import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Lists tests with pagination", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const testCatalogIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["LAB:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create 3 test catalog entries
		for (let i = 0; i < 3; i++) {
			const test = await TestCatalog.create({
				_id: uuidv4(),
				tenantId: context.hospitalId,
				name: `Pagination Test ${i + 1}`,
				code: `PAG-${context.uniqueId}-${i}`,
				category: "HEMATOLOGY",
				sampleType: "BLOOD",
				status: "ACTIVE",
				referenceRanges: [
					{
						label: "Hemoglobin",
						min: 12,
						max: 16,
						unit: "g/dL",
						gender: "ALL",
					},
				],
			});
			testCatalogIds.push(String(test._id));
		}
	}, 30000);

	afterAll(async () => {
		for (const id of testCatalogIds) {
			await TestCatalog.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns paginated test catalog with correct shape", async () => {
		const response = await request(app)
			.get("/api/lab/tests")
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
		expect(item).toHaveProperty("name");
		expect(item).toHaveProperty("code");
		expect(item).toHaveProperty("category");
		expect(item).toHaveProperty("sampleType");
		expect(item).toHaveProperty("status");
		expect(item).toHaveProperty("referenceRanges");
	});

	it("respects limit parameter", async () => {
		const response = await request(app)
			.get("/api/lab/tests?limit=2")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeLessThanOrEqual(2);
		expect(response.body.pagination.limit).toBe(2);
	});

	it("respects page parameter", async () => {
		const response = await request(app)
			.get("/api/lab/tests?limit=2&page=2")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.pagination.page).toBe(2);
	});
});
