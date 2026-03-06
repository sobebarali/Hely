import {
	Admission,
	Appointment,
	ClinicalNote,
	LabOrder,
	Prescription,
	Vitals,
} from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("timelineEmr");

export interface TimelineEvent {
	id: string;
	type: string;
	title: string;
	description: string;
	metadata: Record<string, unknown>;
	authorId?: string;
	occurredAt: Date;
}

export interface TimelineResult {
	events: TimelineEvent[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export async function getPatientTimeline({
	tenantId,
	patientId,
	page,
	limit,
	type,
	startDate,
	endDate,
}: {
	tenantId: string;
	patientId: string;
	page: number;
	limit: number;
	type?: string;
	startDate?: string;
	endDate?: string;
}): Promise<TimelineResult> {
	try {
		logger.debug(
			{ tenantId, patientId, page, limit },
			"Getting patient timeline",
		);

		const events: TimelineEvent[] = [];

		const dateFilter: Record<string, Date> = {};
		if (startDate) dateFilter.$gte = new Date(startDate);
		if (endDate) dateFilter.$lte = new Date(endDate);
		const hasDateFilter = Object.keys(dateFilter).length > 0;

		const queries: Promise<void>[] = [];

		// Clinical notes
		if (!type || type === "NOTE") {
			queries.push(
				(async () => {
					const noteFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) noteFilter.createdAt = dateFilter;

					const notes = await ClinicalNote.find(noteFilter, {
						type: 1,
						status: 1,
						chiefComplaint: 1,
						content: 1,
						authorId: 1,
						createdAt: 1,
					}).lean();
					for (const note of notes) {
						events.push({
							id: String(note._id),
							type: "NOTE",
							title: `${note.type} Note`,
							description:
								(note.chiefComplaint as string) ||
								(note.content as string) ||
								"",
							metadata: {
								noteType: note.type,
								status: note.status,
							},
							authorId: note.authorId as string,
							occurredAt: note.createdAt as Date,
						});
					}
				})(),
			);
		}

		// Vitals
		if (!type || type === "VITALS") {
			queries.push(
				(async () => {
					const vitalsFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) vitalsFilter.recordedAt = dateFilter;

					const vitals = await Vitals.find(vitalsFilter, {
						heartRate: 1,
						bloodPressure: 1,
						temperature: 1,
						recordedBy: 1,
						recordedAt: 1,
					}).lean();
					for (const v of vitals) {
						events.push({
							id: String(v._id),
							type: "VITALS",
							title: "Vitals Recorded",
							description: "Vital signs measurement",
							metadata: {
								heartRate: v.heartRate,
								bloodPressure: v.bloodPressure,
								temperature: v.temperature,
							},
							authorId: v.recordedBy as string,
							occurredAt: v.recordedAt as Date,
						});
					}
				})(),
			);
		}

		// Lab orders
		if (!type || type === "LAB") {
			queries.push(
				(async () => {
					const labFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) labFilter.createdAt = dateFilter;

					const labs = await LabOrder.find(labFilter, {
						orderId: 1,
						status: 1,
						doctorId: 1,
						createdAt: 1,
					}).lean();
					for (const lab of labs) {
						events.push({
							id: String(lab._id),
							type: "LAB",
							title: "Lab Order",
							description: (lab.orderId as string) || "Lab order created",
							metadata: {
								status: lab.status,
							},
							authorId: lab.doctorId as string,
							occurredAt: lab.createdAt as Date,
						});
					}
				})(),
			);
		}

		// Prescriptions
		if (!type || type === "PRESCRIPTION") {
			queries.push(
				(async () => {
					const rxFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) rxFilter.createdAt = dateFilter;

					const prescriptions = await Prescription.find(rxFilter, {
						prescriptionId: 1,
						status: 1,
						doctorId: 1,
						createdAt: 1,
					}).lean();
					for (const rx of prescriptions) {
						events.push({
							id: String(rx._id),
							type: "PRESCRIPTION",
							title: "Prescription",
							description:
								(rx.prescriptionId as string) || "Prescription created",
							metadata: {
								status: rx.status,
							},
							authorId: rx.doctorId as string,
							occurredAt: rx.createdAt as Date,
						});
					}
				})(),
			);
		}

		// Appointments
		if (!type || type === "APPOINTMENT") {
			queries.push(
				(async () => {
					const apptFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) apptFilter.date = dateFilter;

					const appointments = await Appointment.find(apptFilter, {
						reason: 1,
						status: 1,
						type: 1,
						doctorId: 1,
						date: 1,
						createdAt: 1,
					}).lean();
					for (const appt of appointments) {
						events.push({
							id: String(appt._id),
							type: "APPOINTMENT",
							title: "Appointment",
							description: (appt.reason as string) || "Scheduled appointment",
							metadata: {
								status: appt.status,
								type: appt.type,
							},
							authorId: appt.doctorId as string,
							occurredAt: (appt.date as Date) || (appt.createdAt as Date),
						});
					}
				})(),
			);
		}

		// Admissions
		if (!type || type === "ADMISSION") {
			queries.push(
				(async () => {
					const admFilter: Record<string, unknown> = { tenantId, patientId };
					if (hasDateFilter) admFilter.admissionDate = dateFilter;

					const admissions = await Admission.find(admFilter, {
						admissionReason: 1,
						status: 1,
						admittedBy: 1,
						admissionDate: 1,
						createdAt: 1,
					}).lean();
					for (const adm of admissions) {
						events.push({
							id: String(adm._id),
							type: "ADMISSION",
							title: "Admission",
							description:
								(adm.admissionReason as string) || "Patient admission",
							metadata: {
								status: adm.status,
							},
							authorId: adm.admittedBy as string,
							occurredAt:
								(adm.admissionDate as Date) || (adm.createdAt as Date),
						});
					}
				})(),
			);
		}

		await Promise.all(queries);

		// Sort by occurredAt descending
		events.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

		const total = events.length;
		const totalPages = Math.ceil(total / limit);
		const skip = (page - 1) * limit;
		const paginatedEvents = events.slice(skip, skip + limit);

		logDatabaseOperation(
			logger,
			"multi-find",
			"timeline",
			{ tenantId, patientId },
			{ total, returned: paginatedEvents.length },
		);

		return {
			events: paginatedEvents,
			total,
			page,
			limit,
			totalPages,
		};
	} catch (error) {
		logError(logger, error, "Failed to get patient timeline", { tenantId });
		throw error;
	}
}
