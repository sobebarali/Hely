import { Counter } from "@hms/db";
import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { createClinicalNote } from "../repositories/create-note.emr.repository";
import type { CreateNoteInput } from "../validations/create-note.emr.validation";

const logger = createServiceLogger("createNote");

export async function createNoteService({
	tenantId,
	authorId,
	...input
}: {
	tenantId: string;
	authorId: string;
} & CreateNoteInput) {
	logger.info(
		{ tenantId, patientId: input.patientId },
		"Creating clinical note",
	);

	// Validate patient exists
	const patient = await findPatientById({
		tenantId,
		patientId: input.patientId,
	});
	if (!patient) {
		throw new NotFoundError("Patient not found", "INVALID_PATIENT");
	}

	// Generate note ID using Counter
	const counter = await Counter.findOneAndUpdate(
		{ tenantId, type: "clinical-note" },
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true },
	);
	const noteId = `${tenantId}-NOTE-${counter.seq}`;

	const note = await createClinicalNote({
		tenantId,
		noteId,
		patientId: input.patientId,
		encounterId: input.encounterId,
		admissionId: input.admissionId,
		type: input.type,
		chiefComplaint: input.chiefComplaint,
		subjective: input.subjective,
		objective: input.objective,
		assessment: input.assessment,
		plan: input.plan,
		content: input.content,
		diagnosis: input.diagnosis,
		procedures: input.procedures,
		authorId,
	});

	logger.info(
		{ noteId: note._id, tenantId },
		"Clinical note created successfully",
	);

	return {
		id: note._id,
		noteId: note.noteId,
		patientId: note.patientId,
		type: note.type,
		status: note.status,
		authorId: note.authorId,
		createdAt: note.createdAt.toISOString(),
	};
}
