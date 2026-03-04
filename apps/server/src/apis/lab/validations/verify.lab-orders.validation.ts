import { z } from "zod";

export const verifyLabOrderSchema = z.object({
	params: z.object({
		orderId: z.string().min(1, "Order ID is required"),
	}),
	body: z.object({
		verifiedBy: z.string().min(1, "Verified by staff ID is required"),
		comments: z.string().optional(),
	}),
});

export type VerifyLabOrderInput = z.infer<
	typeof verifyLabOrderSchema.shape.body
>;

export interface VerifyLabOrderOutput {
	id: string;
	status: string;
	verifiedBy: {
		id: string;
		employeeId: string;
		firstName: string;
		lastName: string;
	};
	verifiedAt: string;
}
