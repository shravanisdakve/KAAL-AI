import { useEffect, useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { AssistantHeader } from './components/AssistantHeader.tsx';
import { UserMessage } from './components/Message.tsx';
import { GuidanceCard } from './components/GuidanceCard.tsx';
import { Composer } from './components/Composer.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { LoadingState } from './components/LoadingState.tsx';
import { ErrorState } from './components/ErrorState.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { ApiError, GuidanceSession } from './types/guidance.ts';
import {
  askGuidance,
  fetchHistory,
  fetchHistoryById,
  deleteHistoryById,
  clearAllHistory,
} from './services/api.ts';

interface LoadingRequest {
  conversationId: number | null;
  requestId: number;
}

interface PendingSubmission {
  conversationId: number | null;
  requestId: number;
  question: string;
}

export default function App() {
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<GuidanceSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Synchronized ref for active session ID to prevent stale closures in async callbacks
  const activeSessionIdRef = useRef<number | null>(null);

  // Request ownership and concurrency refs
  const requestIdRef = useRef(0);
  const guidanceAbortControllerRef = useRef<AbortController | null>(null);
  const historyRequestIdRef = useRef(0);

  // Scoped UI state
  const [loadingRequest, setLoadingRequest] = useState<LoadingRequest | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [currentError, setCurrentError] = useState<ApiError | null>(null);

  // Sidebar responsive & collapse states
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shortcuts modal
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Admin login modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Abort any active in-flight guidance request
  const abortActiveGuidance = () => {
    if (guidanceAbortControllerRef.current) {
      guidanceAbortControllerRef.current.abort();
      guidanceAbortControllerRef.current = null;
    }
  };

  // Safe history refresh that ignores stale out-of-order responses
  const refreshHistory = async () => {
    const reqId = ++historyRequestIdRef.current;
    try {
      const updatedHistory = await fetchHistory();
      if (historyRequestIdRef.current === reqId) {
        setSessions(updatedHistory);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Could not refresh history:', err);
    }
  };

  // Check window size for mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial load: fetch history from backend API
  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialData() {
      try {
        const historyData = await fetchHistory(controller.signal);
        setSessions(historyData);
        if (historyData.length > 0) {
          setActiveSession(historyData[0]);
          setActiveSessionId(historyData[0].id);
          activeSessionIdRef.current = historyData[0].id;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Could not load initial history from API:', err);
      }
    }
    loadInitialData();
    return () => {
      controller.abort();
      abortActiveGuidance();
    };
  }, []);

  // Smooth scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Select a session from history (Instant local navigation; zero network wait)
  const handleSelectSession = (id: number) => {
    if (id === activeSessionIdRef.current) {
      if (isMobile) setIsMobileSidebarOpen(false);
      return;
    }

    // 1. Abort any active guidance request from previous conversation
    abortActiveGuidance();

    // 2. Invalidate request ID to ensure no in-flight response can mutate this view
    const newReqId = ++requestIdRef.current;

    // 3. Immediately switch active session pointers and clear state
    setActiveSessionId(id);
    activeSessionIdRef.current = id;
    setCurrentError(null);
    setLoadingRequest(null);
    setPendingSubmission(null);
    if (isMobile) setIsMobileSidebarOpen(false);

    // 4. Instant local cache lookup - renders immediately without network latency
    const cached = sessions.find((s) => s.id === id);
    if (cached) {
      setActiveSession(cached);
      scrollToBottom();
      return;
    }

    // 5. Fallback fetch only if item is not found in memory (with stale protection)
    fetchHistoryById(id)
      .then((session) => {
        if (activeSessionIdRef.current === id && requestIdRef.current === newReqId) {
          setActiveSession(session);
          scrollToBottom();
        }
      })
      .catch((err) => {
        if (activeSessionIdRef.current === id && requestIdRef.current === newReqId) {
          setCurrentError(err as ApiError);
        }
      });
  };

  // Start a new conversation (Instant local UI action; zero network wait)
  const handleNewConversation = () => {
    // 1. Abort any active guidance request
    abortActiveGuidance();

    // 2. Invalidate request generation so in-flight responses cannot apply
    ++requestIdRef.current;

    // 3. Clear active session pointers
    setActiveSession(null);
    setActiveSessionId(null);
    activeSessionIdRef.current = null;

    // 4. Clear loading and pending state
    setLoadingRequest(null);
    setPendingSubmission(null);
    setCurrentError(null);

    if (isMobile) setIsMobileSidebarOpen(false);
  };

  // Delete a single conversation from history
  const handleDeleteSession = async (id: number) => {
    // If the deleted session was actively generating guidance, abort it
    if (activeSessionIdRef.current === id) {
      abortActiveGuidance();
      ++requestIdRef.current;
      setLoadingRequest(null);
      setPendingSubmission(null);
    }

    // Optimistic UI update
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);

    if (activeSessionIdRef.current === id) {
      if (remaining.length > 0) {
        setActiveSession(remaining[0]);
        setActiveSessionId(remaining[0].id);
        activeSessionIdRef.current = remaining[0].id;
      } else {
        setActiveSession(null);
        setActiveSessionId(null);
        activeSessionIdRef.current = null;
      }
    }

    try {
      await deleteHistoryById(id);
      refreshHistory();
    } catch (err) {
      console.error('Failed to delete session:', err);
      refreshHistory();
    }
  };

  // Clear all conversation history
  const handleClearAllHistory = async () => {
    abortActiveGuidance();
    ++requestIdRef.current;
    setLoadingRequest(null);
    setPendingSubmission(null);

    // Optimistic UI update
    setSessions([]);
    setActiveSession(null);
    setActiveSessionId(null);
    activeSessionIdRef.current = null;

    try {
      await clearAllHistory();
      refreshHistory();
    } catch (err) {
      console.error('Failed to clear history:', err);
      refreshHistory();
    }
  };

  // Handle Question Submission to POST /api/guidance with strict request ownership
  const handleSubmitQuestion = async (question: string) => {
    // 1. Abort any previous guidance request
    abortActiveGuidance();

    // 2. Create new AbortController for this guidance request
    const controller = new AbortController();
    guidanceAbortControllerRef.current = controller;

    // 3. Capture exact request ID and conversation context at moment of submission
    const requestId = ++requestIdRef.current;
    const conversationIdAtSubmit = activeSessionIdRef.current;

    // 4. Set scoped loading and optimistic user message
    setCurrentError(null);
    setLoadingRequest({ conversationId: conversationIdAtSubmit, requestId });
    setPendingSubmission({ conversationId: conversationIdAtSubmit, requestId, question });
    scrollToBottom();

    try {
      const updatedSession = await askGuidance(
        question,
        conversationIdAtSubmit,
        controller.signal
      );

      // 5. Strict ownership verification: apply ONLY if user is still on this exact request & conversation
      if (
        requestIdRef.current === requestId &&
        activeSessionIdRef.current === conversationIdAtSubmit
      ) {
        setActiveSession(updatedSession);
        setActiveSessionId(updatedSession.id);
        activeSessionIdRef.current = updatedSession.id;
        setLoadingRequest(null);
        setPendingSubmission(null);

        // Optimistically update sessions list immediately
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === updatedSession.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedSession;
            return copy;
          }
          return [updatedSession, ...prev];
        });

        refreshHistory();
        scrollToBottom();
      } else {
        // User navigated away; safely update sessions cache in background
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === updatedSession.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedSession;
            return copy;
          }
          return [updatedSession, ...prev];
        });
        refreshHistory();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // Request was cancelled due to conversation switch or new chat; silently ignore
        return;
      }

      // Only display error if user is still on this exact request and conversation
      if (
        requestIdRef.current === requestId &&
        activeSessionIdRef.current === conversationIdAtSubmit
      ) {
        console.error('Error submitting question:', err);
        setCurrentError(err as ApiError);
        setLoadingRequest(null);
        setPendingSubmission(null);
      }
    } finally {
      if (guidanceAbortControllerRef.current === controller) {
        guidanceAbortControllerRef.current = null;
      }
    }
  };

  // Retry action for error state
  const handleRetry = () => {
    if (pendingSubmission) {
      handleSubmitQuestion(pendingSubmission.question);
    } else if (activeSession) {
      handleSubmitQuestion(activeSession.question);
    }
  };

  // Helper to format session time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '10:42 AM';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:42 AM';
    }
  };

  // Computed scoped loading and pending flags for the current view
  const isCurrentConversationLoading =
    loadingRequest !== null &&
    loadingRequest.requestId === requestIdRef.current &&
    loadingRequest.conversationId === activeSessionId;

  const isPendingForCurrentConversation =
    pendingSubmission !== null &&
    pendingSubmission.requestId === requestIdRef.current &&
    pendingSubmission.conversationId === activeSessionId;

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-[#fafbfa] dark:bg-[#05070b] text-gray-900 dark:text-white font-sans antialiased">
      {/* Left Collapsible History Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewConversation={handleNewConversation}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
        isOpen={isMobile ? isMobileSidebarOpen : isSidebarOpen}
        onToggle={() => {
          if (isMobile) {
            setIsMobileSidebarOpen((prev) => !prev);
          } else {
            setIsSidebarOpen((prev) => !prev);
          }
        }}
        isMobile={isMobile}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col h-full overflow-hidden bg-[#fafbfa] dark:bg-[#05070b] relative">
        {/* Top Assistant Header */}
        <AssistantHeader
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onReset={handleNewConversation}
          isMobile={isMobile}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />

        {/* Scrollable Conversation Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-8 py-4 sm:py-6 scroll-smooth">
          <div className="w-full max-w-4xl mx-auto min-w-0">
            {activeSession ? (
              activeSession.messages && activeSession.messages.length > 0 ? (
                activeSession.messages.map((exchange, idx) => (
                  <div key={exchange.id || idx} className="space-y-6 mb-8">
                    <UserMessage
                      question={exchange.question}
                      timestamp={formatTime(exchange.createdAt)}
                    />
                    <GuidanceCard
                      response={exchange.response}
                      category={exchange.response.meta?.category || activeSession.category}
                      timestamp={formatTime(exchange.createdAt)}
                    />
                  </div>
                ))
              ) : (
                <>
                  <UserMessage
                    question={activeSession.question}
                    timestamp={formatTime(activeSession.createdAt)}
                  />
                  <GuidanceCard
                    response={activeSession.response}
                    category={activeSession.category}
                    timestamp={formatTime(activeSession.createdAt)}
                  />
                </>
              )
            ) : (
              !isCurrentConversationLoading && (
                <EmptyState onSelectPrompt={(prompt) => handleSubmitQuestion(prompt)} />
              )
            )}

            {/* Dynamic live loading during active query */}
            {isCurrentConversationLoading && (
              <>
                {isPendingForCurrentConversation && pendingSubmission && (
                  <UserMessage question={pendingSubmission.question} timestamp="Just now" />
                )}
                <LoadingState />
              </>
            )}

            {/* Dynamic live error if query failed */}
            {currentError && (
              <ErrorState error={currentError} onRetry={handleRetry} />
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Question Composer */}
        <div className="shrink-0 bg-[#fafbfa]/90 dark:bg-[#05070b]/95 backdrop-blur-xs border-t border-gray-100 dark:border-[#1a2230]">
          <Composer
            onSubmit={handleSubmitQuestion}
            isLoading={isCurrentConversationLoading}
            onClearError={() => setCurrentError(null)}
          />
        </div>
      </div>

      {/* Command Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onNewConversation={handleNewConversation}
      />

      {/* Admin Defense Login Modal (SD) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}
