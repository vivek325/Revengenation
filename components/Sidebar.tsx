"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  Home, ShieldCheck, ChevronDown, ChevronUp, PlusCircle,
  BarChart2, Users, LayoutGrid, FileText, MessageSquare,
  Flag, Tag, Megaphone, Settings, ShieldAlert, LogIn, UserPlus, User, LogOut,
} from "lucide-react";
import { getSession, logout } from "@/lib/auth";
import { getUserCommunities } from "@/lib/storage";
import type { AuthUser } from "@/lib/auth";
import type { Community } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner open={open} onClose={onClose} />
    </Suspense>
  );
}

function SidebarInner({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  useEffect(() => {
    async function load() {
      const [session, comms] = await Promise.all([getSession(), getUserCommunities()]);
      setUser(session);
      setUserCommunities(comms);
      setMounted(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (pathname === "/admin") setAdminExpanded(true);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      active
        ? "text-[#E11D48] bg-rose-50 dark:bg-[#E11D48]/10 border border-rose-100 dark:border-[#E11D48]/20"
        : "text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161B2A]"
    }`;

  const iconClass = (active: boolean) =>
    `shrink-0 ${active ? "text-[#E11D48]" : "text-slate-400 dark:text-[#475569]"}`;

  const adminTabs = [
    { tab: "overview",      Icon: BarChart2,    label: "Overview" },
    { tab: "users",         Icon: Users,        label: "Users" },
    { tab: "communities",   Icon: LayoutGrid,   label: "Communities" },
    { tab: "posts",         Icon: FileText,     label: "Posts" },
    { tab: "comments",      Icon: MessageSquare, label: "Comments" },
    { tab: "reports",       Icon: Flag,         label: "Reports" },
    { tab: "categories",    Icon: Tag,          label: "Categories" },
    { tab: "announcements", Icon: Megaphone,    label: "Announcements" },
    { tab: "settings",      Icon: Settings,     label: "Settings" },
    { tab: "security",      Icon: ShieldAlert,  label: "Security" },
  ];

  return (
    <>
      {/* Mobile backdrop — closes sidebar when tapping outside */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-white dark:bg-[#0D1117] border-r border-slate-200 dark:border-[#1C2035] flex flex-col z-40 overflow-y-auto transition-transform duration-300 ease-in-out shadow-lg shadow-slate-200/50 dark:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex-1 px-3 py-4 space-y-0.5">

        {/* Home */}
        <Link href="/" onClick={onClose} className={navLinkClass(isActive("/"))}>
          <Home size={16} className={iconClass(isActive("/"))} />
          Home
        </Link>

        {/* Admin Panel */}
        {mounted && user?.isAdmin && (
          <>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === "/admin"
                ? "text-[#E11D48] bg-rose-50 dark:bg-[#E11D48]/10 border border-rose-100 dark:border-[#E11D48]/20"
                : "text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161B2A]"
            }`}>
              <Link href="/admin" className="flex-1 flex items-center gap-3">
                <ShieldCheck size={16} className={iconClass(pathname === "/admin")} />
                Admin Panel
              </Link>
              <button
                onClick={() => setAdminExpanded((v) => !v)}
                className="text-slate-400 dark:text-[#475569] hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded"
                aria-label="toggle admin menu"
              >
                {adminExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {adminExpanded && (
              <div className="ml-4 border-l-2 border-slate-100 dark:border-[#1E2336] pl-3 space-y-0.5 mt-0.5">
                {adminTabs.map(({ tab, Icon, label }) => {
                  const active = pathname === "/admin" && (searchParams.get("tab") ?? "overview") === tab;
                  return (
                    <Link
                      key={tab}
                      href={`/admin?tab=${tab}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? "text-[#E11D48] bg-rose-50 dark:bg-[#E11D48]/10 border border-rose-100 dark:border-[#E11D48]/20"
                          : "text-slate-500 dark:text-[#475569] hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161B2A]"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-[#E11D48]" : "text-slate-400 dark:text-[#475569]"} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="my-3 border-t border-slate-100 dark:border-[#1C2035]" />
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#2A3040]">Communities</p>

        <Link href="/communities/new" className={navLinkClass(isActive("/communities/new"))}>
          <PlusCircle size={16} className={iconClass(isActive("/communities/new"))} />
          Create Community
        </Link>

        {userCommunities.length > 0 && (
          <div className="space-y-0.5 mt-1">
            {userCommunities.map((c) => {
              const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const active = pathname === `/communities/${slug}`;
              return (
                <Link
                  key={c.id}
                  href={`/communities/${slug}`}
                  onClick={onClose}
                  className={navLinkClass(active)}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: c.color + "22" }}>{c.emoji}</span>
                  <span className="truncate">{c.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="my-3 border-t border-slate-100 dark:border-[#1C2035]" />
        {mounted && user && (
          <>
            <Link href="/profile" onClick={onClose} className={navLinkClass(isActive("/profile"))}>
              <User size={16} className={iconClass(isActive("/profile"))} />
              {user.username}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-slate-600 dark:text-[#64748B] hover:text-rose-600 dark:hover:text-[#F87171] hover:bg-rose-50 dark:hover:bg-[#161B2A]"
            >
              <LogOut size={16} className="text-slate-400 dark:text-[#475569] shrink-0" />
              Log Out
            </button>
          </>
        )}
        {mounted && !user && (
          <>
            <Link href="/login" onClick={onClose} className={navLinkClass(isActive("/login"))}>
              <LogIn size={16} className={iconClass(isActive("/login"))} />
              Log In
            </Link>
            <Link href="/login?mode=signup" onClick={onClose} className={navLinkClass(false)}>
              <UserPlus size={16} className="text-slate-400 dark:text-[#475569] shrink-0" />
              Sign Up
            </Link>
          </>
        )}
      </div>

      <div className="px-4 py-4 border-t border-slate-100 dark:border-[#1C2035] shrink-0">
        <p className="text-slate-300 dark:text-[#1E2A3A] text-xs text-center">RevengeNation © 2026</p>
      </div>
    </aside>
    </>
  );
}
