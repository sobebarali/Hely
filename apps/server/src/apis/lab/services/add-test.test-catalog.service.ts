import { BadRequestError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import {
	createTestCatalogEntry,
	findTestByCode,
} from "../repositories/add-test.test-catalog.repository";
import type {
	AddTestToCatalogInput,
	AddTestToCatalogOutput,
} from "../validations/add-test.test-catalog.validation";

const logger = createServiceLogger("addTestCatalog");

export async function addTestToCatalogService({
	tenantId,
	name,
	code,
	category,
	sampleType,
	turnaroundTime,
	price,
	referenceRanges,
}: {
	tenantId: string;
} & AddTestToCatalogInput): Promise<AddTestToCatalogOutput> {
	logger.info({ tenantId, code, name }, "Adding test to catalog");

	const existing = await findTestByCode({ tenantId, code });
	if (existing) {
		throw new BadRequestError(
			`Test with code '${code}' already exists`,
			"DUPLICATE_CODE",
		);
	}

	const entry = await createTestCatalogEntry({
		tenantId,
		name,
		code,
		category,
		sampleType,
		turnaroundTime,
		price,
		referenceRanges,
	});

	logger.info(
		{ testId: entry._id, code },
		"Test added to catalog successfully",
	);

	return {
		id: String(entry._id),
		name: entry.name,
		code: entry.code,
		category: entry.category,
		sampleType: entry.sampleType,
		turnaroundTime: entry.turnaroundTime ?? "",
		price: entry.price ?? 0,
		status: entry.status ?? "ACTIVE",
		referenceRanges: (entry.referenceRanges || []).map(
			(r: Record<string, unknown>) => ({
				label: r.label as string,
				min: r.min as number | undefined,
				max: r.max as number | undefined,
				unit: r.unit as string | undefined,
				gender: r.gender as string | undefined,
			}),
		),
		createdAt: entry.createdAt.toISOString(),
	};
}
