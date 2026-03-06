import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findClinicalNoteById } from "../repositories/shared.emr.repository";

const logger = createServiceLogger("getNote");

export async function getNoteService({
	tenantId,
	noteId,
}: {
	tenantId: string;
	noteId: string;
}) {
	logger.debug({ noteId }, "Getting clinical note");

	const note = await findClinicalNoteById({ tenantId, noteId });
	if (!note) {
		throw new NotFoundError("Clinical note not found", "NOT_FOUND");
	}

	return {
		id: note._id,
		noteId: note.noteId,
		patientId: note.patientId,
		encounterId: note.encounterId,
		admissionId: note.admissionId,
		type: note.type,
		chiefComplaint: note.chiefComplaint,
		subjective: note.subjective,
		objective: note.objective,
		assessment: note.assessment,
		plan: note.plan,
		content: note.content,
		diagnosis: note.diagnosis,
		procedures: note.procedures,
		status: note.status,
		authorId: note.authorId,
		signedBy: note.signedBy,
		signedAt: note.signedAt?.toISOString(),
		amendments: note.amendments.map((a) => ({
			reason: a.reason,
			content: a.content,
			amendedBy: a.amendedBy,
			amendedAt: a.amendedAt.toISOString(),
		})),
		createdAt: note.createdAt.toISOString(),
		updatedAt: note.updatedAt.toISOString(),
	};
}
