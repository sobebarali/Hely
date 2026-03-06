import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/hospitals/branding - Get branding by domain", () => {
	let authContext: AuthTestContext;
	let accessToken: string;
	const uniqueDomain = `test-${Date.now()}.example.com`;

	beforeAll(async () => {
		authContext = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["TENANT:READ", "TENANT:UPDATE"],
		});
		const tokens = await authContext.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Set up branding with a custom domain
		await request(app)
			.patch("/api/hospitals/branding")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				appName: "Domain Test Clinic",
				customDomain: uniqueDomain,
				primaryColor: "#ef4444",
			});
	}, 30000);

	afterAll(async () => {
		await authContext.cleanup();
	});

	it("should return branding for a valid custom domain", async () => {
		const response = await request(app).get(
			`/api/hospitals/branding?domain=${uniqueDomain}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("success", true);
		expect(response.body.data).toHaveProperty("appName", "Domain Test Clinic");
		expect(response.body.data).toHaveProperty("primaryColor", "#ef4444");
	});

	it("should return 400 without domain query parameter", async () => {
		const response = await request(app).get("/api/hospitals/branding");

		expect(response.status).toBe(400);
	});

	it("should return 404 for non-existent domain", async () => {
		const response = await request(app).get(
			"/api/hospitals/branding?domain=nonexistent.example.com",
		);

		expect(response.status).toBe(404);
	});
});
