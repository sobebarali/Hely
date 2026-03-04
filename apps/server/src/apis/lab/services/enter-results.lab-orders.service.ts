import { LabOrderStatus } from "@hms/db";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { updateLabOrderResults } from "../repositories/enter-results.lab-orders.repository";
import { findLabOrderById } from "../repositories/shared.lab-orders.repository";
import type {
	EnterLabResultInput,
	EnterLabResultOutput,
} from "../validations/enter-results.lab-orders.validation";

const logger = createServiceLogger("enterLabResults");

export async function enterLabResultsService({
	tenantId,
	orderId,
	results,
	enteredBy,
	notes,
}: {
	tenantId: string;
	orderId: string;
} & EnterLabResultInput): Promise<EnterLabResultOutput> {
	logger.info({ tenantId, orderId }, "Entering results for lab order");

	// First, fetch the order to validate testIds
	const existingOrder = await findLabOrderById({ tenantId, orderId });

	if (!existingOrder) {
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	if (existingOrder.status !== LabOrderStatus.SAMPLE_COLLECTED) {
		throw new BadRequestError(
			`Cannot enter results for order with status ${existingOrder.status}`,
			"INVALID_STATUS",
		);
	}

	// Validate all submitted testIds belong to the order's tests
	const orderTestIds = new Set(
		existingOrder.tests.map((t: { testId: string }) => t.testId),
	);

	for (const result of results) {
		if (!orderTestIds.has(result.testId)) {
			throw new BadRequestError(
				`Test ${result.testId} is not part of this order`,
				"INVALID_TEST",
			);
		}
	}

	// Validate all tests in order have results submitted (no partial)
	const submittedTestIds = new Set(results.map((r) => r.testId));
	if (submittedTestIds.size !== orderTestIds.size) {
		throw new BadRequestError(
			"All tests in the order must have results submitted",
			"INVALID_REQUEST",
		);
	}

	const resultEnteredAt = new Date();

	// Parallel: atomic update + staff lookup
	const [updatedOrder, staff] = await Promise.all([
		updateLabOrderResults({
			tenantId,
			orderId,
			expectedStatus: LabOrderStatus.SAMPLE_COLLECTED,
			results: results.map((r) => ({
				testId: r.testId,
				resultDetails: {
					value: r.value,
					unit: r.unit,
					normalRange: r.normalRange,
					flag: r.flag,
					interpretation: r.interpretation,
				},
			})),
			status: LabOrderStatus.RESULTS_ENTERED,
			resultEnteredBy: enteredBy,
			resultEnteredAt,
			resultNotes: notes,
		}),
		findStaffById({ tenantId, staffId: enteredBy }),
	]);

	// Staff validation
	if (!staff) {
		throw new BadRequestError("Entering staff not found", "INVALID_STAFF");
	}

	// If atomic update returned null, shouldn't happen since we checked above,
	// but handle race condition
	if (!updatedOrder) {
		const currentOrder = await findLabOrderById({ tenantId, orderId });
		if (currentOrder) {
			throw new BadRequestError(
				`Cannot enter results for order with status ${currentOrder.status}`,
				"INVALID_STATUS",
			);
		}
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	logger.info({ labOrderId: orderId }, "Results entered successfully");

	return {
		id: String(updatedOrder._id),
		orderId: updatedOrder.orderId,
		status: updatedOrder.status!,
		tests: updatedOrder.tests.map(
			(t: {
				testId: string;
				testName: string;
				testCode: string;
				resultDetails?: {
					value: string;
					unit?: string;
					normalRange?: string;
					flag?: string;
					interpretation?: string;
				};
			}) => ({
				testId: t.testId,
				testName: t.testName,
				testCode: t.testCode,
				resultDetails: t.resultDetails!,
			}),
		),
		enteredBy: {
			id: String(staff._id),
			employeeId: staff.employeeId,
			firstName: staff.firstName,
			lastName: staff.lastName,
		},
		enteredAt: resultEnteredAt.toISOString(),
		notes,
	};
}
