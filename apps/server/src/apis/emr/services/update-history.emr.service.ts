import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { upsertMedicalHistory } from "../repositories/history.emr.repository";
import type { UpdateHistoryInput } from "../validations/update-history.emr.validation";

const logger = createServiceLogger("updateHistory");

export async function updateHistoryService({
	tenantId,
	patientId,
	...input
}: {
	tenantId: string;
	patientId: string;
} & UpdateHistoryInput) {
	logger.info({ tenantId, patientId }, "Updating medical history");

	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new NotFoundError("Patient not found", "NOT_FOUND");
	}

	const updates: Record<string, unknown> = {};
	if (input.allergies !== undefined) updates.allergies = input.allergies;
	if (input.medications !== undefined) updates.medications = input.medications;
	if (input.surgicalHistory !== undefined)
		updates.surgicalHistory = input.surgicalHistory;
	if (input.familyHistory !== undefined)
		updates.familyHistory = input.familyHistory;
	if (input.socialHistory !== undefined)
		updates.socialHistory = input.socialHistory;
	if (input.immunizations !== undefined)
		updates.immunizations = input.immunizations;
	if (input.pastMedicalHistory !== undefined)
		updates.pastMedicalHistory = input.pastMedicalHistory;

	const history = await upsertMedicalHistory({ tenantId, patientId, updates });

	logger.info({ tenantId, patientId }, "Medical history updated successfully");

	return {
		patientId: history.patientId,
		updatedAt: history.updatedAt.toISOString(),
	};
}
