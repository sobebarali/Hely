import { ConflictError, InternalError, NotFoundError } from "../../../errors";
import { invalidateHospitalCache } from "../../../lib/cache/hospital.cache";
import { createServiceLogger } from "../../../lib/logger";
import { findHospitalByCustomDomain } from "../repositories/get.branding.repository";
import { findHospitalById } from "../repositories/shared.hospital.repository";
import { updateBrandingByHospitalId } from "../repositories/update.branding.repository";
import type {
	BrandingOutput,
	UpdateBrandingInput,
} from "../validations/update.branding.validation";

const logger = createServiceLogger("updateBranding");

function toBrandingOutput(hospital: {
	branding?: Record<string, unknown>;
}): BrandingOutput {
	const b = hospital.branding || {};
	return {
		appName: (b.appName as string) || null,
		logoUrl: (b.logoUrl as string) || null,
		faviconUrl: (b.faviconUrl as string) || null,
		supportEmail: (b.supportEmail as string) || null,
		primaryColor: (b.primaryColor as string) || null,
		accentColor: (b.accentColor as string) || null,
		customDomain: (b.customDomain as string) || null,
	};
}

export { toBrandingOutput };

export async function updateBranding({
	hospitalId,
	data,
}: {
	hospitalId: string;
	data: UpdateBrandingInput;
}): Promise<BrandingOutput> {
	logger.info(
		{ hospitalId, fieldsToUpdate: Object.keys(data) },
		"Starting branding update",
	);

	const existing = await findHospitalById({ hospitalId });
	if (!existing) {
		throw new NotFoundError("Hospital not found");
	}

	// Check custom domain uniqueness if being set
	if (data.customDomain) {
		const domainHolder = await findHospitalByCustomDomain({
			domain: data.customDomain,
		});
		if (domainHolder && String(domainHolder._id) !== hospitalId) {
			throw new ConflictError("Custom domain is already in use");
		}
	}

	const updated = await updateBrandingByHospitalId({
		hospitalId,
		data: data as Record<string, unknown>,
	});

	if (!updated) {
		throw new InternalError("Failed to update branding", "UPDATE_FAILED");
	}

	await invalidateHospitalCache(hospitalId);
	logger.info({ hospitalId }, "Branding updated successfully");

	return toBrandingOutput(updated as { branding?: Record<string, unknown> });
}
