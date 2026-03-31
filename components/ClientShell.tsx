"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  // Default closed on mobile (< 768px), open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Set sidebar open on desktop only
    if (window.innerWidth >= 768) setSidebarOpen(true);

    const saved = localStorage.getItem("rn-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("rn-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("rn-theme", "light");
    }
  };

  return (
    <>
      <Navbar
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 min-w-0 transition-[margin] duration-300 ease-in-out ${sidebarOpen ? "md:ml-64" : "ml-0"}`}>
          {children}
        </main>
      </div>
    </>
  );
}
