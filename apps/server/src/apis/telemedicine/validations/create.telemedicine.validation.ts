import { z } from "zod";

export const createTelemedicineSchema = z.object({
	body: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
		doctorId: z.string().min(1, "Doctor ID is required"),
		scheduledAt: z
			.string()
			.min(1, "Scheduled date/time is required")
			.refine((val) => !Number.isNaN(Date.parse(val)), {
				message: "Invalid ISO 8601 date format",
			}),
		duration: z.number().int().positive().default(30).optional(),
		reason: z.string().min(1, "Reason is required"),
		type: z
			.enum(["CONSULTATION", "FOLLOW_UP", "SECOND_OPINION"])
			.default("CONSULTATION")
			.optional(),
		notes: z.string().optional(),
	}),
});

export type CreateTelemedicineInput = z.infer<
	typeof createTelemedicineSchema
>["body"];

export interface CreateTelemedicineOutput {
	id: string;
	visitId: string;
	patientId: string;
	doctorId: string;
	scheduledAt: string;
	duration: number;
	type: string;
	status: string;
	joinUrl: string;
	createdAt: string;
}
