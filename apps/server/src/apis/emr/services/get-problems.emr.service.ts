import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findProblemsByPatient } from "../repositories/problems.emr.repository";

const logger = createServiceLogger("getProblems");

export async function getProblemsService({
	tenantId,
	patientId,
	status,
}: {
	tenantId: string;
	patientId: string;
	status?: string;
}) {
	logger.debug({ patientId, status }, "Getting problem list");

	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new NotFoundError("Patient not found", "NOT_FOUND");
	}

	const problems = await findProblemsByPatient({
		tenantId,
		patientId,
		status,
	});

	const data = problems.map((p) => ({
		id: p._id,
		code: p.code,
		description: p.description,
		status: p.status,
		onsetDate: p.onsetDate?.toISOString(),
		resolvedDate: p.resolvedDate?.toISOString(),
		addedBy: p.addedBy,
		createdAt: p.createdAt.toISOString(),
	}));

	logger.info(
		{ tenantId, patientId, count: data.length },
		"Problem list retrieved",
	);

	return { data };
}
