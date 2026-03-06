import { Patient, TelemedicineVisit } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/telemedicine/visits - Create visit success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let doctorId: string;
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

		// Use the staff from context as the doctor
		doctorId = context.staffId as string;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Tele",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-tele-${context.uniqueId}`,
			email: `tele-patient-${context.uniqueId}@test.com`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}, 30000);

	afterAll(async () => {
		for (const id of createdVisitIds) {
			await TelemedicineVisit.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("creates a telemedicine visit successfully", async () => {
		const scheduledAt = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();

		const payload = {
			patientId,
			doctorId,
			scheduledAt,
			duration: 30,
			reason: "Follow-up consultation",
			type: "CONSULTATION",
			notes: "Patient requested video consultation",
		};

		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body).toHaveProperty("visitId");
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.doctorId).toBe(doctorId);
		expect(response.body.duration).toBe(30);
		expect(response.body.type).toBe("CONSULTATION");
		expect(response.body.status).toBe("SCHEDULED");
		expect(response.body).toHaveProperty("joinUrl");
		expect(response.body).toHaveProperty("createdAt");

		createdVisitIds.push(response.body.id);
	});

	it("creates a visit with default duration and type", async () => {
		const scheduledAt = new Date(
			Date.now() + 48 * 60 * 60 * 1000,
		).toISOString();

		const payload = {
			patientId,
			doctorId,
			scheduledAt,
			reason: "Initial consultation",
		};

		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.duration).toBe(30);
		expect(response.body.type).toBe("CONSULTATION");

		createdVisitIds.push(response.body.id);
	});

	it("creates a FOLLOW_UP visit", async () => {
		const scheduledAt = new Date(
			Date.now() + 72 * 60 * 60 * 1000,
		).toISOString();

		const payload = {
			patientId,
			doctorId,
			scheduledAt,
			reason: "Follow up after surgery",
			type: "FOLLOW_UP",
			duration: 15,
		};

		const response = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.type).toBe("FOLLOW_UP");
		expect(response.body.duration).toBe(15);

		createdVisitIds.push(response.body.id);
	});

	it("generates a unique visitId", async () => {
		const scheduledAt = new Date(
			Date.now() + 96 * 60 * 60 * 1000,
		).toISOString();

		const response1 = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ patientId, doctorId, scheduledAt, reason: "Visit 1" });

		const response2 = await request(app)
			.post("/api/telemedicine/visits")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId,
				scheduledAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
				reason: "Visit 2",
			});

		expect(response1.status).toBe(201);
		expect(response2.status).toBe(201);
		expect(response1.body.visitId).not.toBe(response2.body.visitId);
		expect(response1.body.visitId).toMatch(/^.+-TM-\d+$/);

		createdVisitIds.push(response1.body.id, response2.body.id);
	});
});
