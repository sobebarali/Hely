import type { Response } from "express";
import { BadRequestError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { timelineService } from "../services/timeline.emr.service";
import type { TimelineQuery } from "../validations/timeline.emr.validation";

const logger = createControllerLogger("timeline");

export const timelineController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{
				patientId: req.params.patientId,
				type: req.query.type,
				page: req.query.page,
			},
			"Patient timeline request received",
		);

		const patientId = req.params.patientId;
		if (!patientId) {
			throw new BadRequestError("Patient ID is required", "MISSING_PATIENT_ID");
		}

		const query = req.query as unknown as TimelineQuery;
		const result = await timelineService({
			tenantId: req.user.tenantId,
			patientId,
			...query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: req.params.patientId, total: result.pagination.total },
			"Patient timeline retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
