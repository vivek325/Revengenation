"use client";

export default function RNLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-[#F1F5F9] dark:bg-[#07090F]"
          : "flex items-center justify-center min-h-[60vh]"
      }
    >
      <div className="flex items-end gap-0">
        <span className="text-2xl font-black text-[#E11D48] tracking-tight">Revenge</span>
        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Nation</span>
        {/* Animated dots */}
        <span className="flex items-end ml-0.5 mb-0.5 gap-[3px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-[bounce_1s_ease-in-out_infinite_0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-[bounce_1s_ease-in-out_infinite_180ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-[bounce_1s_ease-in-out_infinite_360ms]" />
        </span>
      </div>
    </div>
  );
}
