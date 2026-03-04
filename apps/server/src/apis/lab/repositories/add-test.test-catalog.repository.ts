import { TestCatalog, TestCatalogStatus } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { ConflictError } from "../../../errors";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("addTestCatalog");

export async function createTestCatalogEntry(params: {
	tenantId: string;
	name: string;
	code: string;
	category: string;
	sampleType: string;
	turnaroundTime: string;
	price: number;
	referenceRanges?: Array<{
		label: string;
		min?: number;
		max?: number;
		unit?: string;
		gender?: string;
	}>;
}) {
	try {
		const id = uuidv4();

		logger.debug(
			{ id, tenantId: params.tenantId, code: params.code },
			"Creating test catalog entry",
		);

		const entry = await TestCatalog.create({
			_id: id,
			...params,
			status: TestCatalogStatus.ACTIVE,
		});

		logDatabaseOperation(
			logger,
			"create",
			"testCatalog",
			{ tenantId: params.tenantId, code: params.code },
			{ _id: id },
		);

		return entry;
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes("E11000") ||
				error.message.includes("duplicate key"))
		) {
			throw new ConflictError(
				`Test with code '${params.code}' already exists`,
				"DUPLICATE_CODE",
			);
		}
		logError(logger, error, "Failed to create test catalog entry", {
			tenantId: params.tenantId,
		});
		throw error;
	}
}
