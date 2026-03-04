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
import { listTestCatalogService } from "../services/list-tests.lab-catalog.service";
import type { ListTestCatalogInput } from "../validations/list-tests.lab-catalog.validation";

const logger = createControllerLogger("listTestCatalog");

export const listTestCatalogController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.query, "List test catalog request received");

		const query = req.query as unknown as ListTestCatalogInput;

		const result = await listTestCatalogService({
			tenantId: req.user.tenantId,
			...query,
			page: Number(query.page) || 1,
			limit: Number(query.limit) || 50,
			status: query.status || "ACTIVE",
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				count: result.data.length,
				total: result.pagination.total,
			},
			"Test catalog listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
