import { TestCatalog } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import { escapeRegex } from "../../../utils/crypto";
import type { ListTestCatalogInput } from "../validations/list-tests.lab-catalog.validation";

const logger = createRepositoryLogger("listTestCatalog");

/**
 * List test catalog entries with filters and pagination
 */
export async function listTestCatalog({
	tenantId,
	page,
	limit,
	category,
	search,
	status,
}: {
	tenantId: string;
} & ListTestCatalogInput) {
	try {
		logger.debug(
			{ tenantId, page, limit, category, status },
			"Listing test catalog",
		);

		const query: Record<string, unknown> = { tenantId };

		if (status) {
			query.status = status;
		}
		if (category) {
			query.category = category;
		}

		if (search) {
			const escapedSearch = escapeRegex(search);
			query.$or = [
				{ name: { $regex: escapedSearch, $options: "i" } },
				{ code: { $regex: escapedSearch, $options: "i" } },
			];
		}

		const skip = (page - 1) * limit;

		const [total, tests] = await Promise.all([
			TestCatalog.countDocuments(query),
			TestCatalog.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
		]);

		logDatabaseOperation(
			logger,
			"find",
			"testCatalog",
			{ tenantId, page, limit },
			{ count: tests.length, total },
		);

		return {
			data: tests,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	} catch (error) {
		logError(logger, error, "Failed to list test catalog", { tenantId });
		throw error;
	}
}
