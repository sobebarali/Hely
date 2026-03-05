import mongoose from "mongoose";
import { fieldEncryptionPlugin } from "../plugins/field-encryption.plugin";

const { Schema, model } = mongoose;

// Enums
export const ClinicalNoteStatus = {
	DRAFT: "DRAFT",
	SIGNED: "SIGNED",
	AMENDED: "AMENDED",
} as const;

export const ClinicalNoteType = {
	SOAP: "SOAP",
	PROGRESS: "PROGRESS",
	PROCEDURE: "PROCEDURE",
	DISCHARGE: "DISCHARGE",
	CONSULTATION: "CONSULTATION",
	OPERATIVE: "OPERATIVE",
} as const;

export const DiagnosisType = {
	PRIMARY: "PRIMARY",
	SECONDARY: "SECONDARY",
} as const;

// Sub-schemas
const diagnosisSchema = new Schema(
	{
		code: { type: String, required: true },
		description: { type: String, required: true },
		type: {
			type: String,
			enum: Object.values(DiagnosisType),
			required: true,
		},
	},
	{ _id: false },
);

const procedureSchema = new Schema(
	{
		code: { type: String, required: true },
		description: { type: String, required: true },
	},
	{ _id: false },
);

const amendmentSchema = new Schema(
	{
		reason: { type: String, required: true },
		content: { type: String, required: true },
		amendedBy: { type: String, ref: "Staff", required: true },
		amendedAt: { type: Date, required: true },
	},
	{ _id: false },
);

// Main schema
const clinicalNoteSchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		noteId: { type: String, required: true, unique: true },
		patientId: { type: String, ref: "Patient", required: true },
		encounterId: { type: String, ref: "Appointment" },
		admissionId: { type: String, ref: "Admission" },
		type: {
			type: String,
			enum: Object.values(ClinicalNoteType),
			required: true,
		},
		chiefComplaint: { type: String },
		subjective: { type: String },
		objective: { type: String },
		assessment: { type: String },
		plan: { type: String },
		content: { type: String },
		diagnosis: [diagnosisSchema],
		procedures: [procedureSchema],
		status: {
			type: String,
			enum: Object.values(ClinicalNoteStatus),
			default: ClinicalNoteStatus.DRAFT,
			required: true,
		},
		authorId: { type: String, ref: "Staff", required: true },
		signedBy: { type: String, ref: "Staff" },
		signedAt: { type: Date },
		amendments: [amendmentSchema],
	},
	{
		collection: "clinical_notes",
		timestamps: true,
	},
);

// Indexes
clinicalNoteSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
clinicalNoteSchema.index({ tenantId: 1, authorId: 1, createdAt: -1 });
clinicalNoteSchema.index({ tenantId: 1, type: 1 });
clinicalNoteSchema.index({ tenantId: 1, status: 1 });
clinicalNoteSchema.index({ tenantId: 1, createdAt: -1 });
clinicalNoteSchema.index({ tenantId: 1, encounterId: 1 });

// Field-level encryption for PHI data
clinicalNoteSchema.plugin(fieldEncryptionPlugin, {
	fields: [
		"chiefComplaint",
		"subjective",
		"objective",
		"assessment",
		"plan",
		"content",
	],
	getMasterKey: () => process.env.ENCRYPTION_MASTER_KEY,
});

const ClinicalNote = model("ClinicalNote", clinicalNoteSchema);

export { ClinicalNote };
