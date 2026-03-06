import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/results - Enters results successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let testCatalogId2: string;
	let createdLabOrderId: string;
	let testIdInOrder: string;
	let testIdInOrder2: string;
	let invalidStatusOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:CREATE", "LAB:COLLECT", "LAB:RESULT"],
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

		const testCatalog2 = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Blood Sugar",
			code: `BS-${context.uniqueId}`,
			category: "BIOCHEMISTRY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId2 = String(testCatalog2._id);

		// Create order with 2 tests
		const createResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [
					{ testId: testCatalogId, priority: "ROUTINE" },
					{ testId: testCatalogId2, priority: "ROUTINE" },
				],
				diagnosis: "Routine checkup",
			});

		createdLabOrderId = createResponse.body.id;
		testIdInOrder = createResponse.body.tests[0].testId;
		testIdInOrder2 = createResponse.body.tests[1].testId;

		// Collect sample
		await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				sampleType: "BLOOD",
				collectedBy: context.staffId,
			});

		// Create a second order in ORDERED status for invalid-status test
		const invalidStatusResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Invalid status test",
			});

		invalidStatusOrderId = invalidStatusResponse.body.id;
	}, 30000);

	afterAll(async () => {
		if (createdLabOrderId) {
			await LabOrder.deleteOne({ _id: createdLabOrderId });
		}
		if (invalidStatusOrderId) {
			await LabOrder.deleteOne({ _id: invalidStatusOrderId });
		}
		await Counter.deleteOne({ tenantId: context.hospitalId, type: "lab" });
		if (testCatalogId) {
			await TestCatalog.deleteOne({ _id: testCatalogId });
		}
		if (testCatalogId2) {
			await TestCatalog.deleteOne({ _id: testCatalogId2 });
		}
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}
		await context.cleanup();
	});

	it("enters results successfully", async () => {
		const payload = {
			results: [
				{
					testId: testIdInOrder,
					value: "14.5",
					unit: "g/dL",
					normalRange: "12.0-17.5",
					flag: "NORMAL",
					interpretation: "Within normal range",
				},
				{
					testId: testIdInOrder2,
					value: "95",
					unit: "mg/dL",
					normalRange: "70-100",
					flag: "NORMAL",
				},
			],
			enteredBy: context.staffId,
			notes: "Results reviewed",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdLabOrderId);
		expect(response.body.status).toBe("RESULTS_ENTERED");
		expect(response.body.tests).toHaveLength(2);
		expect(response.body.tests[0].resultDetails).toBeDefined();
		expect(response.body.tests[0].resultDetails.value).toBe("14.5");
		expect(response.body.tests[0].resultDetails.unit).toBe("g/dL");
		expect(response.body.tests[0].resultDetails.flag).toBe("NORMAL");
		expect(response.body.enteredBy).toBeDefined();
		expect(response.body.enteredBy.id).toBe(context.staffId);
		expect(response.body.enteredAt).toBeDefined();
		expect(response.body.notes).toBe("Results reviewed");
	});

	it("returns 400 INVALID_STATUS when order is not in SAMPLE_COLLECTED status", async () => {
		const payload = {
			results: [{ testId: testCatalogId, value: "14.5" }],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${invalidStatusOrderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_STATUS");
	});

	it("returns 400 INVALID_TEST when testId is not in the order", async () => {
		// Create a new order in SAMPLE_COLLECTED state
		const createResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Test for invalid test",
			});

		const orderId = createResponse.body.id;
		const orderTestId = createResponse.body.tests[0].testId;

		await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				sampleType: "BLOOD",
				collectedBy: context.staffId,
			});

		const fakeTestId = uuidv4();
		const payload = {
			results: [
				{ testId: orderTestId, value: "14.5" },
				{ testId: fakeTestId, value: "5.0" },
			],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_TEST");

		// Cleanup
		await LabOrder.deleteOne({ _id: orderId });
	});

	it("returns 400 when not all tests have results (partial results)", async () => {
		// Create a new order with 2 tests in SAMPLE_COLLECTED state
		const createResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [
					{ testId: testCatalogId, priority: "ROUTINE" },
					{ testId: testCatalogId2, priority: "ROUTINE" },
				],
				diagnosis: "Test for partial results",
			});

		const orderId = createResponse.body.id;
		const orderTestId = createResponse.body.tests[0].testId;

		await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				sampleType: "BLOOD",
				collectedBy: context.staffId,
			});

		// Only provide result for 1 of 2 tests
		const payload = {
			results: [{ testId: orderTestId, value: "14.5" }],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");

		// Cleanup
		await LabOrder.deleteOne({ _id: orderId });
	});

	it("returns 404 for non-existent order", async () => {
		const fakeOrderId = uuidv4();
		const payload = {
			results: [{ testId: uuidv4(), value: "5.0" }],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${fakeOrderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
