import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/tests - Returns 403 without permission", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: ["PATIENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks LAB:READ permission", async () => {
		const response = await request(app)
			.get("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
	});
});
