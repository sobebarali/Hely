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
import { collectLabOrderService } from "../services/collect.lab-orders.service";

const logger = createControllerLogger("collectLabOrder");

export const collectLabOrderController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ params: req.params, body: req.body },
			"Collect sample request received",
		);

		const result = await collectLabOrderService({
			tenantId: req.user.tenantId,
			orderId: req.params.orderId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				labOrderId: result.id,
				sampleId: result.sampleDetails.sampleId,
			},
			"Sample collected successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
