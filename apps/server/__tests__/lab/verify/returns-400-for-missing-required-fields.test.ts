import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/verify - Returns 400 for missing required fields", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:VERIFY"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 400 when body is empty", async () => {
		const orderId = uuidv4();

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({});

		expect(response.status).toBe(400);
	});

	it("returns 400 when verifiedBy is missing", async () => {
		const orderId = uuidv4();
		const payload = {
			comments: "Looks good",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/verify`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});
});
