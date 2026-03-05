import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/emr/notes - Create clinical note success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdNoteIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ", "PATIENT:CREATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "EMR",
			lastName: "Patient",
			dateOfBirth: new Date("1985-06-15"),
			gender: "FEMALE",
			phone: `+1-emr-${context.uniqueId}`,
			email: `emr-patient-${context.uniqueId}@test.com`,
			address: {
				street: "456 Clinical Ave",
				city: "Medical City",
				state: "MC",
				postalCode: "54321",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0001",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
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

	it("creates a SOAP clinical note successfully", async () => {
		const payload = {
			patientId,
			type: "SOAP",
			chiefComplaint: "Headache for 3 days",
			subjective: "Patient reports persistent headache",
			objective: "BP 120/80, no neurological deficits",
			assessment: "Tension headache",
			plan: "Prescribe analgesics, follow up in 1 week",
		};

		const response = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body).toHaveProperty("noteId");
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.type).toBe("SOAP");
		expect(response.body.status).toBe("DRAFT");
		expect(response.body).toHaveProperty("authorId");
		expect(response.body).toHaveProperty("createdAt");
		expect(response.body.noteId).toMatch(/^.+-NOTE-\d+$/);

		createdNoteIds.push(response.body.id);
	});

	it("creates a PROGRESS note with diagnosis", async () => {
		const payload = {
			patientId,
			type: "PROGRESS",
			content: "Patient showing improvement",
			diagnosis: [
				{
					code: "J06.9",
					description: "Acute upper respiratory infection",
					type: "PRIMARY",
				},
			],
		};

		const response = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.type).toBe("PROGRESS");
		expect(response.body.status).toBe("DRAFT");

		createdNoteIds.push(response.body.id);
	});

	it("creates a PROCEDURE note with procedures", async () => {
		const payload = {
			patientId,
			type: "PROCEDURE",
			content: "Minor laceration repair",
			procedures: [
				{
					code: "12001",
					description: "Simple repair of superficial wounds",
				},
			],
		};

		const response = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.type).toBe("PROCEDURE");

		createdNoteIds.push(response.body.id);
	});

	it("generates unique noteIds", async () => {
		const response1 = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ patientId, type: "CONSULTATION", content: "Note 1" });

		const response2 = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ patientId, type: "CONSULTATION", content: "Note 2" });

		expect(response1.status).toBe(201);
		expect(response2.status).toBe(201);
		expect(response1.body.noteId).not.toBe(response2.body.noteId);

		createdNoteIds.push(response1.body.id, response2.body.id);
	});
});
