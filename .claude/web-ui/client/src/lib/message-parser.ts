/**
 * Message Parser
 *
 * Parses terminal ANSI output into structured messages for the chat panel.
 * Extracts user prompts, assistant responses, code blocks, and tool invocations.
 */

export interface CodeBlock {
  language: string;
  code: string;
}

export interface ToolMetadata {
  toolName: string;
  toolArgs?: Record<string, unknown>;
  status?: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

export interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    toolStatus?: 'pending' | 'running' | 'completed' | 'error';
    toolResult?: string;
    codeBlock?: CodeBlock;
  };
}

// ANSI escape code patterns
// CSI sequences: \x1b[ followed by parameters and command letter
// Include ? for DEC private modes (e.g., \x1b[?1004h)
const ANSI_ESCAPE = /\x1b\[[0-9;?]*[a-zA-Z]/g;
// OSC sequences: \x1b] ... (terminated by BEL \x07 or ST \x1b\\)
const ANSI_OSC = /\x1b\][\s\S]*?(?:\x07|\x1b\\)/g;
// Other escape sequences (single character escapes, etc.)
const ANSI_OTHER = /\x1b[()][AB012]/g;
const ANSI_CONTROL = /[\x00-\x1f]/g;
// Bracket sequences that may appear without escape (malformed/partial)
const BRACKET_SEQUENCES = /\[\?[0-9;]*[a-zA-Z]/g;

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsi(text: string): string {
  return text
    .replace(ANSI_ESCAPE, '')
    .replace(ANSI_OSC, '')
    .replace(ANSI_OTHER, '')
    .replace(BRACKET_SEQUENCES, '')
    .replace(ANSI_CONTROL, (char) => {
      // Preserve newlines and tabs
      if (char === '\n' || char === '\r' || char === '\t') return char;
      return '';
    });
}

/**
 * Generate a unique message ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Patterns for detecting different message types
const PATTERNS = {
  // User prompt indicators (Claude Code uses various prompt styles)
  userPrompt: /^(?:❯|>|\$|human:|user:)\s*/im,

  // Claude Code message boundary markers
  claudeMessageStart: /^╭─/,
  claudeMessageEnd: /^╰─/,

  // Code block delimiters
  codeBlockStart: /^```(\w*)/m,
  codeBlockEnd: /^```$/m,

  // Tool invocation patterns (Claude Code tool patterns)
  // Matches: "Read(file.ts)" or "Edit(path)" or "Bash(command)" etc.
  toolInvocation: /^([A-Z][a-zA-Z]+)\(([^)]*)\)/,
  // More general tool patterns
  toolStart: /(?:\[Tool:\s*([^\]]+)\]|Tool:\s*(\w+)|calling\s+(\w+)|^([A-Z][a-zA-Z]+)\s*\()/i,
  toolResult: /(?:\[Result\]|Result:|Output:|✓|✗)/i,

  // Assistant response indicators
  assistantIndicator: /^(?:assistant:|claude:)/im,

  // System message indicators
  systemIndicator: /^(?:\[system\]|\[info\]|\[warning\]|\[error\])/im,

  // Status/thinking indicators
  thinkingIndicator: /^(?:Thinking|Processing|Loading|Working)/i,

  // Claude Code specific patterns
  todoStatus: /^\[(pending|in_progress|completed)\]/i,
};

export interface ParserState {
  messages: ParsedMessage[];
  buffer: string;
  currentMessage: Partial<ParsedMessage> | null;
  inCodeBlock: boolean;
  codeBlockLanguage: string;
  codeBlockContent: string;
  lastRole: 'user' | 'assistant' | 'system' | 'tool';
  inClaudeMessage: boolean; // Track if we're inside a ╭─...╰─ block
  pendingToolContent: string; // Buffer for tool output
}

export function createParserState(): ParserState {
  return {
    messages: [],
    buffer: '',
    currentMessage: null,
    inCodeBlock: false,
    codeBlockLanguage: '',
    codeBlockContent: '',
    lastRole: 'assistant',
    inClaudeMessage: false,
    pendingToolContent: '',
  };
}

/**
 * Parse a chunk of terminal data and extract structured messages
 */
