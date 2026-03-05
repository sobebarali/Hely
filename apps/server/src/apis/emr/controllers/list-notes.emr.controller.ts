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
import { listNotesService } from "../services/list-notes.emr.service";

const logger = createControllerLogger("listNotes");

export const listNotesController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ query: req.query },
			"List clinical notes request received",
		);

		const result = await listNotesService({
			tenantId: req.user.tenantId,
			...req.query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ total: result.pagination.total, returned: result.data.length },
			"Clinical notes listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
