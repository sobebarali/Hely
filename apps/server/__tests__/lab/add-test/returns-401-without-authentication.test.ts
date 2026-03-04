import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/lab/tests - Returns 401 without authentication", () => {
	it("returns 401 when no authorization header is provided", async () => {
		const payload = {
			name: "Complete Blood Count",
			code: "CBC-001",
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			turnaroundTime: "24 hours",
			price: 50,
		};

		const response = await request(app).post("/api/lab/tests").send(payload);

		expect(response.status).toBe(401);
	});
});
