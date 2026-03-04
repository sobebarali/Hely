import { LabOrderStatus } from "@hms/db";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import {
	findLabOrderById,
	updateLabOrderSampleCollection,
} from "../repositories/collect.lab-orders.repository";
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

	// Validate lab order exists
	const labOrder = await findLabOrderById({ tenantId, orderId });
	if (!labOrder) {
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	// Validate status is ORDERED
	if (labOrder.status !== LabOrderStatus.ORDERED) {
		throw new BadRequestError(
			`Cannot collect sample for order with status ${labOrder.status}`,
			"INVALID_STATUS",
		);
	}

	// Validate collectedBy staff exists
	const staff = await findStaffById({ tenantId, staffId: collectedBy });
	if (!staff) {
		throw new BadRequestError("Collecting staff not found", "INVALID_STAFF");
	}

	// Generate sampleId if not provided
	const finalSampleId = sampleId || `${tenantId}-SMP-${Date.now()}`;

	// Default collectedAt to now if not provided
	const finalCollectedAt = collectedAt ? new Date(collectedAt) : new Date();

	// Update order with sample details and status
	const updatedOrder = await updateLabOrderSampleCollection({
		tenantId,
		orderId,
		sampleDetails: {
			sampleType,
			collectedBy,
			collectedAt: finalCollectedAt,
			sampleId: finalSampleId,
			notes,
		},
		status: LabOrderStatus.SAMPLE_COLLECTED,
	});

	logger.info(
		{ labOrderId: orderId, sampleId: finalSampleId },
		"Sample collected successfully",
	);

	return {
		id: String(updatedOrder!._id),
		orderId: updatedOrder!.orderId,
		status: updatedOrder!.status!,
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
