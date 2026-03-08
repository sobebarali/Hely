import { createServiceLogger } from "../../../lib/logger";
import { createTestCatalogEntry } from "../repositories/add-test.test-catalog.repository";
import type {
	AddTestToCatalogInput,
	AddTestToCatalogOutput,
} from "../validations/add-test.test-catalog.validation";

const logger = createServiceLogger("addTestCatalog");

export async function addTestToCatalogService({
	tenantId,
	...input
}: {
	tenantId: string;
} & AddTestToCatalogInput): Promise<AddTestToCatalogOutput> {
	logger.info(
		{ tenantId, code: input.code, name: input.name },
		"Adding test to catalog",
	);

	const entry = await createTestCatalogEntry({ tenantId, ...input });

	logger.info(
		{ testId: entry._id, code: input.code },
		"Test added to catalog successfully",
	);

	return {
		id: String(entry._id),
		name: entry.name,
		code: entry.code,
		category: entry.category,
		sampleType: entry.sampleType,
		turnaroundTime: entry.turnaroundTime as string,
		price: entry.price as number,
		status: entry.status as string,
		referenceRanges: (entry.referenceRanges || []).map((r) => ({
			label: r.label,
			min: r.min ?? undefined,
			max: r.max ?? undefined,
			unit: r.unit ?? undefined,
			gender: r.gender ?? undefined,
		})),
		createdAt: entry.createdAt.toISOString(),
	};
}
