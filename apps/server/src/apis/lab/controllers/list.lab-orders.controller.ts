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
import { listLabOrdersService } from "../services/list.lab-orders.service";
import type { ListLabOrdersInput } from "../validations/list.lab-orders.validation";

const logger = createControllerLogger("listLabOrders");

export const listLabOrdersController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.query, "List lab orders request received");

		const result = await listLabOrdersService({
			tenantId: req.user.tenantId,
			...(req.query as unknown as ListLabOrdersInput),
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				count: result.data.length,
				total: result.pagination.total,
			},
			"Lab orders listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
