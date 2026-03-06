import { z } from "zod";

export const addProblemSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	body: z.object({
		code: z.string().min(1, "ICD-10 code is required"),
		description: z.string().min(1, "Problem description is required"),
		onsetDate: z
			.string()
			.refine((v) => !Number.isNaN(Date.parse(v)), {
				message: "onsetDate must be a valid ISO 8601 date",
			})
			.optional(),
		notes: z.string().optional(),
	}),
});

export type AddProblemInput = z.infer<typeof addProblemSchema>["body"];
export type AddProblemParams = z.infer<typeof addProblemSchema>["params"];
