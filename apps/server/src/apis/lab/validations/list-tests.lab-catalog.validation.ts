import { TestCatalogStatus, TestCategory } from "@hms/db";
import { z } from "zod";
import type { PaginationInfo } from "../../../lib/types/pagination";

const TestCategoryEnum = z.enum(
	Object.values(TestCategory) as [string, ...string[]],
);

const TestCatalogStatusEnum = z.enum(
	Object.values(TestCatalogStatus) as [string, ...string[]],
);

export const listTestCatalogSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(200).default(50),
		category: TestCategoryEnum.optional(),
		search: z.string().max(100).optional(),
		status: TestCatalogStatusEnum.default("ACTIVE"),
	}),
});

export type ListTestCatalogInput = z.infer<
	typeof listTestCatalogSchema.shape.query
>;

export interface TestCatalogListItem {
	id: string;
	name: string;
	code: string;
	category: string;
	sampleType: string;
	turnaroundTime?: string;
	price?: number;
	status: string;
	referenceRanges: {
		label: string;
		min?: number;
		max?: number;
		unit?: string;
		gender: string;
	}[];
}

export interface ListTestCatalogOutput {
	data: TestCatalogListItem[];
	pagination: PaginationInfo;
}
