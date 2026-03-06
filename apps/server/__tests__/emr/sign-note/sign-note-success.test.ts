import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/emr/notes/:noteId/sign - Sign clinical note", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let noteId: string;
	let signedNoteId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ", "EMR:SIGN", "EMR:UPDATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Sign",
			lastName: "Note",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-sign-${context.uniqueId}`,
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

		// Create a draft note
		const res = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				type: "SOAP",
				chiefComplaint: "Headache",
				subjective: "Pain for 2 days",
				objective: "Normal exam",
				assessment: "Tension headache",
				plan: "Rest and analgesics",
			});
		noteId = res.body.id;

		// Create another note to test double-sign
		const res2 = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				type: "PROGRESS",
				content: "Already signed note",
			});
		signedNoteId = res2.body.id;
	}, 30000);

	afterAll(async () => {
		await ClinicalNote.deleteMany({
			_id: { $in: [noteId, signedNoteId] },
		});
		await Counter.deleteMany({
			tenantId: context.hospitalId,
			type: "clinical-note",
		});
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("signs a draft note successfully", async () => {
		const response = await request(app)
			.post(`/api/emr/notes/${noteId}/sign`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(noteId);
		expect(response.body.status).toBe("SIGNED");
		expect(response.body).toHaveProperty("signedBy");
		expect(response.body).toHaveProperty("signedAt");
	});

	it("rejects signing an already signed note", async () => {
		const response = await request(app)
			.post(`/api/emr/notes/${noteId}/sign`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
	});

	it("rejects update of a signed note", async () => {
		const response = await request(app)
			.put(`/api/emr/notes/${noteId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ chiefComplaint: "Trying to update" });

		expect(response.status).toBe(400);
	});
});
