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
import { createLabOrderService } from "../services/create.lab-orders.service";

const logger = createControllerLogger("createLabOrder");

export const createLabOrderController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.body, "Create lab order request received");

		const result = await createLabOrderService({
			tenantId: req.user.tenantId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				labOrderId: result.id,
				orderId: result.orderId,
			},
			"Lab order created successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
