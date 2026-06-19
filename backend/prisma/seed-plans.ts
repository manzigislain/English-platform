import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = "postgresql://postgres@localhost:5432/english-platform";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding plans...");

  const plans = [
    { name: "Seed", type: "SEED", price: 0, currency: "USD", durationDays: 3650, features: { lessons: "Free lessons only", community: true, vocabulary: true, exercises: true, certificates: false, mentoring: false }, isActive: true },
    { name: "Growth", type: "GROWTH", price: 9.99, currency: "USD", durationDays: 30, features: { lessons: "All Seed + Growth content", community: true, vocabulary: true, exercises: true, grammar: true, reading: true, writing: true, certificates: false, mentoring: false }, isActive: true },
    { name: "Success", type: "SUCCESS", price: 19.99, currency: "USD", durationDays: 30, features: { lessons: "All content unlocked", community: true, vocabulary: true, exercises: true, grammar: true, reading: true, writing: true, business: true, interview: true, certificates: true, mentoring: true }, isActive: true },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.type },
      update: plan as any,
      create: { id: plan.type, ...plan } as any,
    });
    console.log(`  ✓ ${plan.name} (${plan.type})`);
  }

  console.log("Plans seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
