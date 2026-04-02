import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        operator: { select: { name: true, email: true } },
        billingEvent: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.load.count({ where }),
  ]);

  return NextResponse.json({ loads, total, page, limit });
}

const loadSchema = z.object({
  loadNumber: z.string().min(1),
  clientName: z.string().min(1),
  clientDoc: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      requiredQuantity: z.number().positive(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = loadSchema.parse(body);

    const load = await prisma.load.create({
      data: {
        loadNumber: data.loadNumber,
        clientName: data.clientName,
        clientDoc: data.clientDoc,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            requiredQuantity: item.requiredQuantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(load, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Load creation error:", error);
    return NextResponse.json({ error: "Erro ao criar carga" }, { status: 500 });
  }
}
