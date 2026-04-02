import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const load = await prisma.load.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
          scanRecords: {
            include: { batch: true, operator: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      operator: { select: { name: true, email: true } },
      manifest: true,
      billingEvent: true,
      scanRecords: {
        include: {
          operator: { select: { name: true } },
          batch: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!load) return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });

  return NextResponse.json(load);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();

  const load = await prisma.load.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(load);
}
