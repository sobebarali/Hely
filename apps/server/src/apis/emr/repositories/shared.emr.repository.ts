import { ClinicalNote, MedicalHistory } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedEmr");

export interface ClinicalNoteLean {
	_id: string;
	tenantId: string;
	noteId: string;
	patientId: string;
	encounterId?: string;
	admissionId?: string;
	type: string;
	chiefComplaint?: string;
	subjective?: string;
	objective?: string;
	assessment?: string;
	plan?: string;
	content?: string;
	diagnosis: Array<{
		code: string;
		description: string;
		type: string;
	}>;
	procedures: Array<{
		code: string;
		description: string;
	}>;
	status: string;
	authorId: string;
	signedBy?: string;
	signedAt?: Date;
	amendments: Array<{
		reason: string;
		content: string;
		amendedBy: string;
		amendedAt: Date;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

export interface MedicalHistoryLean {
	_id: string;
	tenantId: string;
	patientId: string;
	allergies: Array<{
		allergen: string;
		reaction?: string;
		severity?: string;
	}>;
	medications: Array<{
		name: string;
		dosage?: string;
		frequency?: string;
		startDate?: Date;
		endDate?: Date;
	}>;
	surgicalHistory: Array<{
		procedure: string;
		date?: Date;
		notes?: string;
	}>;
	familyHistory: Array<{
		condition: string;
		relationship?: string;
		notes?: string;
	}>;
	socialHistory?: {
		smoking?: string;
		alcohol?: string;
		exercise?: string;
		occupation?: string;
		notes?: string;
	};
	immunizations: Array<{
		vaccine: string;
		date?: Date;
		notes?: string;
	}>;
	pastMedicalHistory: Array<{
		condition: string;
		diagnosedDate?: Date;
		status?: string;
		notes?: string;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProblemListLean {
	_id: string;
	tenantId: string;
	patientId: string;
	code: string;
	description: string;
	status: string;
	onsetDate?: Date;
	resolvedDate?: Date;
	notes?: string;
	addedBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export async function findClinicalNoteById({
	tenantId,
	noteId,
}: {
	tenantId: string;
	noteId: string;
}): Promise<ClinicalNoteLean | null> {
	try {
		logger.debug({ tenantId, noteId }, "Finding clinical note by ID");

		const note = await ClinicalNote.findOne({
			_id: noteId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"clinical_notes",
			{ tenantId, noteId },
			note ? { _id: note._id, found: true } : { found: false },
		);

		return note as ClinicalNoteLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find clinical note by ID");
		throw error;
	}
}

export async function findMedicalHistoryByPatient({
	tenantId,
	patientId,
}: {
	tenantId: string;
	patientId: string;
}): Promise<MedicalHistoryLean | null> {
	try {
		logger.debug({ tenantId, patientId }, "Finding medical history");

		const history = await MedicalHistory.findOne({
			tenantId,
			patientId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"medical_histories",
			{ tenantId, patientId },
			history ? { _id: history._id, found: true } : { found: false },
		);

		return history as MedicalHistoryLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find medical history");
		throw error;
	}
}
