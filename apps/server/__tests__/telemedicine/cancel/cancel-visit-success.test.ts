import { Patient, TelemedicineVisit } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/telemedicine/visits/:visitId/cancel - Cancel visit", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdVisitIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: [
				"TELEMEDICINE:CREATE",
				"TELEMEDICINE:READ",
				"TELEMEDICINE:MANAGE",
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
			firstName: "Cancel",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-cancel-${context.uniqueId}`,
			email: `cancel-patient-${context.uniqueId}@test.com`,
			address: {
				street: "789 Test Blvd",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0003",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}, 30000);

	afterAll(async () => {
		for (const id of createdVisitIds) {
			await TelemedicineVisit.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("cancels a scheduled visit successfully", async () => {
		// Create a visit first
		const scheduledAt = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();
		const createResponse = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				scheduledAt,
				reason: "To be cancelled",
			});
		const visitId = createResponse.body.id;
		createdVisitIds.push(visitId);

		// Cancel it
		const response = await request(app)
			.post(`/api/telemedicine/visits/${visitId}/cancel`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Patient requested cancellation",
			});

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(visitId);
		expect(response.body.status).toBe("CANCELLED");
		expect(response.body.cancellationReason).toBe(
			"Patient requested cancellation",
		);
		expect(response.body).toHaveProperty("cancelledAt");
	});

	it("returns 400 when cancelling a non-scheduled visit", async () => {
		// Create and cancel a visit
		const scheduledAt = new Date(
			Date.now() + 48 * 60 * 60 * 1000,
		).toISOString();
		const createResponse = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				scheduledAt,
				reason: "Double cancel test",
			});
		const visitId = createResponse.body.id;
		createdVisitIds.push(visitId);

		// Cancel once
		await request(app)
			.post(`/api/telemedicine/visits/${visitId}/cancel`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "First cancel",
			});

		// Try to cancel again
		const response = await request(app)
			.post(`/api/telemedicine/visits/${visitId}/cancel`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Second cancel",
			});

		expect(response.status).toBe(400);
	});

	it("returns 404 for non-existent visit", async () => {
		const response = await request(app)
			.post(`/api/telemedicine/visits/${uuidv4()}/cancel`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Cancel non-existent",
			});

		expect(response.status).toBe(404);
	});
});
