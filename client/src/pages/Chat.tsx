
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import { getConversation } from "../api/messages";
import api from "../api/axios";
import socket, {
  connectSocket,
} from "../api/socket";
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
  const [messages, setMessages] = useState<Message[]>(
    []
  );
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /*
    Connect to Socket.IO and listen for messages
  */
  useEffect(() => {
    connectSocket();

    console.log("Connecting to Socket.IO...");

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );

      setError(
        "Unable to connect to real-time messaging."
      );
    });

    socket.on(
      "newMessage",
      (message: Message) => {
        console.log(
          "New real-time message:",
          message
        );

        if (!userId) {
          return;
        }

        const senderId = message.senderId._id;

        const receiverId =
          message.receiverId._id;

        const belongsToCurrentConversation =
          (senderId === currentUser?.id &&
            receiverId === userId) ||
          (senderId === userId &&
            receiverId === currentUser?.id);

        if (!belongsToCurrentConversation) {
          return;
        }

        setMessages((previousMessages) => {
          const alreadyExists =
            previousMessages.some(
              (existingMessage) =>
                existingMessage._id ===
                message._id
            );

          if (alreadyExists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            message,
          ];
        });

        setSending(false);
      }
    );

    socket.on(
      "messageError",
      (data: { message: string }) => {
        console.error(
          "Socket message error:",
          data.message
        );

        setError(data.message);
        setSending(false);
      }
    );

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("newMessage");
      socket.off("messageError");

      socket.disconnect();
    };
  }, [userId, currentUser?.id]);

  /*
    Load conversation history
  */
  useEffect(() => {
    const fetchChat = async () => {
      if (!userId) {
        setError("User ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const [
          conversationResponse,
          userResponse,
        ] = await Promise.all([
          getConversation(userId),
          api.get(`/users/${userId}`),
        ]);

        setMessages(
          conversationResponse.messages || []
        );

        setUser(userResponse.data.user);
      } catch (error: any) {
        console.error(
          "Get chat error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load conversation."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [userId]);

  /*
    Send message through Socket.IO
  */
  const handleSendMessage = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const trimmedText = text.trim();

    if (
      !trimmedText ||
      !userId ||
      sending
    ) {
      return;
    }

    if (!socket.connected) {
      setError(
        "Real-time connection is not available."
      );

      return;
    }

    setSending(true);
    setError("");

    socket.emit("sendMessage", {
      receiverId: userId,
      text: trimmedText,
    });

    setText("");
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
                    border:
                      "1px solid #ddd",
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
                    messages.map(
                      (message) => {
                        const isMine =
                          message.senderId
                            ._id ===
                          currentUser?.id;

                        return (
                          <div
                            key={
                              message._id
                            }
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                isMine
                                  ? "flex-end"
                                  : "flex-start",
                              marginBottom:
                                "12px",
                            }}
                          >
                            <div
                              style={{
                                maxWidth:
                                  "70%",
                                padding:
                                  "10px 14px",
                                borderRadius:
                                  "12px",
                                backgroundColor:
                                  isMine
                                    ? "#dbeafe"
                                    : "#f3f4f6",
                              }}
                            >
                              <div>
                                {
                                  message.text
                                }
                              </div>

                              <small>
                                {new Date(
                                  message.createdAt
                                ).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={
                    handleSendMessage
                  }
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={text}
                    onChange={(event) =>
                      setText(
                        event.target.value
                      )
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
                      sending ||
                      !text.trim()
                    }
                  >
                    {sending
                      ? "Sending..."
                      : "Send"}
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

