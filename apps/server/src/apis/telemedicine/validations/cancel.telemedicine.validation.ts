import { z } from "zod";

export const cancelTelemedicineSchema = z.object({
	params: z.object({
		visitId: z.string().min(1, "Visit ID is required"),
	}),
	body: z.object({
		reason: z.string().min(1, "Cancellation reason is required"),
	}),
});

export type CancelTelemedicineParams = z.infer<
	typeof cancelTelemedicineSchema
>["params"];

export type CancelTelemedicineInput = z.infer<
	typeof cancelTelemedicineSchema
>["body"];

export interface CancelTelemedicineOutput {
	id: string;
	status: string;
	cancellationReason: string;
	cancelledAt: string;
}
