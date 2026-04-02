"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Package,
  TruckIcon,
  BarChart3,
  ShieldCheck,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const carouselImages = [
  {
    url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80",
    title: "Frota de Caminhões",
    link: "https://unsplash.com/photos/logistics-trucks",
  },
  {
    url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    title: "Armazém Moderno",
    link: "https://unsplash.com/photos/warehouse",
  },
  {
    url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80",
    title: "Logística de Distribuição",
    link: "https://unsplash.com/photos/distribution-logistics",
  },
  {
    url: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&q=80",
    title: "Operações de Carregamento",
    link: "https://unsplash.com/photos/loading-operations",
  },
];

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
    title: "Verificação em Tempo Real",
    description:
      "Leitura de código de barras com validação instantânea. Alerta imediato para produto incorreto, quantidade excedida ou lote fora de sequência.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
    title: "Inteligência FEFO de Lotes",
    description:
      "Sistema automatizado de sugestão de lotes por data de vencimento (FEFO). Troca automática de lote quando o limite é atingido, garantindo rastreabilidade total.",
  },
  {
    icon: <TruckIcon className="w-8 h-8 text-blue-500" />,
    title: "Gestão Completa de Cargas",
    description:
      "Controle total do ciclo: importação de manifesto, conferência item a item, finalização automática e disparo de evento de faturamento.",
  },
];

const stats = [
  { value: "99.8%", label: "Precisão de Conferência" },
  { value: "3x", label: "Mais Rápido que Manual" },
  { value: "100%", label: "Rastreabilidade de Lotes" },
  { value: "0", label: "Erros de Faturamento" },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index === 0 ? -60 : index === 2 ? 60 : 0, y: index === 1 ? 40 : 0 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="mb-4 p-3 bg-blue-50 rounded-xl w-fit">{feature.icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CargoSync</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Plataforma de Verificação Logística
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Controle Total do{" "}
              <span className="text-blue-400">Seu Carregamento</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Sistema inteligente de verificação de cargas com leitura de código de barras,
              controle de lotes FEFO e faturamento automático. Elimine erros e aumente
              a eficiência operacional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-blue-500/30"
                >
                  Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6 rounded-xl"
                >
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-white/60 text-sm flex flex-col items-center gap-2"
          >
            <span>Rolar para baixo</span>
            <div className="w-0.5 h-8 bg-white/30 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Soluções para Toda a Cadeia Logística
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Da expedição ao faturamento, automatize cada etapa do seu processo logístico
            </p>
          </motion.div>

          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselImages.map((image, idx) => (
                <a
                  key={idx}
                  href={image.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-full relative block"
                >
                  <div className="relative h-96 md:h-[500px]">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-8 left-8 text-white">
                      <h3 className="text-2xl font-bold">{image.title}</h3>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {carouselImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tecnologia a Serviço da Logística
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Funcionalidades projetadas para maximizar a precisão e minimizar o tempo de conferência
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Fluxo Completo de Ponta a Ponta
              </h2>
              <div className="space-y-4">
                {[
                  { icon: <Package className="w-5 h-5" />, text: "Importação de manifesto via CSV ou JSON" },
                  { icon: <ShieldCheck className="w-5 h-5" />, text: "Verificação item a item com código de barras" },
                  { icon: <Clock className="w-5 h-5" />, text: "Sugestão automática de lote por FEFO" },
                  { icon: <BarChart3 className="w-5 h-5" />, text: "Dashboard de KPIs em tempo real" },
                  { icon: <Users className="w-5 h-5" />, text: "Múltiplos perfis: Admin, Operador, Faturamento" },
                  { icon: <TruckIcon className="w-5 h-5" />, text: "Disparo automático de evento de faturamento" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/auth/register">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl">
                    Começar Gratuitamente <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-sm text-gray-500">CargoSync - Verificação</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-xs text-blue-600 font-medium mb-1">CARGA ATIVA</div>
                    <div className="font-bold text-gray-900">C-2024-001 · Supermercado ABC</div>
                  </div>
                  {[
                    { name: "Leite Integral 1L", req: 100, checked: 100, done: true },
                    { name: "Iogurte Natural 500g", req: 48, checked: 32, done: false },
                    { name: "Manteiga 200g", req: 24, checked: 0, done: false },
                  ].map((item, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.done
                              ? "bg-green-100 text-green-700"
                              : item.checked > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.done ? "Completo" : item.checked > 0 ? "Em andamento" : "Pendente"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.done ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${(item.checked / item.req) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {item.checked}/{item.req}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para Transformar sua Operação?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Comece hoje mesmo. Configure em minutos, ganhe eficiência imediatamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-6 rounded-xl"
                >
                  Criar Conta Gratuita
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6 rounded-xl"
                >
                  Fazer Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CargoSync</span>
            </div>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link href="/auth/login" className="hover:text-white transition-colors">
                Entrar
              </Link>
              <Link href="/auth/register" className="hover:text-white transition-colors">
                Cadastrar
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 CargoSync. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
