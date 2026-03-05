import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findTelemedicineVisitById } from "../repositories/shared.telemedicine.repository";
import type { TelemedicineVisitOutput } from "../validations/list.telemedicine.validation";

const logger = createServiceLogger("getTelemedicineById");

export async function getTelemedicineByIdService({
	tenantId,
	visitId,
}: {
	tenantId: string;
	visitId: string;
}): Promise<TelemedicineVisitOutput> {
	logger.info({ tenantId, visitId }, "Getting telemedicine visit by ID");

	const visit = await findTelemedicineVisitById({ tenantId, visitId });
	if (!visit) {
		throw new NotFoundError("Virtual visit not found", "NOT_FOUND");
	}

	logger.info(
		{ visitId: visit._id, tenantId },
		"Telemedicine visit retrieved successfully",
	);

	return {
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
	};
}
