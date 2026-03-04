import {
	Counter,
	LabOrder,
	LabOrderStatus,
	Organization,
	Patient,
	PatientType,
	ResultFlag,
	Role,
	SampleType,
	Staff,
	TestCatalog,
	TestPriority,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { createServiceLogger } from "../logger";

const logger = createServiceLogger("labOrdersSeed");

interface CounterModel {
	getNextSequence(tenantId: string, type: string): Promise<number>;
}

// Lab order configurations with status distribution
// 3 ORDERED, 2 SAMPLE_COLLECTED, 2 RESULTS_ENTERED, 2 VERIFIED, 1 CANCELLED
const LAB_ORDERS_CONFIG = [
	// ORDERED (3)
	{
		status: LabOrderStatus.ORDERED,
		testCodes: ["LAB001", "LAB005"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Routine health checkup",
		notes: "Annual screening tests",
	},
	{
		status: LabOrderStatus.ORDERED,
		testCodes: ["LAB013", "LAB014", "LAB015"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Suspected hypothyroidism",
		notes: "Patient reports fatigue and weight gain",
	},
	{
		status: LabOrderStatus.ORDERED,
		testCodes: ["LAB008"],
		priority: TestPriority.URGENT,
		diagnosis: "Dyslipidemia follow-up",
		notes: "Fasting lipid profile requested",
	},

	// SAMPLE_COLLECTED (2)
	{
		status: LabOrderStatus.SAMPLE_COLLECTED,
		testCodes: ["LAB009", "LAB010", "LAB011"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Liver and kidney function assessment",
		notes: "Pre-operative evaluation",
	},
	{
		status: LabOrderStatus.SAMPLE_COLLECTED,
		testCodes: ["LAB017"],
		priority: TestPriority.STAT,
		diagnosis: "Suspected sepsis",
		notes: "Patient febrile for 3 days, blood culture ordered stat",
	},

	// RESULTS_ENTERED (2)
	{
		status: LabOrderStatus.RESULTS_ENTERED,
		testCodes: ["LAB001", "LAB003"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Anemia workup",
		notes: "Patient reports persistent fatigue",
		results: {
			LAB001: [
				{
					value: "9500",
					unit: "cells/mcL",
					normalRange: "4000-11000",
					flag: ResultFlag.NORMAL,
					interpretation: "WBC within normal limits",
				},
				{
					value: "3.8",
					unit: "million/mcL",
					normalRange: "4.5-5.5",
					flag: ResultFlag.LOW,
					interpretation: "RBC slightly below normal",
				},
				{
					value: "10.2",
					unit: "g/dL",
					normalRange: "13.5-17.5",
					flag: ResultFlag.LOW,
					interpretation: "Hemoglobin low - suggests anemia",
				},
				{
					value: "250000",
					unit: "cells/mcL",
					normalRange: "150000-400000",
					flag: ResultFlag.NORMAL,
					interpretation: "Platelets normal",
				},
			],
			LAB003: [
				{
					value: "35",
					unit: "mm/hr",
					normalRange: "0-15",
					flag: ResultFlag.HIGH,
					interpretation: "ESR elevated, suggests inflammation",
				},
			],
		},
	},
	{
		status: LabOrderStatus.RESULTS_ENTERED,
		testCodes: ["LAB005", "LAB007"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Diabetes monitoring",
		notes: "Quarterly diabetes follow-up",
		results: {
			LAB005: [
				{
					value: "142",
					unit: "mg/dL",
					normalRange: "70-100",
					flag: ResultFlag.HIGH,
					interpretation: "Fasting glucose elevated",
				},
			],
			LAB007: [
				{
					value: "7.8",
					unit: "%",
					normalRange: "4.0-5.6",
					flag: ResultFlag.HIGH,
					interpretation: "HbA1c above target, poor glycemic control",
				},
			],
		},
	},

	// VERIFIED (2)
	{
		status: LabOrderStatus.VERIFIED,
		testCodes: ["LAB012"],
		priority: TestPriority.URGENT,
		diagnosis: "Electrolyte imbalance",
		notes: "Patient on diuretics, electrolyte monitoring",
		results: {
			LAB012: [
				{
					value: "138",
					unit: "mEq/L",
					normalRange: "136-145",
					flag: ResultFlag.NORMAL,
					interpretation: "Sodium normal",
				},
				{
					value: "3.2",
					unit: "mEq/L",
					normalRange: "3.5-5.0",
					flag: ResultFlag.LOW,
					interpretation: "Potassium low - hypokalemia",
				},
				{
					value: "101",
					unit: "mEq/L",
					normalRange: "98-106",
					flag: ResultFlag.NORMAL,
					interpretation: "Chloride normal",
				},
			],
		},
		verificationComments:
			"Potassium supplementation recommended. Repeat in 1 week.",
	},
	{
		status: LabOrderStatus.VERIFIED,
		testCodes: ["LAB004"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Anticoagulation monitoring",
		notes: "Patient on warfarin therapy",
		results: {
			LAB004: [
				{
					value: "15.2",
					unit: "seconds",
					normalRange: "11-13.5",
					flag: ResultFlag.HIGH,
					interpretation: "PT prolonged",
				},
				{
					value: "2.5",
					unit: "",
					normalRange: "0.8-1.2",
					flag: ResultFlag.HIGH,
					interpretation:
						"INR within therapeutic range for anticoagulation (target 2.0-3.0)",
				},
			],
		},
		verificationComments:
			"INR within therapeutic range. Continue current warfarin dose.",
	},

	// CANCELLED (1)
	{
		status: LabOrderStatus.CANCELLED,
		testCodes: ["LAB018"],
		priority: TestPriority.ROUTINE,
		diagnosis: "Suspected UTI",
		notes: "Order cancelled - patient started empirical antibiotics",
	},
];

/**
 * Seed lab orders for a tenant
 */
export async function seedLabOrders({
	tenantId,
}: {
	tenantId: string;
}): Promise<number> {
	logger.info({ tenantId }, "Seeding lab orders");

	// Get doctor
	const doctorRole = await Role.findOne({ tenantId, name: "DOCTOR" });
	const doctor = doctorRole
		? await Staff.findOne({ tenantId, roles: doctorRole._id })
		: await Staff.findOne({ tenantId });

	if (!doctor) {
		logger.warn({ tenantId }, "Doctor not found, skipping lab orders");
		return 0;
	}

	// Get nurse for sample collection
	const nurseRole = await Role.findOne({ tenantId, name: "NURSE" });
	const nurse = nurseRole
		? await Staff.findOne({ tenantId, roles: nurseRole._id })
		: doctor;

	// Get OPD patients
	const patients = await Patient.find({
		tenantId,
		patientType: PatientType.OPD,
	}).limit(10);

	if (patients.length === 0) {
		logger.warn({ tenantId }, "No OPD patients found, skipping lab orders");
		return 0;
	}

	// Get test catalog for this tenant
	const testCatalog = await TestCatalog.find({ tenantId });
	if (testCatalog.length === 0) {
		logger.warn({ tenantId }, "No test catalog found, skipping lab orders");
		return 0;
	}

	const testCatalogMap = new Map(testCatalog.map((t) => [String(t.code), t]));

	let count = 0;

	for (let i = 0; i < LAB_ORDERS_CONFIG.length; i++) {
		const config = LAB_ORDERS_CONFIG[i]!;
		const patient = patients[i % patients.length]!;

		// Build tests array from test codes
		const tests = config.testCodes
			.map((code) => {
				const catalogTest = testCatalogMap.get(code);
				if (!catalogTest) return null;

				const testEntry: Record<string, unknown> = {
					testId: String(catalogTest._id),
					testName: catalogTest.name,
					testCode: catalogTest.code,
					priority: config.priority,
					status: config.status,
				};

				// Add result details for RESULTS_ENTERED and VERIFIED orders
				if (
					config.results &&
					(config.status === LabOrderStatus.RESULTS_ENTERED ||
						config.status === LabOrderStatus.VERIFIED)
				) {
					const resultSet = config.results[code as keyof typeof config.results];
					if (resultSet && Array.isArray(resultSet) && resultSet.length > 0) {
						// Use the first result entry for this test's resultDetails
						const firstResult = resultSet[0]!;
						testEntry.resultDetails = {
							value: firstResult.value,
							unit: firstResult.unit,
							normalRange: firstResult.normalRange,
							flag: firstResult.flag,
							interpretation: firstResult.interpretation,
						};
					}
				}

				return testEntry;
			})
			.filter(Boolean);

		if (tests.length === 0) {
			logger.debug(
				{ tenantId, index: i },
				"No matching tests in catalog, skipping order",
			);
			continue;
		}

		// Generate orderId using Counter
		const seq = await (Counter as unknown as CounterModel).getNextSequence(
			tenantId,
			"lab",
		);
		const orderId = `${tenantId}-LAB-${String(seq).padStart(6, "0")}`;

		// Check if order already exists
		const existing = await LabOrder.findOne({ tenantId, orderId });
		if (existing) {
			logger.debug({ tenantId, orderId }, "Lab order already exists, skipping");
			continue;
		}

		const labOrderId = uuidv4();
		const now = new Date();
		const daysAgo = (d: number) =>
			new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

		const orderData: Record<string, unknown> = {
			_id: labOrderId,
			tenantId,
			orderId,
			patientId: String(patient._id),
			doctorId: String(doctor._id),
			tests,
			status: config.status,
			diagnosis: config.diagnosis,
			notes: config.notes,
			createdAt: daysAgo(10 - i),
			updatedAt: now,
		};

		// Add sample details for SAMPLE_COLLECTED and beyond
		if (
			config.status === LabOrderStatus.SAMPLE_COLLECTED ||
			config.status === LabOrderStatus.RESULTS_ENTERED ||
			config.status === LabOrderStatus.VERIFIED
		) {
			const primaryTestCode = config.testCodes[0]!;
			const primaryTest = testCatalogMap.get(primaryTestCode);
			orderData.sampleDetails = {
				sampleType: primaryTest ? primaryTest.sampleType : SampleType.BLOOD,
				collectedBy: nurse ? String(nurse._id) : String(doctor._id),
				collectedAt: daysAgo(8 - i),
				sampleId: `SMP-${String(seq).padStart(6, "0")}`,
				notes: "Sample collected and labeled",
			};
		}

		// Add result entry details for RESULTS_ENTERED and VERIFIED
		if (
			config.status === LabOrderStatus.RESULTS_ENTERED ||
			config.status === LabOrderStatus.VERIFIED
		) {
			orderData.resultEnteredBy = String(doctor._id);
			orderData.resultEnteredAt = daysAgo(6 - i);
			orderData.resultNotes = "Results reviewed and entered";
		}

		// Add verification details for VERIFIED orders
		if (config.status === LabOrderStatus.VERIFIED) {
			orderData.verifiedBy = String(doctor._id);
			orderData.verifiedAt = daysAgo(4 - i);
			orderData.verificationComments =
				(config as { verificationComments?: string }).verificationComments ||
				"Results verified and approved";
		}

		await LabOrder.create(orderData);
		count++;
	}

	logger.info({ tenantId, count }, "Lab orders seeded");
	return count;
}

/**
 * Seed lab orders for all organizations
 */
export async function seedAllLabOrders(): Promise<number> {
	logger.info("Starting lab orders seed for all organizations");

	const orgs = await Organization.find({ status: "ACTIVE" });
	let totalCount = 0;

	for (const org of orgs) {
		const count = await seedLabOrders({ tenantId: String(org._id) });
		totalCount += count;
	}

	logger.info({ totalCount }, "All lab orders seeded");
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
		const count = await seedAllLabOrders();
		console.log(`\nLab orders seed completed: ${count} lab orders created`);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("lab-orders.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
