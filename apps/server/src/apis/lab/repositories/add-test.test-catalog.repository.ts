import { TestCatalog } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("addTestCatalog");

export async function findTestByCode({
	tenantId,
	code,
}: {
	tenantId: string;
	code: string;
}) {
	try {
		const test = await TestCatalog.findOne({ tenantId, code }).lean();

		logDatabaseOperation(logger, "findOne", "testCatalog", {
			tenantId,
			code,
		});

		return test;
	} catch (error) {
		logError(logger, error, "Failed to find test by code", {
			tenantId,
			code,
		});
		throw error;
	}
}

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
			status: "ACTIVE",
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
		logError(logger, error, "Failed to create test catalog entry", {
			tenantId: params.tenantId,
		});
		throw error;
	}
}
