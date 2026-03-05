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
import { createTelemedicineService } from "../services/create.telemedicine.service";

const logger = createControllerLogger("createTelemedicine");

export const createTelemedicineController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.body, "Create telemedicine visit request received");

		const result = await createTelemedicineService({
			tenantId: req.user.tenantId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ visitId: result.id },
			"Telemedicine visit created successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
