import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Chatbot.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const ACCESS_TOKEN_KEY = "vora_access_token";
const REFRESH_TOKEN_KEY = "vora_refresh_token";
const CHATS_KEY = "vora_chats";
const CURRENT_CHAT_KEY = "vora_current_chat_id";

function createChatId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).substring(2, 8)
  );
}

function createNewChat() {
  return {
    id: createChatId(),
    title: "New Chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function loadSavedChats() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CHATS_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Unable to load chat history:", error);
    return [];
  }
}

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(loadSavedChats);
  const [currentChatId, setCurrentChatId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);
  const currentChatIdRef = useRef(null);
  const resumeInputRef = useRef(null);

  // Restore the existing conversation after refreshing the browser.
  useEffect(() => {
    const savedChats = loadSavedChats();
    const savedCurrentChatId = sessionStorage.getItem(
      CURRENT_CHAT_KEY
    );

    setChats(savedChats);

    const existingChat = savedChats.find(
      (chat) => chat.id === savedCurrentChatId
    );

    if (existingChat) {
      currentChatIdRef.current = existingChat.id;
      setCurrentChatId(existingChat.id);
      setMessages(existingChat.messages || []);
      return;
    }

    const newChat = createNewChat();

    currentChatIdRef.current = newChat.id;
    setCurrentChatId(newChat.id);
    setMessages([]);

    sessionStorage.setItem(CURRENT_CHAT_KEY, newChat.id);
  }, []);

  // Save conversations to localStorage.
  useEffect(() => {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats]);

  // Save messages and update the chat title.
  useEffect(() => {
    if (!currentChatId) return;

    currentChatIdRef.current = currentChatId;

    sessionStorage.setItem(CURRENT_CHAT_KEY, currentChatId);

    setChats((previousChats) => {
      const existingChat = previousChats.find(
        (chat) => chat.id === currentChatId
      );

      const firstUserMessage = messages.find(
        (message) => message.role === "user"
      );

      let title = firstUserMessage?.text?.trim() || "New Chat";

      if (title.length > 45) {
        title = `${title.substring(0, 45)}...`;
      }

      const updatedChat = {
        id: currentChatId,
        title,
        messages,
        updatedAt: Date.now(),
      };

      // Never replace a saved conversation with an empty conversation.
      if (messages.length === 0 && existingChat) {
        return previousChats;
      }

      if (!existingChat && messages.length === 0) {
        return previousChats;
      }

      const updatedChats = existingChat
        ? previousChats.map((chat) =>
            chat.id === currentChatId ? updatedChat : chat
          )
        : [updatedChat, ...previousChats];

      localStorage.setItem(
        CHATS_KEY,
        JSON.stringify(updatedChats)
      );

      return updatedChats;
    });
  }, [messages, currentChatId]);

  // Scroll to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  // Escape exits fullscreen mode.
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsExpanded(false);
        setHistoryOpen(false);
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Refresh the access token using the saved refresh token.
  async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(
      REFRESH_TOKEN_KEY
    );

    if (!refreshToken) {
      throw new Error(
        "SESSION_EXPIRED: No refresh token found. Please sign in again."
      );
    }

    let response;

    try {
      response = await fetch(
        `${API_BASE_URL}/api/auth/refresh/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );
    } catch {
      throw new Error(
        "BACKEND_UNAVAILABLE: Cannot connect to the VORA backend."
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);

      throw new Error(
        "SESSION_EXPIRED: Your refresh token is invalid or expired. Please sign in again."
      );
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);

    if (data.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    }

    return data.access;
  }

  async function getAccessToken() {
    let accessToken = localStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    if (!accessToken) {
      accessToken = await refreshAccessToken();
    }

    return accessToken;
  }

  async function sendChatRequest(text, accessToken) {
    return fetch(`${API_BASE_URL}/api/career/chatbot/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        question: text,
        message: text,
      }),
    });
  }

  // Send a message to the VORA chatbot.
  async function sendQuestion() {
    const trimmedQuestion = question.trim();

    if (
      !trimmedQuestion ||
      loading ||
      sendingRef.current
    ) {
      return;
    }

    if (!currentChatIdRef.current) {
      setErrorMessage(
        "Please start a new chat and try again."
      );
      return;
    }

    sendingRef.current = true;
    setLoading(true);
    setErrorMessage("");
    setUploadMessage("");
    setQuestion("");

    const chatIdForRequest = currentChatIdRef.current;

    const userMessage = {
      role: "user",
      text: trimmedQuestion,
      timestamp: Date.now(),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    try {
      let accessToken = await getAccessToken();

      let response = await sendChatRequest(
        trimmedQuestion,
        accessToken
      );

      if (response.status === 401) {
        accessToken = await refreshAccessToken();

        response = await sendChatRequest(
          trimmedQuestion,
          accessToken
        );
      }

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "SESSION_EXPIRED: The refreshed access token was rejected. Please sign in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            `Server error: ${response.status}`
        );
      }

      const answer =
        data.answer ||
        data.response ||
        data.reply ||
        data.message ||
        data.result;

      if (
        typeof answer !== "string" ||
        !answer.trim()
      ) {
        throw new Error(
          "The chatbot API returned no answer. Check the response format in career/views.py."
        );
      }

      const assistantMessage = {
        role: "assistant",
        text: answer,
        timestamp: Date.now(),
      };

      if (
        currentChatIdRef.current === chatIdForRequest
      ) {
        setMessages((previousMessages) => [
          ...previousMessages,
          assistantMessage,
        ]);
      } else {
        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.id === chatIdForRequest
              ? {
                  ...chat,
                  messages: [
                    ...(chat.messages || []),
                    userMessage,
                    assistantMessage,
                  ],
                  updatedAt: Date.now(),
                }
              : chat
          )
        );
      }
    }      catch (error) {
      console.error("VORA AI Error:", error);

      let readableError =
        error.message ||
        "Something went wrong. Please try again.";

      readableError = readableError
        .replace("SESSION_EXPIRED: ", "")
        .replace("BACKEND_UNAVAILABLE: ", "");

      // Show the error only once inside the conversation.
      setErrorMessage("");

      const errorMessageItem = {
        role: "assistant",
        text: readableError,
        isError: true,
        timestamp: Date.now(),
      };

      if (
        currentChatIdRef.current === chatIdForRequest
      ) {
        setMessages((previousMessages) => [
          ...previousMessages,
          errorMessageItem,
        ]);
      }
    } finally {
      // Always stop processing after success or failure.
      setLoading(false);
      sendingRef.current = false;
    }
  }

  // Upload a PDF, DOC, or DOCX resume.
  async function handleResumeSelected(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extensionIsAllowed =
      /\.(pdf|doc|docx)$/i.test(file.name);

    if (
      !extensionIsAllowed &&
      !allowedTypes.includes(file.type)
    ) {
      setErrorMessage(
        "Please select a PDF, DOC, or DOCX resume file."
      );
      return;
    }

    setUploadingResume(true);
    setErrorMessage("");
    setUploadMessage("");

    try {
      let accessToken = await getAccessToken();

      const formData = new FormData();

      formData.append("resume_file", file);
      formData.append(
        "target_role",
        "General career analysis"
      );

      let response = await fetch(
        `${API_BASE_URL}/api/career/resume/upload/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        accessToken = await refreshAccessToken();

        response = await fetch(
          `${API_BASE_URL}/api/career/resume/upload/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );
      }

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            `Resume upload failed (${response.status}).`
        );
      }

      const successText =
        data.message ||
        data.detail ||
        `Resume "${file.name}" uploaded successfully. You can now ask VORA to analyze your resume.`;

      setUploadMessage(successText);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          text: successText,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Resume upload error:", error);

      setErrorMessage(
        error.message || "Unable to upload your resume."
      );
    } finally {
      setUploadingResume(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      sendQuestion();
    }
  }

  // Start a new conversation.
  function startNewChat() {
    if (sendingRef.current) return;

    const newChat = createNewChat();

    currentChatIdRef.current = newChat.id;

    setCurrentChatId(newChat.id);
    setMessages([]);
    setQuestion("");
    setErrorMessage("");
    setUploadMessage("");

    sessionStorage.setItem(
      CURRENT_CHAT_KEY,
      newChat.id
    );

    setChats((previousChats) => [
      newChat,
      ...previousChats,
    ]);

    setMenuOpen(false);
    setHistoryOpen(false);
  }

  function openHistory() {
    setHistoryOpen(true);
    setMenuOpen(false);
  }

  // Restore a saved conversation.
  function openChat(chat) {
    if (sendingRef.current) return;

    currentChatIdRef.current = chat.id;

    setCurrentChatId(chat.id);

    setMessages(
      Array.isArray(chat.messages)
        ? chat.messages
        : []
    );

    setQuestion("");
    setErrorMessage("");
    setUploadMessage("");

    sessionStorage.setItem(
      CURRENT_CHAT_KEY,
      chat.id
    );

    setHistoryOpen(false);
    setMenuOpen(false);
  }

  // Delete a conversation.
  function deleteChat(chatId, event) {
    event.stopPropagation();

    const updatedChats = chats.filter(
      (chat) => chat.id !== chatId
    );

    setChats(updatedChats);

    localStorage.setItem(
      CHATS_KEY,
      JSON.stringify(updatedChats)
    );

    if (chatId === currentChatIdRef.current) {
      const newChat = createNewChat();

      currentChatIdRef.current = newChat.id;

      setCurrentChatId(newChat.id);
      setMessages([]);
      setQuestion("");
      setErrorMessage("");
      setUploadMessage("");

      sessionStorage.setItem(
        CURRENT_CHAT_KEY,
        newChat.id
      );
    }
  }

  async function copyMessage(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Unable to copy message:", error);

      setErrorMessage(
        "Unable to copy the response. Check browser permissions."
      );
    }
  }

  function handleLogout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    sessionStorage.removeItem(CURRENT_CHAT_KEY);

    window.location.href = "/login";
  }

  const visibleChats = chats
    .filter(
      (chat) => (chat.messages || []).length > 0
    )
    .slice()
    .sort(
      (a, b) =>
        (b.updatedAt || 0) - (a.updatedAt || 0)
    );

  return (
    <div
      className={`chatbot-page ${
        isExpanded ? "chatbot-expanded" : ""
      }`}
    >
      {/* OUTER NAVBAR: hidden in fullscreen mode */}
      {!isExpanded && (
        <nav className="navbar chatbot-navbar">
          <div className="container-fluid chatbot-nav-content">
            <div className="d-flex align-items-center gap-2">
              <div className="logo-icon">V</div>
              <span className="vora-logo">VORA AI</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="assistant-label d-none d-md-block">
                AI Career Assistant
              </span>

              <div className="position-relative">
                <button
                  type="button"
                  className="btn menu-button"
                  onClick={() =>
                    setMenuOpen((open) => !open)
                  }
                  aria-label="Open menu"
                >
                  ☰
                </button>

                {menuOpen && (
                  <div className="dropdown-menu-custom">
                    <button
                      type="button"
                      onClick={startNewChat}
                    >
                      <span>＋</span>
                      New Chat
                    </button>

                    <button
                      type="button"
                      onClick={openHistory}
                    >
                      <span>◷</span>
                      Chat History
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="logout-button"
                    >
                      <span>↪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* CHAT HISTORY */}
      {historyOpen && (
        <div
          className="history-overlay"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="history-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-header">
              <div>
                <h5>Chat History</h5>
                <span>
                  {visibleChats.length} chats
                </span>
              </div>

              <button
                type="button"
                className="history-close"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history"
              >
                ×
              </button>
            </div>

            <div className="history-content">
              {visibleChats.length === 0 ? (
                <div className="no-history">
                  <div>💬</div>
                  <p>No chat history yet</p>
                  <small>
                    Start a conversation with VORA.
                  </small>
                </div>
              ) : (
                visibleChats.map((chat) => (
                  <div
                    className={
                      chat.id === currentChatId
                        ? "history-item active-history-item"
                        : "history-item"
                    }
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        openChat(chat);
                      }
                    }}
                  >
                    <div className="history-avatar">
                      V
                    </div>

                    <div className="history-chat-info">
                      <strong>
                        {chat.title || "New Chat"}
                      </strong>

                      <small>
                        {chat.messages?.length || 0} messages
                      </small>
                    </div>

                    <button
                      type="button"
                      className="history-delete"
                      onClick={(event) =>
                        deleteChat(chat.id, event)
                      }
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHAT */}
      <main className="container-fluid chatbot-main">
        <div className="row justify-content-center h-100">
          <div className="col-12 col-xl-9 col-xxl-8 h-100 chatbot-column">
            <div className="chatbot-card">
              {/* Hide welcome banner in fullscreen mode */}
              {!isExpanded && (
                <div className="chatbot-header text-center">
                  <div className="ai-badge">
                    <span></span>
                    AI-POWERED CAREER ASSISTANT
                  </div>

                  <h1>
                    Welcome to <span>VORA AI</span>
                  </h1>

                  <p>
                    Your intelligent career companion
                  </p>
                </div>
              )}

              <div className="assistant-box">
                {/* CHAT TITLE AND FULLSCREEN BUTTON */}
                <div className="assistant-title">
                  <div className="assistant-title-left">
                    <div className="assistant-icon">
                      V
                    </div>

                    <div>
                      <h5>VORA AI Assistant</h5>
                      <small>
                        Ask anything about your career
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn zoom-button"
                    onClick={() => {
                      setIsExpanded(
                        (expanded) => !expanded
                      );
                      setMenuOpen(false);
                    }}
                    title={
                      isExpanded
                        ? "Exit fullscreen"
                        : "Expand chatbot"
                    }
                    aria-label={
                      isExpanded
                        ? "Exit fullscreen"
                        : "Expand chatbot"
                    }
                  >
                    {isExpanded ? "⊡" : "⛶"}
                  </button>
                </div>

                {/* CHAT MESSAGES */}
                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      <div className="big-vora-icon">
                        V
                      </div>

                      <h4>Hello! I'm VORA 👋</h4>

                      <p>Your AI Career Assistant</p>

                      <span>
                        Ask me about your resume, skills,
                        career roadmap, jobs, interviews,
                        or programming. You can also upload
                        your resume using the paperclip
                        button below.
                      </span>

                      <div className="suggestion-list">
                        <button
                          type="button"
                          onClick={() =>
                            setQuestion("Analyze my resume")
                          }
                        >
                          📄 Analyze my resume
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setQuestion(
                              "What skills should I learn?"
                            )
                          }
                        >
                          🎯 Find my skill gaps
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setQuestion(
                              "Give me a career roadmap"
                            )
                          }
                        >
                          🚀 Build my roadmap
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={`${message.timestamp || index}-${index}`}
                        className={
                          message.role === "user"
                            ? "message-row user-row"
                            : "message-row assistant-row"
                        }
                      >
                        <div
                          className={
                            message.role === "user"
                              ? "message-bubble user-bubble"
                              : message.isError
                              ? "message-bubble error-bubble"
                              : "message-bubble assistant-bubble"
                          }
                        >
                          <div className="message-text">
  {message.role === "user" ? (
    message.text
  ) : (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h3>{children}</h3>,
        h2: ({ children }) => <h4>{children}</h4>,
        h3: ({ children }) => <h5>{children}</h5>,
        hr: () => null,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {message.text || ""}
    </ReactMarkdown>
  )}
</div>

                          {message.role === "assistant" &&
                            !message.isError && (
                              <button
                                type="button"
                                className="copy-button"
                                onClick={() =>
                                  copyMessage(message.text)
                                }
                                title="Copy response"
                                aria-label="Copy response"
                              >
                                ⧉
                              </button>
                            )}
                        </div>
                      </div>
                    ))
                  )}

                  {loading && (
                    <div className="message-row assistant-row">
                      <div className="message-bubble assistant-bubble">
                        <div className="typing">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* STATUS MESSAGES */}
                {(errorMessage || uploadMessage) && (
                  <div
                    className={
                      errorMessage
                        ? "vora-error-message"
                        : "vora-upload-message"
                    }
                    role="status"
                  >
                    {errorMessage || uploadMessage}
                  </div>
                )}

                {/* MESSAGE INPUT */}
                <div className="chat-input-wrapper">
                  <div className="input-group chat-input-group">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="resume-file-input"
                      onChange={handleResumeSelected}
                      aria-label="Choose resume file"
                    />

                    <button
                      type="button"
                      className="btn resume-upload-button"
                      onClick={() =>
                        resumeInputRef.current?.click()
                      }
                      disabled={
                        uploadingResume || loading
                      }
                      title="Upload resume (PDF, DOC, DOCX)"
                      aria-label="Upload resume"
                    >
                      {uploadingResume ? "…" : "📎"}
                    </button>

                    <input
                      type="text"
                      className="form-control chat-input"
                      placeholder="Ask VORA AI anything..."
                      value={question}
                      onChange={(event) =>
                        setQuestion(event.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      disabled={loading || uploadingResume}
                    />

                    <button
                      type="button"
                      className="btn vora-send-button"
                      onClick={sendQuestion}
                      disabled={
                        !question.trim() ||
                        loading ||
                        uploadingResume
                      }
                      aria-label="Send message"
                    >
                      ↑
                    </button>
                  </div>

                  <small>
                    {uploadingResume
                      ? "Uploading resume..."
                      : "Attach a resume or press Enter to send"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chatbot;
