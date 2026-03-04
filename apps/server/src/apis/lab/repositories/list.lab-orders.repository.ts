import { LabOrder } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { ListLabOrdersInput } from "../validations/list.lab-orders.validation";

const logger = createRepositoryLogger("listLabOrders");

/**
 * List lab orders with filters and pagination
 */
export async function listLabOrders({
	tenantId,
	page,
	limit,
	patientId,
	doctorId,
	status,
	priority,
	startDate,
	endDate,
	search,
	sortBy,
	sortOrder,
}: {
	tenantId: string;
} & ListLabOrdersInput) {
	try {
		const numPage = Number(page) || 1;
		const numLimit = Number(limit) || 20;

		logger.debug(
			{ tenantId, page: numPage, limit: numLimit, patientId, doctorId, status },
			"Listing lab orders",
		);

		const query: Record<string, unknown> = { tenantId };

		if (patientId) {
			query.patientId = patientId;
		}
		if (doctorId) {
			query.doctorId = doctorId;
		}
		if (status) {
			query.status = status;
		}
		if (priority) {
			query["tests.priority"] = priority;
		}

		// Date range filter on createdAt
		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) {
				(query.createdAt as Record<string, Date>).$gte = new Date(startDate);
			}
			if (endDate) {
				(query.createdAt as Record<string, Date>).$lte = new Date(endDate);
			}
		}

		// Search filter on orderId
		if (search) {
			query.$or = [{ orderId: { $regex: search, $options: "i" } }];
		}

		const total = await LabOrder.countDocuments(query);

		const skip = (numPage - 1) * numLimit;
		const sortDirection = sortOrder === "asc" ? 1 : -1;

		const labOrders = await LabOrder.find(query)
			.sort({ [sortBy]: sortDirection })
			.skip(skip)
			.limit(numLimit)
			.lean();

		logDatabaseOperation(
			logger,
			"find",
			"labOrder",
			{ tenantId, page: numPage, limit: numLimit },
			{ count: labOrders.length, total },
		);

		return {
			data: labOrders,
			pagination: {
				page: numPage,
				limit: numLimit,
				total,
				totalPages: Math.ceil(total / numLimit),
			},
		};
	} catch (error) {
		logError(logger, error, "Failed to list lab orders", { tenantId });
		throw error;
	}
}
