import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const loadItemId = searchParams.get("loadItemId");

  if (!loadItemId) {
    return NextResponse.json({ error: "loadItemId é obrigatório" }, { status: 400 });
  }

  const loadItem = await prisma.loadItem.findUnique({
    where: { id: loadItemId },
    include: { product: true },
  });

  if (!loadItem) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const remaining = loadItem.requiredQuantity - loadItem.checkedQuantity;

  // FEFO: sort by expiry date ascending (earliest first)
  const batches = await prisma.stockBatch.findMany({
    where: {
      productId: loadItem.productId,
      // Only batches with available stock
    },
    orderBy: [
      { expiryDate: "asc" },
      { createdAt: "asc" },
    ],
    include: { product: true },
  });

  // Filter batches with available stock and build suggestion plan
  const availableBatches = batches.filter(
    (b) => b.quantity - b.usedQuantity > 0
  );

  // Build FEFO suggestion: how to fulfill remaining qty with available batches
  let remainingToFulfill = remaining;
  const suggestions = [];

  for (const batch of availableBatches) {
    if (remainingToFulfill <= 0) break;

    const available = batch.quantity - batch.usedQuantity;
    const useFromBatch = Math.min(available, remainingToFulfill);

    suggestions.push({
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        available,
        quantity: batch.quantity,
        usedQuantity: batch.usedQuantity,
      },
      suggestedQty: useFromBatch,
    });

    remainingToFulfill -= useFromBatch;
  }

  const totalAvailable = availableBatches.reduce(
    (sum, b) => sum + (b.quantity - b.usedQuantity),
    0
  );

  return NextResponse.json({
    productId: loadItem.productId,
    productName: loadItem.product.name,
    requiredQuantity: loadItem.requiredQuantity,
    checkedQuantity: loadItem.checkedQuantity,
    remaining,
    totalAvailable,
    sufficient: totalAvailable >= remaining,
    suggestions,
    allBatches: availableBatches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      available: b.quantity - b.usedQuantity,
      quantity: b.quantity,
      usedQuantity: b.usedQuantity,
    })),
  });
}
