import {
	Organization,
	SampleType,
	TestCatalog,
	TestCatalogStatus,
	TestCategory,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { createServiceLogger } from "../logger";

const logger = createServiceLogger("testCatalogSeed");

// Test catalog configurations - 20 common lab tests across categories
const TEST_CATALOG_CONFIG = [
	// HEMATOLOGY (4)
	{
		name: "Complete Blood Count (CBC)",
		code: "LAB001",
		category: TestCategory.HEMATOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "4 hours",
		price: 350,
		referenceRanges: [
			{ label: "WBC", min: 4000, max: 11000, unit: "cells/mcL", gender: "ALL" },
			{ label: "RBC", min: 4.5, max: 5.5, unit: "million/mcL", gender: "MALE" },
			{
				label: "RBC",
				min: 4.0,
				max: 5.0,
				unit: "million/mcL",
				gender: "FEMALE",
			},
			{
				label: "Hemoglobin",
				min: 13.5,
				max: 17.5,
				unit: "g/dL",
				gender: "MALE",
			},
			{
				label: "Hemoglobin",
				min: 12.0,
				max: 15.5,
				unit: "g/dL",
				gender: "FEMALE",
			},
			{
				label: "Platelets",
				min: 150000,
				max: 400000,
				unit: "cells/mcL",
				gender: "ALL",
			},
		],
	},
	{
		name: "Hemoglobin",
		code: "LAB002",
		category: TestCategory.HEMATOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "2 hours",
		price: 150,
		referenceRanges: [
			{
				label: "Hemoglobin",
				min: 13.5,
				max: 17.5,
				unit: "g/dL",
				gender: "MALE",
			},
			{
				label: "Hemoglobin",
				min: 12.0,
				max: 15.5,
				unit: "g/dL",
				gender: "FEMALE",
			},
		],
	},
	{
		name: "Erythrocyte Sedimentation Rate (ESR)",
		code: "LAB003",
		category: TestCategory.HEMATOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "2 hours",
		price: 200,
		referenceRanges: [
			{ label: "ESR", min: 0, max: 15, unit: "mm/hr", gender: "MALE" },
			{ label: "ESR", min: 0, max: 20, unit: "mm/hr", gender: "FEMALE" },
		],
	},
	{
		name: "Prothrombin Time / INR",
		code: "LAB004",
		category: TestCategory.HEMATOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "4 hours",
		price: 400,
		referenceRanges: [
			{ label: "PT", min: 11, max: 13.5, unit: "seconds", gender: "ALL" },
			{ label: "INR", min: 0.8, max: 1.2, unit: "", gender: "ALL" },
		],
	},

	// BIOCHEMISTRY (8)
	{
		name: "Blood Glucose (Fasting)",
		code: "LAB005",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "2 hours",
		price: 150,
		referenceRanges: [
			{
				label: "Fasting Glucose",
				min: 70,
				max: 100,
				unit: "mg/dL",
				gender: "ALL",
			},
		],
	},
	{
		name: "Blood Glucose (Post Prandial)",
		code: "LAB006",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "2 hours",
		price: 150,
		referenceRanges: [
			{ label: "PP Glucose", min: 70, max: 140, unit: "mg/dL", gender: "ALL" },
		],
	},
	{
		name: "HbA1c (Glycated Hemoglobin)",
		code: "LAB007",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "6 hours",
		price: 500,
		referenceRanges: [
			{ label: "HbA1c", min: 4.0, max: 5.6, unit: "%", gender: "ALL" },
		],
	},
	{
		name: "Lipid Profile",
		code: "LAB008",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "6 hours",
		price: 600,
		referenceRanges: [
			{
				label: "Total Cholesterol",
				min: 0,
				max: 200,
				unit: "mg/dL",
				gender: "ALL",
			},
			{ label: "HDL", min: 40, max: 60, unit: "mg/dL", gender: "ALL" },
			{ label: "LDL", min: 0, max: 100, unit: "mg/dL", gender: "ALL" },
			{
				label: "Triglycerides",
				min: 0,
				max: 150,
				unit: "mg/dL",
				gender: "ALL",
			},
		],
	},
	{
		name: "Liver Function Test (AST/ALT/Bilirubin)",
		code: "LAB009",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "6 hours",
		price: 550,
		referenceRanges: [
			{ label: "AST (SGOT)", min: 10, max: 40, unit: "U/L", gender: "ALL" },
			{ label: "ALT (SGPT)", min: 7, max: 56, unit: "U/L", gender: "ALL" },
			{
				label: "Total Bilirubin",
				min: 0.1,
				max: 1.2,
				unit: "mg/dL",
				gender: "ALL",
			},
			{
				label: "Direct Bilirubin",
				min: 0,
				max: 0.3,
				unit: "mg/dL",
				gender: "ALL",
			},
		],
	},
	{
		name: "Serum Creatinine",
		code: "LAB010",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "4 hours",
		price: 250,
		referenceRanges: [
			{
				label: "Creatinine",
				min: 0.7,
				max: 1.3,
				unit: "mg/dL",
				gender: "MALE",
			},
			{
				label: "Creatinine",
				min: 0.6,
				max: 1.1,
				unit: "mg/dL",
				gender: "FEMALE",
			},
		],
	},
	{
		name: "Blood Urea Nitrogen (BUN)",
		code: "LAB011",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "4 hours",
		price: 250,
		referenceRanges: [
			{ label: "BUN", min: 7, max: 20, unit: "mg/dL", gender: "ALL" },
		],
	},
	{
		name: "Serum Electrolytes (Na/K/Cl)",
		code: "LAB012",
		category: TestCategory.BIOCHEMISTRY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "4 hours",
		price: 450,
		referenceRanges: [
			{ label: "Sodium", min: 136, max: 145, unit: "mEq/L", gender: "ALL" },
			{ label: "Potassium", min: 3.5, max: 5.0, unit: "mEq/L", gender: "ALL" },
			{ label: "Chloride", min: 98, max: 106, unit: "mEq/L", gender: "ALL" },
		],
	},

	// IMMUNOLOGY (4)
	{
		name: "Thyroid Stimulating Hormone (TSH)",
		code: "LAB013",
		category: TestCategory.IMMUNOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "8 hours",
		price: 450,
		referenceRanges: [
			{ label: "TSH", min: 0.4, max: 4.0, unit: "mIU/L", gender: "ALL" },
		],
	},
	{
		name: "Free T3",
		code: "LAB014",
		category: TestCategory.IMMUNOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "8 hours",
		price: 400,
		referenceRanges: [
			{ label: "Free T3", min: 2.3, max: 4.2, unit: "pg/mL", gender: "ALL" },
		],
	},
	{
		name: "Free T4",
		code: "LAB015",
		category: TestCategory.IMMUNOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "8 hours",
		price: 400,
		referenceRanges: [
			{ label: "Free T4", min: 0.8, max: 1.8, unit: "ng/dL", gender: "ALL" },
		],
	},
	{
		name: "C-Reactive Protein (CRP)",
		code: "LAB016",
		category: TestCategory.IMMUNOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "6 hours",
		price: 350,
		referenceRanges: [
			{ label: "CRP", min: 0, max: 10, unit: "mg/L", gender: "ALL" },
		],
	},

	// MICROBIOLOGY (2)
	{
		name: "Blood Culture",
		code: "LAB017",
		category: TestCategory.MICROBIOLOGY,
		sampleType: SampleType.BLOOD,
		turnaroundTime: "48 hours",
		price: 800,
		referenceRanges: [
			{ label: "Culture", min: 0, max: 0, unit: "colonies", gender: "ALL" },
		],
	},
	{
		name: "Urine Culture & Sensitivity",
		code: "LAB018",
		category: TestCategory.MICROBIOLOGY,
		sampleType: SampleType.URINE,
		turnaroundTime: "48 hours",
		price: 700,
		referenceRanges: [
			{
				label: "Colony Count",
				min: 0,
				max: 100000,
				unit: "CFU/mL",
				gender: "ALL",
			},
		],
	},

	// URINALYSIS (2)
	{
		name: "Urinalysis (Routine)",
		code: "LAB019",
		category: TestCategory.OTHER,
		sampleType: SampleType.URINE,
		turnaroundTime: "2 hours",
		price: 200,
		referenceRanges: [
			{ label: "pH", min: 4.5, max: 8.0, unit: "", gender: "ALL" },
			{
				label: "Specific Gravity",
				min: 1.005,
				max: 1.03,
				unit: "",
				gender: "ALL",
			},
		],
	},
	{
		name: "Urine Microalbumin",
		code: "LAB020",
		category: TestCategory.OTHER,
		sampleType: SampleType.URINE,
		turnaroundTime: "4 hours",
		price: 350,
		referenceRanges: [
			{ label: "Microalbumin", min: 0, max: 30, unit: "mg/L", gender: "ALL" },
		],
	},
];

/**
 * Seed test catalog for a tenant
 */
export async function seedTestCatalog({
	tenantId,
}: {
	tenantId: string;
}): Promise<number> {
	logger.info({ tenantId }, "Seeding test catalog");

	let count = 0;

	for (const testConfig of TEST_CATALOG_CONFIG) {
		// Check if test already exists
		const existing = await TestCatalog.findOne({
			tenantId,
			code: testConfig.code,
		});

		if (existing) {
			logger.debug(
				{ tenantId, code: testConfig.code },
				"Test already exists, skipping",
			);
			continue;
		}

		const testId = uuidv4();

		await TestCatalog.create({
			_id: testId,
			tenantId,
			name: testConfig.name,
			code: testConfig.code,
			category: testConfig.category,
			sampleType: testConfig.sampleType,
			turnaroundTime: testConfig.turnaroundTime,
			price: testConfig.price,
			referenceRanges: testConfig.referenceRanges,
			status: TestCatalogStatus.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		count++;
	}

	logger.info({ tenantId, count }, "Test catalog seeded");
	return count;
}

/**
 * Seed test catalog for all organizations
 */
export async function seedAllTestCatalog(): Promise<number> {
	logger.info("Starting test catalog seed for all organizations");

	const orgs = await Organization.find({ status: "ACTIVE" });
	let totalCount = 0;

	for (const org of orgs) {
		const count = await seedTestCatalog({ tenantId: String(org._id) });
		totalCount += count;
	}

	logger.info({ totalCount }, "All test catalog seeded");
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
		const count = await seedAllTestCatalog();
		console.log(`\nTest catalog seed completed: ${count} tests created`);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("test-catalog.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
