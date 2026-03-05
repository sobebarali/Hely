import { Patient, TelemedicineVisit } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/telemedicine/visits/:visitId - Get visit success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let createdVisitId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: [
				"TELEMEDICINE:CREATE",
				"TELEMEDICINE:READ",
				"PATIENT:CREATE",
			],
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
			firstName: "GetById",
			lastName: "Patient",
			dateOfBirth: new Date("1985-06-15"),
			gender: "MALE",
			phone: `+1-getby-${context.uniqueId}`,
			email: `getby-patient-${context.uniqueId}@test.com`,
			address: {
				street: "456 Test Ave",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Sibling",
				phone: "+1-555-0002",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create a visit
		const scheduledAt = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				scheduledAt,
				reason: "Test consultation",
				type: "CONSULTATION",
			});
		createdVisitId = response.body.id;
	}, 30000);

	afterAll(async () => {
		await TelemedicineVisit.deleteOne({ _id: createdVisitId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("retrieves a visit by ID", async () => {
		const response = await request(app)
			.get(`/api/telemedicine/visits/${createdVisitId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdVisitId);
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.doctorId).toBe(context.staffId);
		expect(response.body.type).toBe("CONSULTATION");
		expect(response.body.status).toBe("SCHEDULED");
		expect(response.body).toHaveProperty("visitId");
		expect(response.body).toHaveProperty("scheduledAt");
		expect(response.body).toHaveProperty("joinUrl");
		expect(response.body).toHaveProperty("createdAt");
		expect(response.body).toHaveProperty("updatedAt");
	});
});
