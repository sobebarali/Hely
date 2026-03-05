import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findMedicalHistoryByPatient } from "../repositories/shared.emr.repository";

const logger = createServiceLogger("getHistory");

export async function getHistoryService({
	tenantId,
	patientId,
}: {
	tenantId: string;
	patientId: string;
}) {
	logger.info({ tenantId, patientId }, "Getting medical history");

	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new NotFoundError("Patient not found", "NOT_FOUND");
	}

	const history = await findMedicalHistoryByPatient({ tenantId, patientId });

	if (!history) {
		return {
			patientId,
			allergies: [],
			medications: [],
			surgicalHistory: [],
			familyHistory: [],
			socialHistory: {},
			immunizations: [],
			pastMedicalHistory: [],
			updatedAt: new Date().toISOString(),
		};
	}

	return {
		patientId: history.patientId,
		allergies: history.allergies,
		medications: history.medications,
		surgicalHistory: history.surgicalHistory,
		familyHistory: history.familyHistory,
		socialHistory: history.socialHistory || {},
		immunizations: history.immunizations,
		pastMedicalHistory: history.pastMedicalHistory,
		updatedAt: history.updatedAt.toISOString(),
	};
}
