import { createServiceLogger } from "../../../lib/logger";
import { listTelemedicineVisits } from "../repositories/list.telemedicine.repository";
import type {
	ListTelemedicineOutput,
	ListTelemedicineQuery,
	TelemedicineVisitOutput,
} from "../validations/list.telemedicine.validation";

const logger = createServiceLogger("listTelemedicine");

export async function listTelemedicineService({
	tenantId,
	page: pageParam,
	limit: limitParam,
	...filters
}: {
	tenantId: string;
} & ListTelemedicineQuery): Promise<ListTelemedicineOutput> {
	logger.info(
		{ tenantId, page: pageParam, limit: limitParam },
		"Listing telemedicine visits",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;

	const result = await listTelemedicineVisits({
		tenantId,
		page,
		limit,
		...filters,
	});

	const data: TelemedicineVisitOutput[] = result.visits.map((visit) => ({
		id: visit._id,
		visitId: visit.visitId,
		patientId: visit.patientId,
		doctorId: visit.providerId,
		scheduledAt: visit.scheduledAt.toISOString(),
		duration: visit.duration,
		type: visit.type,
		reason: visit.reason,
		status: visit.status,
		joinUrl: visit.meetingLink || "",
		notes: visit.notes,
		createdAt: visit.createdAt.toISOString(),
		updatedAt: visit.updatedAt.toISOString(),
	}));

	logger.info(
		{ tenantId, total: result.total, returned: data.length },
		"Telemedicine visits listed successfully",
	);

	return {
		data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
	};
}
