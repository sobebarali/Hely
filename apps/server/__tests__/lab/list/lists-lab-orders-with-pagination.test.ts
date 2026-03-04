import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/orders - Lists lab orders with pagination", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	const labOrderIds: string[] = [];

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
			firstName: "List",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-15"),
			gender: "MALE",
			phone: `+1-${context.uniqueId}`,
			email: `patient-list-${context.uniqueId}@test.com`,
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
			code: `CBC-LIST-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId = String(testCatalog._id);

		// Create 3 lab orders via API
		for (let i = 0; i < 3; i++) {
			const response = await request(app)
				.post("/api/lab/orders")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					doctorId: context.staffId,
					tests: [
						{
							testId: testCatalogId,
							priority: "ROUTINE",
						},
					],
					notes: `Test order ${i + 1}`,
				});
			labOrderIds.push(response.body.id);
		}
	}, 30000);

	afterAll(async () => {
		for (const id of labOrderIds) {
			await LabOrder.deleteOne({ _id: id });
		}
		await Counter.deleteOne({ tenantId: context.hospitalId, type: "lab" });
		await TestCatalog.deleteOne({ _id: testCatalogId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns paginated lab orders with correct shape", async () => {
		const response = await request(app)
			.get("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data.length).toBeGreaterThanOrEqual(3);

		// Verify pagination shape
		expect(response.body.pagination).toHaveProperty("page");
		expect(response.body.pagination).toHaveProperty("limit");
		expect(response.body.pagination).toHaveProperty("total");
		expect(response.body.pagination).toHaveProperty("totalPages");

		// Verify item shape
		const item = response.body.data[0];
		expect(item).toHaveProperty("id");
		expect(item).toHaveProperty("orderId");
		expect(item).toHaveProperty("patient");
		expect(item).toHaveProperty("doctor");
		expect(item).toHaveProperty("tests");
		expect(item).toHaveProperty("status");
		expect(item).toHaveProperty("createdAt");
		expect(item.patient).toHaveProperty("firstName");
		expect(item.doctor).toHaveProperty("firstName");
	});

	it("respects limit parameter", async () => {
		const response = await request(app)
			.get("/api/lab/orders?limit=2")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeLessThanOrEqual(2);
		expect(response.body.pagination.limit).toBe(2);
	});
});
