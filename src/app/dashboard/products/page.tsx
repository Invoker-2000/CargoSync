"use client";

import { useState, useEffect } from "react";
import { Plus, Box, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Product {
  id: string;
  code: string;
  name: string;
  barcode?: string;
  unit: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    barcode: "",
    unit: "CX",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          barcode: form.barcode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar produto");
        return;
      }

      toast.success("Produto criado com sucesso!");
      setShowModal(false);
      setForm({ code: "", name: "", barcode: "", unit: "CX" });
      fetchProducts();
    } catch {
      toast.error("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, código ou barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-gray-200"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-lg font-medium">
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Cadastrar Produto
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Código</div>
              <div className="col-span-4">Nome</div>
              <div className="col-span-3">Código de Barras</div>
              <div className="col-span-1">Unidade</div>
              <div className="col-span-2">Cadastrado em</div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-2">
                    <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {product.code}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className="font-medium text-gray-900 text-sm">{product.name}</span>
                  </div>
                  <div className="col-span-3">
                    {product.barcode ? (
                      <span className="font-mono text-sm text-gray-600">{product.barcode}</span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm text-gray-600">{product.unit}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Código do Produto *</Label>
              <Input
                placeholder="Ex: PROD-001"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                required
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Leite Integral 1L"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                placeholder="Ex: 7891234567890"
                value={form.barcode}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                className="border-gray-200 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <select
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CX">CX - Caixa</option>
                <option value="UN">UN - Unidade</option>
                <option value="KG">KG - Quilograma</option>
                <option value="L">L - Litro</option>
                <option value="PC">PC - Peça</option>
                <option value="FD">FD - Fardo</option>
                <option value="PCT">PCT - Pacote</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 border-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
