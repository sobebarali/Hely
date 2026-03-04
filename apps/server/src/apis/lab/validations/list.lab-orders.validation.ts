import { z } from "zod";
import type {
	DoctorSummary,
	PatientSummary,
	TestItemSummary,
} from "./create.lab-orders.validation";

const LabOrderStatusEnum = z.enum([
	"ORDERED",
	"SAMPLE_COLLECTED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
]);

const TestPriorityEnum = z.enum(["ROUTINE", "URGENT", "STAT"]);

export const listLabOrdersSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(100).default(20),
		patientId: z.string().uuid().optional(),
		doctorId: z.string().uuid().optional(),
		status: LabOrderStatusEnum.optional(),
		priority: TestPriorityEnum.optional(),
		startDate: z.string().datetime().optional(),
		endDate: z.string().datetime().optional(),
		search: z.string().optional(),
		sortBy: z.enum(["createdAt", "orderId", "status"]).default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	}),
});

export type ListLabOrdersInput = z.infer<
	typeof listLabOrdersSchema.shape.query
>;

export interface LabOrderListItem {
	id: string;
	orderId: string;
	patient: PatientSummary;
	doctor: DoctorSummary;
	tests: TestItemSummary[];
	status: string;
	diagnosis?: string;
	notes?: string;
	createdAt: string;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ListLabOrdersOutput {
	data: LabOrderListItem[];
	pagination: PaginationInfo;
}
