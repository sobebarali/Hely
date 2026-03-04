import mongoose from "mongoose";
import { SampleType } from "./test-catalog.model";

const { Schema, model } = mongoose;

export const LabOrderStatus = {
	ORDERED: "ORDERED",
	SAMPLE_COLLECTED: "SAMPLE_COLLECTED",
	RESULTS_ENTERED: "RESULTS_ENTERED",
	VERIFIED: "VERIFIED",
	CANCELLED: "CANCELLED",
} as const;

export const TestPriority = {
	ROUTINE: "ROUTINE",
	URGENT: "URGENT",
	STAT: "STAT",
} as const;

const labOrderTestSchema = new Schema(
	{
		testId: { type: String, required: true },
		testName: { type: String, required: true },
		testCode: { type: String, required: true },
		priority: {
			type: String,
			enum: Object.values(TestPriority),
			default: TestPriority.ROUTINE,
		},
		status: {
			type: String,
			enum: Object.values(LabOrderStatus),
			default: LabOrderStatus.ORDERED,
		},
		clinicalNotes: { type: String },
	},
	{ _id: false },
);

const labOrderSchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		orderId: { type: String, required: true },
		patientId: { type: String, ref: "Patient", required: true },
		doctorId: { type: String, ref: "Staff", required: true },
		appointmentId: { type: String, ref: "Appointment" },
		admissionId: { type: String, ref: "Admission" },
		tests: [labOrderTestSchema],
		status: {
			type: String,
			enum: Object.values(LabOrderStatus),
			default: LabOrderStatus.ORDERED,
		},
		sampleDetails: {
			sampleType: {
				type: String,
				enum: Object.values(SampleType),
			},
			collectedBy: { type: String, ref: "Staff" },
			collectedAt: { type: Date },
			sampleId: { type: String },
			notes: { type: String },
		},
		diagnosis: { type: String },
		notes: { type: String },
	},
	{ collection: "labOrder", timestamps: true },
);

labOrderSchema.index({ tenantId: 1, orderId: 1 }, { unique: true });
labOrderSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
labOrderSchema.index({ tenantId: 1, doctorId: 1, createdAt: -1 });
labOrderSchema.index({ tenantId: 1, status: 1 });

const LabOrder = model("LabOrder", labOrderSchema);

export { LabOrder };
