/**
 * ChatPanel — CodeCompass
 * Right pane of the result view — shows chat history, typing indicator,
 * quick-suggestion chips, and the message input/send button.
 */
import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

/* Inline SVG for send button */
const SendSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

/* Starter suggestions shown in the empty state */
const SUGGESTIONS = [
  'How does this project work overall?',
  'How do I set up the dev environment?',
  'What are the most important files?',
]

export default function ChatPanel({
  chatHistory,
  question,
  setQuestion,
  chatLoading,
  onChat,       // onChat(message?: string)
  repoId,
  chatWidth,
  minWidth,
}) {
  const bottomRef = useRef(null)

  /* Auto-scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !chatLoading && question.trim()) {
      onChat(question)
    }
  }

  return (
    <div
      className="chat-panel"
      style={{ width: chatWidth, minWidth }}
      role="complementary"
      aria-label="AI chat assistant"
    >
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-icon" aria-hidden="true">🤖</div>
        <div className="chat-header-info">
          <div className="chat-header-title">AI Assistant</div>
          <div className="chat-header-sub">Ask anything about this codebase</div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {chatHistory.length === 0 ? (
          /* Empty state with suggestion chips */
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">💬</div>
            <div className="chat-empty-title">Ready to explore {repoId}</div>
            <div className="chat-empty-sub">
              Ask me about the architecture, setup steps, key files, or how specific things work.
            </div>
            <div className="chat-suggestions" role="list" aria-label="Suggested questions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion"
                  onClick={() => onChat(s)}
                  role="listitem"
                  aria-label={`Suggested question: ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role}`}
              aria-label={`${msg.role === 'user' ? 'You' : 'CodeCompass AI'}: ${msg.content.slice(0, 80)}…`}
            >
              <div className="chat-msg-avatar" aria-hidden="true">
                {msg.role === 'user' ? '🧑' : '🤖'}
              </div>
              <div className="chat-msg-body">
                <span className="msg-label">
                  {msg.role === 'user' ? 'You' : 'CodeCompass AI'}
                </span>
                <div className="msg-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {chatLoading && (
          <div className="chat-msg assistant" aria-label="AI is typing">
            <div className="chat-msg-avatar" aria-hidden="true">🤖</div>
            <div className="chat-msg-body">
              <span className="msg-label">CodeCompass AI</span>
              <div className="msg-content">
                <div className="typing-indicator" aria-label="Typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input row */}
      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder="Ask about this codebase…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={chatLoading}
          aria-label="Type your question"
          aria-disabled={chatLoading}
        />
        <button
          className="send-btn"
          onClick={() => onChat(question)}
          disabled={chatLoading || !question.trim()}
          aria-label="Send message"
        >
          {chatLoading
            ? <span className="spinner" style={{ width: 14, height: 14 }} aria-hidden="true" />
            : <SendSVG />
          }
        </button>
      </div>
    </div>
  )
}
