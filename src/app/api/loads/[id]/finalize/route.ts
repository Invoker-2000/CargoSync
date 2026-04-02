import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const load = await prisma.load.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!load) return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  if (load.status === "FINALIZED") {
    return NextResponse.json({ error: "Carga já finalizada" }, { status: 400 });
  }

  // Check all items are completed
  const incompleteItems = load.items.filter(
    (item) => item.checkedQuantity < item.requiredQuantity
  );

  if (incompleteItems.length > 0) {
    return NextResponse.json(
      {
        error: "ITENS_PENDENTES",
        message: `Existem ${incompleteItems.length} item(s) não verificados completamente`,
        incompleteItems: incompleteItems.map((i) => ({
          id: i.id,
          checked: i.checkedQuantity,
          required: i.requiredQuantity,
        })),
      },
      { status: 400 }
    );
  }

  // Finalize load and create billing event
  const [updatedLoad, billingEvent] = await prisma.$transaction([
    prisma.load.update({
      where: { id: params.id },
      data: {
        status: "FINALIZED",
        finalizedAt: new Date(),
      },
    }),
    prisma.billingEvent.create({
      data: {
        loadId: params.id,
        status: "PENDING",
      },
    }),
  ]);

  return NextResponse.json({ load: updatedLoad, billingEvent });
}
