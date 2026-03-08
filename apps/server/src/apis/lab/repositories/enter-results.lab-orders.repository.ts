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

		const updateSet: Record<string, unknown> = {
			status,
			resultEnteredBy,
			resultEnteredAt,
		};

		if (resultNotes !== undefined) {
			updateSet.resultNotes = resultNotes;
		}

		// Set each test's resultDetails using arrayFilters
		const arrayFilters: Record<string, string>[] = [];
		for (let i = 0; i < results.length; i++) {
			const result = results[i]!;
			updateSet[`tests.$[elem${i}].resultDetails`] = result.resultDetails;
			arrayFilters.push({ [`elem${i}.testId`]: result.testId });
		}

		// Single atomic operation: status guard + top-level fields + all test results
		const labOrder = await LabOrder.findOneAndUpdate(
			{ _id: orderId, tenantId, status: expectedStatus },
			{ $set: updateSet },
			{ new: true, arrayFilters },
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
		logError(logger, error, "Failed to update lab order results");
		throw error;
	}
}
