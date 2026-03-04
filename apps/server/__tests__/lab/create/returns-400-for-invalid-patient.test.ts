import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders - Returns 400 for invalid patient", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let testCatalogId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["LAB:CREATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const testCatalogItem = await TestCatalog.create({
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
		testCatalogId = String(testCatalogItem._id);
	}, 30000);

	afterAll(async () => {
		if (testCatalogId) {
			await TestCatalog.deleteOne({ _id: testCatalogId });
		}
		await context.cleanup();
	});

	it("returns 400 when patient does not exist", async () => {
		const payload = {
			patientId: uuidv4(),
			doctorId: context.staffId,
			tests: [
				{
					testId: testCatalogId,
					priority: "ROUTINE",
				},
			],
		};

		const response = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_PATIENT");
	});
});
