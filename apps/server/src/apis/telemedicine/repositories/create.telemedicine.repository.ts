import { TelemedicineVisit } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { TelemedicineVisitLean } from "./shared.telemedicine.repository";

const logger = createRepositoryLogger("createTelemedicine");

export async function createTelemedicineVisit({
	tenantId,
	visitId,
	patientId,
	providerId,
	scheduledAt,
	duration,
	reason,
	type,
	notes,
	meetingLink,
}: {
	tenantId: string;
	visitId: string;
	patientId: string;
	providerId: string;
	scheduledAt: Date;
	duration: number;
	reason: string;
	type: string;
	notes?: string;
	meetingLink: string;
}): Promise<TelemedicineVisitLean> {
	try {
		const id = uuidv4();
		const now = new Date();

		logger.debug({ id, tenantId, patientId }, "Creating telemedicine visit");

		await TelemedicineVisit.create({
			_id: id,
			tenantId,
			visitId,
			patientId,
			providerId,
			scheduledAt,
			duration,
			reason,
			type,
			notes,
			meetingLink,
			status: "SCHEDULED",
			createdAt: now,
			updatedAt: now,
		});

		const visit = await TelemedicineVisit.findOne({ _id: id, tenantId }).lean();
		if (!visit) {
			throw new Error("Failed to retrieve created telemedicine visit");
		}

		logDatabaseOperation(
			logger,
			"create",
			"telemedicine_visits",
			{ tenantId, patientId },
			{ _id: visit._id },
		);

		return visit as unknown as TelemedicineVisitLean;
	} catch (error) {
		logError(logger, error, "Failed to create telemedicine visit", {
			tenantId,
		});
		throw error;
	}
}
