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
import { getTelemedicineByIdService } from "../services/get-by-id.telemedicine.service";

const logger = createControllerLogger("getTelemedicineById");

export const getTelemedicineByIdController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ visitId: req.params.visitId },
			"Get telemedicine visit by ID request received",
		);

		const result = await getTelemedicineByIdService({
			tenantId: req.user.tenantId,
			visitId: req.params.visitId as string,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ visitId: result.id },
			"Telemedicine visit retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
