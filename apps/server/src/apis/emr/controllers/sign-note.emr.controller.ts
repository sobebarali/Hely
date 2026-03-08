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
import { signNoteService } from "../services/sign-note.emr.service";

const logger = createControllerLogger("signNote");

export const signNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ noteId: req.params.noteId },
			"Sign clinical note request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to sign notes",
				"STAFF_ID_REQUIRED",
			);
		}

		const noteId = req.params.noteId;
		if (!noteId) {
			throw new BadRequestError("Note ID is required", "MISSING_NOTE_ID");
		}

		const result = await signNoteService({
			tenantId: req.user.tenantId,
			noteId,
			signedBy: req.user.staffId,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ noteId: result.id },
			"Clinical note signed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
