import { z } from "zod";

export const createNoteSchema = z.object({
	body: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
		encounterId: z.string().optional(),
		admissionId: z.string().optional(),
		type: z.enum([
			"SOAP",
			"PROGRESS",
			"PROCEDURE",
			"DISCHARGE",
			"CONSULTATION",
			"OPERATIVE",
		]),
		chiefComplaint: z.string().optional(),
		subjective: z.string().optional(),
		objective: z.string().optional(),
		assessment: z.string().optional(),
		plan: z.string().optional(),
		content: z.string().optional(),
		diagnosis: z
			.array(
				z.object({
					code: z.string().min(1, "Diagnosis code is required"),
					description: z.string().min(1, "Diagnosis description is required"),
					type: z.enum(["PRIMARY", "SECONDARY"]),
				}),
			)
			.optional(),
		procedures: z
			.array(
				z.object({
					code: z.string().min(1, "Procedure code is required"),
					description: z.string().min(1, "Procedure description is required"),
				}),
			)
			.optional(),
	}),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>["body"];
