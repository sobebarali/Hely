import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/emr/patients/:patientId/timeline - Patient timeline", () => {
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
			firstName: "Timeline",
			lastName: "Patient",
			dateOfBirth: new Date("1988-07-22"),
			gender: "MALE",
			phone: `+1-tl-${context.uniqueId}`,
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

		// Create some clinical notes for the timeline
		for (let i = 0; i < 2; i++) {
			const res = await request(app)
				.post("/api/emr/notes")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					type: "PROGRESS",
					content: `Timeline note ${i}`,
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

	it("gets patient timeline with events", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/timeline`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(response.body.data.length).toBeGreaterThanOrEqual(2);

		for (const event of response.body.data) {
			expect(event).toHaveProperty("id");
			expect(event).toHaveProperty("type");
			expect(event).toHaveProperty("title");
			expect(event).toHaveProperty("occurredAt");
		}
	});

	it("filters timeline by type", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/timeline`)
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ type: "NOTE" });

		expect(response.status).toBe(200);
		for (const event of response.body.data) {
			expect(event.type).toBe("NOTE");
		}
	});

	it("paginates timeline results", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/timeline`)
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ page: 1, limit: 1 });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeLessThanOrEqual(1);
		expect(response.body.pagination.limit).toBe(1);
	});

	it("returns 404 for non-existent patient", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${uuidv4()}/timeline`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
	});
});
