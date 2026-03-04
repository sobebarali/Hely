import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Returns default active tests", () => {
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

		const activeTest = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Default Active Test",
			code: `DEF-ACT-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(activeTest._id));

		const inactiveTest = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Default Inactive Test",
			code: `DEF-INA-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "INACTIVE",
		});
		testCatalogIds.push(String(inactiveTest._id));
	}, 30000);

	afterAll(async () => {
		for (const id of testCatalogIds) {
			await TestCatalog.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns only ACTIVE tests by default (no status param)", async () => {
		const response = await request(app)
			.get("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		// All returned tests should be ACTIVE
		for (const item of response.body.data) {
			expect(item.status).toBe("ACTIVE");
		}

		// The inactive test should NOT appear
		const inactiveFound = response.body.data.some(
			(item: { code: string }) => item.code === `DEF-INA-${context.uniqueId}`,
		);
		expect(inactiveFound).toBe(false);

		// The active test should appear
		const activeFound = response.body.data.some(
			(item: { code: string }) => item.code === `DEF-ACT-${context.uniqueId}`,
		);
		expect(activeFound).toBe(true);
	});
});
