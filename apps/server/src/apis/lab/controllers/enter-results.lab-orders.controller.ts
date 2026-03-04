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
import { enterLabResultsService } from "../services/enter-results.lab-orders.service";

const logger = createControllerLogger("enterLabResults");

export const enterLabResultsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ params: req.params, body: req.body },
			"Enter results request received",
		);

		const result = await enterLabResultsService({
			tenantId: req.user.tenantId,
			orderId: req.params.orderId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				labOrderId: result.id,
				status: result.status,
			},
			"Results entered successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
