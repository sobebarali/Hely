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
import { updateHistoryService } from "../services/update-history.emr.service";

const logger = createControllerLogger("updateHistory");

export const updateHistoryController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId, body: req.body },
			"Update medical history request received",
		);

		const result = await updateHistoryService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId as string,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: result.patientId },
			"Medical history updated successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
