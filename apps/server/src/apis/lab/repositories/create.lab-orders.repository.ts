import { LabOrder } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("createLabOrder");

interface CreateLabOrderParams {
	tenantId: string;
	orderId: string;
	patientId: string;
	doctorId: string;
	appointmentId?: string;
	admissionId?: string;
	tests: Array<{
		testId: string;
		testName: string;
		testCode: string;
		priority: string;
		clinicalNotes?: string;
	}>;
	diagnosis?: string;
	notes?: string;
}

export async function createLabOrder(params: CreateLabOrderParams) {
	try {
		logger.debug(
			{ tenantId: params.tenantId, orderId: params.orderId },
			"Creating lab order",
		);

		const id = uuidv4();
		await LabOrder.create({
			_id: id,
			...params,
		});

		const labOrder = await LabOrder.findById(id).lean();

		logDatabaseOperation(
			logger,
			"create",
			"labOrder",
			{ tenantId: params.tenantId, orderId: params.orderId },
			{ _id: id },
		);

		return labOrder!;
	} catch (error) {
		logError(logger, error, "Failed to create lab order");
		throw error;
	}
}
