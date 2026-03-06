import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/hospitals/branding/:type - Forbidden without permission", () => {
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
			.post("/api/hospitals/branding/logo")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ image: "data:image/png;base64,iVBOR" });

		expect(response.status).toBe(403);
	});
});
