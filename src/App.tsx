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
import { ApiError, GuidanceSession } from './types/guidance.ts';
import {
  askGuidance,
  fetchHistory,
  fetchHistoryById,
  deleteHistoryById,
  clearAllHistory,
} from './services/api.ts';

export default function App() {
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<GuidanceSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<ApiError | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

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

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    async function loadInitialData() {
      try {
        const historyData = await fetchHistory();
        setSessions(historyData);
        if (historyData.length > 0) {
          setActiveSession(historyData[0]);
          setActiveSessionId(historyData[0].id);
        }
      } catch (err) {
        console.warn('Could not load initial history from API:', err);
      }
    }
    loadInitialData();
  }, []);

  // Smooth scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Select a session from history
  const handleSelectSession = async (id: number) => {
    setCurrentError(null);
    setActiveSessionId(id);
    setIsMobileSidebarOpen(false);

    try {
      const session = await fetchHistoryById(id);
      setActiveSession(session);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load session:', err);
      const fallback = sessions.find((s) => s.id === id);
      if (fallback) {
        setActiveSession(fallback);
      } else {
        setCurrentError(err as ApiError);
      }
    }
  };

  // Start a new conversation
  const handleNewConversation = () => {
    setActiveSession(null);
    setActiveSessionId(null);
    setCurrentError(null);
    setPendingQuestion(null);
    setIsMobileSidebarOpen(false);
  };

  // Delete a single conversation from history
  const handleDeleteSession = async (id: number) => {
    // Optimistic UI update
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);

    if (activeSessionId === id) {
      if (remaining.length > 0) {
        setActiveSession(remaining[0]);
        setActiveSessionId(remaining[0].id);
      } else {
        setActiveSession(null);
        setActiveSessionId(null);
      }
    }

    try {
      await deleteHistoryById(id);
      const updatedHistory = await fetchHistory();
      setSessions(updatedHistory);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Clear all conversation history
  const handleClearAllHistory = async () => {
    // Optimistic UI update
    setSessions([]);
    setActiveSession(null);
    setActiveSessionId(null);

    try {
      await clearAllHistory();
      const updatedHistory = await fetchHistory();
      setSessions(updatedHistory);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Handle Question Submission to POST /api/guidance
  const handleSubmitQuestion = async (question: string) => {
    setCurrentError(null);
    setIsLoading(true);
    setPendingQuestion(question);
    scrollToBottom();

    try {
      // Pass activeSessionId if continuing an existing chat thread
      const updatedSession = await askGuidance(question, activeSessionId);
      setActiveSession(updatedSession);
      setActiveSessionId(updatedSession.id);
      setPendingQuestion(null);

      // Refresh history list so sidebar updates
      const updatedHistory = await fetchHistory();
      setSessions(updatedHistory);

      scrollToBottom();
    } catch (err) {
      console.error('Error submitting question:', err);
      setCurrentError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry action for error state
  const handleRetry = () => {
    if (pendingQuestion) {
      handleSubmitQuestion(pendingQuestion);
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafbfa] text-gray-900 font-sans antialiased">
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafbfa] relative">
        {/* Top Assistant Header */}
        <AssistantHeader
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onReset={handleNewConversation}
          isMobile={isMobile}
        />

        {/* Scrollable Conversation Content Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
          <div className="max-w-4xl mx-auto">
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
              !isLoading && (
                <EmptyState onSelectPrompt={(prompt) => handleSubmitQuestion(prompt)} />
              )
            )}

            {/* Dynamic live loading during active query */}
            {isLoading && (
              <>
                {pendingQuestion && (
                  <UserMessage question={pendingQuestion} timestamp="Just now" />
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
        <div className="shrink-0 bg-[#fafbfa]/90 backdrop-blur-xs border-t border-gray-100">
          <Composer
            onSubmit={handleSubmitQuestion}
            isLoading={isLoading}
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
    </div>
  );
}
