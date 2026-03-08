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
import { getProblemsService } from "../services/get-problems.emr.service";

const logger = createControllerLogger("getProblems");

export const getProblemsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId, status: req.query.status },
			"Get problem list request received",
		);

		const patientId = req.params.patientId;
		if (!patientId) {
			throw new BadRequestError("Patient ID is required", "MISSING_PATIENT_ID");
		}

		const result = await getProblemsService({
			tenantId: req.user.tenantId,
			patientId,
			status: req.query.status as string | undefined,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: req.params.patientId, count: result.data.length },
			"Problem list retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
