import { TestCatalog } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/tests - Adds test successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let createdTestId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_ADMIN",
			rolePermissions: ["LAB:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		if (createdTestId) {
			await TestCatalog.deleteOne({ _id: createdTestId });
		}
		await context.cleanup();
	});

	it("creates a new test catalog entry successfully", async () => {
		const payload = {
			name: "Complete Blood Count",
			code: `CBC-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			turnaroundTime: "24 hours",
			price: 50,
			referenceRanges: [
				{
					label: "Adult Male",
					min: 4.5,
					max: 11.0,
					unit: "x10^9/L",
					gender: "MALE",
				},
				{
					label: "Adult Female",
					min: 4.0,
					max: 10.0,
					unit: "x10^9/L",
					gender: "FEMALE",
				},
			],
		};

		const response = await request(app)
			.post("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.name).toBe(payload.name);
		expect(response.body.code).toBe(payload.code);
		expect(response.body.category).toBe(payload.category);
		expect(response.body.sampleType).toBe(payload.sampleType);
		expect(response.body.turnaroundTime).toBe(payload.turnaroundTime);
		expect(response.body.price).toBe(payload.price);
		expect(response.body.status).toBe("ACTIVE");
		expect(response.body.referenceRanges).toHaveLength(2);
		expect(response.body.referenceRanges[0].label).toBe("Adult Male");
		expect(response.body).toHaveProperty("createdAt");

		createdTestId = response.body.id;
	});
});
