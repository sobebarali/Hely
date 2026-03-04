import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/lab/orders - Returns 401 without authentication", () => {
	it("returns 401 when no authorization header is provided", async () => {
		const payload = {
			patientId: uuidv4(),
			doctorId: uuidv4(),
			tests: [
				{
					testId: uuidv4(),
					priority: "ROUTINE",
				},
			],
		};

		const response = await request(app).post("/api/lab/orders").send(payload);

		expect(response.status).toBe(401);
	});
});
