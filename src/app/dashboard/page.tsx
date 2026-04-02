import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Truck,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    FINALIZED: "Finalizado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    FINALIZED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLoads,
    inProgress,
    finalizedToday,
    pendingBilling,
    pendingLoads,
    recentLoads,
  ] = await Promise.all([
    prisma.load.count(),
    prisma.load.count({ where: { status: "IN_PROGRESS" } }),
    prisma.load.count({
      where: { status: "FINALIZED", finalizedAt: { gte: today } },
    }),
    prisma.billingEvent.count({ where: { status: "PENDING" } }),
    prisma.load.count({ where: { status: "PENDING" } }),
    prisma.load.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        items: true,
        operator: { select: { name: true } },
        billingEvent: true,
      },
    }),
  ]);

  const stats = [
    {
      label: "Total de Cargas",
      value: totalLoads,
      icon: Truck,
      color: "bg-blue-500",
      sub: `${pendingLoads} pendentes`,
    },
    {
      label: "Em Andamento",
      value: inProgress,
      icon: Clock,
      color: "bg-yellow-500",
      sub: "conferências ativas",
    },
    {
      label: "Finalizadas Hoje",
      value: finalizedToday,
      icon: CheckCircle2,
      color: "bg-green-500",
      sub: "cargas verificadas",
    },
    {
      label: "Aguardando Faturamento",
      value: pendingBilling,
      icon: FileText,
      color: "bg-purple-500",
      sub: "eventos pendentes",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {(session?.user as any)?.name?.split(" ")[0] ?? "Usuário"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aqui está o resumo das operações logísticas de hoje
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
              <div className="text-gray-400 text-xs mt-1">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/loads">
          <div className="bg-blue-500 rounded-2xl p-6 text-white hover:bg-blue-600 transition-colors cursor-pointer group">
            <Truck className="w-8 h-8 mb-3" />
            <h3 className="font-bold text-lg mb-1">Gerenciar Cargas</h3>
            <p className="text-blue-100 text-sm">Ver todas as cargas e iniciar conferência</p>
            <ArrowRight className="mt-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link href="/dashboard/manifests">
          <div className="bg-gray-900 rounded-2xl p-6 text-white hover:bg-black transition-colors cursor-pointer group">
            <FileText className="w-8 h-8 mb-3" />
            <h3 className="font-bold text-lg mb-1">Importar Manifesto</h3>
            <p className="text-gray-400 text-sm">Importar cargas via CSV ou JSON</p>
            <ArrowRight className="mt-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link href="/dashboard/admin">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-gray-900 hover:border-blue-200 transition-colors cursor-pointer group">
            <CheckCircle2 className="w-8 h-8 mb-3 text-green-500" />
            <h3 className="font-bold text-lg mb-1">Faturamento</h3>
            <p className="text-gray-500 text-sm">
              {pendingBilling} carga(s) aguardando faturamento
            </p>
            <ArrowRight className="mt-3 w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Loads */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Cargas Recentes</h2>
          <Link href="/dashboard/loads">
            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
              Ver todas <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentLoads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>Nenhuma carga cadastrada ainda</p>
              <Link href="/dashboard/manifests">
                <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                  Importar Manifesto
                </Button>
              </Link>
            </div>
          ) : (
            recentLoads.map((load) => {
              const total = load.items.reduce((s, i) => s + i.requiredQuantity, 0);
              const checked = load.items.reduce((s, i) => s + i.checkedQuantity, 0);
              const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

              return (
                <Link key={load.id} href={`/dashboard/loads/${load.id}`}>
                  <div className="p-5 hover:bg-gray-50 transition-colors flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {load.loadNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(load.status)}`}
                        >
                          {getStatusLabel(load.status)}
                        </span>
                        {load.billingEvent?.status === "PENDING" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                            Aguarda Faturamento
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mb-2">{load.clientName}</div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-gray-400 w-10 text-right">{progress}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-700">
                        {load.items.length} itens
                      </div>
                      <div className="text-xs text-gray-400">
                        {load.operator?.name ?? "Sem operador"}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
