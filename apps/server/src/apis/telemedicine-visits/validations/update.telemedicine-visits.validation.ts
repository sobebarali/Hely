import { z } from "zod";

// Zod schema for runtime validation
export const updateTelemedicineVisitSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Visit ID is required"),
	}),
	body: z.object({
		status: z
			.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
			.optional(),
		scheduledAt: z.string().optional(),
		meetingLink: z.string().url().optional(),
		notes: z.string().optional(),
		diagnosis: z.string().optional(),
		prescription: z.string().optional(),
		metadata: z.record(z.string(), z.unknown()).optional(),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type UpdateTelemedicineVisitParams = z.infer<
	typeof updateTelemedicineVisitSchema.shape.params
>;
export type UpdateTelemedicineVisitInput = z.infer<
	typeof updateTelemedicineVisitSchema.shape.body
>;

// Output type - manually defined for response structure
export interface UpdateTelemedicineVisitOutput {
	id: string;
	patientId: string;
	providerId: string;
	scheduledAt: string;
	startedAt?: string;
	endedAt?: string;
	status: string;
	type: string;
	meetingLink?: string;
	notes?: string;
	reason: string;
	diagnosis?: string;
	prescription?: string;
	metadata?: Record<string, unknown>;
	updatedAt: string;
}
