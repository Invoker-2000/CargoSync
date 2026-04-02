"use client";

import { useState, useEffect, useRef } from "react";
import { FileUp, Upload, CheckCircle2, Clock, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Manifest {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  loads: { id: string; loadNumber: string; status: string }[];
}

const exampleCSV = `loadNumber,clientName,clientDoc
C-2024-001,Supermercado ABC,12.345.678/0001-99
C-2024-002,Distribuidora XYZ,98.765.432/0001-11`;

const exampleJSON = `[
  {
    "loadNumber": "C-2024-001",
    "clientName": "Supermercado ABC",
    "clientDoc": "12.345.678/0001-99",
    "items": []
  }
]`;

export default function ManifestsPage() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchManifests();
  }, []);

  async function fetchManifests() {
    try {
      const res = await fetch("/api/manifests");
      const data = await res.json();
      setManifests(data);
    } catch {
      toast.error("Erro ao carregar manifestos");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".json")) {
      toast.error("Formato inválido. Use CSV ou JSON.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/manifests", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao importar manifesto");
        return;
      }

      toast.success(
        `Manifesto importado! ${data.created} carga(s) criada(s)${
          data.errors?.length ? `, ${data.errors.length} erro(s)` : ""
        }`
      );

      fetchManifests();
    } catch {
      toast.error("Erro ao importar manifesto");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function downloadExample(type: "csv" | "json") {
    const content = type === "csv" ? exampleCSV : exampleJSON;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exemplo-manifesto.${type}`;
    a.click();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importação de Manifestos</h1>
        <p className="text-gray-500 mt-1">
          Importe cargas em lote via arquivo CSV ou JSON
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div>
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 font-medium">Processando manifesto...</p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileUp className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Arraste o arquivo aqui
              </h3>
              <p className="text-gray-500 mb-4">
                ou clique para selecionar um arquivo CSV ou JSON
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <p className="text-xs text-gray-400 mt-3">
                Formatos suportados: .csv, .json · Tamanho máximo: 10MB
              </p>
            </div>
          )}
        </div>

        {/* Format Examples */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700 text-sm">Formato CSV</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadExample("csv")}
                className="text-blue-500 hover:text-blue-600 h-7 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar exemplo
              </Button>
            </div>
            <pre className="text-xs text-gray-500 font-mono overflow-x-auto whitespace-pre-wrap">
              {exampleCSV}
            </pre>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700 text-sm">Formato JSON</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadExample("json")}
                className="text-blue-500 hover:text-blue-600 h-7 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar exemplo
              </Button>
            </div>
            <pre className="text-xs text-gray-500 font-mono overflow-x-auto whitespace-pre-wrap">
              {exampleJSON}
            </pre>
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Histórico de Importações</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : manifests.length === 0 ? (
          <div className="p-12 text-center">
            <FileUp className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">Nenhum manifesto importado ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {manifests.map((manifest) => (
              <div key={manifest.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileUp className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {manifest.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        Importado em{" "}
                        {new Date(manifest.importedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {manifest.loads.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {manifest.loads.map((l) => (
                          <span
                            key={l.id}
                            className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                          >
                            {l.loadNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{manifest.loads.length} carga(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
