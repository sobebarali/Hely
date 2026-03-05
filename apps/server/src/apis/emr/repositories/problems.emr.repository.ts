import { ProblemList } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { ProblemListLean } from "./shared.emr.repository";

const logger = createRepositoryLogger("problemsEmr");

export async function findProblemsByPatient({
	tenantId,
	patientId,
	status,
}: {
	tenantId: string;
	patientId: string;
	status?: string;
}): Promise<ProblemListLean[]> {
	try {
		logger.debug(
			{ tenantId, patientId, status },
			"Finding problems by patient",
		);

		const filter: Record<string, unknown> = { tenantId, patientId };
		if (status && status !== "ALL") {
			filter.status = status;
		}

		const problems = await ProblemList.find(filter)
			.sort({ createdAt: -1 })
			.lean();

		logDatabaseOperation(
			logger,
			"find",
			"problem_lists",
			{ tenantId, patientId },
			{ returned: problems.length },
		);

		return problems as unknown as ProblemListLean[];
	} catch (error) {
		logError(logger, error, "Failed to find problems", { tenantId });
		throw error;
	}
}

export async function findActiveProblemByCode({
	tenantId,
	patientId,
	code,
}: {
	tenantId: string;
	patientId: string;
	code: string;
}): Promise<ProblemListLean | null> {
	try {
		const problem = await ProblemList.findOne({
			tenantId,
			patientId,
			code,
			status: "ACTIVE",
		}).lean();

		return problem as ProblemListLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find problem by code", { tenantId });
		throw error;
	}
}

export async function createProblem({
	tenantId,
	patientId,
	code,
	description,
	onsetDate,
	notes,
	addedBy,
}: {
	tenantId: string;
	patientId: string;
	code: string;
	description: string;
	onsetDate?: Date;
	notes?: string;
	addedBy: string;
}): Promise<ProblemListLean> {
	try {
		const id = uuidv4();

		logger.debug({ id, tenantId, patientId }, "Creating problem");

		await ProblemList.create({
			_id: id,
			tenantId,
			patientId,
			code,
			description,
			status: "ACTIVE",
			onsetDate,
			notes,
			addedBy,
		});

		const problem = await ProblemList.findOne({ _id: id, tenantId }).lean();
		if (!problem) {
			throw new Error("Failed to retrieve created problem");
		}

		logDatabaseOperation(
			logger,
			"create",
			"problem_lists",
			{ tenantId, patientId },
			{ _id: problem._id },
		);

		return problem as unknown as ProblemListLean;
	} catch (error) {
		logError(logger, error, "Failed to create problem", { tenantId });
		throw error;
	}
}
