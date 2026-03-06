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
import type { ListNotesQuery } from "../validations/list-notes.emr.validation";

const logger = createControllerLogger("listNotes");

export const listNotesController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{
				page: req.query.page,
				limit: req.query.limit,
				type: req.query.type,
				status: req.query.status,
			},
			"List clinical notes request received",
		);

		const query = req.query as unknown as ListNotesQuery;
		const result = await listNotesService({
			tenantId: req.user.tenantId,
			...query,
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
