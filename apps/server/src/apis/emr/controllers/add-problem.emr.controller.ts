import type { Response } from "express";
import { ForbiddenError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { addProblemService } from "../services/add-problem.emr.service";

const logger = createControllerLogger("addProblem");

export const addProblemController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId, body: req.body },
			"Add problem request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to add problems",
				"STAFF_ID_REQUIRED",
			);
		}

		const result = await addProblemService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId as string,
			addedBy: req.user.staffId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ problemId: result.id },
			"Problem added successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
