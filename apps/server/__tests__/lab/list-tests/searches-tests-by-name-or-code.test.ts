import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Searches tests by name or code", () => {
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

		const test1 = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Complete Blood Count Search",
			code: `CBC-SRCH-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(test1._id));

		const test2 = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Lipid Panel Search",
			code: `LIP-SRCH-${context.uniqueId}`,
			category: "BIOCHEMISTRY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(test2._id));
	}, 30000);

	afterAll(async () => {
		for (const id of testCatalogIds) {
			await TestCatalog.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("searches by name (case-insensitive)", async () => {
		const response = await request(app)
			.get("/api/lab/tests?search=complete blood count search")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		const found = response.body.data.some(
			(item: { name: string }) => item.name === "Complete Blood Count Search",
		);
		expect(found).toBe(true);
	});

	it("searches by code (case-insensitive)", async () => {
		const response = await request(app)
			.get(`/api/lab/tests?search=LIP-SRCH-${context.uniqueId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		const found = response.body.data.some(
			(item: { code: string }) => item.code === `LIP-SRCH-${context.uniqueId}`,
		);
		expect(found).toBe(true);
	});

	it("returns empty data for non-matching search", async () => {
		const response = await request(app)
			.get("/api/lab/tests?search=zzz-nonexistent-xyz-999")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveLength(0);
		expect(response.body.pagination.total).toBe(0);
	});
});
