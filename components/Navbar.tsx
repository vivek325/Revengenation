"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Menu, X, Flame, Moon, Sun, Plus, LogIn, LogOut,
  UserPlus, User, ChevronDown,
} from "lucide-react";
import { getSession, logout, getSessionSync } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { getProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Navbar({ onToggleSidebar, sidebarOpen, isDark, onToggleTheme }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    // 1. Instant: synchronously read from localStorage — shows buttons before any async
    const cached = getSessionSync();
    if (cached) {
      setUser(cached);
      setMounted(true);
    }

    async function loadSession() {
      try {
        const session = await getSession();
        if (!active) return;
        setUser(session);
        setMounted(true); // ensure mounted even when no cache exists
        if (session) {
          const p = await getProfile(session.username);
          if (active) setProfile(p);
        } else {
          setProfile(null);
        }
      } catch {
        if (active) setMounted(true);
      }
    }
    loadSession();
    // Only re-run on actual auth changes, NOT on every route navigation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadSession());
    return () => { active = false; subscription.unsubscribe(); };
  }, []); // ← empty deps: runs once on mount

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setProfileDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setProfileDropdown(false); }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setUser(null); setProfile(null); setProfileDropdown(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-[#1C2035] bg-white dark:bg-[#0D1117] shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="max-w-full px-4 h-14 flex items-center gap-3">

        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#161B2A] transition-colors shrink-0 text-slate-500 dark:text-[#8892A4] hover:text-slate-800 dark:hover:text-white"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E11D48] to-rose-700 flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-rose-900/30">
            <Flame size={16} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">
            <span className="text-slate-900 dark:text-white">Revenge</span>
            <span className="text-[#E11D48]">Nation</span>
          </span>
        </Link>

        {/* Centre tagline */}
        <div className="flex-1 flex justify-center">
          <span className="text-lg font-black tracking-widest uppercase hidden md:block">
            <span className="text-[#E11D48]">Cheating</span>
            <span className="text-slate-800 dark:text-white"> Wife</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#161B2A] transition-colors text-slate-500 dark:text-[#8892A4] hover:text-slate-800 dark:hover:text-white"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {!mounted ? null : user ? (
            <>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#E11D48] hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-rose-200 dark:shadow-rose-900/20"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Create</span>
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdown((v) => !v)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-slate-50 dark:bg-[#111520] border border-slate-200 dark:border-[#1E2336] hover:border-slate-300 dark:hover:border-[#2E3450] hover:bg-white dark:hover:bg-[#161B2A] rounded-lg transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E11D48] to-rose-700 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0 overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : profile?.avatarEmoji ? (
                      <span className="text-[10px] leading-none">{profile.avatarEmoji}</span>
                    ) : (
                      user.username[0]
                    )}
                  </div>
                  <span className="hidden sm:inline text-slate-600 dark:text-[#94A3B8] text-xs font-semibold max-w-[80px] truncate">{user.username}</span>
                  {user.isAdmin && (
                    <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-[#E11D48]/15 text-[#E11D48] border border-rose-200 dark:border-transparent">Admin</span>
                  )}
                  <ChevronDown size={12} className={`text-slate-400 dark:text-[#475569] transition-transform duration-200 ${profileDropdown ? "rotate-180" : ""}`} />
                </button>

                {profileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-[#1C2035] rounded-xl overflow-hidden shadow-xl shadow-slate-200/80 dark:shadow-black/60 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1C2035] bg-slate-50 dark:bg-[#0A0C14]">
                      <p className="text-[10px] text-slate-400 dark:text-[#475569] uppercase tracking-widest mb-0.5">Signed in as</p>
                      <p className="text-sm text-slate-800 dark:text-white font-bold truncate">{user.username}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#161B2A] transition-colors">
                      <User size={15} className="text-slate-400 dark:text-[#475569] shrink-0" />
                      View Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 dark:text-[#64748B] hover:text-rose-600 dark:hover:text-[#F87171] hover:bg-rose-50 dark:hover:bg-[#161B2A] transition-colors border-t border-slate-100 dark:border-[#1C2035]">
                      <LogOut size={15} className="shrink-0" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161B2A] transition-colors">
                <LogIn size={16} />
                Log In
              </Link>
              <Link href="/login?mode=signup" className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-rose-200 dark:shadow-rose-900/20">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
