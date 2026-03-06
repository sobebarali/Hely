import { createServiceLogger } from "../../../lib/logger";
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

	const signed = await signClinicalNote({ tenantId, noteId, signedBy });

	logger.info({ tenantId, noteId }, "Clinical note signed successfully");

	return {
		id: signed._id,
		status: signed.status,
		signedBy: signed.signedBy,
		signedAt: signed.signedAt?.toISOString(),
	};
}
