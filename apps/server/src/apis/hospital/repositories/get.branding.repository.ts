import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("getBranding");

// Intentionally queries across all tenants — this is a public endpoint
// that resolves a custom domain to a hospital's branding configuration.
export async function findHospitalByCustomDomain({
	domain,
}: {
	domain: string;
}) {
	try {
		logger.debug({ domain }, "Finding hospital by custom domain");

		const hospital = await Hospital.findOne({
			"branding.customDomain": domain,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"hospitals",
			{ "branding.customDomain": domain },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to find hospital by custom domain", {
			domain,
		});
		throw error;
	}
}
