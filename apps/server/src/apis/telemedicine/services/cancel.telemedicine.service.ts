import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { cancelTelemedicineVisit } from "../repositories/cancel.telemedicine.repository";
import { findTelemedicineVisitById } from "../repositories/shared.telemedicine.repository";
import type {
	CancelTelemedicineInput,
	CancelTelemedicineOutput,
} from "../validations/cancel.telemedicine.validation";

const logger = createServiceLogger("cancelTelemedicine");

export async function cancelTelemedicineService({
	tenantId,
	visitId,
	reason,
	cancelledBy,
}: {
	tenantId: string;
	visitId: string;
	cancelledBy: string;
} & CancelTelemedicineInput): Promise<CancelTelemedicineOutput> {
	logger.info({ tenantId, visitId }, "Cancelling telemedicine visit");

	const visit = await findTelemedicineVisitById({ tenantId, visitId });
	if (!visit) {
		throw new NotFoundError("Virtual visit not found", "NOT_FOUND");
	}

	if (visit.status !== "SCHEDULED") {
		throw new BadRequestError(
			"Only scheduled visits can be cancelled",
			"INVALID_STATUS",
		);
	}

	const updated = await cancelTelemedicineVisit({
		tenantId,
		visitId,
		reason,
		cancelledBy,
	});

	logger.info(
		{ visitId, tenantId },
		"Telemedicine visit cancelled successfully",
	);

	return {
		id: updated._id,
		status: updated.status,
		cancellationReason: updated.cancellationReason || "",
		cancelledAt: updated.cancelledAt
			? updated.cancelledAt.toISOString()
			: new Date().toISOString(),
	};
}
