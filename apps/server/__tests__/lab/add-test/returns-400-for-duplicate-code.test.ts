import { TestCatalog } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/lab/tests - Returns 409 for duplicate code", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let existingTestId: string;
	let testCode: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_ADMIN",
			rolePermissions: ["LAB:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		testCode = `DUP-${context.uniqueId}`;

		const existing = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Existing Test",
			code: testCode,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		existingTestId = String(existing._id);
	}, 30000);

	afterAll(async () => {
		if (existingTestId) {
			await TestCatalog.deleteOne({ _id: existingTestId });
		}
		await context.cleanup();
	});

	it("returns 409 with DUPLICATE_CODE when code already exists", async () => {
		const payload = {
			name: "Another Test",
			code: testCode,
			category: "BIOCHEMISTRY",
			sampleType: "URINE",
			turnaroundTime: "48 hours",
			price: 100,
		};

		const response = await request(app)
			.post("/api/lab/tests")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(409);
		expect(response.body.code).toBe("DUPLICATE_CODE");
	});
});
