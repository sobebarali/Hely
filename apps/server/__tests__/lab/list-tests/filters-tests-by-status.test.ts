import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Filters tests by status", () => {
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
			name: "Active Status Test",
			code: `ACT-STS-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
		});
		testCatalogIds.push(String(activeTest._id));

		const inactiveTest = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Inactive Status Test",
			code: `INA-STS-${context.uniqueId}`,
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

	it("returns only inactive tests when status=INACTIVE", async () => {
		const response = await request(app)
			.get("/api/lab/tests?status=INACTIVE")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);

		for (const item of response.body.data) {
			expect(item.status).toBe("INACTIVE");
		}
	});

	it("returns only active tests when status=ACTIVE", async () => {
		const response = await request(app)
			.get("/api/lab/tests?status=ACTIVE")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		for (const item of response.body.data) {
			expect(item.status).toBe("ACTIVE");
		}
	});
});
