import { ClinicalNote } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { ClinicalNoteLean } from "./shared.emr.repository";

const logger = createRepositoryLogger("createNote");

export async function createClinicalNote({
	tenantId,
	noteId,
	patientId,
	encounterId,
	admissionId,
	type,
	chiefComplaint,
	subjective,
	objective,
	assessment,
	plan,
	content,
	diagnosis,
	procedures,
	authorId,
}: {
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
	diagnosis?: Array<{ code: string; description: string; type: string }>;
	procedures?: Array<{ code: string; description: string }>;
	authorId: string;
}): Promise<ClinicalNoteLean> {
	try {
		const id = uuidv4();

		logger.debug({ id, tenantId, patientId }, "Creating clinical note");

		const created = await ClinicalNote.create({
			_id: id,
			tenantId,
			noteId,
			patientId,
			encounterId,
			admissionId,
			type,
			chiefComplaint,
			subjective,
			objective,
			assessment,
			plan,
			content,
			diagnosis: diagnosis || [],
			procedures: procedures || [],
			status: "DRAFT",
			authorId,
			amendments: [],
		});

		const note = created.toObject();

		logDatabaseOperation(
			logger,
			"create",
			"clinical_notes",
			{ tenantId, patientId },
			{ _id: note._id },
		);

		return note as unknown as ClinicalNoteLean;
	} catch (error) {
		logError(logger, error, "Failed to create clinical note", { tenantId });
		throw error;
	}
}
