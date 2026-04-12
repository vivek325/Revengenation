"use client";

import { useState, useRef, RefObject } from "react";
import { Link2 } from "lucide-react";

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
}

export default function RichTextareaToolbar({ textareaRef, value, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const savedSel = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    // Prevent textarea from losing focus/selection
    e.preventDefault();
    const ta = textareaRef.current;
    if (ta) savedSel.current = { start: ta.selectionStart, end: ta.selectionEnd };
    setShowInput(true);
    setUrl("");
    setUrlError("");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const insertLink = () => {
    const raw = url.trim();
    // Security: only allow http/https URLs
    if (!raw || !/^https?:\/\/.+\..+/.test(raw)) {
      setUrlError("Enter a valid https:// URL");
      return;
    }
    const { start, end } = savedSel.current;
    const selectedText = value.slice(start, end) || "link text";
    const markdown = `[${selectedText}](${raw})`;
    const newValue = value.slice(0, start) + markdown + value.slice(end);
    onChange(newValue);
    setShowInput(false);
    setUrl("");
    setUrlError("");
    // Restore focus + cursor position to textarea
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const pos = start + markdown.length;
      ta.setSelectionRange(pos, pos);
    }, 10);
  };

  const cancel = () => {
    setShowInput(false);
    setUrl("");
    setUrlError("");
    textareaRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 mb-1 min-h-[28px]">
      <button
        type="button"
        onMouseDown={handleButtonMouseDown}
        title="Select text then click to add a link"
        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 dark:text-[#64748B] hover:text-[#E11D48] hover:bg-[#E11D48]/10 rounded-md transition-colors border border-transparent hover:border-[#E11D48]/20"
      >
        <Link2 size={12} />
        <span>Link</span>
      </button>

      {showInput && (
        <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-1 duration-100">
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); insertLink(); }
              if (e.key === "Escape") cancel();
            }}
            placeholder="https://example.com"
            className={`flex-1 px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-[#0F0F18] text-slate-800 dark:text-[#E2E8F0] outline-none transition-colors ${
              urlError
                ? "border-red-400 dark:border-red-500 focus:border-red-400"
                : "border-slate-200 dark:border-[#1E1E2E] focus:border-[#E11D48]"
            }`}
          />
          {urlError && <span className="text-[10px] text-red-400 shrink-0">{urlError}</span>}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertLink}
            className="px-2.5 py-1 text-xs bg-[#E11D48] hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0 font-semibold"
          >
            Add
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
