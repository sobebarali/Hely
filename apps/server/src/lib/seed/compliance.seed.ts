import {
	Consent,
	ConsentPurpose,
	ConsentSource,
	Organization,
	Staff,
} from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { createServiceLogger } from "../logger";

const logger = createServiceLogger("complianceSeed");

/**
 * Seed consent records for a tenant
 */
export async function seedCompliance({
	tenantId,
}: {
	tenantId: string;
}): Promise<number> {
	logger.info({ tenantId }, "Seeding compliance consent data");

	// Get the first staff member for this tenant (use their userId for consent)
	const staff = await Staff.findOne({ tenantId }).lean();
	if (!staff) {
		logger.warn({ tenantId }, "No staff found, skipping compliance seed");
		return 0;
	}

	const userId = String(staff.userId);
	let count = 0;

	const purposes = Object.values(ConsentPurpose);
	const grantedAt = new Date();
	grantedAt.setDate(grantedAt.getDate() - 30); // Consented 30 days ago

	for (const purpose of purposes) {
		// Check if consent already exists
		const existing = await Consent.findOne({ tenantId, userId, purpose });
		if (existing) {
			logger.debug({ userId, purpose }, "Consent already exists, skipping");
			continue;
		}

		const id = uuidv4();

		// Grant all except marketing and third-party sharing
		const granted =
			purpose !== ConsentPurpose.MARKETING_EMAILS &&
			purpose !== ConsentPurpose.THIRD_PARTY_SHARING;

		await Consent.create({
			_id: id,
			tenantId,
			userId,
			purpose,
			description: `Consent for ${purpose.replace(/_/g, " ")}`,
			granted,
			version: "1.0",
			source: ConsentSource.REGISTRATION,
			grantedAt: granted ? grantedAt : undefined,
		});
		count++;
	}

	logger.info({ tenantId, count }, "Compliance consent data seeded");
	return count;
}

/**
 * Seed compliance data for all organizations
 */
export async function seedAllCompliance(): Promise<number> {
	logger.info("Starting compliance seed for all organizations");

	const orgs = await Organization.find({ status: "ACTIVE" });
	let totalCount = 0;

	for (const org of orgs) {
		const count = await seedCompliance({ tenantId: String(org._id) });
		totalCount += count;
	}

	logger.info({ totalCount }, "All compliance data seeded");
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
		const count = await seedAllCompliance();
		console.log(
			`\nCompliance seed completed: ${count} consent records created`,
		);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("compliance.seed.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
