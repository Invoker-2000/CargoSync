"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export default function NewLoadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    loadNumber: "",
    clientName: "",
    clientDoc: "",
  });
  const [items, setItems] = useState([{ productId: "", requiredQuantity: 1 }]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => toast.error("Erro ao carregar produtos"));
  }, []);

  function addItem() {
    setItems((prev) => [...prev, { productId: "", requiredQuantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, key: string, value: any) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validItems = items.filter((i) => i.productId && i.requiredQuantity > 0);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item à carga");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: validItems.map((i) => ({
            productId: i.productId,
            requiredQuantity: Number(i.requiredQuantity),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar carga");
        return;
      }

      toast.success("Carga criada com sucesso!");
      router.push(`/dashboard/loads/${data.id}`);
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/loads">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Carga</h1>
          <p className="text-gray-500 text-sm">Cadastre uma nova carga manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Dados da Carga</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número da Carga *</Label>
              <Input
                placeholder="Ex: C-2024-001"
                value={form.loadNumber}
                onChange={(e) => setForm((p) => ({ ...p, loadNumber: e.target.value }))}
                required
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input
                placeholder="Ex: Supermercado ABC"
                value={form.clientName}
                onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                required
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>CNPJ/CPF do Cliente</Label>
              <Input
                placeholder="Ex: 12.345.678/0001-99"
                value={form.clientDoc}
                onChange={(e) => setForm((p) => ({ ...p, clientDoc: e.target.value }))}
                className="border-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Itens da Carga</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-gray-500">Produto</Label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-xs text-gray-500">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.requiredQuantity}
                    onChange={(e) => updateItem(index, "requiredQuantity", e.target.value)}
                    className="h-10 border-gray-200"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 h-10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <p className="text-yellow-700 text-sm">
                Nenhum produto cadastrado.{" "}
                <Link href="/dashboard/products" className="font-semibold underline">
                  Cadastrar produtos
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/loads">
            <Button variant="outline" className="border-gray-200">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Carga"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
