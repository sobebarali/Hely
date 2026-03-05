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
import { timelineService } from "../services/timeline.emr.service";

const logger = createControllerLogger("timeline");

export const timelineController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId, query: req.query },
			"Patient timeline request received",
		);

		const result = await timelineService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId as string,
			...req.query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: req.params.patientId, total: result.pagination.total },
			"Patient timeline retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
