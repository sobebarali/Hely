import { z } from "zod";

// Zod schema for runtime validation
export const getTelemedicineVisitByIdSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Visit ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type GetTelemedicineVisitByIdParams = z.infer<
	typeof getTelemedicineVisitByIdSchema.shape.params
>;

// Output type - manually defined for response structure
export interface GetTelemedicineVisitByIdOutput {
	id: string;
	patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	};
	provider: {
		id: string;
		firstName: string;
		lastName: string;
	};
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
	createdAt: string;
	updatedAt: string;
}
