import { useState, useRef, useEffect, useCallback } from 'react';
import { useClaudeSession, usePlans, useMessages } from '@/hooks';
import { Header, Sidebar } from '@/components/layout';
import { Terminal, TerminalRef } from '@/components/terminal';
import { PlanDetail } from '@/components/plans';
import { NewPlanModal, AddNoteModal } from '@/components/modals';
import { ChatPanel, ChatPanelToggle } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/types';

function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== 'light';
  });

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteFilename, setNoteFilename] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chatPanelVisible, setChatPanelVisible] = useState(true);
  const [chatPanelExpanded, setChatPanelExpanded] = useState(false);

  // Terminal ref for imperative access
  const terminalRef = useRef<TerminalRef | null>(null);

  // Session hook
  const session = useClaudeSession();

  // Plans hook
  const plans = usePlans();

  // Messages hook for chat panel
  const { messages, addRawData, clear: clearMessages, isStreaming } = useMessages();

  // Apply theme to body - use .dark class for ShadCN
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Handle terminal data from WebSocket
  useEffect(() => {
    const unsub = session.onTerminalData((data) => {
      terminalRef.current?.write(data);
      addRawData(data);
    });
    return unsub;
  }, [session, addRawData]);

  // Handle session exit message
  useEffect(() => {
    if (session.exitCode !== null) {
      terminalRef.current?.writeln(`\r\n\r\n[Session ended with exit code ${session.exitCode}]\r\n`);
    }
  }, [session.exitCode]);

  // Handle session created - focus terminal and send initial size
  useEffect(() => {
    if (session.sessionActive) {
      terminalRef.current?.focus();
      terminalRef.current?.fit();
    }
  }, [session.sessionActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewPlanModal(true);
        return;
      }

      if (e.key === 'Escape') {
        if (showNewPlanModal || showAddNoteModal) {
          setShowNewPlanModal(false);
          setShowAddNoteModal(false);
        } else {
          terminalRef.current?.focus();
        }
        return;
      }

      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNewPlanModal, showAddNoteModal]);

  // Refit terminal when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      terminalRef.current?.fit();
    }, 250);
    return () => clearTimeout(timer);
  }, [sidebarCollapsed]);

  // Handlers
  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const handleStartSession = useCallback((plan?: Plan) => {
    terminalRef.current?.clear();
    clearMessages();
    if (plan) {
      session.startSession({ planPath: `./docs/plans/${plan.filename}`, planMode: true });
    } else {
      session.startSession({ planMode: true });
    }
  }, [session, clearMessages]);

  const handleSendMessage = useCallback((message: string) => {
    if (session.sessionActive) {
      session.sendInput(message + '\n');
    } else if (!session.isStarting) {
      handleStartSession();
      const checkAndSend = () => {
        if (session.sessionActive) {
          session.sendInput(message + '\n');
        } else {
          setTimeout(checkAndSend, 100);
        }
      };
      setTimeout(checkAndSend, 500);
    }
  }, [session, handleStartSession]);

  const handleCreatePlan = useCallback(
    async (data: { title: string; category: string; description: string; priority: string }) => {
      try {
        await plans.createPlan({
          title: data.title,
          category: data.category,
          description: data.description,
          priority: data.priority as 'low' | 'medium' | 'high',
        });
      } catch (err) {
        console.error('Error creating plan:', err);
      }
    },
    [plans]
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await plans.triggerSync();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [plans]);

  const handleAddNote = useCallback((filename: string) => {
    setNoteFilename(filename);
    setShowAddNoteModal(true);
  }, []);

  const handleSubmitNote = useCallback(
    async (filename: string, note: string) => {
      try {
        await plans.addNote(filename, note);
      } catch (err) {
        console.error('Error adding note:', err);
      }
    },
    [plans]
  );

  return (
    <>
      <Header
        connectionStatus={session.connectionStatus}
        isDark={isDark}
        onNewPlan={() => setShowNewPlanModal(true)}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          plans={plans.plans}
          selectedPlan={plans.selectedPlan}
          filters={plans.filters}
          isCollapsed={sidebarCollapsed}
          isLoading={plans.isLoading}
          isSyncing={isSyncing}
          onSelectPlan={plans.selectPlan}
          onFilterChange={plans.setFilters}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onSync={handleSync}
          onStatusChange={plans.updateStatus}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Terminal + Chat horizontal split */}
          <div className="flex flex-1 overflow-hidden">
            {/* Terminal Section */}
            <div
              className={cn(
                'flex flex-1 flex-col transition-all duration-200',
                chatPanelVisible && !chatPanelExpanded && 'flex-[0.6]'
              )}
            >
              <div className="flex flex-1 flex-col">
                {/* Terminal Header */}
                <div className="flex h-10 items-center justify-between border-b border-border bg-card px-3">
                  <span className="text-xs font-medium text-muted-foreground">Terminal</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleStartSession()}
                    >
                      + New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={session.stopSession}
                      disabled={!session.sessionActive}
                    >
                      End
                    </Button>
                    {!chatPanelVisible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setChatPanelVisible(true)}
                      >
                        Chat
                      </Button>
                    )}
                  </div>
                </div>

                {/* Terminal Wrapper */}
                <div className="relative flex-1 overflow-hidden bg-background">
                  <Terminal
                    terminalRef={terminalRef}
                    onData={session.sendInput}
                    onResize={session.resize}
                    hasSession={session.sessionActive}
                    isDark={isDark}
                  />
                  <div
                    className={cn(
                      'absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background',
                      (session.sessionActive || session.isStarting) && 'hidden'
                    )}
                  >
                    {session.sessionError ? (
                      <>
                        <div className="max-w-sm text-center">
                          <p className="text-base font-semibold text-destructive">Session Error</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {session.sessionError.message}
                          </p>
                          {session.sessionError.code && (
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              Code: {session.sessionError.code}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="brand"
                            onClick={() => handleStartSession()}
                            disabled={session.isStarting}
                          >
                            Retry
                          </Button>
                          <Button variant="ghost" onClick={session.clearError}>
                            Dismiss
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">No active session</p>
                        <Button
                          variant="brand"
                          onClick={() => handleStartSession()}
                          disabled={session.isStarting}
                        >
                          {session.isStarting ? 'Starting...' : 'Start Claude Session'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <ChatPanel
              messages={messages}
              isStreaming={isStreaming}
              isVisible={chatPanelVisible}
              isExpanded={chatPanelExpanded}
              sessionActive={session.sessionActive}
              isStarting={session.isStarting}
              sessionError={session.sessionError}
              onToggleVisibility={() => setChatPanelVisible((prev) => !prev)}
              onToggleExpand={() => setChatPanelExpanded((prev) => !prev)}
              onSendMessage={handleSendMessage}
              onClearError={session.clearError}
            />
          </div>

          <PlanDetail
            plan={plans.selectedPlan}
            onClose={() => plans.selectPlan(null)}
            onStartSession={handleStartSession}
            onAddNote={handleAddNote}
            onArchive={plans.archivePlan}
            onStatusChange={plans.updateStatus}
          />
        </main>

        {/* Floating toggle button when chat is hidden */}
        <ChatPanelToggle
          isVisible={chatPanelVisible}
          messageCount={messages.length}
          onClick={() => setChatPanelVisible(true)}
        />
      </div>

      <NewPlanModal
        isOpen={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        onSubmit={handleCreatePlan}
      />

      <AddNoteModal
        isOpen={showAddNoteModal}
        filename={noteFilename}
        onClose={() => {
          setShowAddNoteModal(false);
          setNoteFilename(null);
        }}
        onSubmit={handleSubmitNote}
      />
    </>
  );
}

export default App;
