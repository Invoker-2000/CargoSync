"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Scan,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Package,
  Layers,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface BatchSuggestion {
  batch: {
    id: string;
    batchNumber: string;
    expiryDate?: string | null;
    available: number;
  };
  suggestedQty: number;
}

interface BatchInfo {
  productId: string;
  productName: string;
  requiredQuantity: number;
  checkedQuantity: number;
  remaining: number;
  totalAvailable: number;
  sufficient: boolean;
  suggestions: BatchSuggestion[];
  allBatches: {
    id: string;
    batchNumber: string;
    expiryDate?: string | null;
    available: number;
  }[];
}

interface LoadItem {
  id: string;
  productId: string;
  requiredQuantity: number;
  checkedQuantity: number;
  status: string;
  product: { id: string; code: string; name: string; barcode?: string; unit: string };
}

interface Load {
  id: string;
  loadNumber: string;
  clientName: string;
  status: string;
  items: LoadItem[];
}

type AlertType = "success" | "error" | "warning" | "info" | null;

interface AlertState {
  type: AlertType;
  title: string;
  message: string;
}

export default function ScanPage() {
  const params = useParams();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>();
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const currentItem = load?.items[currentItemIndex];

  const fetchLoad = useCallback(async () => {
    try {
      const res = await fetch(`/api/loads/${params.id}`);
      const data = await res.json();
      setLoad(data);

      // Find first incomplete item
      const firstIncompleteIdx = data.items.findIndex(
        (i: LoadItem) => i.checkedQuantity < i.requiredQuantity
      );
      if (firstIncompleteIdx >= 0) {
        setCurrentItemIndex(firstIncompleteIdx);
      }
    } catch {
      toast.error("Erro ao carregar carga");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchBatchSuggestion = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(
        `/api/loads/${params.id}/batch-suggestion?loadItemId=${itemId}`
      );
      const data = await res.json();
      setBatchInfo(data);

      // Auto-select first suggested batch
      if (data.suggestions?.[0]?.batch?.id) {
        setSelectedBatchId(data.suggestions[0].batch.id);
        setQuantity(data.suggestions[0].suggestedQty);
      } else {
        setSelectedBatchId(undefined);
        setQuantity(1);
      }
    } catch {
      setBatchInfo(null);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLoad();
  }, [fetchLoad]);

  useEffect(() => {
    if (currentItem) {
      fetchBatchSuggestion(currentItem.id);
      // Auto-focus barcode input
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [currentItem, fetchBatchSuggestion]);

  function showAlert(type: AlertType, title: string, message: string) {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  }

  async function handleScan(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!currentItem || !barcodeValue.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/loads/${params.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: barcodeValue.trim(),
          loadItemId: currentItem.id,
          batchId: selectedBatchId,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "PRODUTO_ERRADO") {
          showAlert("error", "Produto Incorreto!", data.message);
          setBarcodeValue("");
          barcodeInputRef.current?.focus();
          return;
        }
        if (data.error === "QUANTIDADE_EXCEDIDA") {
          showAlert("warning", "Quantidade Excedida", data.message);
          setBarcodeValue("");
          return;
        }
        if (data.error === "ESTOQUE_INSUFICIENTE") {
          showAlert("warning", "Estoque Insuficiente", data.message);
          return;
        }
        if (data.error === "PRODUTO_NAO_ENCONTRADO") {
          showAlert("error", "Produto Não Encontrado", data.message);
          setBarcodeValue("");
          barcodeInputRef.current?.focus();
          return;
        }
        showAlert("error", "Erro", data.message || data.error || "Erro ao processar leitura");
        setBarcodeValue("");
        return;
      }

      if (data.warning) {
        showAlert("warning", "Atenção", data.warning);
      } else {
        showAlert("success", "Leitura Registrada", `${data.quantityAdded} unidade(s) registrada(s)`);
      }

      setBarcodeValue("");

      // Refresh load data
      const updatedRes = await fetch(`/api/loads/${params.id}`);
      const updatedLoad = await updatedRes.json();
      setLoad(updatedLoad);

      // Update current item
      const updatedItem = updatedLoad.items[currentItemIndex];

      // Check if current item is now complete and suggest moving to next
      if (updatedItem && updatedItem.checkedQuantity >= updatedItem.requiredQuantity) {
        // Item complete - check if there's a next item
        const nextIncompleteIdx = updatedLoad.items.findIndex(
          (i: LoadItem, idx: number) =>
            idx !== currentItemIndex && i.checkedQuantity < i.requiredQuantity
        );

        if (nextIncompleteIdx >= 0) {
          setTimeout(() => {
            setCurrentItemIndex(nextIncompleteIdx);
            showAlert(
              "info",
              "Item Completo!",
              `Avançando para o próximo item: ${updatedLoad.items[nextIncompleteIdx].product.name}`
            );
          }, 1000);
        } else {
          // All items complete
          showAlert(
            "success",
            "Todos os Itens Verificados!",
            "Você pode finalizar a carga agora."
          );
        }
      } else {
        // Refresh batch suggestion for current item
        await fetchBatchSuggestion(currentItem.id);
      }

      barcodeInputRef.current?.focus();
    } catch {
      showAlert("error", "Erro", "Falha na comunicação com o servidor");
    } finally {
      setProcessing(false);
    }
  }

  // Handle Enter key on barcode input
  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!load) return <div>Carga não encontrada</div>;

  const completedItems = load.items.filter(
    (i) => i.checkedQuantity >= i.requiredQuantity
  ).length;
  const overallProgress =
    load.items.length > 0
      ? Math.round((completedItems / load.items.length) * 100)
      : 0;

  const remaining = currentItem
    ? currentItem.requiredQuantity - currentItem.checkedQuantity
    : 0;
  const itemProgress = currentItem
    ? Math.round(
        (currentItem.checkedQuantity / currentItem.requiredQuantity) * 100
      )
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/loads/${params.id}`}>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Conferência: {load.loadNumber}
            </h1>
            <p className="text-gray-500 text-sm">{load.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {completedItems}/{load.items.length} itens completos
          </span>
          <div className="w-32">
            <Progress value={overallProgress} className="h-2" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{overallProgress}%</span>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${
            alert.type === "success"
              ? "bg-green-50 border-green-200"
              : alert.type === "error"
              ? "bg-red-50 border-red-200"
              : alert.type === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          {alert.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
          {alert.type === "error" && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
          {alert.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
          {alert.type === "info" && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
          <div>
            <div
              className={`font-semibold text-sm ${
                alert.type === "success"
                  ? "text-green-800"
                  : alert.type === "error"
                  ? "text-red-800"
                  : alert.type === "warning"
                  ? "text-yellow-800"
                  : "text-blue-800"
              }`}
            >
              {alert.title}
            </div>
            <div
              className={`text-sm ${
                alert.type === "success"
                  ? "text-green-700"
                  : alert.type === "error"
                  ? "text-red-700"
                  : alert.type === "warning"
                  ? "text-yellow-700"
                  : "text-blue-700"
              }`}
            >
              {alert.message}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Scan Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Item */}
          {currentItem ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Item {currentItemIndex + 1} de {load.items.length}
                  </span>
                  {currentItem.checkedQuantity >= currentItem.requiredQuantity && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completo
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentItemIndex(Math.max(0, currentItemIndex - 1))
                    }
                    disabled={currentItemIndex === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentItemIndex(
                        Math.min(load.items.length - 1, currentItemIndex + 1)
                      )
                    }
                    disabled={currentItemIndex === load.items.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentItem.product.name}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Código: {currentItem.product.code}
                {currentItem.product.barcode && ` · Barcode: ${currentItem.product.barcode}`}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentItem.requiredQuantity.toFixed(0)}
                  </div>
                  <div className="text-xs text-blue-500 font-medium">Necessário</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentItem.checkedQuantity.toFixed(0)}
                  </div>
                  <div className="text-xs text-green-500 font-medium">Conferido</div>
                </div>
                <div
                  className={`rounded-xl p-4 text-center ${
                    remaining <= 0 ? "bg-gray-50" : "bg-orange-50"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      remaining <= 0 ? "text-gray-400" : "text-orange-600"
                    }`}
                  >
                    {Math.max(0, remaining).toFixed(0)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      remaining <= 0 ? "text-gray-400" : "text-orange-500"
                    }`}
                  >
                    Restante
                  </div>
                </div>
              </div>

              <Progress value={itemProgress} className="h-3 mb-4" />

              {/* Barcode Scan Input */}
              {currentItem.checkedQuantity < currentItem.requiredQuantity && (
                <form onSubmit={handleScan} className="space-y-3">
                  <div className="relative">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Escaneie ou digite o código de barras..."
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      className="pl-10 h-14 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Quantidade</label>
                      <Input
                        type="number"
                        min="1"
                        max={remaining}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="h-10 border-gray-200"
                      />
                    </div>

                    {batchInfo && batchInfo.allBatches.length > 0 && (
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Lote</label>
                        <select
                          value={selectedBatchId ?? ""}
                          onChange={(e) => setSelectedBatchId(e.target.value || undefined)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Sem lote</option>
                          {batchInfo.allBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber}
                              {b.expiryDate
                                ? ` (Val: ${new Date(b.expiryDate).toLocaleDateString("pt-BR")})`
                                : ""}
                              · Disp: {b.available}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex-shrink-0 mt-5">
                      <Button
                        type="submit"
                        disabled={processing || !barcodeValue.trim()}
                        className="h-10 bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-xl"
                      >
                        {processing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Confirmar"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {currentItem.checkedQuantity >= currentItem.requiredQuantity && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Item Completo!</p>
                    <p className="text-green-700 text-sm">
                      Todas as {currentItem.requiredQuantity} unidades foram verificadas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Todos os itens verificados!
              </h2>
              <p className="text-gray-500 mb-6">
                Você pode finalizar a carga agora.
              </p>
              <Link href={`/dashboard/loads/${params.id}`}>
                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                  Ir para Detalhes da Carga
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Batch Suggestion */}
          {batchInfo && batchInfo.suggestions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Sugestão FEFO de Lotes</h3>
              </div>

              {!batchInfo.sufficient && (
                <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-red-700 text-xs font-medium">
                    Estoque insuficiente! Total disponível: {batchInfo.totalAvailable.toFixed(0)} de{" "}
                    {batchInfo.remaining.toFixed(0)} necessários.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {batchInfo.suggestions.map((s, i) => (
                  <button
                    key={s.batch.id}
                    onClick={() => {
                      setSelectedBatchId(s.batch.id);
                      setQuantity(s.suggestedQty);
                    }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedBatchId === s.batch.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-blue-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {i === 0 && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full mr-1">
                              FEFO
                            </span>
                          )}
                          Lote: {s.batch.batchNumber}
                        </div>
                        {s.batch.expiryDate && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Validade:{" "}
                            {new Date(s.batch.expiryDate).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Disponível: {s.batch.available.toFixed(0)} un
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600 text-sm">
                          {s.suggestedQty.toFixed(0)} un
                        </div>
                        <div className="text-xs text-gray-400">sugerido</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Todos os Itens</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {load.items.map((item, idx) => {
                const p =
                  item.requiredQuantity > 0
                    ? Math.round(
                        (item.checkedQuantity / item.requiredQuantity) * 100
                      )
                    : 0;
                const done = item.checkedQuantity >= item.requiredQuantity;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentItemIndex(idx)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      idx === currentItemIndex ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">
                        {item.product.name}
                      </span>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={p} className="flex-1 h-1.5" />
                      <span className="text-xs text-gray-500 w-10 text-right">{p}%</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.checkedQuantity.toFixed(0)}/{item.requiredQuantity.toFixed(0)} {item.product.unit}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Complete */}
          {completedItems === load.items.length && load.items.length > 0 && (
            <Link href={`/dashboard/loads/${params.id}`}>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar Carga
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
