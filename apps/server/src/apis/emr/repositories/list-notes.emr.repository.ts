import { ClinicalNote } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { ClinicalNoteLean } from "./shared.emr.repository";

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const logger = createRepositoryLogger("listNotes");

export interface ListNotesResult {
	notes: ClinicalNoteLean[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export async function listClinicalNotes({
	tenantId,
	page,
	limit,
	patientId,
	type,
	status,
	authorId,
	startDate,
	endDate,
	search,
	sortBy,
	sortOrder,
}: {
	tenantId: string;
	page: number;
	limit: number;
	patientId?: string;
	type?: string;
	status?: string;
	authorId?: string;
	startDate?: string;
	endDate?: string;
	search?: string;
	sortBy?: string;
	sortOrder?: string;
}): Promise<ListNotesResult> {
	try {
		logger.debug({ tenantId, page, limit }, "Listing clinical notes");

		const filter: Record<string, unknown> = { tenantId };

		if (patientId) filter.patientId = patientId;
		if (type) filter.type = type;
		if (status) filter.status = status;
		if (authorId) filter.authorId = authorId;

		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) {
				(filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
			}
			if (endDate) {
				(filter.createdAt as Record<string, Date>).$lte = new Date(endDate);
			}
		}

		if (search) {
			const escaped = escapeRegex(search);
			filter.$or = [
				{ chiefComplaint: { $regex: escaped, $options: "i" } },
				{ content: { $regex: escaped, $options: "i" } },
				{ subjective: { $regex: escaped, $options: "i" } },
				{ assessment: { $regex: escaped, $options: "i" } },
			];
		}

		const total = await ClinicalNote.countDocuments(filter);
		const skip = (page - 1) * limit;
		const totalPages = Math.ceil(total / limit);

		const sortField = sortBy || "createdAt";
		const sortDir = sortOrder === "asc" ? 1 : -1;

		const notes = await ClinicalNote.find(filter, {
			noteId: 1,
			patientId: 1,
			type: 1,
			status: 1,
			authorId: 1,
			chiefComplaint: 1,
			createdAt: 1,
			updatedAt: 1,
		})
			.sort({ [sortField]: sortDir })
			.skip(skip)
			.limit(limit)
			.lean();

		logDatabaseOperation(
			logger,
			"find",
			"clinical_notes",
			{ tenantId, page, limit },
			{ total, returned: notes.length },
		);

		return {
			notes: notes as unknown as ClinicalNoteLean[],
			total,
			page,
			limit,
			totalPages,
		};
	} catch (error) {
		logError(logger, error, "Failed to list clinical notes", { tenantId });
		throw error;
	}
}
