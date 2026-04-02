"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Scan,
  Loader2,
  AlertTriangle,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface LoadItem {
  id: string;
  productId: string;
  requiredQuantity: number;
  checkedQuantity: number;
  status: string;
  product: { id: string; code: string; name: string; unit: string };
  scanRecords: {
    id: string;
    quantity: number;
    scannedBarcode: string;
    createdAt: string;
    operator: { name: string };
    batch?: { batchNumber: string; expiryDate?: string } | null;
  }[];
}

interface LoadDetail {
  id: string;
  loadNumber: string;
  clientName: string;
  clientDoc?: string;
  status: string;
  startedAt?: string;
  finalizedAt?: string;
  createdAt: string;
  items: LoadItem[];
  operator?: { name: string } | null;
  manifest?: { fileName: string } | null;
  billingEvent?: { status: string; notifiedAt: string } | null;
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    FINALIZED: "Finalizado",
    CANCELLED: "Cancelado",
    COMPLETED: "Completo",
  };
  return m[s] ?? s;
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    FINALIZED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return m[s] ?? "bg-gray-100 text-gray-700";
}

export default function LoadDetailPage() {
  const params = useParams();
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    fetchLoad();
  }, []);

  async function fetchLoad() {
    try {
      const res = await fetch(`/api/loads/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLoad(data);
    } catch {
      toast.error("Erro ao carregar detalhes da carga");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    if (!load) return;

    const incompleteItems = load.items.filter(
      (i) => i.checkedQuantity < i.requiredQuantity
    );

    if (incompleteItems.length > 0) {
      toast.error(
        `Ainda há ${incompleteItems.length} item(s) incompleto(s). Complete todos os itens antes de finalizar.`
      );
      return;
    }

    setFinalizing(true);
    try {
      const res = await fetch(`/api/loads/${params.id}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Erro ao finalizar");
        return;
      }
      toast.success("Carga finalizada! Evento de faturamento criado.");
      fetchLoad();
    } catch {
      toast.error("Erro ao finalizar carga");
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!load) return <div>Carga não encontrada</div>;

  const totalQty = load.items.reduce((s, i) => s + i.requiredQuantity, 0);
  const checkedQty = load.items.reduce((s, i) => s + i.checkedQuantity, 0);
  const overallProgress = totalQty > 0 ? Math.round((checkedQty / totalQty) * 100) : 0;
  const completedItems = load.items.filter((i) => i.checkedQuantity >= i.requiredQuantity).length;
  const allComplete = completedItems === load.items.length && load.items.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/loads">
            <Button variant="ghost" size="sm" className="text-gray-500 mt-1">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{load.loadNumber}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor(load.status)}`}>
                {statusLabel(load.status)}
              </span>
              {load.billingEvent && (
                <span className="text-sm px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                  {load.billingEvent.status === "PENDING" && "Aguardando Faturamento"}
                  {load.billingEvent.status === "COMPLETED" && "Faturado"}
                  {load.billingEvent.status === "PROCESSING" && "Em Faturamento"}
                </span>
              )}
            </div>
            <p className="text-gray-500">{load.clientName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(load.status === "PENDING" || load.status === "IN_PROGRESS") && (
            <Link href={`/dashboard/loads/${load.id}/scan`}>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                <Scan className="w-4 h-4 mr-2" />
                Iniciar Conferência
              </Button>
            </Link>
          )}
          {load.status === "IN_PROGRESS" && allComplete && (
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
            >
              {finalizing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Finalizar Carga
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Progresso Geral</h2>
              <span className="text-2xl font-bold text-blue-500">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 mb-3" />
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{completedItems}/{load.items.length} itens completos</span>
              <span>•</span>
              <span>{checkedQty.toFixed(0)}/{totalQty.toFixed(0)} unidades</span>
            </div>

            {!allComplete && load.status === "IN_PROGRESS" && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-700 text-sm">
                  {load.items.length - completedItems} item(s) ainda não foram completamente verificados
                </p>
              </div>
            )}

            {allComplete && load.status === "IN_PROGRESS" && (
              <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-green-700 text-sm">
                  Todos os itens verificados! Você pode finalizar a carga.
                </p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Itens da Carga</h2>
              <span className="text-sm text-gray-500">{load.items.length} itens</span>
            </div>
            <div className="divide-y divide-gray-50">
              {load.items.map((item) => {
                const progress =
                  item.requiredQuantity > 0
                    ? Math.round((item.checkedQuantity / item.requiredQuantity) * 100)
                    : 0;
                const complete = item.checkedQuantity >= item.requiredQuantity;

                return (
                  <div key={item.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {item.product.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Código: {item.product.code} · Unidade: {item.product.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${complete ? "text-green-600" : "text-gray-900"}`}>
                          {item.checkedQuantity.toFixed(0)}
                          <span className="text-sm font-normal text-gray-400">
                            /{item.requiredQuantity.toFixed(0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{item.product.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={progress}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-gray-500 w-10 text-right">{progress}%</span>
                    </div>

                    {/* Scan records */}
                    {item.scanRecords.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-500 mb-1">Leituras registradas:</p>
                        {item.scanRecords.slice(0, 3).map((scan) => (
                          <div
                            key={scan.id}
                            className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <span className="font-mono">{scan.scannedBarcode}</span>
                            <span>·</span>
                            <span>{scan.quantity} un</span>
                            {scan.batch && (
                              <>
                                <span>·</span>
                                <span>Lote: {scan.batch.batchNumber}</span>
                              </>
                            )}
                            <span>·</span>
                            <span>{scan.operator.name}</span>
                          </div>
                        ))}
                        {item.scanRecords.length > 3 && (
                          <p className="text-xs text-gray-400 pl-3">
                            +{item.scanRecords.length - 3} leitura(s) adicionais
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Informações</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Cliente</div>
                  <div className="font-medium text-gray-900">{load.clientName}</div>
                  {load.clientDoc && (
                    <div className="text-gray-400 text-xs">{load.clientDoc}</div>
                  )}
                </div>
              </div>

              {load.operator && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Operador</div>
                    <div className="font-medium text-gray-900">{load.operator.name}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Criado em</div>
                  <div className="font-medium text-gray-900">
                    {new Date(load.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {load.startedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Iniciado em</div>
                    <div className="font-medium text-gray-900">
                      {new Date(load.startedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {load.finalizedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Finalizado em</div>
                    <div className="font-medium text-gray-900">
                      {new Date(load.finalizedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {load.manifest && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Manifesto</div>
                    <div className="font-medium text-gray-900 text-xs">{load.manifest.fileName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {load.billingEvent && (
            <div
              className={`rounded-2xl p-5 border ${
                load.billingEvent.status === "COMPLETED"
                  ? "bg-green-50 border-green-200"
                  : "bg-purple-50 border-purple-200"
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-2">Faturamento</h3>
              <div
                className={`text-sm font-medium ${
                  load.billingEvent.status === "COMPLETED"
                    ? "text-green-700"
                    : "text-purple-700"
                }`}
              >
                {load.billingEvent.status === "PENDING" && "Aguardando Faturamento"}
                {load.billingEvent.status === "PROCESSING" && "Em Processamento"}
                {load.billingEvent.status === "COMPLETED" && "Faturado"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Notificado em:{" "}
                {new Date(load.billingEvent.notifiedAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          )}

          {(load.status === "PENDING" || load.status === "IN_PROGRESS") && (
            <Link href={`/dashboard/loads/${load.id}/scan`} className="block">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12">
                <Scan className="w-4 h-4 mr-2" />
                {load.status === "PENDING" ? "Iniciar Conferência" : "Continuar Conferência"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
