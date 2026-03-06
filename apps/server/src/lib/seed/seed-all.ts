/**
 * Master seed script that runs all seed files in the correct order
 *
 * Order is important due to dependencies:
 * 1. Organizations (creates tenants, departments, users, roles)
 * 2. Medicines (no deps, master data)
 * 3. Patients (needs org, department)
 * 4. Inventory (needs medicines)
 * 5. Appointments (needs patients, staff)
 * 6. Prescriptions (needs patients, medicines, appointments)
 * 7. Vitals (needs patients, staff)
 * 8. Admissions (needs IPD patients, staff)
 * 9. Dispensing (needs prescriptions, inventory)
 */

import { createServiceLogger } from "../logger";
import { seedAllAdmissions } from "./admissions.seed";
import { seedAllAppointments } from "./appointments.seed";
import { seedAllDispensing } from "./dispensing.seed";
import { seedAllEmr } from "./emr.seed";
import { seedAllInventory } from "./inventory.seed";
import { seedAllLabOrders } from "./lab-orders.seed";
import { seedAllMedicines } from "./medicines.seed";
import { seedOrganizations } from "./organizations.seed";
import { seedAllPatients } from "./patients.seed";
import { seedAllPrescriptions } from "./prescriptions.seed";
import { seedAllTestCatalog } from "./test-catalog.seed";
import { seedAllVitals } from "./vitals.seed";

const logger = createServiceLogger("seedAll");

interface SeedResult {
	organizations: number;
	medicines: number;
	patients: number;
	inventory: number;
	appointments: number;
	prescriptions: number;
	vitals: number;
	admissions: number;
	dispensing: number;
	testCatalog: number;
	labOrders: number;
	emr: number;
}

/**
 * Run all seed functions in order
 */
export async function seedAll(): Promise<SeedResult> {
	logger.info("Starting complete seed process");

	const result: SeedResult = {
		organizations: 0,
		medicines: 0,
		patients: 0,
		inventory: 0,
		appointments: 0,
		prescriptions: 0,
		vitals: 0,
		admissions: 0,
		dispensing: 0,
		testCatalog: 0,
		labOrders: 0,
		emr: 0,
	};

	// 1. Organizations (includes departments, users, roles)
	console.log("\n📦 Seeding organizations...");
	const orgResult = await seedOrganizations();
	result.organizations = orgResult.organizations;
	console.log(
		`   ✅ ${orgResult.organizations} organizations, ${orgResult.departments} departments, ${orgResult.users} users`,
	);

	// 2. Medicines
	console.log("\n💊 Seeding medicines...");
	result.medicines = await seedAllMedicines();
	console.log(`   ✅ ${result.medicines} medicines`);

	// 3. Patients
	console.log("\n👤 Seeding patients...");
	result.patients = await seedAllPatients();
	console.log(`   ✅ ${result.patients} patients`);

	// 4. Inventory
	console.log("\n📦 Seeding inventory...");
	result.inventory = await seedAllInventory();
	console.log(`   ✅ ${result.inventory} inventory records`);

	// 5. Appointments
	console.log("\n📅 Seeding appointments...");
	result.appointments = await seedAllAppointments();
	console.log(`   ✅ ${result.appointments} appointments`);

	// 6. Prescriptions
	console.log("\n📝 Seeding prescriptions...");
	result.prescriptions = await seedAllPrescriptions();
	console.log(`   ✅ ${result.prescriptions} prescriptions`);

	// 7. Vitals
	console.log("\n❤️ Seeding vitals...");
	result.vitals = await seedAllVitals();
	console.log(`   ✅ ${result.vitals} vitals records`);

	// 8. Admissions
	console.log("\n🏥 Seeding admissions...");
	result.admissions = await seedAllAdmissions();
	console.log(`   ✅ ${result.admissions} admissions`);

	// 9. Dispensing
	console.log("\n💉 Seeding dispensing...");
	result.dispensing = await seedAllDispensing();
	console.log(`   ✅ ${result.dispensing} dispensing records`);

	// 10. Test Catalog
	console.log("\n🧪 Seeding test catalog...");
	result.testCatalog = await seedAllTestCatalog();
	console.log(`   ✅ ${result.testCatalog} test catalog entries`);

	// 11. Lab Orders (needs patients, test catalog)
	console.log("\n🔬 Seeding lab orders...");
	result.labOrders = await seedAllLabOrders();
	console.log(`   ✅ ${result.labOrders} lab orders`);

	// 12. EMR (needs patients, staff)
	console.log("\n📋 Seeding EMR data...");
	result.emr = await seedAllEmr();
	console.log(`   ✅ ${result.emr} EMR records`);

	logger.info(result, "Complete seed process finished");
	return result;
}

/**
 * Main function for standalone execution
 */
async function main(): Promise<void> {
	const dotenv = await import("dotenv");
	dotenv.config();

	const { connectDB, mongoose } = await import("@hms/db");
	await connectDB();

	console.log("🔌 Connected to database");
	console.log("━".repeat(50));

	try {
		const startTime = Date.now();
		const result = await seedAll();
		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		console.log(`\n${"━".repeat(50)}`);
		console.log("🎉 SEED COMPLETE");
		console.log("━".repeat(50));
		console.log(`
Summary:
  Organizations: ${result.organizations}
  Medicines:     ${result.medicines}
  Patients:      ${result.patients}
  Inventory:     ${result.inventory}
  Appointments:  ${result.appointments}
  Prescriptions: ${result.prescriptions}
  Vitals:        ${result.vitals}
  Admissions:    ${result.admissions}
  Dispensing:    ${result.dispensing}
  Test Catalog:  ${result.testCatalog}
  Lab Orders:    ${result.labOrders}
  EMR:           ${result.emr}

Duration: ${duration}s

Default credentials:
  Password: Test123!
  Emails:   hospital-{role}@usehely.com
            clinic-{role}@usehely.com
            solo-{role}@usehely.com

  Roles: admin, doctor, nurse, pharmacist, receptionist
`);
	} finally {
		await mongoose.disconnect();
		console.log("🔌 Disconnected from database");
	}
}

const isMainModule = process.argv[1]?.endsWith("seed-all.ts");
if (isMainModule) {
	main()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
