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
import { listTelemedicineService } from "../services/list.telemedicine.service";

const logger = createControllerLogger("listTelemedicine");

export const listTelemedicineController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ query: req.query },
			"List telemedicine visits request received",
		);

		const result = await listTelemedicineService({
			tenantId: req.user.tenantId,
			...req.query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				total: result.pagination.total,
				returned: result.data.length,
			},
			"Telemedicine visits listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
