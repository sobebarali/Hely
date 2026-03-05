import { Patient, ProblemList } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/emr/patients/:patientId/problems - Get problem list", () => {
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
			firstName: "Problem",
			lastName: "List",
			dateOfBirth: new Date("1970-12-01"),
			gender: "MALE",
			phone: `+1-prob-${context.uniqueId}`,
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

		// Add some problems
		const res1 = await request(app)
			.post(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "I10",
				description: "Essential hypertension",
			});
		createdProblemIds.push(res1.body.id);

		const res2 = await request(app)
			.post(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				code: "E11.9",
				description: "Type 2 diabetes mellitus",
			});
		createdProblemIds.push(res2.body.id);
	}, 30000);

	afterAll(async () => {
		for (const id of createdProblemIds) {
			await ProblemList.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("gets active problems by default", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${patientId}/problems`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body.data).toHaveLength(2);
		for (const problem of response.body.data) {
			expect(problem.status).toBe("ACTIVE");
			expect(problem).toHaveProperty("id");
			expect(problem).toHaveProperty("code");
			expect(problem).toHaveProperty("description");
			expect(problem).toHaveProperty("addedBy");
		}
	});

	it("returns 404 for non-existent patient", async () => {
		const response = await request(app)
			.get(`/api/emr/patients/${uuidv4()}/problems`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
	});
});
