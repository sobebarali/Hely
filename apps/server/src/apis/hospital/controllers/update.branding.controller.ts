import type { Response } from "express";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { updateBranding } from "../services/update.branding.service";
import type { UpdateBrandingInput } from "../validations/update.branding.validation";

const logger = createControllerLogger("updateBranding");

export const updateBrandingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();
		const hospitalId = req.user.tenantId;
		const data = req.body as UpdateBrandingInput;

		logger.info({ hospitalId }, "Update branding controller started");

		const branding = await updateBranding({ hospitalId, data });

		const duration = Date.now() - startTime;
		logSuccess(
			logger,
			{ hospitalId },
			"Branding updated successfully",
			duration,
		);

		res.status(200).json({ success: true, data: branding });
	},
);
