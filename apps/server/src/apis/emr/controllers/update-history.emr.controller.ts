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
import { updateHistoryService } from "../services/update-history.emr.service";
import type { UpdateHistoryInput } from "../validations/update-history.emr.validation";

const logger = createControllerLogger("updateHistory");

export const updateHistoryController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{
				patientId: req.params.patientId,
				fieldsProvided: Object.keys(req.body),
			},
			"Update medical history request received",
		);

		const patientId = req.params.patientId;
		if (!patientId) {
			throw new BadRequestError("Patient ID is required", "MISSING_PATIENT_ID");
		}

		const input = req.body as UpdateHistoryInput;
		const result = await updateHistoryService({
			tenantId: req.user.tenantId,
			patientId,
			...input,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId: result.patientId },
			"Medical history updated successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
