import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/branding/:type - Unauthorized", () => {
	it("should return 401 without authentication", async () => {
		const response = await request(app)
			.post("/api/hospitals/branding/logo")
			.send({ image: "data:image/png;base64,iVBOR" });

		expect(response.status).toBe(401);
	});
});
