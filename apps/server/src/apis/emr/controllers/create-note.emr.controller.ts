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
import { createNoteService } from "../services/create-note.emr.service";
import type { CreateNoteInput } from "../validations/create-note.emr.validation";

const logger = createControllerLogger("createNote");

export const createNoteController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ patientId: req.body.patientId, type: req.body.type },
			"Create clinical note request received",
		);

		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to create clinical notes",
				"STAFF_ID_REQUIRED",
			);
		}

		const input = req.body as CreateNoteInput;
		const result = await createNoteService({
			tenantId: req.user.tenantId,
			authorId: req.user.staffId,
			...input,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ noteId: result.id },
			"Clinical note created successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
