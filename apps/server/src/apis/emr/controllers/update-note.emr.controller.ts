import type { Response } from "express";
import { BadRequestError, ForbiddenError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { updateNoteService } from "../services/update-note.emr.service";
import type { UpdateNoteInput } from "../validations/update-note.emr.validation";

const logger = createControllerLogger("updateNote");

export const updateNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ noteId: req.params.noteId, fieldsProvided: Object.keys(req.body) },
			"Update clinical note request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to update notes",
				"STAFF_ID_REQUIRED",
			);
		}

		const noteId = req.params.noteId;
		if (!noteId) {
			throw new BadRequestError("Note ID is required", "MISSING_NOTE_ID");
		}

		const input = req.body as UpdateNoteInput;
		const result = await updateNoteService({
			tenantId: req.user.tenantId,
			noteId,
			userId: req.user.staffId,
			...input,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ noteId: result.id },
			"Clinical note updated successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
