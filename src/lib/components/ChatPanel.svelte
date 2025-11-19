<script>
  import { sessionId, player, socket } from '$lib/components/PortalStore';
  import { onMount } from 'svelte';

  let messages = $state([]);
  let messageInput = $state('');
  let chatContainer;
  let isMinimized = $state(false);

  function sendMessage() {
    if (!messageInput.trim()) return;

    socket.emit('sendMessage', {
      sessionId: $sessionId,
      message: messageInput,
      type: 'chat'
    });

    messageInput = '';
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  onMount(() => {
    // Listen for new messages
    socket.on('newMessage', (message) => {
      messages = [...messages, message];
      setTimeout(scrollToBottom, 100);
    });

    // Listen for session joined/created (get chat history)
    const loadChatHistory = (session) => {
      if (session.chatHistory && Array.isArray(session.chatHistory)) {
        messages = session.chatHistory;
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on('sessionJoined', loadChatHistory);
    socket.on('sessionCreated', loadChatHistory);

    return () => {
      socket.off('newMessage');
      socket.off('sessionJoined', loadChatHistory);
      socket.off('sessionCreated', loadChatHistory);
    };
  });

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMessageClass(message) {
    if (message.type === 'system') return 'system-message';
    if (message.type === 'dice') return 'dice-message';
    if (message.playerId === socket.id) return 'own-message';
    return 'other-message';
  }

  /**
   * Sanitize color value to prevent CSS injection
   * Only allow valid hex colors
   * @param {string} color
   * @returns {string}
   */
  function sanitizeColor(color) {
    if (!color || typeof color !== 'string') return '#888888';

    // Only allow hex colors in format #RGB or #RRGGBB
    const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    if (hexColorRegex.test(color)) {
      return color;
    }

    // Default to gray if invalid
    return '#888888';
  }

  /**
   * Escape HTML entities to prevent XSS
   * Defense in depth - Svelte auto-escapes {text}, but this ensures safety
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
</script>

<div class="chat-panel" class:minimized={isMinimized}>
  <div class="chat-header">
    <h3>
      <i class="bi bi-chat-dots"></i>
      Chat
      {#if messages.length > 0}
        <span class="message-count">({messages.length})</span>
      {/if}
    </h3>
    <button
      onclick={() => isMinimized = !isMinimized}
      class="btn-icon"
      aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
    >
      <i class="bi bi-{isMinimized ? 'chevron-up' : 'chevron-down'}"></i>
    </button>
  </div>

  {#if !isMinimized}
    <div class="chat-messages" bind:this={chatContainer}>
      {#if messages.length === 0}
        <div class="empty-chat">
          <i class="bi bi-chat"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      {:else}
        {#each messages as message}
          <div class="message {getMessageClass(message)}">
            <div class="message-header">
              <span class="player-name" style="color: {sanitizeColor(message.color)}">
                {message.playerName}
              </span>
              <span class="timestamp">{formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">
              {message.message}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="chat-input">
      <textarea
        bind:value={messageInput}
        onkeypress={handleKeyPress}
        placeholder="Type a message... (Enter to send)"
        rows="2"
        maxlength="1000"
      ></textarea>
      <button
        onclick={sendMessage}
        disabled={!messageInput.trim()}
        class="send-btn"
        aria-label="Send message"
      >
        <i class="bi bi-send"></i>
      </button>
    </div>
  {/if}
</div>

<style>
  .chat-panel {
    position: fixed;
    bottom: 0;
    right: 20px;
    width: 350px;
    max-height: 500px;
    background: var(--color-bg-primary, white);
    border: 1px solid var(--color-primary-overlay, #ccc);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
  }

  .chat-panel.minimized {
    max-height: 50px;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary, #f5f5f5);
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid var(--color-primary-overlay, #ccc);
  }

  .chat-header h3 {
    margin: 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .message-count {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
    font-weight: normal;
  }

  .btn-icon {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    font-size: 1.25rem;
    color: var(--color-text-primary, #333);
  }

  .btn-icon:hover {
    color: var(--color-accent-one, #007bff);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    max-height: 350px;
    min-height: 200px;
  }

  .empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary, #666);
    text-align: center;
  }

  .empty-chat i {
    font-size: 3rem;
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  .message {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .player-name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
  }

  .message-content {
    font-size: 0.9rem;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .own-message {
    background: var(--color-accent-one-transparent, rgba(0, 123, 255, 0.1));
    border-left: 3px solid var(--color-accent-one, #007bff);
  }

  .other-message {
    background: var(--color-bg-secondary, #f5f5f5);
  }

  .system-message {
    background: var(--color-warning-transparent, rgba(255, 193, 7, 0.1));
    border-left: 3px solid var(--color-warning, #ffc107);
    font-style: italic;
  }

  .dice-message {
    background: var(--color-success-transparent, rgba(40, 167, 69, 0.1));
    border-left: 3px solid var(--color-success, #28a745);
    font-weight: 500;
  }

  .chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-top: 1px solid var(--color-primary-overlay, #ccc);
    background: var(--color-bg-primary, white);
  }

  .chat-input textarea {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-primary-overlay, #ccc);
    border-radius: 4px;
    resize: none;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .chat-input textarea:focus {
    outline: none;
    border-color: var(--color-accent-one, #007bff);
  }

  .send-btn {
    padding: 0.5rem 1rem;
    background: var(--color-accent-one, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--color-accent-one-dark, #0056b3);
  }

  .send-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
