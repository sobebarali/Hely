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
import { cancelTelemedicineService } from "../services/cancel.telemedicine.service";

const logger = createControllerLogger("cancelTelemedicine");

export const cancelTelemedicineController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ visitId: req.params.visitId, body: req.body },
			"Cancel telemedicine visit request received",
		);

		const result = await cancelTelemedicineService({
			tenantId: req.user.tenantId,
			visitId: req.params.visitId as string,
			cancelledBy: req.user.userId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ visitId: result.id },
			"Telemedicine visit cancelled successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
