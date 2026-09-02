import { seedDatabase } from "./seed";
import { initiateSuperAdmin } from "./db";

async function main() {
  try {
    console.log("Initiating default admin...");
    await initiateSuperAdmin();

    console.log("Seeding categories and products...");
    const result = await seedDatabase();
    console.log("Seed completed:", result);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();
