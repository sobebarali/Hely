import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders - Creates lab order successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId1: string;
	let testCatalogId2: string;
	let createdLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
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

		const testCatalog1 = await TestCatalog.create({
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
		testCatalogId1 = String(testCatalog1._id);

		const testCatalog2 = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Blood Glucose",
			code: `BG-${context.uniqueId}`,
			category: "BIOCHEMISTRY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId2 = String(testCatalog2._id);
	}, 30000);

	afterAll(async () => {
		if (createdLabOrderId) {
			await LabOrder.deleteOne({ _id: createdLabOrderId });
		}
		await Counter.deleteOne({ tenantId: context.hospitalId, type: "lab" });
		if (testCatalogId1) {
			await TestCatalog.deleteOne({ _id: testCatalogId1 });
		}
		if (testCatalogId2) {
			await TestCatalog.deleteOne({ _id: testCatalogId2 });
		}
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}
		await context.cleanup();
	});

	it("creates a new lab order successfully", async () => {
		const payload = {
			patientId,
			doctorId: context.staffId,
			tests: [
				{
					testId: testCatalogId1,
					priority: "ROUTINE",
					clinicalNotes: "Annual checkup",
				},
				{
					testId: testCatalogId2,
					priority: "URGENT",
				},
			],
			diagnosis: "Routine health screening",
			notes: "Patient fasting for 12 hours",
		};

		const response = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body).toHaveProperty("orderId");
		expect(response.body.orderId).toMatch(
			new RegExp(`^${context.hospitalId}-LAB-\\d{6}$`),
		);
		expect(response.body.patient.id).toBe(patientId);
		expect(response.body.doctor.id).toBe(context.staffId);
		expect(response.body.status).toBe("ORDERED");
		expect(response.body.tests).toHaveLength(2);
		expect(response.body.tests[0].testName).toBe("Complete Blood Count");
		expect(response.body.tests[0].priority).toBe("ROUTINE");
		expect(response.body.tests[1].testName).toBe("Blood Glucose");
		expect(response.body.tests[1].priority).toBe("URGENT");
		expect(response.body.diagnosis).toBe("Routine health screening");
		expect(response.body.notes).toBe("Patient fasting for 12 hours");

		createdLabOrderId = response.body.id;
	});
});