export function parseTerminalData(state: ParserState, rawData: string): ParserState {
  // Clean the data
  const cleanData = stripAnsi(rawData);

  // Add to buffer
  state.buffer += cleanData;

  // Process complete lines
  const lines = state.buffer.split('\n');
  state.buffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines unless in a code block
    if (!trimmed && !state.inCodeBlock) continue;

    // Handle code blocks
    if (state.inCodeBlock) {
      if (PATTERNS.codeBlockEnd.test(trimmed)) {
        // End code block
        state.inCodeBlock = false;
        if (state.currentMessage) {
          state.currentMessage.metadata = {
            ...state.currentMessage.metadata,
            codeBlock: {
              language: state.codeBlockLanguage || 'plaintext',
              code: state.codeBlockContent.trim(),
            },
          };
          state.currentMessage.content =
            (state.currentMessage.content || '') +
            '\n```' + state.codeBlockLanguage + '\n' +
            state.codeBlockContent.trim() + '\n```';
        }
        state.codeBlockLanguage = '';
        state.codeBlockContent = '';
      } else {
        state.codeBlockContent += line + '\n';
      }
      continue;
    }

    // Check for code block start
    const codeBlockMatch = trimmed.match(PATTERNS.codeBlockStart);
    if (codeBlockMatch) {
      state.inCodeBlock = true;
      state.codeBlockLanguage = codeBlockMatch[1] || '';
      state.codeBlockContent = '';
      continue;
    }

    // Detect Claude message boundaries (╭─ and ╰─)
    if (PATTERNS.claudeMessageStart.test(trimmed)) {
      // Start of a Claude message block
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }
      state.inClaudeMessage = true;
      state.currentMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      state.lastRole = 'assistant';
      continue;
    }

    if (PATTERNS.claudeMessageEnd.test(trimmed)) {
      // End of a Claude message block
      state.inClaudeMessage = false;
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
        state.currentMessage = null;
      }
      continue;
    }

    // Detect user prompt
    if (PATTERNS.userPrompt.test(trimmed)) {
      // Finalize current message if exists
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }

      // Start new user message
      const content = trimmed.replace(PATTERNS.userPrompt, '').trim();
      if (content) {
        state.currentMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        state.lastRole = 'user';
        // Immediately push user messages
        state.messages.push(state.currentMessage as ParsedMessage);
        state.currentMessage = null;
      }
      continue;
    }

    // Detect tool invocation (e.g., "Read(path)" or "Edit(file)")
    const toolInvocationMatch = trimmed.match(PATTERNS.toolInvocation);
    if (toolInvocationMatch) {
      // Finalize current message if exists
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }

      const toolName = toolInvocationMatch[1];
      const toolArgs = toolInvocationMatch[2];
      state.currentMessage = {
        id: generateId(),
        role: 'tool',
        content: trimmed,
        timestamp: new Date(),
        metadata: {
          toolName,
          toolArgs: { path: toolArgs },
          toolStatus: 'running',
        },
      };
      state.lastRole = 'tool';
      continue;
    }

    // Detect general tool invocation
    const toolMatch = trimmed.match(PATTERNS.toolStart);
    if (toolMatch && !state.inClaudeMessage) {
      // Finalize current message if exists
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }

      const toolName = toolMatch[1] || toolMatch[2] || toolMatch[3] || toolMatch[4];
      state.currentMessage = {
        id: generateId(),
        role: 'tool',
        content: trimmed,
        timestamp: new Date(),
        metadata: {
          toolName,
          toolStatus: 'running',
        },
      };
      state.lastRole = 'tool';
      continue;
    }

    // Detect tool result
    if (PATTERNS.toolResult.test(trimmed) && state.currentMessage?.role === 'tool') {
      state.currentMessage.metadata = {
        ...state.currentMessage.metadata,
        toolStatus: trimmed.includes('✓') ? 'completed' : trimmed.includes('✗') ? 'error' : 'completed',
      };
      state.currentMessage.content += '\n' + trimmed;
      continue;
    }

    // Detect system message
    if (PATTERNS.systemIndicator.test(trimmed)) {
      // Finalize current message if exists
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }

      state.currentMessage = {
        id: generateId(),
        role: 'system',
        content: trimmed,
        timestamp: new Date(),
      };
      state.lastRole = 'system';
      continue;
    }

    // Default: append to current message or create new assistant message
    if (!state.currentMessage || state.currentMessage.role === 'user') {
      // Finalize previous message if it was user
      if (state.currentMessage && state.currentMessage.content) {
        state.messages.push(state.currentMessage as ParsedMessage);
      }

      state.currentMessage = {
        id: generateId(),
        role: 'assistant',
        content: trimmed,
        timestamp: new Date(),
      };
      state.lastRole = 'assistant';
    } else if (state.currentMessage.role === 'tool') {
      // Append to tool output
      state.currentMessage.content =
        (state.currentMessage.content || '') + '\n' + trimmed;
    } else {
      // Append to current message
      state.currentMessage.content =
        (state.currentMessage.content || '') + '\n' + trimmed;
    }
  }

  return state;
}

/**
 * Flush any remaining buffered content as a message
 */
export function flushBuffer(state: ParserState): ParsedMessage[] {
  const messages = [...state.messages];

  // Add current message if it has content
  if (state.currentMessage && state.currentMessage.content) {
    messages.push(state.currentMessage as ParsedMessage);
  }

  // Process any remaining buffer
  if (state.buffer.trim()) {
    const content = stripAnsi(state.buffer).trim();
    if (content) {
      messages.push({
        id: generateId(),
        role: state.lastRole === 'user' ? 'assistant' : state.lastRole,
        content,
        timestamp: new Date(),
      });
    }
  }

  return messages;
}

/**
 * Get all messages including current incomplete message
 */
export function getMessages(state: ParserState): ParsedMessage[] {
  const messages = [...state.messages];

  // Include current message if it has content
  if (state.currentMessage && state.currentMessage.content?.trim()) {
    messages.push({
      ...state.currentMessage,
      id: state.currentMessage.id || generateId(),
      role: state.currentMessage.role || 'assistant',
      content: state.currentMessage.content,
      timestamp: state.currentMessage.timestamp || new Date(),
    } as ParsedMessage);
  }

  return messages;
}
