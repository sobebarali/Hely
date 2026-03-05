import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findClinicalNoteById } from "../repositories/shared.emr.repository";
import { signClinicalNote } from "../repositories/update-note.emr.repository";

const logger = createServiceLogger("signNote");

export async function signNoteService({
	tenantId,
	noteId,
	signedBy,
}: {
	tenantId: string;
	noteId: string;
	signedBy: string;
}) {
	logger.info({ tenantId, noteId }, "Signing clinical note");

	const note = await findClinicalNoteById({ tenantId, noteId });
	if (!note) {
		throw new NotFoundError("Clinical note not found", "NOT_FOUND");
	}

	if (note.status !== "DRAFT") {
		throw new BadRequestError(
			"Note not in valid state for signing",
			"INVALID_STATUS",
		);
	}

	const signed = await signClinicalNote({ tenantId, noteId, signedBy });

	logger.info({ tenantId, noteId }, "Clinical note signed successfully");

	return {
		id: signed._id,
		status: signed.status,
		signedBy: signed.signedBy,
		signedAt: signed.signedAt?.toISOString(),
	};
}
