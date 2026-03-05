import { MedicalHistory, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/emr/patients/:patientId/history - Get medical history", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:READ", "EMR:UPDATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "History",
			lastName: "Patient",
			dateOfBirth: new Date("1980-03-20"),
			gender: "MALE",
			phone: `+1-hist-${context.uniqueId}`,
			address: {
				street: "123 St",
				city: "City",
				state: "ST",
				postalCode: "00000",
				country: "USA",
			},
			emergencyContact: {
				name: "EC",
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
		await MedicalHistory.deleteMany({
			tenantId: context.hospitalId,
			patientId,
		});
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns empty history for a new patient", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/history`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.allergies).toEqual([]);
		expect(response.body.medications).toEqual([]);
		expect(response.body.surgicalHistory).toEqual([]);
	});

	it("returns 404 for non-existent patient", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${uuidv4()}/history`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
	});
});
