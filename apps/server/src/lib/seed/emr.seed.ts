import {
	ClinicalNote,
	ClinicalNoteStatus,
	ClinicalNoteType,
	Counter,
	DiagnosisType,
	MedicalHistory,
	Organization,
	Patient,
	ProblemList,
	ProblemStatus,
	Staff,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { createServiceLogger } from "../logger";

const logger = createServiceLogger("emrSeed");

interface CounterModel {
	getNextSequence(tenantId: string, type: string): Promise<number>;
}

// Clinical note templates
const SOAP_NOTES = [
	{
		chiefComplaint: "Persistent headache for 3 days",
		subjective:
			"Patient reports throbbing headache, primarily frontal, rated 7/10. Worsens with bright light. No nausea or vomiting. OTC ibuprofen provides mild relief.",
		objective:
			"BP 130/85, HR 78, Temp 98.6F. Neurological exam normal. No papilledema. Neck supple without rigidity.",
		assessment:
			"Tension-type headache, likely stress-related. No red flags for secondary causes.",
		plan: "1. Continue ibuprofen 400mg PRN. 2. Stress management counseling. 3. Follow up in 2 weeks if not resolved. 4. Return immediately if vision changes or fever develops.",
		diagnosis: [
			{
				code: "G44.209",
				description: "Tension-type headache, unspecified",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
	{
		chiefComplaint: "Annual wellness exam",
		subjective:
			"Patient presents for routine annual physical. No new complaints. Reports regular exercise 3x/week. Diet is balanced. No tobacco or excessive alcohol use.",
		objective:
			"BP 120/78, HR 68, Temp 98.4F, BMI 24.2. Heart RRR, no murmurs. Lungs CTA bilaterally. Abdomen soft, non-tender.",
		assessment:
			"Healthy adult. All vitals within normal limits. Due for routine screening labs.",
		plan: "1. Order CBC, CMP, lipid panel, HbA1c. 2. Continue current exercise regimen. 3. Schedule follow-up for lab review. 4. Flu vaccine administered today.",
		diagnosis: [
			{
				code: "Z00.00",
				description:
					"Encounter for general adult medical examination without abnormal findings",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
	{
		chiefComplaint: "Cough and congestion for 5 days",
		subjective:
			"Patient reports productive cough with yellowish sputum, nasal congestion, mild sore throat. Low-grade fever (100.2F at home). No shortness of breath or chest pain.",
		objective:
			"BP 118/76, HR 82, Temp 100.1F, SpO2 98%. Pharynx mildly erythematous. TMs clear. Lungs with scattered rhonchi, no wheezes.",
		assessment:
			"Acute upper respiratory infection, likely viral. No evidence of bacterial pneumonia.",
		plan: "1. Supportive care: rest, hydration, honey for cough. 2. Guaifenesin 400mg q4h PRN. 3. Acetaminophen for fever. 4. Return if symptoms worsen or persist >10 days.",
		diagnosis: [
			{
				code: "J06.9",
				description: "Acute upper respiratory infection, unspecified",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
	{
		chiefComplaint: "Right knee pain after jogging",
		subjective:
			"Patient reports right knee pain that started 2 days ago after a 5-mile jog. Pain is medial, worse with stairs. No locking or giving way. No prior knee injuries.",
		objective:
			"BP 122/80, HR 72. Right knee: mild effusion, tenderness along medial joint line. McMurray test negative. Drawer tests negative. ROM 0-130 degrees with pain at end range.",
		assessment:
			"Right knee medial collateral ligament strain, grade I. Low suspicion for meniscal tear.",
		plan: "1. RICE protocol. 2. Naproxen 500mg BID x7 days. 3. Avoid running for 2 weeks. 4. Physical therapy referral if not improving. 5. MRI if persistent symptoms.",
		diagnosis: [
			{
				code: "S83.401A",
				description: "Sprain of medial collateral ligament of right knee",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
	{
		chiefComplaint: "Follow-up for hypertension management",
		subjective:
			"Patient returns for BP check. Taking lisinopril 10mg daily as prescribed. Home BP readings averaging 135/88. No headaches, dizziness, or chest pain. Tolerating medication well.",
		objective:
			"BP 138/86, HR 74, Weight 185 lbs. Heart RRR, no murmurs. Lungs clear. No peripheral edema.",
		assessment:
			"Essential hypertension, not at goal (target <130/80). Current regimen partially effective.",
		plan: "1. Increase lisinopril to 20mg daily. 2. Low sodium diet counseling. 3. Continue home BP monitoring. 4. Recheck BMP/creatinine in 4 weeks. 5. Follow up in 6 weeks.",
		diagnosis: [
			{
				code: "I10",
				description: "Essential (primary) hypertension",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
];

const PROGRESS_NOTES = [
	{
		chiefComplaint: "Diabetes follow-up",
		content:
			"Patient with Type 2 DM on metformin 1000mg BID. HbA1c improved from 8.2% to 7.1%. Fasting glucose logs show range 110-145. No hypoglycemic episodes. Feet exam normal, monofilament intact. Eye exam up to date. Continue current regimen. Recheck HbA1c in 3 months.",
		diagnosis: [
			{
				code: "E11.65",
				description: "Type 2 diabetes mellitus with hyperglycemia",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
	{
		chiefComplaint: "Post-operative follow-up - appendectomy",
		content:
			"POD #7 from laparoscopic appendectomy. Incision sites healing well, no erythema or drainage. Tolerating regular diet. Pain well controlled with acetaminophen only. Bowel function normalized. Cleared for light activity. Return to full activity in 2 weeks.",
		diagnosis: [
			{
				code: "Z09",
				description:
					"Encounter for follow-up examination after completed treatment",
				type: DiagnosisType.PRIMARY,
			},
		],
	},
];

// Problem list templates
const PROBLEMS_CONFIG = [
	{
		code: "I10",
		description: "Essential hypertension",
		status: ProblemStatus.ACTIVE,
		notes: "Diagnosed 2023, on lisinopril",
	},
	{
		code: "E11.9",
		description: "Type 2 diabetes mellitus without complications",
		status: ProblemStatus.ACTIVE,
		notes: "Managed with metformin",
	},
	{
		code: "J45.20",
		description: "Mild intermittent asthma, uncomplicated",
		status: ProblemStatus.ACTIVE,
		notes: "Uses albuterol PRN",
	},
	{
		code: "M54.5",
		description: "Low back pain",
		status: ProblemStatus.RESOLVED,
		notes: "Resolved with physical therapy",
	},
	{
		code: "K21.0",
		description: "Gastroesophageal reflux disease with esophagitis",
		status: ProblemStatus.ACTIVE,
		notes: "On omeprazole 20mg daily",
	},
	{
		code: "F41.1",
		description: "Generalized anxiety disorder",
		status: ProblemStatus.ACTIVE,
		notes: "Managed with counseling",
	},
];

// Medical history templates
const MEDICAL_HISTORY_CONFIGS = [
	{
		allergies: [
			{
				allergen: "Penicillin",
				reaction: "Rash and hives",
				severity: "MODERATE",
			},
			{
				allergen: "Sulfa drugs",
				reaction: "Anaphylaxis",
				severity: "SEVERE",
			},
		],
		medications: [
			{
				name: "Lisinopril",
				dosage: "10mg",
				frequency: "Once daily",
				startDate: new Date("2023-06-15"),
			},
			{
				name: "Metformin",
				dosage: "500mg",
				frequency: "Twice daily",
				startDate: new Date("2023-09-01"),
			},
		],
		surgicalHistory: [
			{
				procedure: "Appendectomy",
				date: new Date("2020-03-15"),
				notes: "Laparoscopic, uncomplicated",
			},
		],
		familyHistory: [
			{
				condition: "Type 2 Diabetes",
				relationship: "Father",
				notes: "Diagnosed at age 55",
			},
			{
				condition: "Breast Cancer",
				relationship: "Mother",
				notes: "Diagnosed at age 62, in remission",
			},
		],
		socialHistory: {
			smoking: "Never",
			alcohol: "Occasional, 1-2 drinks/week",
			exercise: "Moderate, walks 30 min daily",
			occupation: "Office worker",
			notes: "Married, two children",
		},
		immunizations: [
			{
				vaccine: "Influenza",
				date: new Date("2025-10-15"),
				notes: "Annual flu shot",
			},
			{
				vaccine: "COVID-19 Booster",
				date: new Date("2025-09-01"),
				notes: "Updated booster",
			},
			{
				vaccine: "Tdap",
				date: new Date("2022-05-20"),
				notes: "Routine booster",
			},
		],
		pastMedicalHistory: [
			{
				condition: "Hypertension",
				diagnosedDate: new Date("2023-06-15"),
				status: "Active",
				notes: "Well controlled on medication",
			},
		],
	},
	{
		allergies: [
			{
				allergen: "Latex",
				reaction: "Contact dermatitis",
				severity: "MILD",
			},
		],
		medications: [
			{
				name: "Omeprazole",
				dosage: "20mg",
				frequency: "Once daily before breakfast",
				startDate: new Date("2024-01-10"),
			},
		],
		surgicalHistory: [],
		familyHistory: [
			{
				condition: "Coronary artery disease",
				relationship: "Father",
				notes: "MI at age 60",
			},
		],
		socialHistory: {
			smoking: "Former, quit 5 years ago",
			alcohol: "None",
			exercise: "Active, gym 4x/week",
			occupation: "Teacher",
		},
		immunizations: [
			{
				vaccine: "Influenza",
				date: new Date("2025-10-01"),
			},
		],
		pastMedicalHistory: [
			{
				condition: "GERD",
				diagnosedDate: new Date("2024-01-10"),
				status: "Active",
				notes: "Managed with PPI",
			},
			{
				condition: "Ankle fracture",
				diagnosedDate: new Date("2019-07-20"),
				status: "Resolved",
				notes: "Right ankle, healed completely",
			},
		],
	},
	{
		allergies: [],
		medications: [
			{
				name: "Albuterol inhaler",
				dosage: "2 puffs",
				frequency: "As needed",
				startDate: new Date("2022-03-01"),
			},
			{
				name: "Sertraline",
				dosage: "50mg",
				frequency: "Once daily",
				startDate: new Date("2024-06-15"),
			},
		],
		surgicalHistory: [
			{
				procedure: "Tonsillectomy",
				date: new Date("2010-08-10"),
				notes: "Childhood procedure, uncomplicated",
			},
		],
		familyHistory: [
			{
				condition: "Asthma",
				relationship: "Mother",
			},
			{
				condition: "Depression",
				relationship: "Sibling",
			},
		],
		socialHistory: {
			smoking: "Never",
			alcohol: "Social, 2-3 drinks/month",
			exercise: "Light, yoga twice weekly",
			occupation: "Software developer",
			notes: "Lives alone, good social support network",
		},
		immunizations: [
			{
				vaccine: "Influenza",
				date: new Date("2025-11-01"),
			},
			{
				vaccine: "HPV",
				date: new Date("2018-04-15"),
				notes: "Series completed",
			},
		],
		pastMedicalHistory: [
			{
				condition: "Mild intermittent asthma",
				diagnosedDate: new Date("2022-03-01"),
				status: "Active",
				notes: "Well controlled with PRN inhaler",
			},
			{
				condition: "Generalized anxiety disorder",
				diagnosedDate: new Date("2024-06-15"),
				status: "Active",
				notes: "On SSRI, improving",
			},
		],
	},
];

/**
 * Seed EMR data for a tenant
 */
export async function seedEmr({
	tenantId,
}: {
	tenantId: string;
}): Promise<number> {
	logger.info({ tenantId }, "Seeding EMR data");

	// Get patients
	const patients = await Patient.find({ tenantId }).limit(10).lean();
	if (patients.length === 0) {
		logger.warn({ tenantId }, "No patients found, skipping EMR seed");
		return 0;
	}

	// Get a doctor staff member as author
	const doctor = await Staff.findOne({ tenantId }).populate("roles").lean();

	if (!doctor) {
		logger.warn({ tenantId }, "No staff found, skipping EMR seed");
		return 0;
	}

	const authorId = String(doctor._id);
	let count = 0;

	// Seed clinical notes
	for (let i = 0; i < Math.min(patients.length, 7); i++) {
		const patient = patients[i];
		if (!patient) continue;
		const patientId = String(patient._id);

		// Check if notes already exist for this patient
		const existingNote = await ClinicalNote.findOne({
			tenantId,
			patientId,
		});
		if (existingNote) {
			logger.debug({ patientId }, "Clinical notes already exist, skipping");
			continue;
		}

		// Create a SOAP note
		const soapTemplate = SOAP_NOTES[
			i % SOAP_NOTES.length
		] as (typeof SOAP_NOTES)[number];
		const seq = await (Counter as unknown as CounterModel).getNextSequence(
			tenantId,
			"NOTE",
		);
		const noteId = `${tenantId}-NOTE-${seq}`;
		const soapId = uuidv4();

		const daysAgo = Math.floor(Math.random() * 30) + 1;
		const createdAt = new Date();
		createdAt.setDate(createdAt.getDate() - daysAgo);

		const isSigned = i % 3 !== 0; // 2/3 of notes are signed

		await ClinicalNote.create({
			_id: soapId,
			tenantId,
			noteId,
			patientId,
			type: ClinicalNoteType.SOAP,
			chiefComplaint: soapTemplate.chiefComplaint,
			subjective: soapTemplate.subjective,
			objective: soapTemplate.objective,
			assessment: soapTemplate.assessment,
			plan: soapTemplate.plan,
			diagnosis: soapTemplate.diagnosis,
			procedures: [],
			status: isSigned ? ClinicalNoteStatus.SIGNED : ClinicalNoteStatus.DRAFT,
			authorId,
			signedBy: isSigned ? authorId : undefined,
			signedAt: isSigned ? createdAt : undefined,
			createdAt,
			updatedAt: createdAt,
		});
		count++;

		// Add a progress note for some patients
		if (i < PROGRESS_NOTES.length) {
			const progressTemplate = PROGRESS_NOTES[
				i
			] as (typeof PROGRESS_NOTES)[number];
			const seq2 = await (Counter as unknown as CounterModel).getNextSequence(
				tenantId,
				"NOTE",
			);
			const noteId2 = `${tenantId}-NOTE-${seq2}`;
			const progressId = uuidv4();

			const progressDate = new Date();
			progressDate.setDate(
				progressDate.getDate() - Math.floor(Math.random() * 14),
			);

			await ClinicalNote.create({
				_id: progressId,
				tenantId,
				noteId: noteId2,
				patientId,
				type: ClinicalNoteType.PROGRESS,
				chiefComplaint: progressTemplate.chiefComplaint,
				content: progressTemplate.content,
				diagnosis: progressTemplate.diagnosis,
				procedures: [],
				status: ClinicalNoteStatus.SIGNED,
				authorId,
				signedBy: authorId,
				signedAt: progressDate,
				createdAt: progressDate,
				updatedAt: progressDate,
			});
			count++;
		}
	}

	// Seed medical history for first 3 patients
	for (let i = 0; i < Math.min(patients.length, 3); i++) {
		const patient = patients[i];
		if (!patient) continue;
		const patientId = String(patient._id);

		const existing = await MedicalHistory.findOne({ tenantId, patientId });
		if (existing) {
			logger.debug({ patientId }, "Medical history already exists, skipping");
			continue;
		}

		const template = MEDICAL_HISTORY_CONFIGS[
			i % MEDICAL_HISTORY_CONFIGS.length
		] as (typeof MEDICAL_HISTORY_CONFIGS)[number];
		const historyId = uuidv4();

		await MedicalHistory.create({
			_id: historyId,
			tenantId,
			patientId,
			...template,
		});
		count++;
	}

	// Seed problem lists for first 5 patients
	for (let i = 0; i < Math.min(patients.length, 5); i++) {
		const patient = patients[i];
		if (!patient) continue;
		const patientId = String(patient._id);

		const existingProblem = await ProblemList.findOne({ tenantId, patientId });
		if (existingProblem) {
			logger.debug({ patientId }, "Problems already exist, skipping");
			continue;
		}

		// Assign 2-3 problems per patient
		const numProblems = 2 + (i % 2);
		for (let j = 0; j < numProblems; j++) {
			const problemConfig = PROBLEMS_CONFIG[
				(i + j) % PROBLEMS_CONFIG.length
			] as (typeof PROBLEMS_CONFIG)[number];
			const problemId = uuidv4();

			const onsetDate = new Date();
			onsetDate.setMonth(
				onsetDate.getMonth() - Math.floor(Math.random() * 24) - 1,
			);

			await ProblemList.create({
				_id: problemId,
				tenantId,
				patientId,
				code: problemConfig.code,
				description: problemConfig.description,
				status: problemConfig.status,
				onsetDate,
				resolvedDate:
					problemConfig.status === ProblemStatus.RESOLVED
						? new Date()
						: undefined,
				notes: problemConfig.notes,
				addedBy: authorId,
			});
			count++;
		}
	}

	logger.info({ tenantId, count }, "EMR data seeded");
	return count;
}

/**
 * Seed EMR data for all organizations
 */
export async function seedAllEmr(): Promise<number> {
	logger.info("Starting EMR seed for all organizations");

	const orgs = await Organization.find({ status: "ACTIVE" });
	let totalCount = 0;

	for (const org of orgs) {
		const count = await seedEmr({ tenantId: String(org._id) });
		totalCount += count;
	}

	logger.info({ totalCount }, "All EMR data seeded");
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
		const count = await seedAllEmr();
		console.log(`\nEMR seed completed: ${count} records created`);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("emr.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
