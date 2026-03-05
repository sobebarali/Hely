import { z } from "zod";

export const updateHistorySchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	body: z.object({
		allergies: z
			.array(
				z.object({
					allergen: z.string().min(1),
					reaction: z.string().optional(),
					severity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
				}),
			)
			.optional(),
		medications: z
			.array(
				z.object({
					name: z.string().min(1),
					dosage: z.string().optional(),
					frequency: z.string().optional(),
					startDate: z.string().optional(),
					endDate: z.string().optional(),
				}),
			)
			.optional(),
		surgicalHistory: z
			.array(
				z.object({
					procedure: z.string().min(1),
					date: z.string().optional(),
					notes: z.string().optional(),
				}),
			)
			.optional(),
		familyHistory: z
			.array(
				z.object({
					condition: z.string().min(1),
					relationship: z.string().optional(),
					notes: z.string().optional(),
				}),
			)
			.optional(),
		socialHistory: z
			.object({
				smoking: z.string().optional(),
				alcohol: z.string().optional(),
				exercise: z.string().optional(),
				occupation: z.string().optional(),
				notes: z.string().optional(),
			})
			.optional(),
		immunizations: z
			.array(
				z.object({
					vaccine: z.string().min(1),
					date: z.string().optional(),
					notes: z.string().optional(),
				}),
			)
			.optional(),
		pastMedicalHistory: z
			.array(
				z.object({
					condition: z.string().min(1),
					diagnosedDate: z.string().optional(),
					status: z.string().optional(),
					notes: z.string().optional(),
				}),
			)
			.optional(),
	}),
});

export type UpdateHistoryInput = z.infer<typeof updateHistorySchema>["body"];
export type UpdateHistoryParams = z.infer<typeof updateHistorySchema>["params"];
