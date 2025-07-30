import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';
import bot from '../assets/image2vector.svg';
import user from '../assets/reshot-icon-user-G3RUDHZMQ6.svg';
import loaderGif from '../assets/377.gif';
import { LuPlus } from 'react-icons/lu';
import {
  MdAttachFile,
  MdImage,
  MdInsertDriveFile,
  MdClose,
  MdHistory,
} from 'react-icons/md';
import sendBTN from '../assets/test.svg';
import styles from '../styles/ai.module.css';
import { writePrompts } from '../constants/writePrompts';
import { learnPrompts } from '../constants/learnPrompts';
import { codePrompts } from '../constants/codePrompts';
import { lifePrompts } from '../constants/lifePrompts';
import ChatHistory from './ChatHistory';

const API_URL = import.meta.env.VITE_API_URL;

const ChatAI = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [, setCountdown] = useState(0);
  const chatContainerRef = useRef(null);
  const [isThinking, setIsThinking] = useState(false);
  const [hideHeading, setHideHeading] = useState(false);
  const [, setIsMobileView] = useState();
  const [, setShowContinueMessage] = useState(false);
  const [userId, setUserId] = useState(null);
  const [, setIsTypingFinished] = useState(true);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [isNearLimit, setIsNearLimit] = useState(false);
  const [username, setUsername] = useState('');
  const [, setLoadingUsername] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const result = await getUserIdFromServer();
      setUserId(result);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchUsername = async () => {
      const result = await getUsernameFromServer();
      if (result) {
        const formattedUsername =
          result.charAt(0).toUpperCase() + result.slice(1);
        setUsername(formattedUsername);
      } else {
        setUsername(result);
      }
      setLoadingUsername(false);
    };

    fetchUsername();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const resetChat = () => {
    const newConversationId = uuidv4();
    localStorage.setItem('conversationId', newConversationId);
    setCurrentConversationId(newConversationId);
    setChatMessages([]);
    setUserInput('');
    setHideHeading(false);
    setShowChatHistory(false);
  };

  const loadChatHistory = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}mindstream/history/${conversationId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data) {
        const historyMessages = response.data
          .map((item) => [
            {
              content: item.userQuestion,
              isUser: true,
              timestamp: new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            {
              content: item.chattrAnswer,
              isUser: false,
              timestamp: new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ])
          .flat();

        setChatMessages(historyMessages);
        if (historyMessages.length > 0) {
          setHideHeading(true);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleConversationSelect = (conversationId, messages) => {
    localStorage.setItem('conversationId', conversationId);
    setCurrentConversationId(conversationId);

    // Convert messages to the format expected by the chat
    const formattedMessages = messages
      .map((message) => [
        {
          content: message.userQuestion,
          isUser: true,
          timestamp: new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        {
          content: message.chattrAnswer,
          isUser: false,
          timestamp: new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
      .flat();

    setChatMessages(formattedMessages);
    if (formattedMessages.length > 0) {
      setHideHeading(true);
    }
  };

  useEffect(() => {
    const existingConversationId = localStorage.getItem('conversationId');
    if (existingConversationId) {
      setCurrentConversationId(existingConversationId);
      loadChatHistory(existingConversationId);
    } else {
      resetChat();
    }
  }, []);

  //format the code block provided by the model
  const formatCodeBlocks = (text) => {
    const codeBlockRegex = /```(.*?)(\n([\s\S]*?))?```/gs;

    let formattedText = text.replace(codeBlockRegex, (match, lang, _, code) => {
      const language = lang?.trim() || 'plaintext';
      const cleanLanguage = language.split(':')[0];

      return `
        <div class="${styles.terminal_block}">
          <pre><code class="${cleanLanguage}">${code}</code></pre>
        </div>
      `;
    });

    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    );

    formattedText = formattedText
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>');

    formattedText = formattedText
      .split('\n')
      .map((line) =>
        /^[*-] /.test(line) ? `<li>${line.substring(2)}</li>` : line
      )
      .join('<br />')
      .replace(/(<li>.*<\/li>\s*){2,}/g, '<ul>$&</ul>');

    return formattedText.includes('<li>')
      ? `<ul>${formattedText}</ul>`
      : formattedText;
  };

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getGreetingByTime = () => {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    return `${greeting}, ${username}!`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userInput.trim()) {
      return;
    }

    setHideHeading(true);

    if (isRateLimited || isProcessingResponse) return;

    if (userInput.length > 4000) {
      const errorResponse = {
        content: 'Your input exceeds the 4000 character limit.',
        isUser: false,
        timestamp: formatTimestamp(),
      };
      setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
      return;
    }

    setIsLoading(true);
    setIsThinking(true);
    setIsProcessingResponse(true);

    const message = {
      content: userInput,
      isUser: true,
      timestamp: formatTimestamp(),
    };
    setChatMessages((prevMessages) => [...prevMessages, message]);
    setUserInput('');

    console.log('Sending question to backend...');

    const handleRateLimit = () => {
      setIsRateLimited(true);
      setCountdown(30);
      setShowContinueMessage(false);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsRateLimited(false);
            setCountdown(0);
            setShowContinueMessage(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const getOrCreateConversationId = () => {
      const existingId = localStorage.getItem('conversationId');
      if (existingId) {
        return existingId;
      }

      const newId = uuidv4();
      localStorage.setItem('conversationId', newId);
      return newId;
    };

    try {
      const response = await axios.post(
        `${API_URL}mindstream/generate`,
        {
          question: userInput,
          conversationId: getOrCreateConversationId(),
          userId: userId,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        if (response.data.success) {
          const responseData = response.data.chattrAnswer || 'No response.';

          setChatMessages((prevMessages) => [
            ...prevMessages,
            { content: '', isUser: false },
          ]);

          simulateTypingEffect(responseData);
          setIsThinking(false);
        } else {
          const errorMessage =
            response.data.errorMessage ||
            'Something went wrong with the AI response.';
          const errorResponse = {
            content: errorMessage,
            isUser: false,
            timestamp: formatTimestamp(),
          };
          setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
          setIsThinking(false);
          setIsProcessingResponse(false);
        }
      } else {
        console.error('Error: ', response.statusText);
        setIsThinking(false);
        setIsProcessingResponse(false);
      }
    } catch (error) {
      if (error.response?.status === 405) {
        handleRateLimit();
        const errorMessage =
          'You have reached your request limit. Please wait 30 seconds before trying again.';
        const errorResponse = {
          content: errorMessage,
          isUser: false,
          timestamp: formatTimestamp(),
        };
        setIsThinking(false);
        setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
      } else {
        console.error('Error: ', error.message);
        const errorMessage =
          'Something went wrong. Please check your internet connection or try again later.';
        const errorResponse = {
          content: errorMessage,
          isUser: false,
          timestamp: formatTimestamp(),
        };
        setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
        setIsThinking(false);
      }
      setIsProcessingResponse(false);
    }

    setIsLoading(false);
  };

  const simulateTypingEffect = (text) => {
    setIsTypingFinished(false);
    const chunks = text.split(/(\s+)/);
    let currentContent = '';
    const interval = 20;
    const batchSize = 3;
    const timestamp = formatTimestamp();

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      setTimeout(
        () => {
          currentContent += batch.join('');
          const formattedContent = formatCodeBlocks(currentContent);

          setChatMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastIndex = updatedMessages.length - 1;

            if (lastIndex >= 0 && !updatedMessages[lastIndex].isUser) {
              updatedMessages[lastIndex].content = formattedContent;
              updatedMessages[lastIndex].timestamp = timestamp;
            } else {
              updatedMessages.push({
                content: formattedContent,
                isUser: false,
                timestamp: timestamp,
              });
            }

            return updatedMessages;
          });

          if (i + batchSize >= chunks.length) {
            setIsThinking(false);
            setIsTypingFinished(true);
            setIsProcessingResponse(false);
            scrollToBottom();
          }
        },
        interval * (i / batchSize)
      );
    }
  };

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    const text = textarea.value;

    if (text.length > 4000) {
      setUserInput(text.substring(0, 4000));

      if (toast) {
        toast.warning('Text has been truncated to 4000 characters');
      } else {
        setIsNearLimit(true);
        setTimeout(() => setIsNearLimit(false), 3000);
      }
    } else {
      setUserInput(text);

      setIsNearLimit(text.length > 3800);
    }

    textarea.style.height = 'auto';

    const lineHeight = 24;
    const maxInitialLines = 3;
    const newHeight = Math.min(
      Math.max(lineHeight, textarea.scrollHeight),
      lineHeight * maxInitialLines
    );

    textarea.style.height = `${newHeight}px`;
  };

  const scrollToBottom = () => {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setShowAttachments(false);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const newImages = imageFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles((prev) => [...prev, ...newImages]);
    setShowAttachments(false);
  };

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((file) => file.id !== fileId);
      const fileToRemove = prev.find((file) => file.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.chat_container_wrapper}>
      <div className={styles.floating_buttons_container}>
        <button
          className={styles.floating_button}
          onClick={() => setShowChatHistory(true)}
          title='Chat History'
        >
          <MdHistory />
        </button>
        <button
          className={styles.floating_button}
          onClick={resetChat}
          title='New Chat'
        >
          <LuPlus />
        </button>
      </div>

      <div className={styles.main_content_ai}>
        {!hideHeading && (
          <div className={styles.welcome_section}>
            <h1 className={styles.heading_center}>{getGreetingByTime()}</h1>
          </div>
        )}

        <div
          id={styles.chat_container}
          ref={chatContainerRef}
          className={hideHeading ? styles.chat_active : ''}
        >
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`${styles.wrapper} ${
                !message.isUser ? styles.ai : styles.user
              }`}
            >
              <div className={styles.chat}>
                {!message.isUser && (
                  <div className={styles.profile}>
                    <img src={bot} alt='bot' className={styles.botImage} />
                  </div>
                )}
                <div>
                  <div
                    className={styles.message}
                    dangerouslySetInnerHTML={{
                      __html: formatCodeBlocks(message.content),
                    }}
                  ></div>
                  {message.timestamp && (
                    <div className={styles.message_time}>
                      {message.timestamp}
                    </div>
                  )}
                </div>
                {message.isUser && (
                  <div className={styles.profile}>
                    <img src={user} alt='user' className={styles.userImage} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className={`${styles.wrapper} ${styles.ai}`}>
              <div className={styles.chat}>
                <div className={styles.profile}>
                  <img className={styles.botImage} src={bot} alt='bot' />
                </div>
                <div className={styles.thinking_placeholder}>
                  Thinking
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.chat_input_area}>
          <div className={styles.category_cards_container}>
            <div className={styles.category_cards}>
              <div
                className={`${styles.category_card} ${activeCategory === 'write' ? styles.active : ''}`}
                onClick={() =>
                  setActiveCategory(activeCategory === 'write' ? null : 'write')
                }
              >
                <svg
                  className={styles.category_icon}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                  <polyline points='14,2 14,8 20,8' />
                  <line x1='16' y1='13' x2='8' y2='13' />
                  <line x1='16' y1='17' x2='8' y2='17' />
                  <polyline points='10,9 9,9 8,9' />
                </svg>
                <span>Write</span>
              </div>

              <div
                className={`${styles.category_card} ${activeCategory === 'learn' ? styles.active : ''}`}
                onClick={() =>
                  setActiveCategory(activeCategory === 'learn' ? null : 'learn')
                }
              >
                <svg
                  className={styles.category_icon}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
                  <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
                </svg>
                <span>Learn</span>
              </div>

              <div
                className={`${styles.category_card} ${activeCategory === 'code' ? styles.active : ''}`}
                onClick={() =>
                  setActiveCategory(activeCategory === 'code' ? null : 'code')
                }
              >
                <svg
                  className={styles.category_icon}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <polyline points='16,18 22,12 16,6' />
                  <polyline points='8,6 2,12 8,18' />
                </svg>
                <span>Code</span>
              </div>

              <div
                className={`${styles.category_card} ${activeCategory === 'life' ? styles.active : ''}`}
                onClick={() =>
                  setActiveCategory(activeCategory === 'life' ? null : 'life')
                }
              >
                <svg
                  className={styles.category_icon}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
                </svg>
                <span>Life</span>
              </div>
            </div>

            {activeCategory && (
              <div className={styles.prompts_dropup}>
                <div className={styles.prompts_list}>
                  {activeCategory === 'write' && (
                    <>
                      {writePrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={styles.prompt_item}
                          onClick={() => {
                            setUserInput(prompt.text);
                            setActiveCategory(null);
                          }}
                        >
                          {prompt.text}
                        </div>
                      ))}
                    </>
                  )}
                  {activeCategory === 'learn' && (
                    <>
                      {learnPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={styles.prompt_item}
                          onClick={() => {
                            setUserInput(prompt.text);
                            setActiveCategory(null);
                          }}
                        >
                          {prompt.text}
                        </div>
                      ))}
                    </>
                  )}
                  {activeCategory === 'code' && (
                    <>
                      {codePrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={styles.prompt_item}
                          onClick={() => {
                            setUserInput(prompt.text);
                            setActiveCategory(null);
                          }}
                        >
                          {prompt.text}
                        </div>
                      ))}
                    </>
                  )}
                  {activeCategory === 'life' && (
                    <>
                      {lifePrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={styles.prompt_item}
                          onClick={() => {
                            setUserInput(prompt.text);
                            setActiveCategory(null);
                          }}
                        >
                          {prompt.text}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <form className={styles.ai_form} onSubmit={handleSubmit}>
            <div className={styles.input_field_container}>
              <textarea
                className={styles.ai_textArea}
                name='message'
                rows='1'
                placeholder='How can I help you today?'
                value={userInput}
                onChange={autoResizeTextarea}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isRateLimited || isThinking || isProcessingResponse}
                maxLength={4000}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className={styles.uploaded_files}>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className={styles.file_item}>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className={styles.file_preview}
                      />
                    ) : (
                      <MdInsertDriveFile className={styles.file_icon} />
                    )}
                    <div className={styles.file_info}>
                      <span className={styles.file_name}>{file.name}</span>
                      <span className={styles.file_size}>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      type='button'
                      className={styles.remove_file}
                      onClick={() => removeFile(file.id)}
                      title='Remove file'
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.bottom_controls}>
              <div className={styles.left_controls}>
                <div className={styles.attachments_dropdown}>
                  <button
                    type='button'
                    className={`${styles.icon_button} ${showAttachments ? styles.active : ''}`}
                    title='Add attachment'
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <LuPlus />
                  </button>
                  {showAttachments && (
                    <div className={styles.dropdown_menu}>
                      <div
                        className={styles.dropdown_item}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <MdImage />
                        <span>Upload Image</span>
                      </div>
                      <div
                        className={styles.dropdown_item}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <MdAttachFile />
                        <span>Upload File</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.right_controls}>
                <div className={styles.model_selector}>
                  <span>Sophia Supreme</span>
                  <small>Smart, efficient model</small>
                </div>

                <button
                  className={styles.ai_submit}
                  type='submit'
                  disabled={
                    isRateLimited ||
                    isThinking ||
                    isProcessingResponse ||
                    !userInput.trim()
                  }
                >
                  {isThinking || isProcessingResponse ? (
                    <img
                      src={loaderGif}
                      alt='Loading'
                      className={styles.loader_icon}
                    />
                  ) : (
                    <img src={sendBTN} alt='' className={styles.sendBTN} />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`${styles.char_counter} ${
                userInput.length > 500 ? styles.visible : ''
              } ${userInput.length > 3800 ? styles.near_limit : ''} ${
                userInput.length >= 4000 ? styles.at_limit : ''
              }`}
            >
              {userInput.length}/4000
            </div>

            {isNearLimit && (
              <div
                className={`${styles.limit_warning} ${
                  isNearLimit ? styles.visible : ''
                }`}
              >
                You are approaching or have reached the 4000 character limit
              </div>
            )}
          </form>

          <input
            ref={fileInputRef}
            type='file'
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept='.pdf,.doc,.docx,.txt,.csv,.json'
          />
          <input
            ref={imageInputRef}
            type='file'
            multiple
            style={{ display: 'none' }}
            onChange={handleImageUpload}
            accept='image/*'
          />
        </div>
      </div>

      <ChatHistory
        userId={userId}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        show={showChatHistory}
        onClose={() => setShowChatHistory(false)}
      />
    </div>
  );
};

export default ChatAI;
