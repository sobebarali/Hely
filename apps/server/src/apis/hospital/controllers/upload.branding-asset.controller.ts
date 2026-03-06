import type { Request, Response } from "express";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { asyncHandler } from "../../../utils/async-handler";
import { uploadBrandingAssetService } from "../services/upload.branding-asset.service";

const logger = createControllerLogger("uploadBrandingAsset");

export const uploadBrandingAssetController = asyncHandler(
	async (req: Request, res: Response) => {
		const startTime = Date.now();
		const hospitalId = req.user!.tenantId;
		const type = req.params.type as "logo" | "favicon";
		const { image } = req.body;

		logger.info(
			{ hospitalId, type },
			"Upload branding asset controller started",
		);

		const result = await uploadBrandingAssetService({
			hospitalId,
			type,
			base64Data: image,
		});

		const duration = Date.now() - startTime;
		logSuccess(
			logger,
			{ hospitalId, type },
			"Branding asset uploaded successfully",
			duration,
		);

		res.status(200).json({ success: true, data: result });
	},
);
