import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/emr/notes - List clinical notes success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdNoteIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "List",
			lastName: "Notes",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-list-${context.uniqueId}`,
			address: {
				street: "123 St",
				city: "City",
				state: "ST",
				postalCode: "00000",
				country: "USA",
			},
			emergencyContact: {
				name: "EC",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create some notes
		for (let i = 0; i < 3; i++) {
			const res = await request(app)
				.post("/api/emr/notes")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					type: "SOAP",
					chiefComplaint: `Complaint ${i}`,
					subjective: `Subjective ${i}`,
				});
			createdNoteIds.push(res.body.id);
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdNoteIds) {
			await ClinicalNote.deleteOne({ _id: id });
		}
		await Counter.deleteMany({
			tenantId: context.hospitalId,
			type: "clinical-note",
		});
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("lists clinical notes with pagination", async () => {
		const response = await request(app)
			.get("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ page: 1, limit: 10 });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(response.body.data.length).toBeGreaterThanOrEqual(3);
		expect(response.body.pagination).toHaveProperty("page");
		expect(response.body.pagination).toHaveProperty("total");
		expect(response.body.pagination).toHaveProperty("totalPages");
	});

	it("filters by patientId", async () => {
		const response = await request(app)
			.get("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ patientId });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBe(3);
		for (const note of response.body.data) {
			expect(note.patientId).toBe(patientId);
		}
	});

	it("filters by type", async () => {
		const response = await request(app)
			.get("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ patientId, type: "SOAP" });

		expect(response.status).toBe(200);
		for (const note of response.body.data) {
			expect(note.type).toBe("SOAP");
		}
	});
});
