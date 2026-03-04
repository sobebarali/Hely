import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/lab/orders/:orderId/collect - Returns 401 without authentication", () => {
	it("returns 401 when no authorization header is provided", async () => {
		const orderId = uuidv4();
		const payload = {
			sampleType: "BLOOD",
			collectedBy: uuidv4(),
		};

		const response = await request(app)
			.post(`/api/lab/orders/${orderId}/collect`)
			.send(payload);

		expect(response.status).toBe(401);
	});
});
