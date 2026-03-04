import { LabOrder } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("verifyLabOrder");

interface UpdateLabOrderVerificationParams {
	tenantId: string;
	orderId: string;
	expectedStatus: string;
	status: string;
	verifiedBy: string;
	verifiedAt: Date;
	verificationComments?: string;
}

export async function updateLabOrderVerification({
	tenantId,
	orderId,
	expectedStatus,
	status,
	verifiedBy,
	verifiedAt,
	verificationComments,
}: UpdateLabOrderVerificationParams) {
	try {
		logger.debug(
			{ tenantId, orderId, status },
			"Updating lab order verification",
		);

		const updateSet: Record<string, unknown> = {
			status,
			verifiedBy,
			verifiedAt,
		};

		if (verificationComments !== undefined) {
			updateSet.verificationComments = verificationComments;
		}

		const labOrder = await LabOrder.findOneAndUpdate(
			{ _id: orderId, tenantId, status: expectedStatus },
			{ $set: updateSet },
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"labOrder",
			{ tenantId, orderId },
			labOrder ? { _id: labOrder._id, status } : { found: false },
		);

		return labOrder;
	} catch (error) {
		logError(logger, error, "Failed to update lab order verification");
		throw error;
	}
}
