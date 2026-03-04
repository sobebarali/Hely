import { Counter, TestCatalog } from "@hms/db";
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
