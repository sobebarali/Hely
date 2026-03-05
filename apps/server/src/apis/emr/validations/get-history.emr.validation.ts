import { z } from "zod";

export const getHistorySchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
});

export type GetHistoryParams = z.infer<typeof getHistorySchema>["params"];
