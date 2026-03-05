import { z } from "zod";

export const signNoteSchema = z.object({
	params: z.object({
		noteId: z.string().min(1, "Note ID is required"),
	}),
});

export type SignNoteParams = z.infer<typeof signNoteSchema>["params"];
