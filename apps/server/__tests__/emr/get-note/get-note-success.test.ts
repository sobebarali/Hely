import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/emr/notes/:noteId - Get clinical note", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let noteId: string;

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
			firstName: "Get",
			lastName: "Note",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-get-${context.uniqueId}`,
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

		const res = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				type: "SOAP",
				chiefComplaint: "Test complaint",
				subjective: "Subjective findings",
				objective: "Objective findings",
				assessment: "Test assessment",
				plan: "Test plan",
				diagnosis: [{ code: "J06.9", description: "URI", type: "PRIMARY" }],
			});
		noteId = res.body.id;
	}, 30000);

	afterAll(async () => {
		await ClinicalNote.deleteOne({ _id: noteId });
		await Counter.deleteMany({
			tenantId: context.hospitalId,
			type: "clinical-note",
		});
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("gets a clinical note by ID", async () => {
		const response = await request(app)
			.get(`/api/emr/notes/${noteId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(noteId);
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.type).toBe("SOAP");
		expect(response.body.chiefComplaint).toBe("Test complaint");
		expect(response.body.diagnosis).toHaveLength(1);
		expect(response.body.diagnosis[0].code).toBe("J06.9");
		expect(response.body.amendments).toEqual([]);
		expect(response.body).toHaveProperty("createdAt");
		expect(response.body).toHaveProperty("updatedAt");
	});

	it("returns 404 for non-existent note", async () => {
		const response = await request(app)
			.get(`/api/emr/notes/${uuidv4()}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
	});
});
