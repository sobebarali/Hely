import { ClinicalNote } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { ClinicalNoteLean } from "./shared.emr.repository";

const logger = createRepositoryLogger("updateNote");

export async function updateClinicalNote({
	tenantId,
	noteId,
	updates,
}: {
	tenantId: string;
	noteId: string;
	updates: Record<string, unknown>;
}): Promise<ClinicalNoteLean> {
	try {
		logger.debug({ tenantId, noteId }, "Updating clinical note");

		const note = await ClinicalNote.findOneAndUpdate(
			{ _id: noteId, tenantId },
			{ $set: updates },
			{ new: true },
		).lean();

		if (!note) {
			throw new Error("Failed to update clinical note");
		}

		logDatabaseOperation(
			logger,
			"update",
			"clinical_notes",
			{ tenantId, noteId },
			{ _id: note._id },
		);

		return note as unknown as ClinicalNoteLean;
	} catch (error) {
		logError(logger, error, "Failed to update clinical note", { tenantId });
		throw error;
	}
}

export async function signClinicalNote({
	tenantId,
	noteId,
	signedBy,
}: {
	tenantId: string;
	noteId: string;
	signedBy: string;
}): Promise<ClinicalNoteLean> {
	try {
		logger.debug({ tenantId, noteId }, "Signing clinical note");

		const note = await ClinicalNote.findOneAndUpdate(
			{ _id: noteId, tenantId },
			{
				$set: {
					status: "SIGNED",
					signedBy,
					signedAt: new Date(),
				},
			},
			{ new: true },
		).lean();

		if (!note) {
			throw new Error("Failed to sign clinical note");
		}

		logDatabaseOperation(
			logger,
			"update",
			"clinical_notes",
			{ tenantId, noteId },
			{ _id: note._id, status: "SIGNED" },
		);

		return note as unknown as ClinicalNoteLean;
	} catch (error) {
		logError(logger, error, "Failed to sign clinical note", { tenantId });
		throw error;
	}
}

export async function amendClinicalNote({
	tenantId,
	noteId,
	amendment,
}: {
	tenantId: string;
	noteId: string;
	amendment: {
		reason: string;
		content: string;
		amendedBy: string;
		amendedAt: Date;
	};
}): Promise<ClinicalNoteLean> {
	try {
		logger.debug({ tenantId, noteId }, "Amending clinical note");

		const note = await ClinicalNote.findOneAndUpdate(
			{ _id: noteId, tenantId },
			{
				$set: { status: "AMENDED" },
				$push: { amendments: amendment },
			},
			{ new: true },
		).lean();

		if (!note) {
			throw new Error("Failed to amend clinical note");
		}

		logDatabaseOperation(
			logger,
			"update",
			"clinical_notes",
			{ tenantId, noteId },
			{ _id: note._id, status: "AMENDED" },
		);

		return note as unknown as ClinicalNoteLean;
	} catch (error) {
		logError(logger, error, "Failed to amend clinical note", { tenantId });
		throw error;
	}
}
