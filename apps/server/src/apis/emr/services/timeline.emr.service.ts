import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { getPatientTimeline } from "../repositories/timeline.emr.repository";
import type { TimelineQuery } from "../validations/timeline.emr.validation";

const logger = createServiceLogger("timeline");

export async function timelineService({
	tenantId,
	patientId,
	page: pageParam,
	limit: limitParam,
	...filters
}: {
	tenantId: string;
	patientId: string;
} & TimelineQuery) {
	logger.info({ tenantId, patientId }, "Getting patient timeline");

	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new NotFoundError("Patient not found", "NOT_FOUND");
	}

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;

	const result = await getPatientTimeline({
		tenantId,
		patientId,
		page,
		limit,
		...filters,
	});

	const data = result.events.map((event) => ({
		id: event.id,
		type: event.type,
		title: event.title,
		description: event.description,
		metadata: event.metadata,
		author: event.authorId ? { id: event.authorId } : undefined,
		occurredAt: event.occurredAt.toISOString(),
	}));

	logger.info(
		{ tenantId, patientId, total: result.total },
		"Patient timeline retrieved",
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
