import { ConflictError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import {
	createProblem,
	findActiveProblemByCode,
} from "../repositories/problems.emr.repository";
import type { AddProblemInput } from "../validations/add-problem.emr.validation";

const logger = createServiceLogger("addProblem");

export async function addProblemService({
	tenantId,
	patientId,
	addedBy,
	...input
}: {
	tenantId: string;
	patientId: string;
	addedBy: string;
} & AddProblemInput) {
	logger.info({ tenantId, patientId, code: input.code }, "Adding problem");

	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new NotFoundError("Patient not found", "NOT_FOUND");
	}

	// Check for duplicate active problem
	const existing = await findActiveProblemByCode({
		tenantId,
		patientId,
		code: input.code,
	});
	if (existing) {
		throw new ConflictError(
			"Problem already exists in active list",
			"DUPLICATE_PROBLEM",
		);
	}

	const problem = await createProblem({
		tenantId,
		patientId,
		code: input.code,
		description: input.description,
		onsetDate: input.onsetDate ? new Date(input.onsetDate) : undefined,
		notes: input.notes,
		addedBy,
	});

	logger.info(
		{ tenantId, patientId, problemId: problem._id },
		"Problem added successfully",
	);

	return {
		id: problem._id,
		code: problem.code,
		description: problem.description,
		status: problem.status,
		onsetDate: problem.onsetDate?.toISOString(),
		addedBy: problem.addedBy,
		createdAt: problem.createdAt.toISOString(),
	};
}
