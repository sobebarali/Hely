import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("updateBranding");

export async function updateBrandingByHospitalId({
	hospitalId,
	data,
}: {
	hospitalId: string;
	data: Record<string, unknown>;
}) {
	try {
		logger.debug({ hospitalId }, "Updating hospital branding");

		const hasUnsets = Object.entries(data).some(([, v]) => v === null);
		const setFields: Record<string, unknown> = {};
		const unsetFields: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(data)) {
			if (value === null) {
				unsetFields[`branding.${key}`] = "";
			} else {
				setFields[`branding.${key}`] = value;
			}
		}

		const updateOp: Record<string, unknown> = {};
		if (Object.keys(setFields).length > 0) {
			updateOp.$set = setFields;
		}
		if (hasUnsets && Object.keys(unsetFields).length > 0) {
			updateOp.$unset = unsetFields;
		}

		const hospital = await Hospital.findByIdAndUpdate(hospitalId, updateOp, {
			new: true,
			runValidators: true,
		});

		logDatabaseOperation(
			logger,
			"findByIdAndUpdate",
			"hospitals",
			{ _id: hospitalId },
			hospital ? { found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to update hospital branding", {
			hospitalId,
		});
		throw error;
	}
}
