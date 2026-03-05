import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/emr/notes/:noteId/amend - Amend clinical note", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let signedNoteId: string;
	let draftNoteId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ", "EMR:SIGN", "EMR:AMEND"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Amend",
			lastName: "Note",
			dateOfBirth: new Date("1990-01-01"),
			gender: "FEMALE",
			phone: `+1-amend-${context.uniqueId}`,
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

		// Create and sign a note
		const res = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				type: "SOAP",
				chiefComplaint: "Original complaint",
				subjective: "Original",
				objective: "Original",
				assessment: "Original",
				plan: "Original",
			});
		signedNoteId = res.body.id;

		await request(app)
			.post(`/api/emr/notes/${signedNoteId}/sign`)
			.set("Authorization", `Bearer ${accessToken}`);

		// Create a draft note (should fail to amend)
		const res2 = await request(app)
			.post("/api/emr/notes")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				type: "PROGRESS",
				content: "Draft note",
			});
		draftNoteId = res2.body.id;
	}, 30000);

	afterAll(async () => {
		await ClinicalNote.deleteMany({
			_id: { $in: [signedNoteId, draftNoteId] },
		});
		await Counter.deleteMany({
			tenantId: context.hospitalId,
			type: "clinical-note",
		});
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("amends a signed note successfully", async () => {
		const response = await request(app)
			.post(`/api/emr/notes/${signedNoteId}/amend`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Correction of diagnosis",
				content: "Updated assessment details",
			});

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(signedNoteId);
		expect(response.body.status).toBe("AMENDED");
		expect(response.body.amendments).toHaveLength(1);
		expect(response.body.amendments[0].reason).toBe("Correction of diagnosis");
		expect(response.body.amendments[0].content).toBe(
			"Updated assessment details",
		);
		expect(response.body.amendments[0]).toHaveProperty("amendedBy");
		expect(response.body.amendments[0]).toHaveProperty("amendedAt");
	});

	it("can amend an already amended note", async () => {
		const response = await request(app)
			.post(`/api/emr/notes/${signedNoteId}/amend`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Additional information",
				content: "More details added",
			});

		expect(response.status).toBe(200);
		expect(response.body.amendments).toHaveLength(2);
	});

	it("rejects amending a draft note", async () => {
		const response = await request(app)
			.post(`/api/emr/notes/${draftNoteId}/amend`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Should fail",
				content: "This should not work",
			});

		expect(response.status).toBe(400);
	});
});
