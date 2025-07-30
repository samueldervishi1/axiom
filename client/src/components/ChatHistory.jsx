import { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdChat } from 'react-icons/md';
import styles from '../styles/chatHistory.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ChatHistory = ({
  userId,
  currentConversationId,
  onConversationSelect,
  show,
  onClose,
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserHistory = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}mindstream/user-history/${userId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data) {
        // Sort conversations by lastMessageAt (most recent first)
        const sortedConversations = response.data.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
        setConversations(sortedConversations);
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && userId) {
      fetchUserHistory();
    }
  }, [show, userId]);

  const handleConversationClick = (conversation) => {
    onConversationSelect(conversation.conversationId, conversation.messages);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationTitle = (messages) => {
    if (!messages || messages.length === 0) return 'New Conversation';
    const firstMessage = messages[0];
    return firstMessage.userQuestion.length > 50
      ? firstMessage.userQuestion.substring(0, 50) + '...'
      : firstMessage.userQuestion;
  };

  const getLastMessage = (messages) => {
    if (!messages || messages.length === 0) return '';
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.chattrAnswer || lastMessage.userQuestion;
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h3>Chat History</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title='Close'
          >
            <MdClose />
          </button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>Loading conversations...</div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && conversations.length === 0 && (
            <div className={styles.empty}>
              <MdChat className={styles.emptyIcon} />
              <p>No conversations yet</p>
              <span>Start a new chat to see your history here</span>
            </div>
          )}

          {!loading && !error && conversations.length > 0 && (
            <div className={styles.conversationsList}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  className={`${styles.conversationItem} ${
                    currentConversationId === conversation.conversationId
                      ? styles.active
                      : ''
                  }`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className={styles.conversationHeader}>
                    <h4 className={styles.conversationTitle}>
                      {getConversationTitle(conversation.messages)}
                    </h4>
                    <span className={styles.conversationDate}>
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                  </div>

                  <p className={styles.conversationPreview}>
                    {getLastMessage(conversation.messages)}
                  </p>

                  <div className={styles.conversationMeta}>
                    <span className={styles.messageCount}>
                      {conversation.messageCount} messages
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
