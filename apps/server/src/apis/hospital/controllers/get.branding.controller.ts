import type { Request, Response } from "express";
import { BadRequestError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { asyncHandler } from "../../../utils/async-handler";
import { getBrandingByDomain } from "../services/get.branding.service";

const logger = createControllerLogger("getBranding");

export const getBrandingController = asyncHandler(
	async (req: Request, res: Response) => {
		const startTime = Date.now();
		const domain = req.query.domain as string;

		if (!domain) {
			throw new BadRequestError("domain query parameter is required");
		}

		logger.info({ domain }, "Get branding by domain controller started");

		const branding = await getBrandingByDomain({ domain });

		const duration = Date.now() - startTime;
		logSuccess(logger, { domain }, "Branding retrieved successfully", duration);

		res.status(200).json({ success: true, data: branding });
	},
);
