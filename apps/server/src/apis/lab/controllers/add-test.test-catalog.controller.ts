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
import { addTestToCatalogService } from "../services/add-test.test-catalog.service";

const logger = createControllerLogger("addTestCatalog");

export const addTestToCatalogController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.body, "Add test to catalog request received");

		const result = await addTestToCatalogService({
			tenantId: req.user.tenantId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ testId: result.id, code: result.code },
			"Test added to catalog successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
