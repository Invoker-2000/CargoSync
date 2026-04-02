"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Truck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Load {
  id: string;
  loadNumber: string;
  clientName: string;
  clientDoc?: string;
  status: string;
  startedAt?: string;
  finalizedAt?: string;
  createdAt: string;
  items: { requiredQuantity: number; checkedQuantity: number }[];
  operator?: { name: string } | null;
  billingEvent?: { status: string } | null;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    FINALIZED: "Finalizado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
    FINALIZED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [total, setTotal] = useState(0);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/loads?${params}`);
      const data = await res.json();
      setLoads(data.loads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Erro ao carregar cargas");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const filteredLoads = loads.filter((l) =>
    search
      ? l.loadNumber.toLowerCase().includes(search.toLowerCase()) ||
        l.clientName.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargas</h1>
          <p className="text-gray-500 mt-1">{total} carga(s) cadastradas</p>
        </div>
        <Link href="/dashboard/loads/new">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nova Carga
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-10 border-gray-200">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
            <SelectItem value="FINALIZED">Finalizado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchLoads}
          className="border-gray-200 h-10"
        >
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400">Carregando cargas...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-lg font-medium">Nenhuma carga encontrada</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? "Tente outros termos de busca" : "Importe um manifesto para começar"}
            </p>
            <Link href="/dashboard/manifests">
              <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                Importar Manifesto
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Número</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Progresso</div>
              <div className="col-span-1">Itens</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredLoads.map((load) => {
                const totalQty = load.items.reduce((s, i) => s + i.requiredQuantity, 0);
                const checkedQty = load.items.reduce((s, i) => s + i.checkedQuantity, 0);
                const progress = totalQty > 0 ? Math.round((checkedQty / totalQty) * 100) : 0;

                return (
                  <Link key={load.id} href={`/dashboard/loads/${load.id}`}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors items-center cursor-pointer group">
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {load.loadNumber}
                        </span>
                        {load.billingEvent && (
                          <div className="text-xs text-purple-600 font-medium mt-0.5">
                            {load.billingEvent.status === "PENDING" && "Aguarda Faturamento"}
                            {load.billingEvent.status === "COMPLETED" && "Faturado"}
                          </div>
                        )}
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {load.clientName}
                        </div>
                        {load.clientDoc && (
                          <div className="text-xs text-gray-400">{load.clientDoc}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusBadge(load.status)}`}
                        >
                          {getStatusLabel(load.status)}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {progress}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {checkedQty.toFixed(0)} / {totalQty.toFixed(0)} un
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm text-gray-700">{load.items.length}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
