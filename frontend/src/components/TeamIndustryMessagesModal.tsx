import { useEffect, useState } from "react";
import { MessageSquare, Building2, X } from "lucide-react";
import * as teamService from "../services/teamService";
import { TeamIndustryConversationSummary, TeamIndustryMessage } from "../types/team";
import { useToast } from "../context/ToastContext";
import ChatThread, { ChatThreadMessage } from "./ChatThread";

interface Props {
  teamId: number;
  teamName: string;
  onClose: () => void;
  onUnreadChange?: (teamId: number, totalUnread: number) => void;
}

const TeamIndustryMessagesModal = ({ teamId, teamName, onClose, onUnreadChange }: Props) => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<TeamIndustryConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [activeIndustryId, setActiveIndustryId] = useState<number | null>(null);
  const [activeCompanyName, setActiveCompanyName] = useState<string>("");
  const [messages, setMessages] = useState<TeamIndustryMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    try {
      const convos = await teamService.getTeamIndustryConversations(teamId);
      setConversations(convos);
      onUnreadChange?.(
        teamId,
        convos.reduce((sum, c) => sum + c.unread_count, 0)
      );
    } catch (err: any) {
      showToast(err.message || "Could not load industry messages.", "error");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openConversation = async (industryId: number, companyName: string) => {
    setActiveIndustryId(industryId);
    setActiveCompanyName(companyName);
    setLoadingThread(true);
    try {
      const res = await teamService.getTeamIndustryMessages(teamId, industryId);
      setMessages(res.messages);
      setConversations((prev) => prev.map((c) => (c.industry_id === industryId ? { ...c, unread_count: 0 } : c)));
    } catch (err: any) {
      showToast(err.message || "Could not load this conversation.", "error");
      setActiveIndustryId(null);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!activeIndustryId) return;
    setSending(true);
    try {
      const res = await teamService.sendTeamIndustryMessage(teamId, activeIndustryId, text);
      setMessages((prev) => [...prev, res.message]);
      setConversations((prev) =>
        prev.map((c) =>
          c.industry_id === activeIndustryId
            ? { ...c, last_message: text, last_sender_type: "STUDENT", last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || "Could not send message.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Industry Messages</h2>
            <p className="text-xs text-slate-500">{teamName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {loadingList ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="mx-auto text-slate-300 mb-2" size={28} />
              <p className="text-sm font-semibold text-slate-700">No industry partners yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Once a company adopts this problem, you'll be able to message them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] h-full min-h-[320px]">
              <div className="border-r border-slate-100 overflow-y-auto divide-y divide-slate-100">
                {conversations.map((c) => (
                  <button
                    key={c.industry_id}
                    onClick={() => openConversation(c.industry_id, c.company_name)}
                    className={`w-full text-left px-3.5 py-3 transition hover:bg-brand-50/60 ${
                      activeIndustryId === c.industry_id ? "bg-brand-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <Building2 size={13} className="text-brand-600 shrink-0" />
                        {c.company_name}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="shrink-0 text-[10px] font-bold bg-brand-600 text-white rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 capitalize">{c.sector}</p>
                  </button>
                ))}
              </div>

              <div className="min-h-0">
                {activeIndustryId ? (
                  <ChatThread
                    title={activeCompanyName}
                    messages={messages.map(
                      (m): ChatThreadMessage => ({
                        id: m.id,
                        message: m.message,
                        created_at: m.created_at,
                        fromMe: m.sender_type === "STUDENT",
                        authorLabel: m.sender_type === "STUDENT" ? m.sender_student_name : activeCompanyName,
                      })
                    )}
                    loading={loadingThread}
                    sending={sending}
                    onSend={handleSend}
                    accent="teal"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[280px] text-slate-400 text-sm px-4 text-center">
                    <span className="inline-flex items-center gap-2">
                      <MessageSquare size={16} /> Select a company to view messages
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamIndustryMessagesModal;
