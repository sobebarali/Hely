import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findClinicalNoteById } from "../repositories/shared.emr.repository";
import { updateClinicalNote } from "../repositories/update-note.emr.repository";
import type { UpdateNoteInput } from "../validations/update-note.emr.validation";

const logger = createServiceLogger("updateNote");

export async function updateNoteService({
	tenantId,
	noteId,
	userId,
	...input
}: {
	tenantId: string;
	noteId: string;
	userId: string;
} & UpdateNoteInput) {
	logger.info({ tenantId, noteId }, "Updating clinical note");

	const note = await findClinicalNoteById({ tenantId, noteId });
	if (!note) {
		throw new NotFoundError("Clinical note not found", "NOT_FOUND");
	}

	if (note.status !== "DRAFT") {
		throw new BadRequestError(
			"Cannot edit a signed note",
			"NOTE_ALREADY_SIGNED",
		);
	}

	if (note.authorId !== userId) {
		throw new ForbiddenError(
			"Only the original author can update a note",
			"FORBIDDEN",
		);
	}

	const updates: Record<string, unknown> = {};
	if (input.chiefComplaint !== undefined)
		updates.chiefComplaint = input.chiefComplaint;
	if (input.subjective !== undefined) updates.subjective = input.subjective;
	if (input.objective !== undefined) updates.objective = input.objective;
	if (input.assessment !== undefined) updates.assessment = input.assessment;
	if (input.plan !== undefined) updates.plan = input.plan;
	if (input.content !== undefined) updates.content = input.content;
	if (input.diagnosis !== undefined) updates.diagnosis = input.diagnosis;
	if (input.procedures !== undefined) updates.procedures = input.procedures;

	const updated = await updateClinicalNote({ tenantId, noteId, updates });

	logger.info({ tenantId, noteId }, "Clinical note updated successfully");

	return {
		id: updated._id,
		status: updated.status,
		updatedAt: updated.updatedAt.toISOString(),
	};
}
