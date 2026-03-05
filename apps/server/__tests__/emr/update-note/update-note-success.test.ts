import { ClinicalNote, Counter, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PUT /api/emr/notes/:noteId - Update clinical note", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let noteId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ", "EMR:UPDATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Update",
			lastName: "Note",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-upd-${context.uniqueId}`,
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
				chiefComplaint: "Original complaint",
				subjective: "Original subjective",
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

	it("updates a draft note successfully", async () => {
		const response = await request(app)
			.put(`/api/emr/notes/${noteId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				chiefComplaint: "Updated complaint",
				assessment: "New assessment",
				plan: "New plan",
			});

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(noteId);
		expect(response.body.status).toBe("DRAFT");
		expect(response.body).toHaveProperty("updatedAt");
	});

	it("verifies updates were persisted", async () => {
		const response = await request(app)
			.get(`/api/emr/notes/${noteId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.chiefComplaint).toBe("Updated complaint");
		expect(response.body.assessment).toBe("New assessment");
		expect(response.body.plan).toBe("New plan");
	});

	it("returns 404 for non-existent note", async () => {
		const response = await request(app)
			.put(`/api/emr/notes/${uuidv4()}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ chiefComplaint: "test" });

		expect(response.status).toBe(404);
	});
});
