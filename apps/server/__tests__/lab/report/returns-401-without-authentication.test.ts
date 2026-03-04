import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/lab/orders/:orderId/report - Returns 401 without authentication", () => {
	it("returns 401 when no authorization header is provided", async () => {
		const orderId = uuidv4();

		const response = await request(app).get(
			`/api/lab/orders/${orderId}/report`,
		);

		expect(response.status).toBe(401);
	});
});
