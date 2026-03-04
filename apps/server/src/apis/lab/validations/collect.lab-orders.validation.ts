import { SampleType } from "@hms/db";
import { z } from "zod";

const SampleTypeEnum = z.enum(
	Object.values(SampleType) as [string, ...string[]],
);

export const collectLabOrderSchema = z.object({
	params: z.object({
		orderId: z.string().min(1, "Order ID is required"),
	}),
	body: z.object({
		sampleType: SampleTypeEnum,
		collectedBy: z.string().min(1, "Collected by staff ID is required"),
		collectedAt: z.string().datetime().optional(),
		sampleId: z.string().optional(),
		notes: z.string().optional(),
	}),
});

export type CollectLabOrderInput = z.infer<
	typeof collectLabOrderSchema.shape.body
>;

export interface CollectLabOrderOutput {
	id: string;
	orderId: string;
	status: string;
	sampleDetails: {
		sampleType: string;
		collectedBy: {
			id: string;
			employeeId: string;
			firstName: string;
			lastName: string;
		};
		collectedAt: string;
		sampleId: string;
		notes?: string;
	};
}
