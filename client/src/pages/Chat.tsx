
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import {
  getConversation,
  sendMessage,
} from "../api/messages";
import api from "../api/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface Message {
  _id: string;
  senderId: User;
  receiverId: User;
  text: string;
  createdAt: string;
}

function Chat() {
  const { userId } = useParams();

  const currentUser = useSelector(
    (state: RootState) => state.auth.user
  );

  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChat = async () => {
      if (!userId) {
        setError("User ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const [conversationResponse, userResponse] =
          await Promise.all([
            getConversation(userId),
            api.get(`/users/${userId}`),
          ]);

        setMessages(
          conversationResponse.messages || []
        );

        setUser(userResponse.data.user);
      } catch (error: any) {
        console.error("Get chat error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load conversation."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChat();

    // Check for new messages every 5 seconds
    const interval = setInterval(() => {
      if (userId) {
        getConversation(userId)
          .then((response) => {
            setMessages(response.messages || []);
          })
          .catch((error) => {
            console.error(
              "Polling conversation error:",
              error
            );
          });
      }
    }, 5000);

    // Stop polling when leaving the page
    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  const handleSendMessage = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText || !userId) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await sendMessage(userId, trimmedText);

      setText("");

      // Refresh messages immediately after sending
      const response = await getConversation(userId);

      setMessages(response.messages || []);
    } catch (error: any) {
      console.error("Send message error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-heading">
              <div>
                <Link to="/messages">
                  ← Messages
                </Link>

                <h1>
                  {user
                    ? `${user.firstName} ${user.lastName}`
                    : "Conversation"}
                </h1>
              </div>
            </div>

            {loading ? (
              <div className="profile-message">
                Loading conversation...
              </div>
            ) : error ? (
              <div className="error-message">
                {error}
              </div>
            ) : (
              <>
                <div
                  style={{
                    minHeight: "300px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="profile-message">
                      No messages yet. Start the
                      conversation!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine =
                        message.senderId._id ===
                        currentUser?.id;

                      return (
                        <div
                          key={message._id}
                          style={{
                            display: "flex",
                            justifyContent: isMine
                              ? "flex-end"
                              : "flex-start",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              padding: "10px 14px",
                              borderRadius: "12px",
                              backgroundColor: isMine
                                ? "#dbeafe"
                                : "#f3f4f6",
                            }}
                          >
                            <div>
                              {message.text}
                            </div>

                            <small>
                              {new Date(
                                message.createdAt
                              ).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={text}
                    onChange={(event) =>
                      setText(event.target.value)
                    }
                    placeholder="Type a message..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      padding: "10px",
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      sending || !text.trim()
                    }
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;

