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

describe("POST /api/lab/orders/:orderId/verify - Verifies results successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let createdLabOrderId: string;
	const differentResultEnterer = uuidv4();

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
				diagnosis: "Verify test",
			});

		createdLabOrderId = createResponse.body.id;

		// Force to RESULTS_ENTERED with a different resultEnteredBy
		await LabOrder.findOneAndUpdate(
			{ _id: createdLabOrderId },
			{
				$set: {
					status: LabOrderStatus.RESULTS_ENTERED,
					resultEnteredBy: differentResultEnterer,
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

	it("verifies results successfully", async () => {
		const payload = {
			verifiedBy: context.staffId,
			comments: "Results verified and approved",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdLabOrderId);
		expect(response.body.status).toBe("VERIFIED");
		expect(response.body.verifiedBy).toBeDefined();
		expect(response.body.verifiedBy.id).toBe(context.staffId);
		expect(response.body.verifiedBy.employeeId).toBeDefined();
		expect(response.body.verifiedBy.firstName).toBeDefined();
		expect(response.body.verifiedBy.lastName).toBeDefined();
		expect(response.body.verifiedAt).toBeDefined();
	});

	it("returns 404 for non-existent order", async () => {
		const fakeOrderId = uuidv4();
		const payload = {
			verifiedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${fakeOrderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
