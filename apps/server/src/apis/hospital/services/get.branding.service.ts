import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findHospitalByCustomDomain } from "../repositories/get.branding.repository";
import type { BrandingOutput } from "../validations/update.branding.validation";
import { toBrandingOutput } from "./update.branding.service";

const logger = createServiceLogger("getBranding");

export async function getBrandingByDomain({
	domain,
}: {
	domain: string;
}): Promise<BrandingOutput> {
	logger.info({ domain }, "Looking up branding by domain");

	const hospital = await findHospitalByCustomDomain({ domain });

	if (!hospital) {
		throw new NotFoundError("No organization found for this domain");
	}

	logger.info(
		{ domain, hospitalId: hospital._id },
		"Branding found for domain",
	);

	return toBrandingOutput(hospital as { branding?: Record<string, unknown> });
}
