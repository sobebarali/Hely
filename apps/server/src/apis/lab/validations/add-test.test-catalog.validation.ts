import { SampleType, TestCategory } from "@hms/db";
import { z } from "zod";

const TestCategoryEnum = z.enum(
	Object.values(TestCategory) as [string, ...string[]],
);

const SampleTypeEnum = z.enum(
	Object.values(SampleType) as [string, ...string[]],
);

export const addTestToCatalogSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required"),
		code: z.string().min(1, "Code is required"),
		category: TestCategoryEnum,
		sampleType: SampleTypeEnum,
		turnaroundTime: z.string().min(1, "Turnaround time is required"),
		price: z.number().min(0, "Price must be non-negative"),
		referenceRanges: z
			.array(
				z.object({
					label: z.string().min(1, "Label is required"),
					min: z.number().optional(),
					max: z.number().optional(),
					unit: z.string().optional(),
					gender: z.enum(["MALE", "FEMALE", "ALL"]).optional(),
				}),
			)
			.optional(),
	}),
});

export type AddTestToCatalogInput = z.infer<
	typeof addTestToCatalogSchema
>["body"];

export interface AddTestToCatalogOutput {
	id: string;
	name: string;
	code: string;
	category: string;
	sampleType: string;
	turnaroundTime: string;
	price: number;
	status: string;
	referenceRanges: Array<{
		label: string;
		min?: number;
		max?: number;
		unit?: string;
		gender?: string;
	}>;
	createdAt: string;
}
