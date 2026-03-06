import {
	Account,
	Counter,
	Department,
	DepartmentStatus,
	DepartmentType,
	type mongoose,
	Organization,
	OrganizationStatus,
	OrganizationType,
	PricingTier,
	Role,
	Staff,
	User,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../../utils/crypto";
import { createServiceLogger } from "../logger";
import { seedSystemRoles } from "./system-roles.seed";

const logger = createServiceLogger("organizationsSeed");

// Default password for all seed users
const SEED_PASSWORD = "Test123!";

// Organization configurations
const ORGANIZATIONS_CONFIG = [
	{
		name: "City General Hospital",
		slug: "city-general-hospital",
		emailPrefix: "hospital",
		type: OrganizationType.HOSPITAL,
		licenseNumber: "HOSP-2024-001",
	},
	{
		name: "Downtown Medical Clinic",
		slug: "downtown-medical-clinic",
		emailPrefix: "clinic",
		type: OrganizationType.CLINIC,
		licenseNumber: "CLIN-2024-001",
	},
	{
		name: "Dr. Smith Solo Practice",
		slug: "dr-smith-solo-practice",
		emailPrefix: "solo",
		type: OrganizationType.SOLO_PRACTICE,
		licenseNumber: undefined,
	},
] as const;

// Seed config interfaces
interface DepartmentSeedConfig {
	name: string;
	code: string;
	type: (typeof DepartmentType)[keyof typeof DepartmentType];
	description: string;
	location: string;
	contact: { phone: string; email: string };
	operatingHours: Record<string, { start: string; end: string } | null>;
	headRole?: string;
}

interface UserSeedConfig {
	role: string;
	firstName: string;
	lastName: string;
	departmentCode: string;
	specialization?: string;
	shift: "MORNING" | "EVENING" | "NIGHT";
}

// Operating hours helpers
const WEEKDAY_HOURS = { start: "08:00", end: "17:00" };
const FULL_DAY = { start: "00:00", end: "23:59" };

function weekdaySchedule(
	weekday: { start: string; end: string },
	saturday: { start: string; end: string } | null,
) {
	return {
		monday: weekday,
		tuesday: weekday,
		wednesday: weekday,
		thursday: weekday,
		friday: weekday,
		saturday,
		sunday: null,
	};
}

// Department configurations
const DEPARTMENTS_CONFIG: DepartmentSeedConfig[] = [
	{
		name: "General Medicine",
		code: "GEN",
		type: DepartmentType.CLINICAL,
		description: "General medicine and primary care",
		location: "Building A, Floor 1",
		contact: { phone: "+1-555-0101", email: "gen.medicine@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, {
			start: "09:00",
			end: "13:00",
		}),
		headRole: "DOCTOR",
	},
	{
		name: "Emergency",
		code: "ER",
		type: DepartmentType.EMERGENCY,
		description: "Emergency and urgent care services",
		location: "Building A, Ground Floor",
		contact: { phone: "+1-555-0911", email: "emergency@usehely.com" },
		operatingHours: {
			monday: FULL_DAY,
			tuesday: FULL_DAY,
			wednesday: FULL_DAY,
			thursday: FULL_DAY,
			friday: FULL_DAY,
			saturday: FULL_DAY,
			sunday: FULL_DAY,
		},
	},
	{
		name: "Pharmacy",
		code: "PHARM",
		type: DepartmentType.PHARMACY,
		description: "Pharmacy and dispensing services",
		location: "Building B, Floor 1",
		contact: { phone: "+1-555-0102", email: "pharmacy@usehely.com" },
		operatingHours: weekdaySchedule(
			{ start: "08:00", end: "18:00" },
			{ start: "09:00", end: "14:00" },
		),
		headRole: "PHARMACIST",
	},
	{
		name: "Administration",
		code: "ADMIN",
		type: DepartmentType.ADMINISTRATIVE,
		description: "Administrative and front desk services",
		location: "Building A, Floor 3",
		contact: { phone: "+1-555-0100", email: "admin@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, null),
		headRole: "HOSPITAL_ADMIN",
	},
	{
		name: "Cardiology",
		code: "CARDIO",
		type: DepartmentType.CLINICAL,
		description: "Heart and cardiovascular care",
		location: "Building C, Floor 2",
		contact: { phone: "+1-555-0103", email: "cardiology@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, {
			start: "09:00",
			end: "13:00",
		}),
	},
	{
		name: "Neurology",
		code: "NEURO",
		type: DepartmentType.CLINICAL,
		description: "Brain and nervous system care",
		location: "Building C, Floor 3",
		contact: { phone: "+1-555-0104", email: "neurology@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, {
			start: "09:00",
			end: "13:00",
		}),
	},
	{
		name: "Orthopedics",
		code: "ORTHO",
		type: DepartmentType.CLINICAL,
		description: "Musculoskeletal and bone care",
		location: "Building D, Floor 1",
		contact: { phone: "+1-555-0105", email: "orthopedics@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, {
			start: "09:00",
			end: "14:00",
		}),
	},
	{
		name: "Pediatrics",
		code: "PEDIA",
		type: DepartmentType.CLINICAL,
		description: "Child and adolescent healthcare",
		location: "Building B, Floor 2",
		contact: { phone: "+1-555-0106", email: "pediatrics@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, {
			start: "09:00",
			end: "13:00",
		}),
	},
	{
		name: "Oncology",
		code: "ONCO",
		type: DepartmentType.CLINICAL,
		description: "Cancer diagnosis and treatment",
		location: "Building D, Floor 2",
		contact: { phone: "+1-555-0107", email: "oncology@usehely.com" },
		operatingHours: weekdaySchedule(WEEKDAY_HOURS, null),
	},
	{
		name: "Radiology",
		code: "RAD",
		type: DepartmentType.DIAGNOSTIC,
		description: "Medical imaging and diagnostics",
		location: "Building B, Basement",
		contact: { phone: "+1-555-0108", email: "radiology@usehely.com" },
		operatingHours: weekdaySchedule(
			{ start: "07:00", end: "19:00" },
			{ start: "08:00", end: "14:00" },
		),
	},
];

