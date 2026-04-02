import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const batches = await prisma.stockBatch.findMany({
    where: {
      ...(productId ? { productId } : {}),
      // Only show batches with available stock
    },
    include: { product: true },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(batches);
}

const batchSchema = z.object({
  batchNumber: z.string().min(1),
  productId: z.string().min(1),
  expiryDate: z.string().optional(),
  quantity: z.number().positive(),
  productionOrderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = batchSchema.parse(body);

    const batch = await prisma.stockBatch.create({
      data: {
        batchNumber: data.batchNumber,
        productId: data.productId,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        quantity: data.quantity,
        productionOrderId: data.productionOrderId,
      },
      include: { product: true },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Batch creation error:", error);
    return NextResponse.json({ error: "Erro ao criar lote" }, { status: 500 });
  }
}
