import { Patient, TelemedicineVisit } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/telemedicine/visits - List visits success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdVisitIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: [
				"TELEMEDICINE:CREATE",
				"TELEMEDICINE:READ",
				"PATIENT:CREATE",
			],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "List",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "FEMALE",
			phone: `+1-list-${context.uniqueId}`,
			email: `list-patient-${context.uniqueId}@test.com`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Parent",
				phone: "+1-555-0001",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create some visits via API
		for (let i = 0; i < 3; i++) {
			const scheduledAt = new Date(
				Date.now() + (i + 1) * 24 * 60 * 60 * 1000,
			).toISOString();
			const response = await request(app)
				.post("/api/telemedicine/visits")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					doctorId: context.staffId,
					scheduledAt,
					reason: `Visit ${i + 1}`,
					type: i === 0 ? "CONSULTATION" : "FOLLOW_UP",
				});
			if (response.body.id) {
				createdVisitIds.push(response.body.id);
			}
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdVisitIds) {
			await TelemedicineVisit.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("lists visits with pagination", async () => {
		const response = await request(app)
			.get("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ page: 1, limit: 10 });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.pagination.page).toBe(1);
		expect(response.body.pagination.limit).toBe(10);
		expect(response.body.data.length).toBeGreaterThanOrEqual(3);
	});

	it("filters by patientId", async () => {
		const response = await request(app)
			.get("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ patientId });

		expect(response.status).toBe(200);
		for (const visit of response.body.data) {
			expect(visit.patientId).toBe(patientId);
		}
	});

	it("filters by status", async () => {
		const response = await request(app)
			.get("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ status: "SCHEDULED" });

		expect(response.status).toBe(200);
		for (const visit of response.body.data) {
			expect(visit.status).toBe("SCHEDULED");
		}
	});

	it("filters by type", async () => {
		const response = await request(app)
			.get("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.query({ type: "FOLLOW_UP" });

		expect(response.status).toBe(200);
		for (const visit of response.body.data) {
			expect(visit.type).toBe("FOLLOW_UP");
		}
	});

	it("returns 401 without authentication", async () => {
		const response = await request(app).get("/api/telemedicine/visits");

		expect(response.status).toBe(401);
	});
});
