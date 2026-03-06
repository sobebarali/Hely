import { z } from "zod";

export const getNoteSchema = z.object({
	params: z.object({
		noteId: z.string().min(1, "Note ID is required").max(128),
	}),
});

export type GetNoteInput = z.infer<typeof getNoteSchema>["params"];
