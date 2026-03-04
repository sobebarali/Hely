import { LabOrder } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("enterLabResults");

interface ResultDetail {
	value: string;
	unit?: string;
	normalRange?: string;
	flag?: string;
	interpretation?: string;
}

interface UpdateLabOrderResultsParams {
	tenantId: string;
	orderId: string;
	expectedStatus: string;
	results: Array<{
		testId: string;
		resultDetails: ResultDetail;
	}>;
	status: string;
	resultEnteredBy: string;
	resultEnteredAt: Date;
	resultNotes?: string;
}

export async function updateLabOrderResults({
	tenantId,
	orderId,
	expectedStatus,
	results,
	status,
	resultEnteredBy,
	resultEnteredAt,
	resultNotes,
}: UpdateLabOrderResultsParams) {
	try {
		logger.debug({ tenantId, orderId, status }, "Updating lab order results");

		// Build the $set for each test's resultDetails
		const updateSet: Record<string, unknown> = {
			status,
			resultEnteredBy,
			resultEnteredAt,
		};

		if (resultNotes !== undefined) {
			updateSet.resultNotes = resultNotes;
		}

		// First, do the atomic update for status and top-level fields
		const labOrder = await LabOrder.findOneAndUpdate(
			{ _id: orderId, tenantId, status: expectedStatus },
			{ $set: updateSet },
			{ new: true },
		).lean();

		if (!labOrder) {
			return null;
		}

		// Now update each test's resultDetails
		const bulkOps = results.map((result) => ({
			updateOne: {
				filter: {
					_id: orderId,
					tenantId,
					"tests.testId": result.testId,
				},
				update: {
					$set: {
						"tests.$.resultDetails": result.resultDetails,
					},
				},
			},
		}));

		await LabOrder.bulkWrite(bulkOps);

		// Fetch the updated order
		const updatedOrder = await LabOrder.findOne({
			_id: orderId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"labOrder",
			{ tenantId, orderId },
			updatedOrder ? { _id: updatedOrder._id, status } : { found: false },
		);

		return updatedOrder;
	} catch (error) {
		logError(logger, error, "Failed to update lab order results");
		throw error;
	}
}
