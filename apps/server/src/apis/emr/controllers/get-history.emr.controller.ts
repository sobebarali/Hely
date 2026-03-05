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
import { getHistoryService } from "../services/get-history.emr.service";

const logger = createControllerLogger("getHistory");

export const getHistoryController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId },
			"Get medical history request received",
		);

		const result = await getHistoryService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId as string,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: result.patientId },
			"Medical history retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
