import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/tests - Returns 400 for invalid request", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_ADMIN",
			rolePermissions: ["LAB:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 400 when required fields are missing", async () => {
		const payload = {
			name: "Incomplete Test",
		};

		const response = await request(app)
			.post("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when category is invalid", async () => {
		const payload = {
			name: "Bad Category Test",
			code: `BAD-CAT-${context.uniqueId}`,
			category: "INVALID_CATEGORY",
			sampleType: "BLOOD",
			turnaroundTime: "24 hours",
			price: 50,
		};

		const response = await request(app)
			.post("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when sampleType is invalid", async () => {
		const payload = {
			name: "Bad Sample Test",
			code: `BAD-SAMP-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "INVALID_SAMPLE",
			turnaroundTime: "24 hours",
			price: 50,
		};

		const response = await request(app)
			.post("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});
});
