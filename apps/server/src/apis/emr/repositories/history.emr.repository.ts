import { MedicalHistory } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { MedicalHistoryLean } from "./shared.emr.repository";

const logger = createRepositoryLogger("historyEmr");

export async function upsertMedicalHistory({
	tenantId,
	patientId,
	updates,
}: {
	tenantId: string;
	patientId: string;
	updates: Record<string, unknown>;
}): Promise<MedicalHistoryLean> {
	try {
		logger.debug({ tenantId, patientId }, "Upserting medical history");

		const history = await MedicalHistory.findOneAndUpdate(
			{ tenantId, patientId },
			{
				$set: updates,
				$setOnInsert: { _id: uuidv4() },
			},
			{ new: true, upsert: true },
		).lean();

		if (!history) {
			throw new Error("Failed to upsert medical history");
		}

		logDatabaseOperation(
			logger,
			"upsert",
			"medical_histories",
			{ tenantId, patientId },
			{ _id: history._id },
		);

		return history as unknown as MedicalHistoryLean;
	} catch (error) {
		logError(logger, error, "Failed to upsert medical history", { tenantId });
		throw error;
	}
}
