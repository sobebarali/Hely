import { z } from "zod";

export const getTelemedicineByIdSchema = z.object({
	params: z.object({
		visitId: z.string().min(1, "Visit ID is required"),
	}),
});

export type GetTelemedicineByIdParams = z.infer<
	typeof getTelemedicineByIdSchema
>["params"];
