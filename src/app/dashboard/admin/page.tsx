"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BillingEvent {
  id: string;
  status: string;
  notifiedAt: string;
  processedAt?: string;
  notes?: string;
  load: {
    id: string;
    loadNumber: string;
    clientName: string;
    clientDoc?: string;
    finalizedAt?: string;
    operator?: { name: string } | null;
    items: {
      requiredQuantity: number;
      checkedQuantity: number;
      product: { name: string };
    }[];
  };
}

function billingStatusLabel(s: string) {
  const m: Record<string, string> = { PENDING: "Pendente", PROCESSING: "Em Processamento", COMPLETED: "Concluído" };
  return m[s] ?? s;
}

function billingStatusColor(s: string) {
  const m: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
  };
  return m[s] ?? "bg-gray-100 text-gray-800";
}

function timeSince(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `há ${diffDays} dia(s)`;
  if (diffHours > 0) return `há ${diffHours} hora(s)`;
  if (diffMins > 0) return `há ${diffMins} minuto(s)`;
  return "agora mesmo";
}

export default function AdminPage() {
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/billing${params}`);
      const data = await res.json();
      setEvents(data);
    } catch {
      toast.error("Erro ao carregar eventos de faturamento");
    } finally {
      setLoading(false);
    }
  }

  async function updateBillingStatus(eventId: string, newStatus: string) {
    setUpdatingId(eventId);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, status: newStatus }),
      });

      if (!res.ok) throw new Error();
      toast.success("Status atualizado com sucesso!");
      fetchEvents();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = events.filter((e) => e.status === "PENDING").length;
  const processingCount = events.filter((e) => e.status === "PROCESSING").length;
  const completedCount = events.filter((e) => e.status === "COMPLETED").length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
        <p className="text-gray-500 mt-1">
          Cargas finalizadas aguardando processamento de faturamento
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <TrendingUp className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="text-3xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-yellow-600 text-sm font-medium mt-1">Aguardando Faturamento</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-3xl font-bold text-blue-700">{processingCount}</div>
          <div className="text-blue-600 text-sm font-medium mt-1">Em Processamento</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <TrendingUp className="w-4 h-4 text-green-300" />
          </div>
          <div className="text-3xl font-bold text-green-700">{completedCount}</div>
          <div className="text-green-600 text-sm font-medium mt-1">Faturados</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "ALL", label: "Todos" },
          { value: "PENDING", label: "Pendentes" },
          { value: "PROCESSING", label: "Em Processamento" },
          { value: "COMPLETED", label: "Concluídos" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEvents}
          className="ml-auto border-gray-200 h-9"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-lg font-medium">
              Nenhum evento de faturamento
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Os eventos aparecem aqui quando cargas são finalizadas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map((event) => {
              const totalItems = event.load.items.length;
              const totalQty = event.load.items.reduce(
                (s, i) => s + i.requiredQuantity,
                0
              );

              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        event.status === "COMPLETED"
                          ? "bg-green-100"
                          : event.status === "PROCESSING"
                          ? "bg-blue-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {event.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : event.status === "PROCESSING" ? (
                        <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-900">
                          {event.load.loadNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${billingStatusColor(event.status)}`}
                        >
                          {billingStatusLabel(event.status)}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm mb-1">
                        {event.load.clientName}
                        {event.load.clientDoc && (
                          <span className="text-gray-400 ml-1">· {event.load.clientDoc}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>{totalItems} itens · {totalQty.toFixed(0)} unidades</span>
                        {event.load.operator && (
                          <span>Operador: {event.load.operator.name}</span>
                        )}
                        {event.load.finalizedAt && (
                          <span>
                            Finalizado:{" "}
                            {new Date(event.load.finalizedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span className="text-yellow-600 font-medium">
                          Notificado {timeSince(event.notifiedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/dashboard/loads/${event.load.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-blue-600 h-8"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>

                      {event.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => updateBillingStatus(event.id, "PROCESSING")}
                          disabled={updatingId === event.id}
                          className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs"
                        >
                          {updatingId === event.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            "Processar"
                          )}
                        </Button>
                      )}

                      {event.status === "PROCESSING" && (
                        <Button
                          size="sm"
                          onClick={() => updateBillingStatus(event.id, "COMPLETED")}
                          disabled={updatingId === event.id}
                          className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                        >
                          {updatingId === event.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            "Concluir"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-3 ml-14 flex flex-wrap gap-1.5">
                    {event.load.items.slice(0, 5).map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {item.product.name} ({item.requiredQuantity.toFixed(0)})
                      </span>
                    ))}
                    {event.load.items.length > 5 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        +{event.load.items.length - 5} itens
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
