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
import { verifyLabOrderService } from "../services/verify.lab-orders.service";

const logger = createControllerLogger("verifyLabOrder");

export const verifyLabOrderController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ params: req.params, body: req.body },
			"Verify results request received",
		);

		const result = await verifyLabOrderService({
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
			"Results verified successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
