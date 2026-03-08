import { z } from "zod";

// Zod schema for runtime validation
export const createTelemedicineVisitSchema = z.object({
	body: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
		providerId: z.string().min(1, "Provider ID is required"),
		scheduledAt: z.string().min(1, "Scheduled date/time is required"),
		type: z.enum(["VIDEO", "AUDIO", "CHAT"]),
		reason: z.string().min(1, "Reason is required"),
		meetingLink: z.string().url().optional(),
		notes: z.string().optional(),
		metadata: z.record(z.string(), z.unknown()).optional(),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type CreateTelemedicineVisitInput = z.infer<
	typeof createTelemedicineVisitSchema
>["body"];

// Output type - manually defined for response structure
export interface CreateTelemedicineVisitOutput {
	id: string;
	patientId: string;
	providerId: string;
	scheduledAt: string;
	status: string;
	type: string;
	reason: string;
	meetingLink?: string;
	notes?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
}
