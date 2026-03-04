import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/results - Returns 400 for missing required fields", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:RESULT"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 400 when results array is missing", async () => {
		const orderId = uuidv4();
		const payload = {
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when enteredBy is missing", async () => {
		const orderId = uuidv4();
		const payload = {
			results: [{ testId: uuidv4(), value: "5.0" }],
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when results array is empty", async () => {
		const orderId = uuidv4();
		const payload = {
			results: [],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when a result is missing testId", async () => {
		const orderId = uuidv4();
		const payload = {
			results: [{ value: "5.0" }],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when a result is missing value", async () => {
		const orderId = uuidv4();
		const payload = {
			results: [{ testId: uuidv4() }],
			enteredBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/results`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});
});
