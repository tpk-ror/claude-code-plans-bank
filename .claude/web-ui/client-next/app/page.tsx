'use client';

import { ChatContainer } from '@/components/chat/chat-container';
import { PlansSidebar } from '@/components/plans/plans-sidebar';
import { TerminalPanel } from '@/components/terminal/terminal-panel';
import { AppHeader } from '@/components/layout/app-header';

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-background">
      <PlansSidebar />
      <main className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatContainer />
          <TerminalPanel />
        </div>
      </main>
    </div>
  );
}
