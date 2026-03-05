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
import { updateNoteService } from "../services/update-note.emr.service";

const logger = createControllerLogger("updateNote");

export const updateNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ noteId: req.params.noteId, body: req.body },
			"Update clinical note request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to update notes",
				"STAFF_ID_REQUIRED",
			);
		}

		const result = await updateNoteService({
			tenantId: req.user.tenantId,
			noteId: req.params.noteId as string,
			userId: req.user.staffId,
			...req.body,
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
