import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const events = await prisma.billingEvent.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      load: {
        include: {
          items: { include: { product: true } },
          operator: { select: { name: true } },
        },
      },
    },
    orderBy: { notifiedAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, status, notes } = await request.json();

  const event = await prisma.billingEvent.update({
    where: { id },
    data: {
      status,
      notes,
      processedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(event);
}
