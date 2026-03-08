import {
	Counter,
	Organization,
	Patient,
	Staff,
	TelemedicineVisit,
	TelemedicineVisitStatus,
	TelemedicineVisitType,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { createServiceLogger } from "../logger";

const logger = createServiceLogger("telemedicineSeed");

interface CounterModel {
	getNextSequence(tenantId: string, type: string): Promise<number>;
}

const VISIT_REASONS = [
	"Follow-up consultation for hypertension management",
	"Routine check-up and medication review",
	"Dermatology consultation for skin rash",
	"Mental health follow-up and counseling",
	"Post-surgical recovery assessment",
];

/**
 * Seed telemedicine visits for a tenant
 */
export async function seedTelemedicine({
	tenantId,
}: {
	tenantId: string;
}): Promise<number> {
	logger.info({ tenantId }, "Seeding telemedicine visits");

	const patients = await Patient.find({ tenantId }).limit(5).lean();
	if (patients.length === 0) {
		logger.warn({ tenantId }, "No patients found, skipping telemedicine seed");
		return 0;
	}

	const doctor = await Staff.findOne({ tenantId }).lean();
	if (!doctor) {
		logger.warn({ tenantId }, "No staff found, skipping telemedicine seed");
		return 0;
	}

	const providerId = String(doctor._id);
	let count = 0;

	// Status distribution: 2 SCHEDULED, 1 IN_PROGRESS, 1 COMPLETED, 1 CANCELLED
	const statusDistribution = [
		TelemedicineVisitStatus.SCHEDULED,
		TelemedicineVisitStatus.SCHEDULED,
		TelemedicineVisitStatus.IN_PROGRESS,
		TelemedicineVisitStatus.COMPLETED,
		TelemedicineVisitStatus.CANCELLED,
	];

	const typeDistribution = [
		TelemedicineVisitType.CONSULTATION,
		TelemedicineVisitType.FOLLOW_UP,
		TelemedicineVisitType.CONSULTATION,
		TelemedicineVisitType.FOLLOW_UP,
		TelemedicineVisitType.SECOND_OPINION,
	];

	for (let i = 0; i < 5; i++) {
		const patient = patients[i % patients.length];
		const status = statusDistribution[i];
		const type = typeDistribution[i];

		if (!patient) continue;

		const patientId = String(patient._id);

		// Check if visit already exists
		const existing = await TelemedicineVisit.findOne({
			tenantId,
			patientId,
			status: TelemedicineVisitStatus.SCHEDULED,
		});
		if (existing) {
			logger.debug({ patientId }, "Visit already exists, skipping");
			continue;
		}

		const seq = await (Counter as unknown as CounterModel).getNextSequence(
			tenantId,
			"telemedicine",
		);
		const visitId = `TM-${String(seq).padStart(6, "0")}`;
		const id = uuidv4();

		// Schedule future visits, past for completed/cancelled
		const scheduledAt = new Date();
		if (
			status === TelemedicineVisitStatus.COMPLETED ||
			status === TelemedicineVisitStatus.CANCELLED
		) {
			scheduledAt.setDate(scheduledAt.getDate() - (i + 1) * 2);
		} else {
			scheduledAt.setDate(scheduledAt.getDate() + (i + 1));
		}
		scheduledAt.setHours(9 + i, 0, 0, 0);

		const visitData: Record<string, unknown> = {
			_id: id,
			tenantId,
			visitId,
			patientId,
			providerId,
			scheduledAt,
			duration: 30,
			status,
			type,
			reason: VISIT_REASONS[i % VISIT_REASONS.length],
			meetingLink: `https://meet.example.com/${visitId}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		if (status === TelemedicineVisitStatus.IN_PROGRESS) {
			visitData.startedAt = new Date();
		}

		if (status === TelemedicineVisitStatus.COMPLETED) {
			const startedAt = new Date(scheduledAt);
			visitData.startedAt = startedAt;
			const endedAt = new Date(startedAt);
			endedAt.setMinutes(startedAt.getMinutes() + 25);
			visitData.endedAt = endedAt;
			visitData.notes = "Patient doing well. Continue current treatment plan.";
			visitData.diagnosis = "Stable condition, no new findings";
		}

		if (status === TelemedicineVisitStatus.CANCELLED) {
			visitData.cancellationReason = "Patient requested reschedule";
			visitData.cancelledBy = patientId;
			visitData.cancelledAt = new Date();
		}

		await TelemedicineVisit.create(visitData);
		count++;
	}

	logger.info({ tenantId, count }, "Telemedicine visits seeded");
	return count;
}

/**
 * Seed telemedicine visits for all organizations
 */
export async function seedAllTelemedicine(): Promise<number> {
	logger.info("Starting telemedicine seed for all organizations");

	const orgs = await Organization.find({ status: "ACTIVE" });
	let totalCount = 0;

	for (const org of orgs) {
		const count = await seedTelemedicine({ tenantId: String(org._id) });
		totalCount += count;
	}

	logger.info({ totalCount }, "All telemedicine visits seeded");
	return totalCount;
}

/**
 * Main function for standalone execution
 */
async function main(): Promise<void> {
	const dotenv = await import("dotenv");
	dotenv.config();

	const { connectDB, mongoose } = await import("@hms/db");
	await connectDB();

	console.log("Connected to database");

	try {
		const count = await seedAllTelemedicine();
		console.log(`\nTelemedicine seed completed: ${count} visits created`);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("telemedicine.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
