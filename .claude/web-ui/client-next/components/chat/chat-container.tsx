'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useClaudeSession, useMessages } from '@/hooks';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const session = useClaudeSession();
  const { messages, addRawData, clear, isStreaming } = useMessages();

  // Listen for terminal data and parse into messages
  useEffect(() => {
    const unsub = session.onTerminalData((data) => {
      addRawData(data);
    });
    return unsub;
  }, [session, addRawData]);

  // Clear messages when session ends
  useEffect(() => {
    if (!session.sessionActive && session.exitCode !== null) {
      // Optionally clear messages on session exit
      // clear();
    }
  }, [session.sessionActive, session.exitCode, clear]);

  const handleStartSession = () => {
    clear();
    session.startSession();
  };

  const handleStopSession = () => {
    session.stopSession();
  };

  const handleSendMessage = (message: string) => {
    if (session.sessionActive) {
      session.sendInput(message + '\n');
    }
  };

  return (
    <div className={cn('flex flex-1 flex-col min-h-0', className)}>
      <ChatHeader
        connectionStatus={session.connectionStatus}
        sessionActive={session.sessionActive}
        isStarting={session.isStarting}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
      />
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        isLoading={session.isStarting}
      />
      <ChatInput
        onSubmit={handleSendMessage}
        disabled={!session.sessionActive}
        placeholder={
          session.sessionActive
            ? 'Type a message to Claude...'
            : 'Start a session to begin chatting'
        }
      />
    </div>
  );
}
