import { z } from "zod";

export const updateNoteSchema = z.object({
	params: z.object({
		noteId: z.string().min(1, "Note ID is required").max(128),
	}),
	body: z.object({
		chiefComplaint: z.string().optional(),
		subjective: z.string().optional(),
		objective: z.string().optional(),
		assessment: z.string().optional(),
		plan: z.string().optional(),
		content: z.string().optional(),
		diagnosis: z
			.array(
				z.object({
					code: z.string().min(1),
					description: z.string().min(1),
					type: z.enum(["PRIMARY", "SECONDARY"]),
				}),
			)
			.optional(),
		procedures: z
			.array(
				z.object({
					code: z.string().min(1),
					description: z.string().min(1),
				}),
			)
			.optional(),
	}),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>["body"];
export type UpdateNoteParams = z.infer<typeof updateNoteSchema>["params"];
