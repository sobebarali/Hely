import { Counter, LabOrder, Patient, TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/orders - Filters lab orders by status", () => {
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
			firstName: "Filter",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-15"),
			gender: "FEMALE",
			phone: `+1-${context.uniqueId}`,
			email: `patient-filter-${context.uniqueId}@test.com`,
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
			name: "Lipid Panel",
			code: `LP-FILTER-${context.uniqueId}`,
			category: "BIOCHEMISTRY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId = String(testCatalog._id);

		// Create 2 lab orders (both start as ORDERED)
		for (let i = 0; i < 2; i++) {
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
				});
			labOrderIds.push(response.body.id);
		}

		// Update one order to CANCELLED directly in DB
		await LabOrder.updateOne(
			{ _id: labOrderIds[1] },
			{ $set: { status: "CANCELLED" } },
		);
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

	it("filters by status=ORDERED and returns only matching orders", async () => {
		const response = await request(app)
			.get("/api/lab/orders?status=ORDERED")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		for (const order of response.body.data) {
			expect(order.status).toBe("ORDERED");
		}
	});

	it("filters by status=CANCELLED and returns only matching orders", async () => {
		const response = await request(app)
			.get("/api/lab/orders?status=CANCELLED")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		for (const order of response.body.data) {
			expect(order.status).toBe("CANCELLED");
		}
	});
});
