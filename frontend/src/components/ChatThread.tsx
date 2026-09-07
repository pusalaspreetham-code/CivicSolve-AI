import { useEffect, useRef, useState } from "react";
import { Send, Loader2, X } from "lucide-react";

export interface ChatThreadMessage {
  id: number;
  message: string;
  created_at: string;
  fromMe: boolean;
  authorLabel?: string | null;
}

interface Props {
  title: string;
  subtitle?: string;
  messages: ChatThreadMessage[];
  loading: boolean;
  sending: boolean;
  onSend: (text: string) => Promise<void>;
  onClose?: () => void;
  accent?: "teal" | "amber";
}

// A small, self-contained two-way message thread. Used both by the
// Industry Portal (talking to a student team) and the Student
// Portal (talking to an adopting industry) — the caller supplies
// which side "fromMe" is and how to send.
const ChatThread = ({ title, subtitle, messages, loading, sending, onSend, onClose, accent = "teal" }: Props) => {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const accentBg = accent === "amber" ? "bg-amber-500 hover:bg-amber-600" : "bg-brand-600 hover:bg-brand-700";
  const bubbleMine = accent === "amber" ? "bg-amber-500 text-white" : "bg-brand-600 text-white";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    await onSend(text);
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <p className="font-bold text-slate-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[220px] max-h-[420px] bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-8 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.fromMe ? bubbleMine : "bg-white border border-slate-200 text-slate-800"}`}>
                {!m.fromMe && m.authorLabel && (
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">{m.authorLabel}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.message}</p>
                <p className={`text-[10px] mt-1 ${m.fromMe ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-slate-200">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          disabled={sending}
          className="flex-1 input py-2"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className={`shrink-0 h-10 w-10 rounded-lg text-white flex items-center justify-center transition disabled:opacity-50 ${accentBg}`}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

export default ChatThread;
