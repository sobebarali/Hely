import { LabOrder } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("collectLabOrder");

interface UpdateLabOrderSampleCollectionParams {
	tenantId: string;
	orderId: string;
	expectedStatus: string;
	sampleDetails: {
		sampleType: string;
		collectedBy: string;
		collectedAt: Date;
		sampleId: string;
		notes?: string;
	};
	status: string;
}

export async function updateLabOrderSampleCollection({
	tenantId,
	orderId,
	expectedStatus,
	sampleDetails,
	status,
}: UpdateLabOrderSampleCollectionParams) {
	try {
		logger.debug(
			{ tenantId, orderId, status },
			"Updating lab order sample collection",
		);

		const labOrder = await LabOrder.findOneAndUpdate(
			{ _id: orderId, tenantId, status: expectedStatus },
			{ $set: { sampleDetails, status } },
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
		logError(logger, error, "Failed to update lab order sample collection");
		throw error;
	}
}
