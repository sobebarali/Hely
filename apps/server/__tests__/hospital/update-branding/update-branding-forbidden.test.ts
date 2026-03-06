import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/hospitals/branding - Forbidden without permission", () => {
	let authContext: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		authContext = await createAuthTestContext({
			roleName: "VIEWER",
			rolePermissions: ["TENANT:READ"],
		});
		const tokens = await authContext.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await authContext.cleanup();
	});

	it("should return 403 without TENANT:UPDATE permission", async () => {
		const response = await request(app)
			.patch("/api/hospitals/branding")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ appName: "Test" });

		expect(response.status).toBe(403);
	});
});
