import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/collect - Collects sample successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let createdLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["LAB:CREATE", "LAB:READ", "LAB:COLLECT"],
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

		// Create a lab order to collect sample for
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

	it("collects sample successfully", async () => {
		const payload = {
			sampleType: "BLOOD",
			collectedBy: context.staffId,
			notes: "Fasting sample",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdLabOrderId);
		expect(response.body.status).toBe("SAMPLE_COLLECTED");
		expect(response.body.sampleDetails).toBeDefined();
		expect(response.body.sampleDetails.sampleType).toBe("BLOOD");
		expect(response.body.sampleDetails.collectedBy.id).toBe(context.staffId);
		expect(response.body.sampleDetails.sampleId).toBeDefined();
		expect(response.body.sampleDetails.collectedAt).toBeDefined();
		expect(response.body.sampleDetails.notes).toBe("Fasting sample");
	});

	it("returns 400 INVALID_STATUS when order is not in ORDERED status", async () => {
		// The order is already SAMPLE_COLLECTED from the previous test
		const payload = {
			sampleType: "BLOOD",
			collectedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${createdLabOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_STATUS");
	});

	it("returns 404 for non-existent order", async () => {
		const fakeOrderId = uuidv4();
		const payload = {
			sampleType: "BLOOD",
			collectedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${fakeOrderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
