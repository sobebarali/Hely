import { TelemedicineVisit } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { TelemedicineVisitLean } from "./shared.telemedicine.repository";

const logger = createRepositoryLogger("cancelTelemedicine");

export async function cancelTelemedicineVisit({
	tenantId,
	visitId,
	reason,
	cancelledBy,
}: {
	tenantId: string;
	visitId: string;
	reason: string;
	cancelledBy: string;
}): Promise<TelemedicineVisitLean> {
	try {
		const now = new Date();

		logger.debug({ tenantId, visitId }, "Cancelling telemedicine visit");

		const visit = await TelemedicineVisit.findOneAndUpdate(
			{ _id: visitId, tenantId },
			{
				status: "CANCELLED",
				cancellationReason: reason,
				cancelledBy,
				cancelledAt: now,
				updatedAt: now,
			},
			{ new: true },
		).lean();

		if (!visit) {
			throw new Error("Failed to update telemedicine visit");
		}

		logDatabaseOperation(
			logger,
			"update",
			"telemedicine_visits",
			{ tenantId, visitId },
			{ status: "CANCELLED" },
		);

		return visit as unknown as TelemedicineVisitLean;
	} catch (error) {
		logError(logger, error, "Failed to cancel telemedicine visit", {
			tenantId,
		});
		throw error;
	}
}
