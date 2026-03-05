import mongoose from "mongoose";
import { fieldEncryptionPlugin } from "../plugins/field-encryption.plugin";

const { Schema, model } = mongoose;

// Enums
export const TelemedicineVisitStatus = {
	SCHEDULED: "SCHEDULED",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
	CANCELLED: "CANCELLED",
	NO_SHOW: "NO_SHOW",
} as const;

export const TelemedicineVisitType = {
	CONSULTATION: "CONSULTATION",
	FOLLOW_UP: "FOLLOW_UP",
	SECOND_OPINION: "SECOND_OPINION",
} as const;

// Main schema
const telemedicineVisitSchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		patientId: { type: String, ref: "Patient", required: true },
		providerId: { type: String, ref: "Staff", required: true },
		visitId: { type: String, required: true, unique: true },
		scheduledAt: { type: Date, required: true },
		duration: { type: Number, default: 30 },
		startedAt: { type: Date },
		endedAt: { type: Date },
		status: {
			type: String,
			enum: Object.values(TelemedicineVisitStatus),
			default: TelemedicineVisitStatus.SCHEDULED,
			required: true,
		},
		type: {
			type: String,
			enum: Object.values(TelemedicineVisitType),
			required: true,
		},
		meetingLink: { type: String },
		notes: { type: String },
		reason: { type: String, required: true },
		diagnosis: { type: String },
		prescription: { type: String },
		cancellationReason: { type: String },
		cancelledBy: { type: String },
		cancelledAt: { type: Date },
		metadata: { type: Schema.Types.Mixed },
		createdAt: { type: Date, required: true },
		updatedAt: { type: Date, required: true },
	},
	{
		collection: "telemedicine_visits",
		timestamps: true,
	},
);

// Indexes
telemedicineVisitSchema.index({ tenantId: 1, patientId: 1, scheduledAt: -1 });
telemedicineVisitSchema.index({ tenantId: 1, providerId: 1, scheduledAt: -1 });
telemedicineVisitSchema.index({ tenantId: 1, status: 1 });
telemedicineVisitSchema.index({ tenantId: 1, scheduledAt: -1 });

// Field-level encryption for PHI data
telemedicineVisitSchema.plugin(fieldEncryptionPlugin, {
	fields: ["notes", "diagnosis", "prescription", "reason"],
	getMasterKey: () => process.env.ENCRYPTION_MASTER_KEY,
});

const TelemedicineVisit = model("TelemedicineVisit", telemedicineVisitSchema);

export { TelemedicineVisit };
