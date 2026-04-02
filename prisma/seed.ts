import "dotenv/config";

// Allow self-signed certificates for Aiven cloud database
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@cargosync.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@cargosync.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create operator user
  const operatorPassword = await bcrypt.hash("op123456", 12);
  const operator = await prisma.user.upsert({
    where: { email: "operador@cargosync.com" },
    update: {},
    create: {
      name: "João Operador",
      email: "operador@cargosync.com",
      password: operatorPassword,
      role: "OPERATOR",
    },
  });

  // Create billing user
  const billingPassword = await bcrypt.hash("fat123456", 12);
  await prisma.user.upsert({
    where: { email: "faturamento@cargosync.com" },
    update: {},
    create: {
      name: "Maria Faturamento",
      email: "faturamento@cargosync.com",
      password: billingPassword,
      role: "BILLING",
    },
  });

  console.log("Users created");

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { code: "PROD-001" },
      update: {},
      create: { code: "PROD-001", name: "Leite Integral 1L", barcode: "7891234567890", unit: "CX" },
    }),
    prisma.product.upsert({
      where: { code: "PROD-002" },
      update: {},
      create: { code: "PROD-002", name: "Iogurte Natural 500g", barcode: "7891234567891", unit: "CX" },
    }),
    prisma.product.upsert({
      where: { code: "PROD-003" },
      update: {},
      create: { code: "PROD-003", name: "Manteiga 200g", barcode: "7891234567892", unit: "CX" },
    }),
    prisma.product.upsert({
      where: { code: "PROD-004" },
      update: {},
      create: { code: "PROD-004", name: "Queijo Mussarela 500g", barcode: "7891234567893", unit: "KG" },
    }),
    prisma.product.upsert({
      where: { code: "PROD-005" },
      update: {},
      create: { code: "PROD-005", name: "Água Mineral 500ml", barcode: "7891234567894", unit: "FD" },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  // Create stock batches (FEFO order)
  await Promise.all([
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2024-001", productId: products[0].id } },
      update: {},
      create: { batchNumber: "LOTE-2024-001", productId: products[0].id, expiryDate: new Date("2024-12-31"), quantity: 200, usedQuantity: 0 },
    }),
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2025-001", productId: products[0].id } },
      update: {},
      create: { batchNumber: "LOTE-2025-001", productId: products[0].id, expiryDate: new Date("2025-06-30"), quantity: 300, usedQuantity: 0 },
    }),
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2024-002", productId: products[1].id } },
      update: {},
      create: { batchNumber: "LOTE-2024-002", productId: products[1].id, expiryDate: new Date("2025-11-30"), quantity: 100, usedQuantity: 0 },
    }),
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2024-003", productId: products[2].id } },
      update: {},
      create: { batchNumber: "LOTE-2024-003", productId: products[2].id, expiryDate: new Date("2025-03-31"), quantity: 150, usedQuantity: 0 },
    }),
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2024-004", productId: products[3].id } },
      update: {},
      create: { batchNumber: "LOTE-2024-004", productId: products[3].id, expiryDate: new Date("2025-08-31"), quantity: 80, usedQuantity: 0 },
    }),
    prisma.stockBatch.upsert({
      where: { batchNumber_productId: { batchNumber: "LOTE-2024-005", productId: products[4].id } },
      update: {},
      create: { batchNumber: "LOTE-2024-005", productId: products[4].id, expiryDate: new Date("2026-12-31"), quantity: 500, usedQuantity: 0 },
    }),
  ]);

  console.log("Stock batches created");

  // Create sample loads
  const load1Exists = await prisma.load.findUnique({ where: { loadNumber: "C-2024-001" } });
  if (!load1Exists) {
    await prisma.load.create({
      data: {
        loadNumber: "C-2024-001",
        clientName: "Supermercado ABC Ltda",
        clientDoc: "12.345.678/0001-99",
        status: "PENDING",
        items: {
          create: [
            { productId: products[0].id, requiredQuantity: 100 },
            { productId: products[1].id, requiredQuantity: 48 },
            { productId: products[2].id, requiredQuantity: 24 },
          ],
        },
      },
    });
    console.log("Created load C-2024-001");
  }

  const load2Exists = await prisma.load.findUnique({ where: { loadNumber: "C-2024-002" } });
  if (!load2Exists) {
    await prisma.load.create({
      data: {
        loadNumber: "C-2024-002",
        clientName: "Distribuidora XYZ",
        clientDoc: "98.765.432/0001-11",
        status: "PENDING",
        operatorId: operator.id,
        items: {
          create: [
            { productId: products[3].id, requiredQuantity: 50 },
            { productId: products[4].id, requiredQuantity: 200 },
          ],
        },
      },
    });
    console.log("Created load C-2024-002");
  }

  const load3Exists = await prisma.load.findUnique({ where: { loadNumber: "C-2024-003" } });
  if (!load3Exists) {
    await prisma.load.create({
      data: {
        loadNumber: "C-2024-003",
        clientName: "Mercado Central",
        clientDoc: "11.222.333/0001-44",
        status: "PENDING",
        items: {
          create: [
            { productId: products[0].id, requiredQuantity: 60 },
            { productId: products[2].id, requiredQuantity: 36 },
            { productId: products[4].id, requiredQuantity: 120 },
          ],
        },
      },
    });
    console.log("Created load C-2024-003");
  }

  console.log("\nSeed completed successfully!");
  console.log("\nTest credentials:");
  console.log("  Admin:      admin@cargosync.com / admin123");
  console.log("  Operator:   operador@cargosync.com / op123456");
  console.log("  Billing:    faturamento@cargosync.com / fat123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
