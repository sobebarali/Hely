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
import { listAppointmentsService } from "../services/list.appointments.service";
import type { ListAppointmentsInput } from "../validations/list.appointments.validation";

const logger = createControllerLogger("listAppointments");

export const listAppointmentsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.query, "List appointments request received");

		const query = req.query as unknown as ListAppointmentsInput;

		const result = await listAppointmentsService({
			tenantId: req.user.tenantId,
			...query,
			page: Number(query.page) || 1,
			limit: Number(query.limit) || 20,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				count: result.data.length,
				total: result.pagination.total,
			},
			"Appointments listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
