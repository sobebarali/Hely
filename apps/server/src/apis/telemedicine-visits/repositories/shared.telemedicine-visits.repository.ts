import { TelemedicineVisit } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedTelemedicineVisits");

// TypeScript interfaces for lean documents (plain objects returned by .lean())
export interface TelemedicineVisitLean {
	_id: string;
	tenantId: string;
	patientId: string;
	providerId: string;
	scheduledAt: Date;
	startedAt?: Date;
	endedAt?: Date;
	status: string;
	type: string;
	meetingLink?: string;
	notes?: string;
	reason: string;
	diagnosis?: string;
	prescription?: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Find telemedicine visit by ID within a tenant
 */
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
