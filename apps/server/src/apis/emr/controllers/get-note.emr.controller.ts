import type { Response } from "express";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { getNoteService } from "../services/get-note.emr.service";

const logger = createControllerLogger("getNote");

export const getNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ noteId: req.params.noteId },
			"Get clinical note request received",
		);

		const result = await getNoteService({
			tenantId: req.user.tenantId,
			noteId: req.params.noteId,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ noteId: result.id },
			"Clinical note retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
