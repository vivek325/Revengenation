"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getSession, logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { getProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/storage"

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    if (session) setProfile(getProfile(session.username));
    else setProfile(null);
    setMounted(true);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setProfileDropdown(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileDropdown(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#1E1E2E] bg-[#08080E]/95 backdrop-blur-md">
        <div className="max-w-full px-4 h-14 flex items-center gap-4">
          {/* Hamburger / sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-[#1A1A28] transition-colors shrink-0"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? (
              <>
                <span className="block w-5 h-0.5 bg-[#94A3B8] rounded-full rotate-45 translate-y-[7px]" />
                <span className="block w-5 h-0.5 bg-[#94A3B8] rounded-full opacity-0" />
                <span className="block w-5 h-0.5 bg-[#94A3B8] rounded-full -rotate-45 -translate-y-[7px]" />
              </>
            ) : (
              <>
                <span className="block w-5 h-0.5 bg-[#94A3B8] rounded-full" />
                <span className="block w-5 h-0.5 bg-[#94A3B8] rounded-full" />
                <span className="block w-3.5 h-0.5 bg-[#94A3B8] rounded-full self-start ml-[5px]" />
              </>
            )}
          </button>

          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                </svg>
              </div>
              <span className="font-black text-xl tracking-tight">
                <span className="text-white">Revenge</span>
                <span className="text-[#E11D48]">Nation</span>
              </span>
            </Link>
          </div>

          <div className="flex-1 flex justify-center">
            <span className="text-xl font-black tracking-widest uppercase">
              <span className="text-[#E11D48]">Cheating</span>
              <span className="text-white"> Wife</span>
            </span>
          </div>

          {/* Desktop auth area */}
          <div className="flex items-center gap-2">
            {!mounted ? null : user ? (
              <>
                {!user.isAdmin && (
                  <Link
                    href="/submit"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Create
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdown((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A28] border border-[#2A2A3E] hover:border-[#3A3A4E] rounded-lg transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E11D48] to-[#7C3AED] flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0 overflow-hidden">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : profile?.avatarEmoji ? (
                        <span className="text-[10px] leading-none">{profile.avatarEmoji}</span>
                      ) : (
                        user.username[0]
                      )}
                    </div>
                    <span className="text-[#94A3B8] text-xs font-semibold max-w-[80px] truncate">{user.username}</span>
                    {user.isAdmin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E11D48]/15 text-[#E11D48]">Admin</span>
                    )}
                    <svg className={`w-3 h-3 text-[#475569] transition-transform ${profileDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-[#0F0F18] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl z-50">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white hover:bg-[#1A1A28] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#64748B] hover:text-white hover:bg-[#1A1A28] transition-colors border-t border-[#1E1E2E]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2 rounded-lg text-sm font-semibold text-[#64748B] hover:text-white hover:bg-[#1A1A28] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE1239] text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
