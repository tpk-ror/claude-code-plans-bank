import { useState, useCallback, useRef } from 'react';
import {
  ParsedMessage,
  ParserState,
  createParserState,
  parseTerminalData,
  getMessages,
} from '../lib/message-parser';

export interface UseMessagesReturn {
  /** All parsed messages */
  messages: ParsedMessage[];
  /** Add raw terminal data to be parsed */
  addRawData: (data: string) => void;
  /** Clear all messages and reset parser state */
  clear: () => void;
  /** Whether there's an incomplete/streaming message */
  isStreaming: boolean;
}

/**
 * Hook for managing parsed messages from terminal data
 *
 * Usage:
 * ```tsx
 * const { messages, addRawData, clear } = useMessages();
 *
 * // In terminal data handler:
 * session.onTerminalData((data) => {
 *   terminalRef.current?.write(data);
 *   addRawData(data);
 * });
 * ```
 */
export function useMessages(): UseMessagesReturn {
  const parserStateRef = useRef<ParserState>(createParserState());
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const addRawData = useCallback((data: string) => {
    // Update parser state with new data
    parserStateRef.current = parseTerminalData(parserStateRef.current, data);

    // Get all messages including the current incomplete one
    const allMessages = getMessages(parserStateRef.current);
    setMessages(allMessages);

    // Check if we're streaming (have an incomplete message)
    setIsStreaming(!!parserStateRef.current.currentMessage);
  }, []);

  const clear = useCallback(() => {
    parserStateRef.current = createParserState();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    addRawData,
    clear,
    isStreaming,
  };
}
