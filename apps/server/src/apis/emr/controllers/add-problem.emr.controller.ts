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
import type { AddProblemInput } from "../validations/add-problem.emr.validation";

const logger = createControllerLogger("addProblem");

export const addProblemController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.params.patientId, code: req.body.code },
			"Add problem request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to add problems",
				"STAFF_ID_REQUIRED",
			);
		}

		const input = req.body as AddProblemInput;
		const result = await addProblemService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId,
			addedBy: req.user.staffId,
			...input,
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
