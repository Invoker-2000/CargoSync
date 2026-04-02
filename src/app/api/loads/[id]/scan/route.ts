import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const scanSchema = z.object({
  barcode: z.string().min(1),
  loadItemId: z.string().min(1),
  batchId: z.string().optional(),
  quantity: z.number().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = scanSchema.parse(body);

    // Fetch the load
    const load = await prisma.load.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!load) return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
    if (load.status === "FINALIZED") {
      return NextResponse.json({ error: "Carga já finalizada" }, { status: 400 });
    }
    if (load.status === "CANCELLED") {
      return NextResponse.json({ error: "Carga cancelada" }, { status: 400 });
    }

    // Find the load item
    const loadItem = load.items.find((i) => i.id === data.loadItemId);
    if (!loadItem) {
      return NextResponse.json({ error: "Item da carga não encontrado" }, { status: 404 });
    }

    // Validate barcode matches product
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode: data.barcode },
          { code: data.barcode },
        ],
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "PRODUTO_NAO_ENCONTRADO", message: "Produto não encontrado para este código de barras" },
        { status: 400 }
      );
    }

    if (product.id !== loadItem.productId) {
      return NextResponse.json(
        {
          error: "PRODUTO_ERRADO",
          message: `Produto incorreto! Esperado: ${loadItem.product.name}. Escaneado: ${product.name}`,
        },
        { status: 400 }
      );
    }

    // Check quantity limit
    const remaining = loadItem.requiredQuantity - loadItem.checkedQuantity;
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "QUANTIDADE_EXCEDIDA", message: "Quantidade já verificada para este item" },
        { status: 400 }
      );
    }

    const quantityToAdd = Math.min(data.quantity, remaining);

    // Validate batch if provided
    if (data.batchId) {
      const batch = await prisma.stockBatch.findUnique({
        where: { id: data.batchId },
      });

      if (!batch) {
        return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
      }

      const available = batch.quantity - batch.usedQuantity;
      if (available < quantityToAdd) {
        return NextResponse.json(
          {
            error: "ESTOQUE_INSUFICIENTE",
            message: `Estoque insuficiente no lote. Disponível: ${available}`,
          },
          { status: 400 }
        );
      }

      // Update batch used quantity
      await prisma.stockBatch.update({
        where: { id: data.batchId },
        data: { usedQuantity: { increment: quantityToAdd } },
      });
    }

    // Start load if PENDING
    if (load.status === "PENDING") {
      await prisma.load.update({
        where: { id: params.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          operatorId: (session.user as any).id,
        },
      });
    }

    // Create scan record
    const scanRecord = await prisma.scanRecord.create({
      data: {
        loadId: params.id,
        loadItemId: data.loadItemId,
        productId: product.id,
        batchId: data.batchId ?? null,
        quantity: quantityToAdd,
        scannedBarcode: data.barcode,
        operatorId: (session.user as any).id,
      },
    });

    // Update load item
    const newCheckedQty = loadItem.checkedQuantity + quantityToAdd;
    const itemStatus =
      newCheckedQty >= loadItem.requiredQuantity
        ? "COMPLETED"
        : "IN_PROGRESS";

    await prisma.loadItem.update({
      where: { id: data.loadItemId },
      data: {
        checkedQuantity: newCheckedQty,
        status: itemStatus,
      },
    });

    return NextResponse.json({
      success: true,
      scanRecord,
      quantityAdded: quantityToAdd,
      newCheckedQty,
      itemStatus,
      warning:
        data.quantity > remaining
          ? `Quantidade ajustada para ${quantityToAdd} (restante necessário)`
          : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Erro ao processar leitura" }, { status: 500 });
  }
}
