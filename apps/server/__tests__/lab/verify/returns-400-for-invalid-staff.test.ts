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

describe("POST /api/lab/orders/:orderId/verify - Returns 400 for invalid staff", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let createdLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: [
				"LAB:CREATE",
				"LAB:COLLECT",
				"LAB:RESULT",
				"LAB:VERIFY",
			],
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

		// Create order
		const createResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Routine checkup",
			});

		createdLabOrderId = createResponse.body.id;

		// Collect sample
		await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				sampleType: "BLOOD",
				collectedBy: context.staffId,
			});

		// Enter results with a different staff ID to avoid self-verification
		const differentStaffId = uuidv4();
		await LabOrder.findOneAndUpdate(
			{ _id: createdLabOrderId },
			{
				$set: {
					status: LabOrderStatus.RESULTS_ENTERED,
					resultEnteredBy: differentStaffId,
					resultEnteredAt: new Date(),
				},
			},
		);
	}, 30000);

	afterAll(async () => {
		if (createdLabOrderId) {
			await LabOrder.deleteOne({ _id: createdLabOrderId });
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

	it("returns 400 INVALID_STAFF when verifiedBy staff does not exist", async () => {
		const fakeStaffId = uuidv4();
		const payload = {
			verifiedBy: fakeStaffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_STAFF");
	});
});
