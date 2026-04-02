import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const manifests = await prisma.manifest.findMany({
    include: {
      loads: { select: { id: true, loadNumber: true, status: true } },
    },
    orderBy: { importedAt: "desc" },
  });

  return NextResponse.json(manifests);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    const fileName = file.name;
    const text = await file.text();

    let loads: any[] = [];

    if (fileName.endsWith(".json")) {
      loads = JSON.parse(text);
    } else if (fileName.endsWith(".csv")) {
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      loads = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i];
        });
        return obj;
      });
    } else {
      return NextResponse.json(
        { error: "Formato de arquivo não suportado. Use CSV ou JSON." },
        { status: 400 }
      );
    }

    const manifest = await prisma.manifest.create({
      data: {
        fileName,
        importedBy: (session.user as any).id,
      },
    });

    // Process loads from manifest
    const createdLoads = [];
    const errors = [];

    for (const loadData of loads) {
      try {
        const loadNumber = loadData.loadNumber || loadData.load_number || loadData.numero;
        const clientName = loadData.clientName || loadData.client_name || loadData.cliente;
        const clientDoc = loadData.clientDoc || loadData.client_doc || loadData.cnpj || loadData.cpf;

        if (!loadNumber || !clientName) {
          errors.push({ data: loadData, error: "Número da carga e cliente são obrigatórios" });
          continue;
        }

        // Check if load already exists
        const existing = await prisma.load.findUnique({
          where: { loadNumber },
        });
        if (existing) {
          errors.push({ data: loadData, error: `Carga ${loadNumber} já existe` });
          continue;
        }

        const items = loadData.items || [];

        const load = await prisma.load.create({
          data: {
            loadNumber,
            clientName,
            clientDoc,
            manifestId: manifest.id,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                requiredQuantity: parseFloat(item.requiredQuantity || item.quantidade || 1),
              })),
            },
          },
        });

        createdLoads.push(load);
      } catch (err) {
        errors.push({ data: loadData, error: String(err) });
      }
    }

    return NextResponse.json({
      manifest,
      created: createdLoads.length,
      errors,
    });
  } catch (error) {
    console.error("Manifest import error:", error);
    return NextResponse.json({ error: "Erro ao importar manifesto" }, { status: 500 });
  }
}
