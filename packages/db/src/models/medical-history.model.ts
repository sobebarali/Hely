import mongoose from "mongoose";
import { fieldEncryptionPlugin } from "../plugins/field-encryption.plugin";

const { Schema, model } = mongoose;

// Enums
export const AllergySeverity = {
	MILD: "MILD",
	MODERATE: "MODERATE",
	SEVERE: "SEVERE",
} as const;

// Sub-schemas
const allergySchema = new Schema(
	{
		allergen: { type: String, required: true },
		reaction: { type: String },
		severity: {
			type: String,
			enum: Object.values(AllergySeverity),
		},
	},
	{ _id: false },
);

const medicationSchema = new Schema(
	{
		name: { type: String, required: true },
		dosage: { type: String },
		frequency: { type: String },
		startDate: { type: Date },
		endDate: { type: Date },
	},
	{ _id: false },
);

const surgicalHistorySchema = new Schema(
	{
		procedure: { type: String, required: true },
		date: { type: Date },
		notes: { type: String },
	},
	{ _id: false },
);

const familyHistorySchema = new Schema(
	{
		condition: { type: String, required: true },
		relationship: { type: String },
		notes: { type: String },
	},
	{ _id: false },
);

const socialHistorySchema = new Schema(
	{
		smoking: { type: String },
		alcohol: { type: String },
		exercise: { type: String },
		occupation: { type: String },
		notes: { type: String },
	},
	{ _id: false },
);

const immunizationSchema = new Schema(
	{
		vaccine: { type: String, required: true },
		date: { type: Date },
		notes: { type: String },
	},
	{ _id: false },
);

const pastMedicalHistorySchema = new Schema(
	{
		condition: { type: String, required: true },
		diagnosedDate: { type: Date },
		status: { type: String },
		notes: { type: String },
	},
	{ _id: false },
);

// Main schema
const medicalHistorySchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		patientId: { type: String, ref: "Patient", required: true },
		allergies: [allergySchema],
		medications: [medicationSchema],
		surgicalHistory: [surgicalHistorySchema],
		familyHistory: [familyHistorySchema],
		socialHistory: socialHistorySchema,
		immunizations: [immunizationSchema],
		pastMedicalHistory: [pastMedicalHistorySchema],
	},
	{
		collection: "medical_histories",
		timestamps: true,
	},
);

// Indexes
medicalHistorySchema.index({ tenantId: 1, patientId: 1 }, { unique: true });

// Field-level encryption for PHI data
// TODO: PHI fields (allergies, medications, surgicalHistory, familyHistory,
// socialHistory, immunizations, pastMedicalHistory) should be encrypted.
// The current fieldEncryptionPlugin only supports top-level string fields,
// not arrays/sub-documents. Extend the plugin to support these types.
medicalHistorySchema.plugin(fieldEncryptionPlugin, {
	fields: [],
	getMasterKey: () => process.env.ENCRYPTION_MASTER_KEY,
});

const MedicalHistory = model("MedicalHistory", medicalHistorySchema);

export { MedicalHistory };
