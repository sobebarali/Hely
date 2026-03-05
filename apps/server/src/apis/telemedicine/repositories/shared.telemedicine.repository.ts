import { TelemedicineVisit } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedTelemedicine");

export interface TelemedicineVisitLean {
	_id: string;
	tenantId: string;
	visitId: string;
	patientId: string;
	providerId: string;
	scheduledAt: Date;
	duration: number;
	startedAt?: Date;
	endedAt?: Date;
	status: string;
	type: string;
	meetingLink?: string;
	notes?: string;
	reason: string;
	diagnosis?: string;
	prescription?: string;
	cancellationReason?: string;
	cancelledBy?: string;
	cancelledAt?: Date;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export async function findTelemedicineVisitById({
	tenantId,
	visitId,
}: {
	tenantId: string;
	visitId: string;
}): Promise<TelemedicineVisitLean | null> {
	try {
		logger.debug({ tenantId, visitId }, "Finding telemedicine visit by ID");

		const visit = await TelemedicineVisit.findOne({
			_id: visitId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"telemedicine_visits",
			{ tenantId, visitId },
			visit ? { _id: visit._id, found: true } : { found: false },
		);

		return visit as TelemedicineVisitLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find telemedicine visit by ID");
		throw error;
	}
}
