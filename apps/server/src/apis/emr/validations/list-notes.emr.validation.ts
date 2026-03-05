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
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		search: z.string().optional(),
		sortBy: z
			.enum(["createdAt", "updatedAt", "type", "status"])
			.default("createdAt")
			.optional(),
		sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
	}),
});

export type ListNotesQuery = z.infer<typeof listNotesSchema>["query"];
