import type { Response } from "express";
import { ForbiddenError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { amendNoteService } from "../services/amend-note.emr.service";

const logger = createControllerLogger("amendNote");

export const amendNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ noteId: req.params.noteId, body: req.body },
			"Amend clinical note request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to amend notes",
				"STAFF_ID_REQUIRED",
			);
		}

		const result = await amendNoteService({
			tenantId: req.user.tenantId,
			noteId: req.params.noteId as string,
			amendedBy: req.user.staffId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ noteId: result.id },
			"Clinical note amended successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
