import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

async function seedStripeProducts() {
  console.log("🚀 Starting Stripe product seeding...");

  try {
    // Fetch all active plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
    });

    for (const plan of plans) {
      // Skip if already configured
      if (plan.stripeProductId && plan.stripePriceId) {
        console.log(`✓ Plan "${plan.name}" already has Stripe configuration`);
        continue;
      }

      console.log(`\n📝 Setting up Stripe for plan: ${plan.name}`);

      // Create Stripe Product
      const product = await stripe.products.create({
        name: `${plan.name} Plan - ${plan.type}`,
        description: `${plan.name} subscription plan at $${plan.price}/month`,
        metadata: { planId: plan.id, planType: plan.type },
      });
      console.log(`  ✓ Created Stripe Product: ${product.id}`);

      // Create Stripe Price (monthly recurring)
      const price = await stripe.prices.create({
        product: product.id,
        recurring: {
          interval: "month" as const,
          interval_count: 1,
        },
        unit_amount: Math.round(plan.price * 100), // Convert to cents
        currency: "usd",
        metadata: { planId: plan.id },
      } as any);
      console.log(`  ✓ Created Stripe Price: ${price.id}`);

      // Update plan with Stripe IDs
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          stripeProductId: product.id,
          stripePriceId: price.id,
        },
      });
      console.log(`  ✓ Updated plan with Stripe IDs`);
    }

    console.log("\n✅ Stripe product seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding Stripe products:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedStripeProducts().catch(console.error);

