import { z } from "zod";

export const listTelemedicineSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		patientId: z.string().optional(),
		doctorId: z.string().optional(),
		status: z
			.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
			.optional(),
		type: z.enum(["CONSULTATION", "FOLLOW_UP", "SECOND_OPINION"]).optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		sortBy: z
			.enum(["scheduledAt", "createdAt", "status", "type"])
			.default("scheduledAt")
			.optional(),
		sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
	}),
});

export type ListTelemedicineQuery = z.infer<
	typeof listTelemedicineSchema
>["query"];

export interface TelemedicineVisitOutput {
	id: string;
	visitId: string;
	patientId: string;
	doctorId: string;
	scheduledAt: string;
	duration: number;
	type: string;
	reason: string;
	status: string;
	joinUrl: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ListTelemedicineOutput {
	data: TelemedicineVisitOutput[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
