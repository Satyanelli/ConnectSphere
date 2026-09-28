import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { getConversations } from "../api/messages";

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

interface Conversation {
  userId: string;
  lastMessage: Message;
}

function Messages() {
  const navigate = useNavigate();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getConversations();

        setConversations(
          response.conversations || []
        );
      } catch (error: any) {
        console.error(
          "Get conversations error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load conversations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const getOtherUser = (
    conversation: Conversation
  ) => {
    const sender = conversation.lastMessage.senderId;
    const receiver =
      conversation.lastMessage.receiverId;

    return sender._id === conversation.userId
      ? sender
      : receiver;
  };

  return (
    <div>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-heading">
              <div>
                <h1>Messages</h1>

                <p>
                  Your conversations with connected
                  users.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="profile-message">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="error-message">
                {error}
              </div>
            ) : conversations.length === 0 ? (
              <div className="profile-message">
                No conversations yet.
              </div>
            ) : (
              <div className="connections-list">
                {conversations.map(
                  (conversation) => {
                    const user =
                      getOtherUser(conversation);

                    return (
                      <div
                        key={conversation.userId}
                        className="connection-card"
                        onClick={() =>
                          navigate(
                            `/messages/${conversation.userId}`
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <div className="profile-preview">
                          <div className="profile-avatar">
                            {user.firstName
                              ?.charAt(0)
                              .toUpperCase()}

                            {user.lastName
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <h2>
                              {user.firstName}{" "}
                              {user.lastName}
                            </h2>

                            <p>
                              {
                                conversation
                                  .lastMessage.text
                              }
                            </p>

                            <small>
                              {new Date(
                                conversation.lastMessage.createdAt
                              ).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Messages;