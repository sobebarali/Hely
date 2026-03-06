import { z } from "zod";

export const amendNoteSchema = z.object({
	params: z.object({
		noteId: z.string().min(1, "Note ID is required").max(128),
	}),
	body: z.object({
		reason: z.string().min(1, "Reason for amendment is required"),
		content: z.string().min(1, "Amendment content is required"),
	}),
});

export type AmendNoteInput = z.infer<typeof amendNoteSchema>["body"];
export type AmendNoteParams = z.infer<typeof amendNoteSchema>["params"];
