import { LabOrderStatus } from "@hms/db";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { findLabOrderById } from "../repositories/shared.lab-orders.repository";
import { updateLabOrderVerification } from "../repositories/verify.lab-orders.repository";
import type {
	VerifyLabOrderInput,
	VerifyLabOrderOutput,
} from "../validations/verify.lab-orders.validation";

const logger = createServiceLogger("verifyLabOrder");

export async function verifyLabOrderService({
	tenantId,
	orderId,
	verifiedBy,
	comments,
}: {
	tenantId: string;
	orderId: string;
} & VerifyLabOrderInput): Promise<VerifyLabOrderOutput> {
	logger.info({ tenantId, orderId }, "Verifying lab order results");

	// Pre-flight: check existence and status
	const existingOrder = await findLabOrderById({ tenantId, orderId });

	if (!existingOrder) {
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	if (existingOrder.status !== LabOrderStatus.RESULTS_ENTERED) {
		throw new BadRequestError(
			`Cannot verify order with status ${existingOrder.status}`,
			"INVALID_STATUS",
		);
	}

	// Self-verification check
	if (verifiedBy === existingOrder.resultEnteredBy) {
		throw new BadRequestError(
			"The person who entered results cannot verify their own results",
			"SELF_VERIFICATION",
		);
	}

	const verifiedAt = new Date();

	// Parallel: atomic update + staff lookup
	const [updatedOrder, staff] = await Promise.all([
		updateLabOrderVerification({
			tenantId,
			orderId,
			expectedStatus: LabOrderStatus.RESULTS_ENTERED,
			status: LabOrderStatus.VERIFIED,
			verifiedBy,
			verifiedAt,
			verificationComments: comments,
		}),
		findStaffById({ tenantId, staffId: verifiedBy }),
	]);

	// Staff validation
	if (!staff) {
		throw new BadRequestError("Verifying staff not found", "INVALID_STAFF");
	}

	// Race condition: atomic update returned null
	if (!updatedOrder) {
		const currentOrder = await findLabOrderById({ tenantId, orderId });
		if (currentOrder) {
			throw new BadRequestError(
				`Cannot verify order with status ${currentOrder.status}`,
				"INVALID_STATUS",
			);
		}
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	logger.info({ labOrderId: orderId }, "Lab order verified successfully");

	return {
		id: String(updatedOrder._id),
		status: updatedOrder.status!,
		verifiedBy: {
			id: String(staff._id),
			employeeId: staff.employeeId,
			firstName: staff.firstName,
			lastName: staff.lastName,
		},
		verifiedAt: verifiedAt.toISOString(),
	};
}
