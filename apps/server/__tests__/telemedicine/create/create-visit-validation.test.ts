import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/telemedicine/visits - Validation errors", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["TELEMEDICINE:CREATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 400 when patientId is missing", async () => {
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				doctorId: "some-doctor",
				scheduledAt: new Date(Date.now() + 86400000).toISOString(),
				reason: "Consultation",
			});

		expect(response.status).toBe(400);
	});

	it("returns 400 when doctorId is missing", async () => {
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId: "some-patient",
				scheduledAt: new Date(Date.now() + 86400000).toISOString(),
				reason: "Consultation",
			});

		expect(response.status).toBe(400);
	});

	it("returns 400 when reason is missing", async () => {
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId: "some-patient",
				doctorId: "some-doctor",
				scheduledAt: new Date(Date.now() + 86400000).toISOString(),
			});

		expect(response.status).toBe(400);
	});

	it("returns 400 for invalid visit type", async () => {
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId: "some-patient",
				doctorId: "some-doctor",
				scheduledAt: new Date(Date.now() + 86400000).toISOString(),
				reason: "Consultation",
				type: "INVALID_TYPE",
			});

		expect(response.status).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await request(app)
			.post("/api/telemedicine/visits")
			.send({
				patientId: "some-patient",
				doctorId: "some-doctor",
				scheduledAt: new Date(Date.now() + 86400000).toISOString(),
				reason: "Consultation",
			});

		expect(response.status).toBe(401);
	});
});
