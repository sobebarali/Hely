import { LabOrder } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("collectLabOrder");

export async function findLabOrderById({
	tenantId,
	orderId,
}: {
	tenantId: string;
	orderId: string;
}) {
	try {
		logger.debug({ tenantId, orderId }, "Finding lab order by ID");

		const labOrder = await LabOrder.findOne({
			_id: orderId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"labOrder",
			{ tenantId, orderId },
			labOrder ? { _id: labOrder._id, found: true } : { found: false },
		);

		return labOrder;
	} catch (error) {
		logError(logger, error, "Failed to find lab order by ID");
		throw error;
	}
}

interface UpdateLabOrderSampleCollectionParams {
	tenantId: string;
	orderId: string;
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
	sampleDetails,
	status,
}: UpdateLabOrderSampleCollectionParams) {
	try {
		logger.debug(
			{ tenantId, orderId, status },
			"Updating lab order sample collection",
		);

		const labOrder = await LabOrder.findOneAndUpdate(
			{ _id: orderId, tenantId },
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
