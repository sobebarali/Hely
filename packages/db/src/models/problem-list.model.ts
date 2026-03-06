import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Enums
export const ProblemStatus = {
	ACTIVE: "ACTIVE",
	RESOLVED: "RESOLVED",
} as const;

// Main schema
const problemListSchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		patientId: { type: String, ref: "Patient", required: true },
		code: { type: String, required: true },
		description: { type: String, required: true },
		status: {
			type: String,
			enum: Object.values(ProblemStatus),
			default: ProblemStatus.ACTIVE,
			required: true,
		},
		onsetDate: { type: Date },
		resolvedDate: { type: Date },
		notes: { type: String },
		addedBy: { type: String, ref: "Staff", required: true },
	},
	{
		collection: "problem_lists",
		timestamps: true,
	},
);

// Indexes
problemListSchema.index({ tenantId: 1, patientId: 1, status: 1 });
problemListSchema.index({ tenantId: 1, patientId: 1, code: 1 });
problemListSchema.index({ tenantId: 1, createdAt: -1 });
problemListSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });

const ProblemList = model("ProblemList", problemListSchema);

export { ProblemList };