// User configurations
const USERS_CONFIG: UserSeedConfig[] = [
	{
		role: "HOSPITAL_ADMIN",
		firstName: "Admin",
		lastName: "User",
		departmentCode: "ADMIN",
		shift: "MORNING",
	},
	{
		role: "DOCTOR",
		firstName: "John",
		lastName: "Doctor",
		departmentCode: "GEN",
		specialization: "Internal Medicine",
		shift: "MORNING",
	},
	{
		role: "NURSE",
		firstName: "Jane",
		lastName: "Nurse",
		departmentCode: "GEN",
		specialization: "Critical Care Nursing",
		shift: "MORNING",
	},
	{
		role: "PHARMACIST",
		firstName: "Paul",
		lastName: "Pharmacist",
		departmentCode: "PHARM",
		specialization: "Clinical Pharmacy",
		shift: "MORNING",
	},
	{
		role: "RECEPTIONIST",
		firstName: "Rachel",
		lastName: "Receptionist",
		departmentCode: "ADMIN",
		shift: "MORNING",
	},
];

interface CounterModel {
	getNextSequence(tenantId: string, type: string): Promise<number>;
}

/**
 * Seed departments for a tenant
 */
async function seedDepartments({
	tenantId,
	session,
}: {
	tenantId: string;
	session?: mongoose.ClientSession;
}): Promise<Map<string, string>> {
	logger.info({ tenantId }, "Seeding departments");

	const departmentMap = new Map<string, string>();

	for (const deptConfig of DEPARTMENTS_CONFIG) {
		// Check if department already exists
		const existing = await Department.findOne({
			tenantId,
			code: deptConfig.code,
		}).session(session ?? null);

		if (existing) {
			logger.debug(
				{ tenantId, deptCode: deptConfig.code },
				"Department already exists, skipping",
			);
			departmentMap.set(deptConfig.code, String(existing._id));
			continue;
		}

		const deptId = uuidv4();

		await Department.create(
			[
				{
					_id: deptId,
					tenantId,
					name: deptConfig.name,
					code: deptConfig.code,
					description: deptConfig.description,
					type: deptConfig.type,
					location: deptConfig.location,
					contact: deptConfig.contact,
					operatingHours: deptConfig.operatingHours,
					status: DepartmentStatus.ACTIVE,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{ session },
		);

		departmentMap.set(deptConfig.code, deptId);

		logger.info(
			{ tenantId, deptId, deptName: deptConfig.name },
			"Department created",
		);
	}

	return departmentMap;
}

/**
 * Seed users for a tenant
 */
async function seedUsers({
	tenantId,
	emailPrefix,
	departmentMap,
	roleMap,
	session,
}: {
	tenantId: string;
	emailPrefix: string;
	departmentMap: Map<string, string>;
	roleMap: Map<string, string>;
	session?: mongoose.ClientSession;
}): Promise<Map<string, string>> {
	logger.info({ tenantId }, "Seeding users");

	const staffByRole = new Map<string, string>();
	const hashedPassword = await hashPassword(SEED_PASSWORD);

	let staffIdx = 0;
	for (const userConfig of USERS_CONFIG) {
		const email = `${emailPrefix}-${userConfig.role.toLowerCase().replace("hospital_", "")}@usehely.com`;

		// Check if user already exists globally
		const existingUser = await User.findOne({ email }).session(session ?? null);

		if (existingUser) {
			logger.debug({ email }, "User already exists, checking staff record");
			const existingStaff = await Staff.findOne({
				tenantId,
				userId: String(existingUser._id),
			}).session(session ?? null);

			if (existingStaff) {
				staffByRole.set(userConfig.role, String(existingStaff._id));
			} else {
				// User exists but staff record is missing — create it
				const staffId = uuidv4();
				const seq = await (Counter as unknown as CounterModel).getNextSequence(
					tenantId,
					"employee",
				);
				const employeeId = `EMP-${String(seq).padStart(5, "0")}`;
				const roleId = roleMap.get(userConfig.role);
				const departmentId = departmentMap.get(userConfig.departmentCode);

				if (!roleId || !departmentId) {
					logger.error(
						{ role: userConfig.role, dept: userConfig.departmentCode },
						"Role or department not found for existing user",
					);
					staffIdx++;
					continue;
				}

				await Staff.create(
					[
						{
							_id: staffId,
							tenantId,
							userId: String(existingUser._id),
							employeeId,
							firstName: userConfig.firstName,
							lastName: userConfig.lastName,
							phone: `+1-555-${String(200 + staffIdx).padStart(4, "0")}`,
							departmentId,
							roles: [roleId],
							specialization: userConfig.specialization,
							shift: userConfig.shift,
							status: "ACTIVE",
							forcePasswordChange: false,
							passwordHistory: [hashedPassword],
						},
					],
					{ session },
				);

				staffByRole.set(userConfig.role, staffId);
				logger.info(
					{ email, staffId },
					"Created missing staff record for existing user",
				);
			}
			staffIdx++;
			continue;
		}

		// Generate IDs
		const userId = uuidv4();
		const staffId = uuidv4();
		const accountId = uuidv4();

		// Get employee ID using Counter
		const seq = await (Counter as unknown as CounterModel).getNextSequence(
			tenantId,
			"employee",
		);
		const employeeId = `EMP-${String(seq).padStart(5, "0")}`;

		// Get role and department IDs
		const roleId = roleMap.get(userConfig.role);
		const departmentId = departmentMap.get(userConfig.departmentCode);

		if (!roleId) {
			logger.error({ role: userConfig.role }, "Role not found");
			throw new Error(`Role ${userConfig.role} not found`);
		}

		if (!departmentId) {
			logger.error(
				{ departmentCode: userConfig.departmentCode },
				"Department not found",
			);
			throw new Error(`Department ${userConfig.departmentCode} not found`);
		}

		// Create User record
		await User.create(
			[
				{
					_id: userId,
					name: `${userConfig.firstName} ${userConfig.lastName}`,
					email,
					emailVerified: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{ session },
		);

		// Create Account record
		await Account.create(
			[
				{
					_id: accountId,
					accountId,
					userId,
					providerId: "credential",
					password: hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{ session },
		);

		// Create Staff record
		await Staff.create(
			[
				{
					_id: staffId,
					tenantId,
					userId,
					employeeId,
					firstName: userConfig.firstName,
					lastName: userConfig.lastName,
					phone: `+1-555-${String(200 + staffIdx).padStart(4, "0")}`,
					departmentId,
					roles: [roleId],
					specialization: userConfig.specialization,
					shift: userConfig.shift,
					status: "ACTIVE",
					forcePasswordChange: false, // Seed users don't need to change password
					passwordHistory: [hashedPassword],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{ session },
		);

		staffByRole.set(userConfig.role, staffId);
		staffIdx++;

		logger.info(
			{ userId, email, employeeId, role: userConfig.role },
			"User created",
		);
	}

	return staffByRole;
}

/**
 * Update department heads after staff records exist
 */
async function updateDepartmentHeads({
	tenantId,
	departmentMap,
	staffByRole,
	session,
}: {
	tenantId: string;
	departmentMap: Map<string, string>;
	staffByRole: Map<string, string>;
	session?: mongoose.ClientSession;
}): Promise<void> {
	for (const deptConfig of DEPARTMENTS_CONFIG) {
		if (!deptConfig.headRole) continue;

		const staffId = staffByRole.get(deptConfig.headRole);
		const departmentId = departmentMap.get(deptConfig.code);

		if (!staffId || !departmentId) continue;

		await Department.updateOne(
			{ _id: departmentId, tenantId },
			{ $set: { headId: staffId } },
		).session(session ?? null);

		logger.info(
			{ deptCode: deptConfig.code, headRole: deptConfig.headRole },
			"Department head set",
		);
	}
}

/**
 * Seed a single organization with departments and users
 */
async function seedOrganization(
	config: (typeof ORGANIZATIONS_CONFIG)[number],
): Promise<{ tenantId: string; departments: number; users: number } | null> {
	const { mongoose } = await import("@hms/db");
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		// Check if organization already exists
		const existing = await Organization.findOne({ slug: config.slug }).session(
			session,
		);

		if (existing) {
			logger.info(
				{ slug: config.slug },
				"Organization already exists, skipping",
			);
			await session.abortTransaction();
			return null;
		}

		// Create organization
		const tenantId = uuidv4();

		await Organization.create(
			[
				{
					_id: tenantId,
					name: config.name,
					slug: config.slug,
					type: config.type,
					licenseNumber: config.licenseNumber,
					address: {
						street: "123 Healthcare Ave",
						city: "Medical City",
						state: "HC",
						postalCode: "12345",
						country: "USA",
					},
					contactEmail: `contact@${config.slug}.example.com`,
					contactPhone: "+1234567890",
					adminEmail: `${config.emailPrefix}-admin@usehely.com`,
					adminPhone: "+1234567890",
					status: OrganizationStatus.ACTIVE,
					pricingTier: PricingTier.ENTERPRISE,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{ session },
		);

		logger.info({ tenantId, orgName: config.name }, "Organization created");

		// Seed system roles
		await seedSystemRoles({ tenantId, session });

		// Get role map
		const roles = await Role.find({ tenantId, isSystem: true }).session(
			session,
		);
		const roleMap = new Map(
			roles.map((r) => [r.name as string, String(r._id)]),
		);

		// Seed departments
		const departmentMap = await seedDepartments({ tenantId, session });

		// Seed users
		const staffByRole = await seedUsers({
			tenantId,
			emailPrefix: config.emailPrefix,
			departmentMap,
			roleMap,
			session,
		});

		// Set department heads
		await updateDepartmentHeads({
			tenantId,
			departmentMap,
			staffByRole,
			session,
		});

		await session.commitTransaction();

		logger.info(
			{ tenantId, orgName: config.name },
			"Organization seeded successfully",
		);

		return {
			tenantId,
			departments: departmentMap.size,
			users: USERS_CONFIG.length,
		};
	} catch (error) {
		await session.abortTransaction();
		logger.error(
			{ error, orgSlug: config.slug },
			"Failed to seed organization",
		);
		throw error;
	} finally {
		await session.endSession();
	}
}

/**
 * Seed all organizations with departments and users
 */
export async function seedOrganizations(): Promise<{
	organizations: number;
	departments: number;
	users: number;
}> {
	logger.info("Starting organizations seed");

	let orgCount = 0;
	let deptCount = 0;
	let userCount = 0;

	for (const orgConfig of ORGANIZATIONS_CONFIG) {
		const result = await seedOrganization(orgConfig);

		if (result) {
			orgCount++;
			deptCount += result.departments;
			userCount += result.users;
		}
	}

	logger.info(
		{ organizations: orgCount, departments: deptCount, users: userCount },
		"Organizations seed completed",
	);

	return { organizations: orgCount, departments: deptCount, users: userCount };
}

/**
 * Main function for standalone execution
 */
async function main(): Promise<void> {
	// Load environment variables
	const dotenv = await import("dotenv");
	dotenv.config();

	// Connect to database
	const { connectDB, mongoose } = await import("@hms/db");
	await connectDB();

	console.log("Connected to database");

	try {
		const result = await seedOrganizations();

		console.log("\nSeed completed successfully!");
		console.log(`  Organizations: ${result.organizations}`);
		console.log(`  Departments: ${result.departments}`);
		console.log(`  Users: ${result.users}`);
		console.log(`\nDefault password for all users: ${SEED_PASSWORD}`);
	} finally {
		await mongoose.disconnect();
		console.log("\nDisconnected from database");
	}
}

// Check if running as main module
const isMainModule = process.argv[1]?.endsWith("organizations.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
