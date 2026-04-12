"use client";

import { useState, useRef, useEffect, useCallback, RefObject } from "react";
import { Link2 } from "lucide-react";

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
}

export default function RichTextareaToolbar({ textareaRef, value, onChange }: Props) {
  const [linkMode, setLinkMode] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const savedSel = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  // keep a stable ref to current value to use inside event listener
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  /** Select the word (or token) at the given cursor position */
  const selectWordAt = useCallback((ta: HTMLTextAreaElement, pos: number) => {
    const text = ta.value;
    let start = pos;
    let end = pos;
    // expand left over word chars
    while (start > 0 && /\S/.test(text[start - 1])) start--;
    // expand right over word chars
    while (end < text.length && /\S/.test(text[end])) end++;
    if (start === end) return null; // clicked on whitespace
    ta.setSelectionRange(start, end);
    return { start, end };
  }, []);

  const openUrlInput = useCallback((sel: { start: number; end: number }) => {
    savedSel.current = sel;
    setShowInput(true);
    setUrl("");
    setUrlError("");
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  /** Click handler attached to textarea when link mode is active */
  const handleTextareaClick = useCallback((e: MouseEvent) => {
    const ta = e.currentTarget as HTMLTextAreaElement;
    // short delay so browser updates selectionStart after click
    setTimeout(() => {
      const pos = ta.selectionStart;
      const sel = selectWordAt(ta, pos);
      if (!sel) return;
      openUrlInput(sel);
    }, 0);
  }, [selectWordAt, openUrlInput]);

  // Attach / detach click listener based on link mode
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (linkMode) {
      ta.style.cursor = "pointer";
      ta.title = "Click any word to add a link";
      ta.addEventListener("click", handleTextareaClick);
    } else {
      ta.style.cursor = "";
      ta.title = "";
      ta.removeEventListener("click", handleTextareaClick);
    }
    return () => {
      ta.style.cursor = "";
      ta.removeEventListener("click", handleTextareaClick);
    };
  }, [linkMode, textareaRef, handleTextareaClick]);

  // Exit link mode when URL input is dismissed
  const exitLinkMode = useCallback(() => {
    setLinkMode(false);
    setShowInput(false);
    setUrl("");
    setUrlError("");
    const ta = textareaRef.current;
    if (ta) { ta.style.cursor = ""; ta.title = ""; }
  }, [textareaRef]);

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (linkMode) {
      // toggle off
      exitLinkMode();
      return;
    }
    // If text is already selected, open URL input immediately
    const ta = textareaRef.current;
    if (ta && ta.selectionStart !== ta.selectionEnd) {
      savedSel.current = { start: ta.selectionStart, end: ta.selectionEnd };
      setLinkMode(true);
      openUrlInput(savedSel.current);
    } else {
      // activate link mode: next textarea click selects word
      setLinkMode(true);
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  };

  const insertLink = () => {
    const raw = url.trim();
    if (!raw || !/^https?:\/\/.+\..+/.test(raw)) {
      setUrlError("Enter a valid https:// URL");
      return;
    }
    const { start, end } = savedSel.current;
    const selectedText = valueRef.current.slice(start, end) || "link text";
    const markdown = `[${selectedText}](${raw})`;
    const newValue = valueRef.current.slice(0, start) + markdown + valueRef.current.slice(end);
    onChange(newValue);
    exitLinkMode();
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const pos = start + markdown.length;
      ta.setSelectionRange(pos, pos);
    }, 10);
  };

  return (
    <div className="flex items-center gap-2 mb-1 min-h-[28px]">
      <button
        type="button"
        onMouseDown={handleButtonMouseDown}
        title={linkMode ? "Link mode ON — click a word in the text" : "Add link (select text or click to activate link mode)"}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors border ${
          linkMode
            ? "bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/30 font-semibold"
            : "text-slate-400 dark:text-[#64748B] hover:text-[#E11D48] hover:bg-[#E11D48]/10 border-transparent hover:border-[#E11D48]/20"
        }`}
      >
        <Link2 size={12} />
        <span>{linkMode && !showInput ? "Click a word…" : "Link"}</span>
      </button>

      {showInput && (
        <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-1 duration-100">
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); insertLink(); }
              if (e.key === "Escape") exitLinkMode();
            }}
            placeholder="https://example.com"
            className={`flex-1 px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-[#0F0F18] text-slate-800 dark:text-[#E2E8F0] outline-none transition-colors ${
              urlError
                ? "border-red-400 dark:border-red-500"
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
            onClick={exitLinkMode}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
