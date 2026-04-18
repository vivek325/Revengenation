"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  Home, ShieldCheck, ChevronDown, ChevronUp, PlusCircle,
  BarChart2, Users, LayoutGrid, FileText, MessageSquare,
  Flag, Tag, Megaphone, Settings, ShieldAlert, Globe,
} from "lucide-react";
import { getSession, getSessionSync } from "@/lib/auth";
import { getUserCommunities } from "@/lib/storage";
import type { AuthUser } from "@/lib/auth";
import type { Community } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: "en",    label: "English",    native: "English",    flag: "🇺🇸" },
  { code: "hi",    label: "Hindi",      native: "हिन्दी",     flag: "🇮🇳" },
  { code: "bn",    label: "Bengali",    native: "বাংলা",      flag: "🇮🇳" },
  { code: "ta",    label: "Tamil",      native: "தமிழ்",      flag: "🇮🇳" },
  { code: "te",    label: "Telugu",     native: "తెలుగు",     flag: "🇮🇳" },
  { code: "mr",    label: "Marathi",    native: "मराठी",      flag: "🇮🇳" },
  { code: "gu",    label: "Gujarati",   native: "ગુજરાતી",    flag: "🇮🇳" },
  { code: "pa",    label: "Punjabi",    native: "ਪੰਜਾਬੀ",    flag: "🇮🇳" },
  { code: "es",    label: "Spanish",    native: "Español",    flag: "🇪🇸" },
  { code: "fr",    label: "French",     native: "Français",   flag: "🇫🇷" },
  { code: "de",    label: "German",     native: "Deutsch",    flag: "🇩🇪" },
  { code: "ar",    label: "Arabic",     native: "العربية",    flag: "🇸🇦" },
  { code: "pt",    label: "Portuguese", native: "Português",  flag: "🇧🇷" },
  { code: "ru",    label: "Russian",    native: "Русский",    flag: "🇷🇺" },
  { code: "zh-CN", label: "Chinese",    native: "中文",       flag: "🇨🇳" },
  { code: "ja",    label: "Japanese",   native: "日本語",     flag: "🇯🇵" },
  { code: "ko",    label: "Korean",     native: "한국어",     flag: "🇰🇷" },
];

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
  // Initialize synchronously from localStorage — no async wait before first render
  const [user, setUser] = useState<AuthUser | null>(() =>
    typeof window !== "undefined" ? getSessionSync() : null
  );
  // mounted=true on client immediately — avoids SSR hydration mismatch only
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("en");
  const langRef = useRef<HTMLDivElement>(null);

  // Read active lang from localStorage on mount and re-apply if non-English
  useEffect(() => {
    const saved = localStorage.getItem("rn-lang") ?? "en";
    setActiveLang(saved);

    if (saved === "en") {
      // Clear any leftover googtrans cookie so page stays English
      const exp = new Date(0).toUTCString();
      document.cookie = `googtrans=; expires=${exp}; path=/`;
      document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${location.hostname}`;
      return;
    }

    // Re-apply saved language once Google Translate widget is ready
    let attempts = 0;
    const applyOnLoad = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doGT = (window as any).doGTranslate;
      if (typeof doGT === "function") { doGT(`en|${saved}`); return; }
      const sel = document.querySelector("select.goog-te-combo") as HTMLSelectElement | null;
      if (sel) { sel.value = saved; sel.dispatchEvent(new Event("change", { bubbles: true })); return; }
      if (++attempts < 20) setTimeout(applyOnLoad, 500);
    };
    applyOnLoad();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeLang = (code: string) => {
    setLangOpen(false);
    setActiveLang(code);
    localStorage.setItem("rn-lang", code);

    let attempts = 0;
    const tryApply = () => {
      // Option 1: Google's own exposed function (most reliable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doGT = (window as any).doGTranslate;
      if (typeof doGT === "function") {
        doGT(code === "en" ? "en|en" : `en|${code}`);
        return;
      }
      // Option 2: manipulate the hidden select Google Translate creates
      const select = document.querySelector("select.goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = code === "en" ? "" : code;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
      // Retry up to 20 times (10 seconds) while widget loads
      attempts++;
      if (attempts < 20) {
        setTimeout(tryApply, 500);
        return;
      }
      // Hard fallback: cookie + page reload
      const host = location.hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1";
      const exp = new Date(0).toUTCString();
      document.cookie = `googtrans=; expires=${exp}; path=/`;
      if (!isLocal) document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${host}`;
      if (code !== "en") {
        document.cookie = `googtrans=/en/${code}; path=/`;
        if (!isLocal) document.cookie = `googtrans=/en/${code}; path=/; domain=.${host}`;
      }
      location.reload();
    };
    tryApply();
  };

  useEffect(() => {
    // Confirm session in background (updates if cache stale)
    getSession().then((session) => {
      setUser(session);
      setMounted(true);
    }).catch(() => setMounted(true));
    // Communities load separately — doesn't block auth UI
    getUserCommunities().then((comms) => setUserCommunities(comms));
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

        {/* Language Selector */}
        <div ref={langRef} className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161B2A]"
          >
            <Globe size={16} className="shrink-0 text-slate-400 dark:text-[#475569]" />
            <span className="flex-1 text-left">
              {LANGUAGES.find((l) => l.code === activeLang)?.flag}{" "}
              {LANGUAGES.find((l) => l.code === activeLang)?.native ?? "English"}
            </span>
            {langOpen ? <ChevronUp size={14} className="shrink-0 text-slate-400" /> : <ChevronDown size={14} className="shrink-0 text-slate-400" />}
          </button>

          {langOpen && (
            <div className="absolute left-0 right-0 mt-1 z-50 bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLang(lang.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      activeLang === lang.code
                        ? "bg-rose-50 dark:bg-[#E11D48]/10 text-[#E11D48] font-semibold"
                        : "text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#161B2A] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="text-base w-5 text-center">{lang.flag}</span>
                    <span className="flex-1 text-left">{lang.native}</span>
                    <span className="text-[10px] text-slate-400 dark:text-[#475569]">{lang.label}</span>
                    {activeLang === lang.code && <span className="text-[#E11D48] text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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

      </div>

      <div className="px-4 py-4 border-t border-slate-100 dark:border-[#1C2035] shrink-0 space-y-1.5">
        {/* Row 1 */}
        <div className="flex items-center justify-center gap-2">
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/about", label: "About" },
            { href: "/disclaimer", label: "Disclaimer" },
          ].map((link, i, arr) => (
            <span key={link.href} className="flex items-center gap-2">
              <Link
                href={link.href}
                onClick={onClose}
                className="text-[11px] font-semibold text-slate-500 dark:text-[#475569] hover:text-[#E11D48] dark:hover:text-[#E11D48] transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
              {i < arr.length - 1 && <span className="text-slate-300 dark:text-[#2A3040] text-[10px]">·</span>}
            </span>
          ))}
        </div>
        {/* Row 2 */}
        <div className="flex items-center justify-center gap-2">
          {[
            { href: "/terms", label: "Terms & Conditions" },
            { href: "/contact", label: "Contact Us" },
          ].map((link, i, arr) => (
            <span key={link.href} className="flex items-center gap-2">
              <Link
                href={link.href}
                onClick={onClose}
                className="text-[11px] font-semibold text-slate-500 dark:text-[#475569] hover:text-[#E11D48] dark:hover:text-[#E11D48] transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
              {i < arr.length - 1 && <span className="text-slate-300 dark:text-[#2A3040] text-[10px]">·</span>}
            </span>
          ))}
        </div>
        <p className="text-slate-300 dark:text-[#1E2A3A] text-xs text-center">RevengeNation © 2026</p>
      </div>
    </aside>
    </>
  );
}
