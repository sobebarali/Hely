import { BadRequestError, InternalError, NotFoundError } from "../../../errors";
import { invalidateHospitalCache } from "../../../lib/cache/hospital.cache";
import { createServiceLogger } from "../../../lib/logger";
import { uploadBrandingAsset } from "../../../lib/storage";
import { findHospitalById } from "../repositories/shared.hospital.repository";
import { updateBrandingByHospitalId } from "../repositories/update.branding.repository";

const logger = createServiceLogger("uploadBrandingAsset");

export async function uploadBrandingAssetService({
	hospitalId,
	type,
	base64Data,
}: {
	hospitalId: string;
	type: "logo" | "favicon";
	base64Data: string;
}): Promise<{ url: string }> {
	logger.info({ hospitalId, type }, "Uploading branding asset");

	const existing = await findHospitalById({ hospitalId });
	if (!existing) {
		throw new NotFoundError("Hospital not found");
	}

	let url: string | null;
	try {
		url = await uploadBrandingAsset({
			tenantId: hospitalId,
			type,
			base64Data,
		});
	} catch (error) {
		if (error instanceof Error) {
			throw new BadRequestError(error.message);
		}
		throw error;
	}

	if (!url) {
		throw new InternalError(
			"Storage not configured. Cannot upload branding assets.",
			"STORAGE_NOT_CONFIGURED",
		);
	}

	// Update the hospital branding with the new URL
	const fieldName = type === "logo" ? "logoUrl" : "faviconUrl";
	await updateBrandingByHospitalId({
		hospitalId,
		data: { [fieldName]: url },
	});

	await invalidateHospitalCache(hospitalId);
	logger.info({ hospitalId, type, url }, "Branding asset uploaded and saved");

	return { url };
}
