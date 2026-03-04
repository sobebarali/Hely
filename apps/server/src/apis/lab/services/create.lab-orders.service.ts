import { LabOrderStatus } from "@hms/db";
import { BadRequestError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { createLabOrder } from "../repositories/create.lab-orders.repository";
import {
	findTestsByIds,
	generateLabOrderId,
} from "../repositories/shared.lab-orders.repository";
import type {
	CreateLabOrderInput,
	CreateLabOrderOutput,
} from "../validations/create.lab-orders.validation";

const logger = createServiceLogger("createLabOrder");

export async function createLabOrderService({
	tenantId,
	patientId,
	doctorId,
	tests,
	appointmentId,
	admissionId,
	diagnosis,
	notes,
}: {
	tenantId: string;
} & CreateLabOrderInput): Promise<CreateLabOrderOutput> {
	logger.info(
		{ tenantId, patientId, doctorId, testCount: tests.length },
		"Creating new lab order",
	);

	// Validate patient exists
	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		throw new BadRequestError("Patient not found", "INVALID_PATIENT");
	}

	// Validate doctor exists
	const doctor = await findStaffById({ tenantId, staffId: doctorId });
	if (!doctor) {
		throw new BadRequestError("Doctor not found", "INVALID_DOCTOR");
	}

	// Validate all tests exist in catalog and are ACTIVE
	const testIds = tests.map((t) => t.testId);
	const catalogTests = await findTestsByIds({ tenantId, testIds });

	if (catalogTests.length !== testIds.length) {
		const foundIds = new Set(catalogTests.map((t) => String(t._id)));
		const missingIds = testIds.filter((id) => !foundIds.has(id));
		throw new BadRequestError(
			`Tests not found or inactive: ${missingIds.join(", ")}`,
			"INVALID_TEST",
		);
	}

	const catalogMap = new Map(catalogTests.map((t) => [String(t._id), t]));

	// Generate order ID
	const orderId = await generateLabOrderId({ tenantId });

	// Build test items with catalog data
	const testItems = tests.map((t) => {
		const catalog = catalogMap.get(t.testId);
		return {
			testId: t.testId,
			testName: catalog?.name ?? "",
			testCode: catalog?.code ?? "",
			priority: t.priority || "ROUTINE",
			clinicalNotes: t.clinicalNotes,
		};
	});

	// Create lab order
	const labOrder = await createLabOrder({
		tenantId,
		orderId,
		patientId,
		doctorId,
		appointmentId,
		admissionId,
		tests: testItems,
		diagnosis,
		notes,
	});

	logger.info(
		{ labOrderId: labOrder._id, orderId },
		"Lab order created successfully",
	);

	return {
		id: String(labOrder._id),
		orderId: labOrder.orderId,
		patient: {
			id: String(patient._id),
			patientId: patient.patientId,
			firstName: patient.firstName,
			lastName: patient.lastName,
		},
		doctor: {
			id: String(doctor._id),
			employeeId: doctor.employeeId,
			firstName: doctor.firstName,
			lastName: doctor.lastName,
		},
		tests: labOrder.tests.map((t) => ({
			testId: t.testId,
			testName: t.testName,
			testCode: t.testCode,
			priority: t.priority,
			status: t.status || LabOrderStatus.ORDERED,
			clinicalNotes: t.clinicalNotes ?? undefined,
		})),
		status: labOrder.status || LabOrderStatus.ORDERED,
		diagnosis: labOrder.diagnosis ?? undefined,
		notes: labOrder.notes ?? undefined,
		createdAt: labOrder.createdAt.toISOString(),
	};
}
