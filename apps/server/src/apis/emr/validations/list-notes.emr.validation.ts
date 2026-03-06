import { z } from "zod";

export const listNotesSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		patientId: z.string().optional(),
		type: z
			.enum([
				"SOAP",
				"PROGRESS",
				"PROCEDURE",
				"DISCHARGE",
				"CONSULTATION",
				"OPERATIVE",
			])
			.optional(),
		status: z.enum(["DRAFT", "SIGNED", "AMENDED"]).optional(),
		authorId: z.string().optional(),
		startDate: z
			.string()
			.refine((v) => !Number.isNaN(Date.parse(v)), {
				message: "startDate must be a valid ISO 8601 date",
			})
			.optional(),
		endDate: z
			.string()
			.refine((v) => !Number.isNaN(Date.parse(v)), {
				message: "endDate must be a valid ISO 8601 date",
			})
			.optional(),
		search: z.string().optional(),
		sortBy: z
			.enum(["createdAt", "updatedAt", "type", "status"])
			.default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	}),
});

export type ListNotesQuery = z.infer<typeof listNotesSchema>["query"];
