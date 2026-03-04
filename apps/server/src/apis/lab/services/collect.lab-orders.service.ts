import { LabOrderStatus } from "@hms/db";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { updateLabOrderSampleCollection } from "../repositories/collect.lab-orders.repository";
import { findLabOrderById } from "../repositories/shared.lab-orders.repository";
import type {
	CollectLabOrderInput,
	CollectLabOrderOutput,
} from "../validations/collect.lab-orders.validation";

const logger = createServiceLogger("collectLabOrder");

export async function collectLabOrderService({
	tenantId,
	orderId,
	sampleType,
	collectedBy,
	collectedAt,
	sampleId,
	notes,
}: {
	tenantId: string;
	orderId: string;
} & CollectLabOrderInput): Promise<CollectLabOrderOutput> {
	logger.info({ tenantId, orderId }, "Collecting sample for lab order");

	// Generate sampleId if not provided
	const finalSampleId = sampleId || `${tenantId}-SMP-${Date.now()}`;

	// Default collectedAt to now if not provided
	const finalCollectedAt = collectedAt ? new Date(collectedAt) : new Date();

	// Run atomic update and staff lookup in parallel
	const [updatedOrder, staff] = await Promise.all([
		updateLabOrderSampleCollection({
			tenantId,
			orderId,
			expectedStatus: LabOrderStatus.ORDERED,
			sampleDetails: {
				sampleType,
				collectedBy,
				collectedAt: finalCollectedAt,
				sampleId: finalSampleId,
				notes,
			},
			status: LabOrderStatus.SAMPLE_COLLECTED,
		}),
		findStaffById({ tenantId, staffId: collectedBy }),
	]);

	// Staff validation
	if (!staff) {
		throw new BadRequestError("Collecting staff not found", "INVALID_STAFF");
	}

	// If atomic update returned null, distinguish not-found vs wrong-status
	if (!updatedOrder) {
		const existingOrder = await findLabOrderById({ tenantId, orderId });
		if (existingOrder) {
			throw new BadRequestError(
				`Cannot collect sample for order with status ${existingOrder.status}`,
				"INVALID_STATUS",
			);
		}
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	logger.info(
		{ labOrderId: orderId, sampleId: finalSampleId },
		"Sample collected successfully",
	);

	return {
		id: String(updatedOrder._id),
		orderId: updatedOrder.orderId,
		status: updatedOrder.status!,
		sampleDetails: {
			sampleType,
			collectedBy: {
				id: String(staff._id),
				employeeId: staff.employeeId,
				firstName: staff.firstName,
				lastName: staff.lastName,
			},
			collectedAt: finalCollectedAt.toISOString(),
			sampleId: finalSampleId,
			notes,
		},
	};
}
