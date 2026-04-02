"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package,
  LayoutDashboard,
  Truck,
  FileUp,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/loads",
    label: "Cargas",
    icon: Truck,
  },
  {
    href: "/dashboard/manifests",
    label: "Manifestos",
    icon: FileUp,
  },
  {
    href: "/dashboard/products",
    label: "Produtos",
    icon: Box,
  },
  {
    href: "/dashboard/admin",
    label: "Faturamento",
    icon: ShieldCheck,
  },
];

export function DashboardNav({ user }: { user: NavUser }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">CargoSync</span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 mx-3 mt-3 bg-blue-50 rounded-xl">
        <div className="font-semibold text-gray-900 text-sm truncate">
          {user.name ?? "Usuário"}
        </div>
        <div className="text-gray-500 text-xs truncate">{user.email}</div>
        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          {user.role === "ADMIN"
            ? "Administrador"
            : user.role === "BILLING"
            ? "Faturamento"
            : "Operador"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
