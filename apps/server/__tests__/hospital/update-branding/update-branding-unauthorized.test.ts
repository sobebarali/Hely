import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("PATCH /api/hospitals/branding - Unauthorized", () => {
	it("should return 401 without authentication", async () => {
		const response = await request(app)
			.patch("/api/hospitals/branding")
			.send({ appName: "Test" });

		expect(response.status).toBe(401);
	});
});
