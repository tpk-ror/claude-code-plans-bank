import { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { useClaudeSession, usePlans } from './hooks';
import { Header, Sidebar } from './components/layout';
import { Terminal, TerminalRef } from './components/terminal';
import { PlanDetail } from './components/plans';
import { NewPlanModal, AddNoteModal } from './components/modals';
import type { Plan } from './lib/types';

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

  // Terminal ref for imperative access
  const terminalRef = useRef<TerminalRef | null>(null);

  // Session hook
  const session = useClaudeSession();

  // Plans hook
  const plans = usePlans();

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Handle terminal data from WebSocket
  useEffect(() => {
    const unsub = session.onTerminalData((data) => {
      terminalRef.current?.write(data);
    });
    return unsub;
  }, [session]);

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
      // Ctrl+N: New plan
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewPlanModal(true);
        return;
      }

      // Escape: Focus terminal or close modal
      if (e.key === 'Escape') {
        if (showNewPlanModal || showAddNoteModal) {
          setShowNewPlanModal(false);
          setShowAddNoteModal(false);
        } else {
          terminalRef.current?.focus();
        }
        return;
      }

      // Ctrl+B: Toggle sidebar
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
    if (plan) {
      session.startSession({ planPath: `./docs/plans/${plan.filename}` });
    } else {
      session.startSession();
    }
  }, [session]);

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

      <div className="main-container">
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

        <main className="main-content">
          <div className="terminal-container">
            <div className="terminal-header">
              <span className="terminal-title">Terminal</span>
              <div className="terminal-actions">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleStartSession()}
                  title="New session"
                >
                  + New
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={session.stopSession}
                  title="End session"
                  disabled={!session.sessionActive}
                >
                  ✕ End
                </button>
              </div>
            </div>
            <div className="terminal-wrapper">
              <Terminal
                terminalRef={terminalRef}
                onData={session.sendInput}
                onResize={session.resize}
                hasSession={session.sessionActive}
                isDark={isDark}
              />
              <div
                className={clsx('terminal-placeholder', {
                  hidden: session.sessionActive || session.isStarting,
                })}
              >
                <p>No active session</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleStartSession()}
                  disabled={session.isStarting}
                >
                  {session.isStarting ? 'Starting...' : 'Start Claude Session'}
                </button>
              </div>
            </div>
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
