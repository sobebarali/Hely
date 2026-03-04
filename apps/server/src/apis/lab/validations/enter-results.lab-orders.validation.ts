import { ResultFlag } from "@hms/db";
import { z } from "zod";

const ResultFlagEnum = z.enum(
	Object.values(ResultFlag) as [string, ...string[]],
);

const resultItemSchema = z.object({
	testId: z.string().min(1, "Test ID is required"),
	value: z.string().min(1, "Result value is required"),
	unit: z.string().optional(),
	normalRange: z.string().optional(),
	flag: ResultFlagEnum.optional(),
	interpretation: z.string().optional(),
});

export const enterLabResultSchema = z.object({
	params: z.object({
		orderId: z.string().min(1, "Order ID is required"),
	}),
	body: z.object({
		results: z
			.array(resultItemSchema)
			.min(1, "At least one result is required"),
		enteredBy: z.string().min(1, "Entered by staff ID is required"),
		notes: z.string().optional(),
	}),
});

export type EnterLabResultInput = z.infer<
	typeof enterLabResultSchema.shape.body
>;

export interface EnterLabResultOutput {
	id: string;
	orderId: string;
	status: string;
	tests: Array<{
		testId: string;
		testName: string;
		testCode: string;
		resultDetails: {
			value: string;
			unit?: string;
			normalRange?: string;
			flag?: string;
			interpretation?: string;
		};
	}>;
	enteredBy: {
		id: string;
		employeeId: string;
		firstName: string;
		lastName: string;
	};
	enteredAt: string;
	notes?: string;
}
