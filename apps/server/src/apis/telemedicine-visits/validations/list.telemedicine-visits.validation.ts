import { z } from "zod";

// Zod schema for runtime validation
export const listTelemedicineVisitsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		status: z
			.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
			.optional(),
		patientId: z.string().optional(),
		providerId: z.string().optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		type: z.enum(["VIDEO", "AUDIO", "CHAT"]).optional(),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type ListTelemedicineVisitsQuery = z.infer<
	typeof listTelemedicineVisitsSchema.shape.query
>;

// Visit record output type
export interface TelemedicineVisitRecordOutput {
	id: string;
	patientId: string;
	providerId: string;
	scheduledAt: string;
	startedAt?: string;
	endedAt?: string;
	status: string;
	type: string;
	reason: string;
	meetingLink?: string;
	notes?: string;
	createdAt: string;
}

// Output type - manually defined for response structure
export interface ListTelemedicineVisitsOutput {
	data: TelemedicineVisitRecordOutput[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
