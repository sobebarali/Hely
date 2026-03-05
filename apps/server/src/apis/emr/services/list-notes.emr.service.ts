import { createServiceLogger } from "../../../lib/logger";
import { listClinicalNotes } from "../repositories/list-notes.emr.repository";
import type { ListNotesQuery } from "../validations/list-notes.emr.validation";

const logger = createServiceLogger("listNotes");

export async function listNotesService({
	tenantId,
	page: pageParam,
	limit: limitParam,
	...filters
}: {
	tenantId: string;
} & ListNotesQuery) {
	logger.info(
		{ tenantId, page: pageParam, limit: limitParam },
		"Listing clinical notes",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;

	const result = await listClinicalNotes({
		tenantId,
		page,
		limit,
		...filters,
	});

	const data = result.notes.map((note) => ({
		id: note._id,
		noteId: note.noteId,
		patientId: note.patientId,
		type: note.type,
		status: note.status,
		authorId: note.authorId,
		chiefComplaint: note.chiefComplaint,
		createdAt: note.createdAt.toISOString(),
		updatedAt: note.updatedAt.toISOString(),
	}));

	logger.info(
		{ tenantId, total: result.total, returned: data.length },
		"Clinical notes listed successfully",
	);

	return {
		data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
	};
}
