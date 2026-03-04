import { createServiceLogger } from "../../../lib/logger";
import { findPatientsByIds } from "../../patients/repositories/shared.patients.repository";
import { findStaffByIds } from "../../users/repositories/shared.users.repository";
import { listLabOrders } from "../repositories/list.lab-orders.repository";
import type {
	ListLabOrdersInput,
	ListLabOrdersOutput,
} from "../validations/list.lab-orders.validation";

const logger = createServiceLogger("listLabOrders");

/**
 * List lab orders with filters, pagination, and enrichment
 */
export async function listLabOrdersService({
	tenantId,
	page,
	limit,
	patientId,
	doctorId,
	status,
	priority,
	startDate,
	endDate,
	search,
	sortBy,
	sortOrder,
}: {
	tenantId: string;
} & ListLabOrdersInput): Promise<ListLabOrdersOutput> {
	logger.info({ tenantId, page, limit, status }, "Listing lab orders");

	const result = await listLabOrders({
		tenantId,
		page,
		limit,
		patientId,
		doctorId,
		status,
		priority,
		startDate,
		endDate,
		search,
		sortBy,
		sortOrder,
	});

	// Batch-fetch related entities
	const patientIds = [...new Set(result.data.map((order) => order.patientId))];
	const doctorIds = [...new Set(result.data.map((order) => order.doctorId))];

	const [patients, doctors] = await Promise.all([
		patientIds.length > 0 ? findPatientsByIds({ tenantId, patientIds }) : [],
		doctorIds.length > 0
			? findStaffByIds({ tenantId, staffIds: doctorIds })
			: [],
	]);

	// Create lookup maps
	const patientMap = new Map(patients.map((p) => [String(p._id), p]));
	const doctorMap = new Map(doctors.map((d) => [String(d._id), d]));

	// Enrich lab orders
	const enrichedData = result.data.map((order) => {
		const patient = patientMap.get(order.patientId);
		const doctor = doctorMap.get(order.doctorId);

		return {
			id: String(order._id),
			orderId: order.orderId,
			patient: {
				id: order.patientId,
				patientId: patient?.patientId || "",
				firstName: patient?.firstName || "",
				lastName: patient?.lastName || "",
			},
			doctor: {
				id: order.doctorId,
				employeeId: doctor?.employeeId || "",
				firstName: doctor?.firstName || "",
				lastName: doctor?.lastName || "",
			},
			tests: (order.tests || []).map((t) => ({
				testId: t.testId,
				testName: t.testName,
				testCode: t.testCode,
				priority: t.priority,
				status: t.status,
				clinicalNotes: t.clinicalNotes ?? undefined,
			})),
			status: order.status,
			diagnosis: order.diagnosis ?? undefined,
			notes: order.notes ?? undefined,
			createdAt: order.createdAt.toISOString(),
		};
	});

	logger.info(
		{ count: enrichedData.length, total: result.pagination.total },
		"Lab orders listed successfully",
	);

	return {
		data: enrichedData,
		pagination: result.pagination,
	};
}
