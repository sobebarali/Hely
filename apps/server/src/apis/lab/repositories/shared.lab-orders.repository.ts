import { Counter, LabOrder, TestCatalog } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedLabOrders");

/**
 * Generate next lab order ID for a tenant
 * Format: {tenantId}-LAB-{sequential}
 */
export async function generateLabOrderId({
	tenantId,
}: {
	tenantId: string;
}): Promise<string> {
	try {
		logger.debug({ tenantId }, "Generating lab order ID");

		const counter = await Counter.findOneAndUpdate(
			{ tenantId, type: "lab" },
			{ $inc: { seq: 1 } },
			{ new: true, upsert: true },
		);

		const seq = counter?.seq || 1;
		const orderId = `${tenantId}-LAB-${String(seq).padStart(6, "0")}`;

		logDatabaseOperation(
			logger,
			"generateId",
			"counter",
			{ tenantId, type: "lab" },
			{ orderId, seq },
		);

		return orderId;
	} catch (error) {
		logError(logger, error, "Failed to generate lab order ID");
		throw error;
	}
}

/**
 * Find a lab order by ID within a tenant
 */
export async function findLabOrderById({
	tenantId,
	orderId,
}: {
	tenantId: string;
	orderId: string;
}) {
	try {
		logger.debug({ tenantId, orderId }, "Finding lab order by ID");

		const labOrder = await LabOrder.findOne({
			_id: orderId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"labOrder",
			{ tenantId, orderId },
			labOrder ? { _id: labOrder._id, found: true } : { found: false },
		);

		return labOrder;
	} catch (error) {
		logError(logger, error, "Failed to find lab order by ID");
		throw error;
	}
}

/**
 * Find tests by IDs within a tenant (only ACTIVE tests)
 */
export async function findTestsByIds({
	tenantId,
	testIds,
}: {
	tenantId: string;
	testIds: string[];
}) {
	try {
		logger.debug({ tenantId, count: testIds.length }, "Finding tests by IDs");

		const tests = await TestCatalog.find({
			_id: { $in: testIds },
			tenantId,
			status: "ACTIVE",
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"testCatalog",
			{ tenantId, count: testIds.length },
			{ found: tests.length },
		);

		return tests;
	} catch (error) {
		logError(logger, error, "Failed to find tests by IDs");
		throw error;
	}
}
