import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/verify - Returns 400 for invalid status", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let orderedLabOrderId: string;
	let collectedLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:CREATE", "LAB:COLLECT", "LAB:VERIFY"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const patient = await Patient.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${Date.now()}`,
			firstName: "Test",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-15"),
			gender: "MALE",
			phone: `+1-${context.uniqueId}`,
			email: `patient-${context.uniqueId}@test.com`,
			patientType: "OPD",
			status: "ACTIVE",
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		patientId = String(patient._id);

		const testCatalog = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Complete Blood Count",
			code: `CBC-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId = String(testCatalog._id);

		// Create order in ORDERED status
		const orderedResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Status test - ordered",
			});
		orderedLabOrderId = orderedResponse.body.id;

		// Create order in SAMPLE_COLLECTED status
		const collectedResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Status test - collected",
			});
		collectedLabOrderId = collectedResponse.body.id;

		await request(app)
			.post(`/api/lab/orders/${collectedLabOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				sampleType: "BLOOD",
				collectedBy: context.staffId,
			});
	}, 30000);

	afterAll(async () => {
		if (orderedLabOrderId) {
			await LabOrder.deleteOne({ _id: orderedLabOrderId });
		}
		if (collectedLabOrderId) {
			await LabOrder.deleteOne({ _id: collectedLabOrderId });
		}
		await Counter.deleteOne({ tenantId: context.hospitalId, type: "lab" });
		if (testCatalogId) {
			await TestCatalog.deleteOne({ _id: testCatalogId });
		}
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}
		await context.cleanup();
	});

	it("returns 400 INVALID_STATUS when order is in ORDERED status", async () => {
		const payload = {
			verifiedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderedLabOrderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_STATUS");
	});

	it("returns 400 INVALID_STATUS when order is in SAMPLE_COLLECTED status", async () => {
		const payload = {
			verifiedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${collectedLabOrderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_STATUS");
	});
});
