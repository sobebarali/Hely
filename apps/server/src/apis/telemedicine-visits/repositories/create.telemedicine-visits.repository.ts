import { TelemedicineVisit } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { CreateTelemedicineVisitInput } from "../validations/create.telemedicine-visits.validation";
import type { TelemedicineVisitLean } from "./shared.telemedicine-visits.repository";

const logger = createRepositoryLogger("createTelemedicineVisit");

/**
 * Create a new telemedicine visit record
 */
export async function createTelemedicineVisit({
	tenantId,
	patientId,
	providerId,
	scheduledAt,
	type,
	reason,
	meetingLink,
	notes,
	metadata,
}: {
	tenantId: string;
} & CreateTelemedicineVisitInput): Promise<TelemedicineVisitLean> {
	try {
		const id = uuidv4();
		const now = new Date();

		logger.debug(
			{ id, tenantId, patientId, providerId },
			"Creating telemedicine visit",
		);

		await TelemedicineVisit.create({
			_id: id,
			tenantId,
			patientId,
			providerId,
			scheduledAt: new Date(scheduledAt),
			status: "SCHEDULED",
			type,
			reason,
			meetingLink,
			notes,
			metadata,
			createdAt: now,
			updatedAt: now,
		});

		// Re-fetch to trigger decryption hooks (create doesn't decrypt)
		const visit = await TelemedicineVisit.findById(id);
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

		logger.info(
			{ id, tenantId, patientId },
			"Telemedicine visit created successfully",
		);

		return visit.toObject() as unknown as TelemedicineVisitLean;
	} catch (error) {
		logError(logger, error, "Failed to create telemedicine visit", {
			tenantId,
		});
		throw error;
	}
}
