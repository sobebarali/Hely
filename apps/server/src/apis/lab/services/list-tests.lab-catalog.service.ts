import { createServiceLogger } from "../../../lib/logger";
import { listTestCatalog } from "../repositories/list-tests.lab-catalog.repository";
import type {
	ListTestCatalogInput,
	ListTestCatalogOutput,
} from "../validations/list-tests.lab-catalog.validation";

const logger = createServiceLogger("listTestCatalog");

/**
 * List test catalog entries with filters and pagination
 */
export async function listTestCatalogService({
	tenantId,
	page,
	limit,
	category,
	search,
	status,
}: {
	tenantId: string;
} & ListTestCatalogInput): Promise<ListTestCatalogOutput> {
	logger.info({ tenantId, page, limit, status }, "Listing test catalog");

	const result = await listTestCatalog({
		tenantId,
		page,
		limit,
		category,
		search,
		status,
	});

	const data = result.data.map((test) => ({
		id: String(test._id),
		name: test.name,
		code: test.code,
		category: test.category,
		sampleType: test.sampleType,
		turnaroundTime: test.turnaroundTime ?? undefined,
		price: test.price ?? undefined,
		status: test.status,
		referenceRanges: (test.referenceRanges || []).map(
			(r: Record<string, unknown>) => ({
				label: r.label as string,
				min: r.min as number | undefined,
				max: r.max as number | undefined,
				unit: r.unit as string | undefined,
				gender: r.gender as string,
			}),
		),
	}));

	logger.info(
		{ count: data.length, total: result.pagination.total },
		"Test catalog listed successfully",
	);

	return {
		data,
		pagination: result.pagination,
	};
}
