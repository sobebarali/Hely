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
		referenceRanges: (test.referenceRanges || []).map((r) => ({
			label: r.label,
			min: r.min ?? undefined,
			max: r.max ?? undefined,
			unit: r.unit ?? undefined,
			gender: r.gender,
		})),
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
