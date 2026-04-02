import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLoads,
    inProgress,
    finalizedToday,
    pendingBilling,
    recentLoads,
    pendingLoads,
  ] = await Promise.all([
    prisma.load.count(),
    prisma.load.count({ where: { status: "IN_PROGRESS" } }),
    prisma.load.count({
      where: {
        status: "FINALIZED",
        finalizedAt: { gte: today },
      },
    }),
    prisma.billingEvent.count({ where: { status: "PENDING" } }),
    prisma.load.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        items: true,
        operator: { select: { name: true } },
        billingEvent: true,
      },
    }),
    prisma.load.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    totalLoads,
    inProgress,
    finalizedToday,
    pendingBilling,
    pendingLoads,
    recentLoads,
  });
}
