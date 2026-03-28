"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, logout } from "@/lib/auth";
import { getUserCommunities } from "@/lib/storage";
import type { AuthUser } from "@/lib/auth";
import type { Community } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);

  useEffect(() => {
    setUser(getSession());
    setUserCommunities(getUserCommunities());
    setMounted(true);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
        pathname === href
          ? "text-white bg-[#1A1A28] border border-[#2A2A3E]"
          : "text-[#94A3B8] hover:text-white hover:bg-[#1A1A28]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-[#0A0A12] border-r border-[#1E1E2E] flex flex-col z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Nav links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navLink("/", "🏠  Home")}
        {mounted && user?.isAdmin && navLink("/rn-control", "⚙️  Admin Panel")}

        <div className="my-3 border-t border-[#1E1E2E]" />

        <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2A2A3E]">
          Communities
        </p>
        {navLink("/communities/new", "＋  Create Community")}

        {userCommunities.length > 0 && (
          <div className="space-y-0.5 mt-1">
            {userCommunities.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#94A3B8]"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: c.color + "33" }}
                >
                  {c.emoji}
                </span>
                <span className="truncate font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="my-3 border-t border-[#1E1E2E]" />

        {mounted && !user && (
          <>
            {navLink("/login", "🔑  Log In")}
            {navLink("/login?mode=signup", "🚀  Sign Up")}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1E1E2E] shrink-0">
        <p className="text-[#2A2A3E] text-xs text-center">RevengeNation © 2026</p>
      </div>
    </aside>
  );
}
