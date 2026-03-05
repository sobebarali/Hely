import { MedicalHistory, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PUT /api/emr/patients/:patientId/history - Update medical history", () => {
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
			firstName: "Update",
			lastName: "History",
			dateOfBirth: new Date("1975-08-10"),
			gender: "FEMALE",
			phone: `+1-uhist-${context.uniqueId}`,
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

	it("creates medical history on first update", async () => {
		const response = await request(app)
			.put(`/api/emr/patients/${patientId}/history`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				allergies: [
					{
						allergen: "Penicillin",
						reaction: "Rash",
						severity: "MODERATE",
					},
				],
				medications: [
					{
						name: "Lisinopril",
						dosage: "10mg",
						frequency: "Daily",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.patientId).toBe(patientId);
		expect(response.body).toHaveProperty("updatedAt");
	});

	it("verifies the updated history", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/history`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.allergies).toHaveLength(1);
		expect(response.body.allergies[0].allergen).toBe("Penicillin");
		expect(response.body.medications).toHaveLength(1);
		expect(response.body.medications[0].name).toBe("Lisinopril");
	});

	it("updates existing medical history", async () => {
		const response = await request(app)
			.put(`/api/emr/patients/${patientId}/history`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				socialHistory: {
					smoking: "Never",
					alcohol: "Occasional",
				},
				familyHistory: [
					{
						condition: "Hypertension",
						relationship: "Father",
					},
				],
			});

		expect(response.status).toBe(200);
	});

	it("returns 404 for non-existent patient", async () => {
		const response = await request(app)
			.put(`/api/emr/patients/${uuidv4()}/history`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ allergies: [] });

		expect(response.status).toBe(404);
	});
});
