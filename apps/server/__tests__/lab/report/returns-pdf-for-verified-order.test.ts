import {
	Counter,
	LabOrder,
	LabOrderStatus,
	Patient,
	TestCatalog,
} from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/lab/orders/:orderId/report - Returns PDF for verified order", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let testCatalogId: string;
	let verifiedLabOrderId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LAB_TECH",
			rolePermissions: ["LAB:CREATE", "LAB:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const patient = await Patient.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${Date.now()}`,
			firstName: "Jane",
			lastName: "Doe",
			dateOfBirth: new Date("1985-06-20"),
			gender: "FEMALE",
			phone: `+1-${context.uniqueId}`,
			email: `patient-${context.uniqueId}@test.com`,
			patientType: "OPD",
			status: "ACTIVE",
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		patientId = String(patient._id);

		const testCatalog = await TestCatalog.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: "Complete Blood Count",
			code: `CBC-${context.uniqueId}`,
			category: "HEMATOLOGY",
			sampleType: "BLOOD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		testCatalogId = String(testCatalog._id);

		// Create order
		const createResponse = await request(app)
			.post("/api/lab/orders")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				doctorId: context.staffId,
				tests: [{ testId: testCatalogId, priority: "ROUTINE" }],
				diagnosis: "Report PDF test",
			});
		verifiedLabOrderId = createResponse.body.id;

		// Force to VERIFIED with result details
		await LabOrder.findOneAndUpdate(
			{ _id: verifiedLabOrderId },
			{
				$set: {
					status: LabOrderStatus.VERIFIED,
					resultEnteredBy: context.staffId,
					resultEnteredAt: new Date(),
					verifiedBy: context.staffId,
					verifiedAt: new Date(),
					verificationComments: "All results normal",
					"tests.0.status": LabOrderStatus.VERIFIED,
					"tests.0.resultDetails": {
						value: "14.5",
						unit: "g/dL",
						normalRange: "12.0-17.5",
						flag: "NORMAL",
						interpretation: "Within normal limits",
					},
				},
			},
		);
	}, 30000);

	afterAll(async () => {
		if (verifiedLabOrderId) {
			await LabOrder.deleteOne({ _id: verifiedLabOrderId });
		}
		await Counter.deleteOne({ tenantId: context.hospitalId, type: "lab" });
		if (testCatalogId) {
			await TestCatalog.deleteOne({ _id: testCatalogId });
		}
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}
		await context.cleanup();
	});

	it("returns 200 with PDF content for verified order", async () => {
		const response = await request(app)
			.get(`/api/lab/orders/${verifiedLabOrderId}/report`)
			.set("Authorization", `Bearer ${accessToken}`)
			.buffer(true)
			.parse((res, callback) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk: Buffer) => chunks.push(chunk));
				res.on("end", () => callback(null, Buffer.concat(chunks)));
			});

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("application/pdf");
		expect(response.headers["content-disposition"]).toContain("attachment");
		expect(response.headers["content-disposition"]).toContain(
			`lab-report-${verifiedLabOrderId}.pdf`,
		);

		// Check PDF magic bytes
		const pdfBuffer = response.body as Buffer;
		const pdfHeader = pdfBuffer.subarray(0, 5).toString("ascii");
		expect(pdfHeader).toBe("%PDF-");
	});
});
