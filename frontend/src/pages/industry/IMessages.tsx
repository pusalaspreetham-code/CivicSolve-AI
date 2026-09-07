import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MessageSquare, Users } from "lucide-react";
import * as industryService from "../../services/industryService";
import { IndustryConversationSummary, IndustryTeamMessage } from "../../types/industry";
import { useToast } from "../../context/ToastContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import ChatThread, { ChatThreadMessage } from "../../components/ChatThread";

const IMessages = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<IndustryConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [activeTeamId, setActiveTeamId] = useState<number | null>(
    searchParams.get("team") ? Number(searchParams.get("team")) : null
  );
  const [activeInfo, setActiveInfo] = useState<{ name: string; problem_title: string } | null>(null);
  const [messages, setMessages] = useState<IndustryTeamMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    try {
      const convos = await industryService.getConversations();
      setConversations(convos);
    } catch (err: any) {
      showToast(err.message || "Could not load messages.", "error");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTeamId) loadThread(activeTeamId);
  }, [activeTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadThread = async (teamId: number) => {
    setLoadingThread(true);
    try {
      const res = await industryService.getTeamMessages(teamId);
      setActiveInfo({ name: res.team.name, problem_title: res.team.problem_title });
      setMessages(res.messages);
      // Reflect read-state locally without a full reload.
      setConversations((prev) => prev.map((c) => (c.team_id === teamId ? { ...c, unread_count: 0 } : c)));
    } catch (err: any) {
      showToast(err.message || "Could not load this conversation.", "error");
      setActiveTeamId(null);
    } finally {
      setLoadingThread(false);
    }
  };

  const openConversation = (teamId: number) => {
    setActiveTeamId(teamId);
    setSearchParams({ team: String(teamId) });
  };

  const handleSend = async (text: string) => {
    if (!activeTeamId) return;
    setSending(true);
    try {
      const res = await industryService.sendTeamMessage(activeTeamId, text);
      setMessages((prev) => [...prev, res.message]);
      setConversations((prev) =>
        prev.map((c) =>
          c.team_id === activeTeamId
            ? { ...c, last_message: text, last_sender_type: "INDUSTRY", last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || "Could not send message.", "error");
    } finally {
      setSending(false);
    }
  };

  if (loadingList) return <Loading label="Loading your conversations..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 mt-1">
          Chat directly with student teams working on problems your company has adopted.
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={22} />}
          title="No conversations yet"
          description="Adopt a civic problem to start messaging the student team(s) working on it."
          action={
            <Link to="/industry/problems" className="btn-primary bg-amber-500 hover:bg-amber-600">
              Explore Problems
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {conversations.map((c) => (
              <button
                key={c.team_id}
                onClick={() => openConversation(c.team_id)}
                className={`w-full text-left px-4 py-3.5 transition hover:bg-amber-50/60 ${
                  activeTeamId === c.team_id ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={14} className="text-amber-600 shrink-0" />
                    <p className="font-bold text-sm text-slate-900 truncate">{c.team_name}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="shrink-0 text-[10px] font-bold bg-amber-500 text-white rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{c.problem_title}</p>
                {c.last_message && (
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {c.last_sender_type === "INDUSTRY" ? "You: " : ""}
                    {c.last_message}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            {activeTeamId ? (
              <ChatThread
                title={activeInfo?.name || "Team"}
                subtitle={activeInfo?.problem_title}
                messages={messages.map(
                  (m): ChatThreadMessage => ({
                    id: m.id,
                    message: m.message,
                    created_at: m.created_at,
                    fromMe: m.sender_type === "INDUSTRY",
                    authorLabel: m.sender_student_name,
                  })
                )}
                loading={loadingThread}
                sending={sending}
                onSend={handleSend}
                accent="amber"
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 text-sm">
                Select a conversation to view messages.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IMessages;
