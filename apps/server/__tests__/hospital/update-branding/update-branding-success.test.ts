import { Hospital } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/hospitals/branding - Successfully update branding", () => {
	let authContext: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		authContext = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["TENANT:READ", "TENANT:UPDATE"],
		});
		const tokens = await authContext.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await authContext.cleanup();
	});

	it("should update branding with valid data", async () => {
		const brandingData = {
			appName: "Test Clinic",
			primaryColor: "#3b82f6",
			supportEmail: "support@testclinic.com",
		};

		const response = await request(app)
			.patch("/api/hospitals/branding")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(brandingData);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("success", true);
		expect(response.body.data).toHaveProperty("appName", "Test Clinic");
		expect(response.body.data).toHaveProperty("primaryColor", "#3b82f6");
		expect(response.body.data).toHaveProperty(
			"supportEmail",
			"support@testclinic.com",
		);

		// Verify in DB
		const hospital = await Hospital.findById(authContext.hospitalId);
		expect(hospital?.branding?.appName).toBe("Test Clinic");
		expect(hospital?.branding?.primaryColor).toBe("#3b82f6");
	});

	it("should unset a branding field when null is passed", async () => {
		// First set a custom domain
		await request(app)
			.patch("/api/hospitals/branding")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ customDomain: "test.example.com" });

		// Now unset it
		const response = await request(app)
			.patch("/api/hospitals/branding")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ customDomain: null });

		expect(response.status).toBe(200);
		expect(response.body.data.customDomain).toBeNull();
	});
});
