import { z } from "zod";

export const timelineSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		type: z
			.enum([
				"NOTE",
				"VITALS",
				"LAB",
				"PRESCRIPTION",
				"APPOINTMENT",
				"ADMISSION",
			])
			.optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
	}),
});

export type TimelineParams = z.infer<typeof timelineSchema>["params"];
export type TimelineQuery = z.infer<typeof timelineSchema>["query"];
