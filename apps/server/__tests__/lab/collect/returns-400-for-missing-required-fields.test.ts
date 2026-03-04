import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/orders/:orderId/collect - Returns 400 for missing required fields", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["LAB:COLLECT"],
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
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({});

		expect(response.status).toBe(400);
	});

	it("returns 400 when sampleType is missing", async () => {
		const orderId = uuidv4();
		const payload = {
			collectedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when collectedBy is missing", async () => {
		const orderId = uuidv4();
		const payload = {
			sampleType: "BLOOD",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when sampleType is invalid", async () => {
		const orderId = uuidv4();
		const payload = {
			sampleType: "INVALID_TYPE",
			collectedBy: context.staffId,
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});

	it("returns 400 when collectedAt is not a valid datetime", async () => {
		const orderId = uuidv4();
		const payload = {
			sampleType: "BLOOD",
			collectedBy: context.staffId,
			collectedAt: "not-a-date",
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
	});
});
