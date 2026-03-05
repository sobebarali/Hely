import { TelemedicineVisit } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { TelemedicineVisitLean } from "./shared.telemedicine.repository";

const logger = createRepositoryLogger("listTelemedicine");

export interface ListTelemedicineResult {
	visits: TelemedicineVisitLean[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export async function listTelemedicineVisits({
	tenantId,
	page,
	limit,
	patientId,
	doctorId,
	status,
	type,
	startDate,
	endDate,
	sortBy,
	sortOrder,
}: {
	tenantId: string;
	page: number;
	limit: number;
	patientId?: string;
	doctorId?: string;
	status?: string;
	type?: string;
	startDate?: string;
	endDate?: string;
	sortBy?: string;
	sortOrder?: string;
}): Promise<ListTelemedicineResult> {
	try {
		logger.debug({ tenantId, page, limit }, "Listing telemedicine visits");

		const filter: Record<string, unknown> = { tenantId };

		if (patientId) filter.patientId = patientId;
		if (doctorId) filter.providerId = doctorId;
		if (status) filter.status = status;
		if (type) filter.type = type;

		if (startDate || endDate) {
			filter.scheduledAt = {};
			if (startDate) {
				(filter.scheduledAt as Record<string, Date>).$gte = new Date(startDate);
			}
			if (endDate) {
				(filter.scheduledAt as Record<string, Date>).$lte = new Date(endDate);
			}
		}

		const total = await TelemedicineVisit.countDocuments(filter);
		const skip = (page - 1) * limit;
		const totalPages = Math.ceil(total / limit);

		const sortField = sortBy || "scheduledAt";
		const sortDir = sortOrder === "asc" ? 1 : -1;

		const visits = await TelemedicineVisit.find(filter)
			.sort({ [sortField]: sortDir })
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
