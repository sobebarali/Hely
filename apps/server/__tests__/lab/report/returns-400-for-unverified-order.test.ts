import {
	Counter,
	LabOrder,
	LabOrderStatus,
	Patient,
	TestCatalog,
} from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/orders/:orderId/report - Returns 400 for unverified order", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let orderedLabOrderId: string;
	let resultsEnteredLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:CREATE", "LAB:READ"],
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
				diagnosis: "Report test - ordered",
			});
		orderedLabOrderId = orderedResponse.body.id;

		// Create order in RESULTS_ENTERED status
		const resultsResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Report test - results entered",
			});
		resultsEnteredLabOrderId = resultsResponse.body.id;

		await LabOrder.findOneAndUpdate(
			{ _id: resultsEnteredLabOrderId },
			{
				$set: {
					status: LabOrderStatus.RESULTS_ENTERED,
					resultEnteredBy: context.staffId,
					resultEnteredAt: new Date(),
				},
			},
		);
	}, 30000);

	afterAll(async () => {
		if (orderedLabOrderId) {
			await LabOrder.deleteOne({ _id: orderedLabOrderId });
		}
		if (resultsEnteredLabOrderId) {
			await LabOrder.deleteOne({ _id: resultsEnteredLabOrderId });
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

	it("returns 400 RESULTS_NOT_VERIFIED when order is in ORDERED status", async () => {
		const response = await request(app)
			.get(`/api/lab/orders/${orderedLabOrderId}/report`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("RESULTS_NOT_VERIFIED");
	});

	it("returns 400 RESULTS_NOT_VERIFIED when order is in RESULTS_ENTERED status", async () => {
		const response = await request(app)
			.get(`/api/lab/orders/${resultsEnteredLabOrderId}/report`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("RESULTS_NOT_VERIFIED");
	});
});
