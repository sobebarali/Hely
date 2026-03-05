import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findClinicalNoteById } from "../repositories/shared.emr.repository";
import { amendClinicalNote } from "../repositories/update-note.emr.repository";
import type { AmendNoteInput } from "../validations/amend-note.emr.validation";

const logger = createServiceLogger("amendNote");

export async function amendNoteService({
	tenantId,
	noteId,
	amendedBy,
	...input
}: {
	tenantId: string;
	noteId: string;
	amendedBy: string;
} & AmendNoteInput) {
	logger.info({ tenantId, noteId }, "Amending clinical note");

	const note = await findClinicalNoteById({ tenantId, noteId });
	if (!note) {
		throw new NotFoundError("Clinical note not found", "NOT_FOUND");
	}

	if (note.status !== "SIGNED" && note.status !== "AMENDED") {
		throw new BadRequestError("Note must be signed to amend", "INVALID_STATUS");
	}

	const amended = await amendClinicalNote({
		tenantId,
		noteId,
		amendment: {
			reason: input.reason,
			content: input.content,
			amendedBy,
			amendedAt: new Date(),
		},
	});

	logger.info({ tenantId, noteId }, "Clinical note amended successfully");

	return {
		id: amended._id,
		status: amended.status,
		amendments: amended.amendments.map((a) => ({
			reason: a.reason,
			content: a.content,
			amendedBy: a.amendedBy,
			amendedAt: a.amendedAt.toISOString(),
		})),
	};
}
