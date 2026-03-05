import { TelemedicineVisit } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { TelemedicineVisitLean } from "./shared.telemedicine-visits.repository";

const logger = createRepositoryLogger("listTelemedicineVisits");

export interface ListTelemedicineVisitsResult {
	visits: TelemedicineVisitLean[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * List telemedicine visits with pagination and filters
 */
export async function listTelemedicineVisits({
	tenantId,
	page,
	limit,
	status,
	patientId,
	providerId,
	startDate,
	endDate,
	type,
}: {
	tenantId: string;
	page: number;
	limit: number;
	status?: string;
	patientId?: string;
	providerId?: string;
	startDate?: string;
	endDate?: string;
	type?: string;
}): Promise<ListTelemedicineVisitsResult> {
	try {
		logger.debug(
			{ tenantId, page, limit, status },
			"Listing telemedicine visits",
		);

		// Build query filter
		const filter: Record<string, unknown> = {
			tenantId,
		};

		if (status) {
			filter.status = status;
		}

		if (patientId) {
			filter.patientId = patientId;
		}

		if (providerId) {
			filter.providerId = providerId;
		}

		if (type) {
			filter.type = type;
		}

		// Date range filter
		if (startDate || endDate) {
			filter.scheduledAt = {};
			if (startDate) {
				(filter.scheduledAt as Record<string, Date>).$gte = new Date(startDate);
			}
			if (endDate) {
				(filter.scheduledAt as Record<string, Date>).$lte = new Date(endDate);
			}
		}

		// Get total count
		const total = await TelemedicineVisit.countDocuments(filter);

		// Calculate pagination
		const skip = (page - 1) * limit;
		const totalPages = Math.ceil(total / limit);

		// Fetch visits with pagination
		const visits = await TelemedicineVisit.find(filter)
			.sort({ scheduledAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		logDatabaseOperation(
			logger,
			"find",
			"telemedicine_visits",
			{ tenantId, page, limit },
			{ total, returned: visits.length },
		);

		return {
			visits: visits as unknown as TelemedicineVisitLean[],
			total,
			page,
			limit,
			totalPages,
		};
	} catch (error) {
		logError(logger, error, "Failed to list telemedicine visits", {
			tenantId,
		});
		throw error;
	}
}
