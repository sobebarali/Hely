import { Patient, ProblemList } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/emr/patients/:patientId/problems - Add problem", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdProblemIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["EMR:CREATE", "EMR:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Add",
			lastName: "Problem",
			dateOfBirth: new Date("1965-04-15"),
			gender: "FEMALE",
			phone: `+1-addp-${context.uniqueId}`,
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
		for (const id of createdProblemIds) {
			await ProblemList.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("adds a problem successfully", async () => {
		const response = await request(app)
			.post(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "J45.20",
				description: "Mild intermittent asthma",
				onsetDate: "2024-01-15",
				notes: "Triggered by exercise",
			});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.code).toBe("J45.20");
		expect(response.body.description).toBe("Mild intermittent asthma");
		expect(response.body.status).toBe("ACTIVE");
		expect(response.body).toHaveProperty("addedBy");
		expect(response.body).toHaveProperty("createdAt");

		createdProblemIds.push(response.body.id);
	});

	it("rejects duplicate active problem", async () => {
		const response = await request(app)
			.post(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "J45.20",
				description: "Mild intermittent asthma",
			});

		expect(response.status).toBe(409);
	});

	it("allows adding a different problem", async () => {
		const response = await request(app)
			.post(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "M54.5",
				description: "Low back pain",
			});

		expect(response.status).toBe(201);
		expect(response.body.code).toBe("M54.5");

		createdProblemIds.push(response.body.id);
	});

	it("returns 404 for non-existent patient", async () => {
		const response = await request(app)
			.post(`/api/emr/patients/${uuidv4()}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "I10",
				description: "Hypertension",
			});

		expect(response.status).toBe(404);
	});
});
