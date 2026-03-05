import { Counter } from "@hms/db";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { createTelemedicineVisit } from "../repositories/create.telemedicine.repository";
import type {
	CreateTelemedicineInput,
	CreateTelemedicineOutput,
} from "../validations/create.telemedicine.validation";

const logger = createServiceLogger("createTelemedicine");

export async function createTelemedicineService({
	tenantId,
	...input
}: {
	tenantId: string;
} & CreateTelemedicineInput): Promise<CreateTelemedicineOutput> {
	logger.info(
		{ tenantId, patientId: input.patientId },
		"Creating telemedicine visit",
	);

	// Validate patient exists
	const patient = await findPatientById({
		tenantId,
		patientId: input.patientId,
	});
	if (!patient) {
		throw new NotFoundError("Patient not found", "INVALID_PATIENT");
	}

	// Validate doctor exists
	const doctor = await findStaffById({
		tenantId,
		staffId: input.doctorId,
	});
	if (!doctor) {
		throw new NotFoundError("Doctor not found", "INVALID_DOCTOR");
	}

	// Validate scheduled time is in the future
	const scheduledAt = new Date(input.scheduledAt);
	if (scheduledAt <= new Date()) {
		throw new BadRequestError(
			"Scheduled time must be in the future",
			"INVALID_REQUEST",
		);
	}

	// Generate visit ID using Counter
	const counter = await Counter.findOneAndUpdate(
		{ tenantId, type: "telemedicine-visit" },
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true },
	);
	const visitId = `${tenantId}-TM-${counter.seq}`;

	// Generate join URL
	const meetingLink = `/telemedicine/join/${visitId}`;

	const duration = input.duration ?? 30;
	const type = input.type ?? "CONSULTATION";

	const visit = await createTelemedicineVisit({
		tenantId,
		visitId,
		patientId: input.patientId,
		providerId: input.doctorId,
		scheduledAt,
		duration,
		reason: input.reason,
		type,
		notes: input.notes,
		meetingLink,
	});

	logger.info(
		{ visitId: visit._id, tenantId },
		"Telemedicine visit created successfully",
	);

	return {
		id: visit._id,
		visitId: visit.visitId,
		patientId: visit.patientId,
		doctorId: visit.providerId,
		scheduledAt: visit.scheduledAt.toISOString(),
		duration: visit.duration,
		type: visit.type,
		status: visit.status,
		joinUrl: visit.meetingLink || "",
		createdAt: visit.createdAt.toISOString(),
	};
}
