import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Filters tests by category", () => {
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

		const hematologyTest = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "CBC Category Filter",
			code: `CBC-CAT-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(hematologyTest._id));

		const biochemTest = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Glucose Category Filter",
			code: `GLU-CAT-${context.uniqueId}`,
			category: "BIOCHEMISTRY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(biochemTest._id));
	}, 30000);

	afterAll(async () => {
		for (const id of testCatalogIds) {
			await TestCatalog.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns only tests matching the category filter", async () => {
		const response = await request(app)
			.get("/api/lab/tests?category=HEMATOLOGY")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		for (const item of response.body.data) {
			expect(item.category).toBe("HEMATOLOGY");
		}
	});

	it("returns 400 for invalid category", async () => {
		const response = await request(app)
			.get("/api/lab/tests?category=INVALID")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
	});
});
