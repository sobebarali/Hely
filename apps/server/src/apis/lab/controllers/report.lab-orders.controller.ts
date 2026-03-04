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
import { reportLabOrderService } from "../services/report.lab-orders.service";

const logger = createControllerLogger("reportLabOrder");

export const reportLabOrderController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.params, "Lab report request received");

		const result = await reportLabOrderService({
			tenantId: req.user.tenantId,
			orderId: req.params.orderId,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ filename: result.filename },
			"Lab report generated successfully",
			duration,
		);

		res.setHeader("Content-Type", result.contentType);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${result.filename}"`,
		);

		res.status(200).send(result.content);
	},
);
