import { z } from "zod";

export const reportLabOrderSchema = z.object({
	params: z.object({
		orderId: z.string().min(1, "Order ID is required"),
	}),
});
