import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import api from "../api/axios";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  headline?: string;
}

interface IncomingRequest {
  _id: string;
  requesterId: User;
  status: string;
}

interface SentRequest {
  _id: string;
  recipientId: User;
  status: string;
}

function Requests() {
  const [incomingRequests, setIncomingRequests] =
    useState<IncomingRequest[]>([]);

  const [sentRequests, setSentRequests] =
    useState<SentRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const [incomingResponse, sentResponse] =
        await Promise.all([
          api.get("/connections/requests"),
          api.get("/connections/sent"),
        ]);

      setIncomingRequests(
        incomingResponse.data.requests || []
      );

      setSentRequests(
        sentResponse.data.requests || []
      );
    } catch (error: any) {
      console.error("Get requests error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load connection requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (
    connectionId: string
  ) => {
    try {
      setActionLoading(connectionId);
      setError("");

      await api.patch(
        `/connections/request/${connectionId}/accept`
      );

      setIncomingRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request._id !== connectionId
        )
      );
    } catch (error: any) {
      console.error(
        "Accept request error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to accept request."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (
    connectionId: string
  ) => {
    try {
      setActionLoading(connectionId);
      setError("");

      await api.patch(
        `/connections/request/${connectionId}/reject`
      );

      setIncomingRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request._id !== connectionId
        )
      );
    } catch (error: any) {
      console.error(
        "Reject request error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to reject request."
      );
    } finally {
      setActionLoading("");
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
                <h1>Connection Requests</h1>

                <p>
                  Manage your incoming and sent
                  connection requests.
                </p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading ? (
              <div className="profile-message">
                Loading requests...
              </div>
            ) : (
              <>
                <section>
                  <h2>Incoming Requests</h2>

                  {incomingRequests.length === 0 ? (
                    <div className="profile-message">
                      No incoming requests.
                    </div>
                  ) : (
                    <div className="connections-list">
                      {incomingRequests.map(
                        (request) => (
                          <div
                            key={request._id}
                            className="connection-card"
                          >
                            <div className="profile-preview">
                              <div className="profile-avatar">
                                {request.requesterId
                                  .photoUrl ? (
                                  <img
                                    src={
                                      request
                                        .requesterId
                                        .photoUrl
                                    }
                                    alt={`${request.requesterId.firstName} ${request.requesterId.lastName}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <>
                                    {request.requesterId
                                      .firstName
                                      ?.charAt(0)
                                      .toUpperCase()}

                                    {request.requesterId
                                      .lastName
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </>
                                )}
                              </div>

                              <div>
                                <h2>
                                  {
                                    request
                                      .requesterId
                                      .firstName
                                  }{" "}
                                  {
                                    request
                                      .requesterId
                                      .lastName
                                  }
                                </h2>

                                <p>
                                  {
                                    request
                                      .requesterId
                                      .headline ||
                                    "No professional headline added"
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="connection-actions">
                              <button
                                type="button"
                                className="auth-button"
                                onClick={() =>
                                  handleAccept(
                                    request._id
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  request._id
                                }
                              >
                                {actionLoading ===
                                request._id
                                  ? "Processing..."
                                  : "Accept"}
                              </button>

                              <button
                                type="button"
                                className="auth-button"
                                onClick={() =>
                                  handleReject(
                                    request._id
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  request._id
                                }
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section
                  style={{
                    marginTop: "32px",
                  }}
                >
                  <h2>Sent Requests</h2>

                  {sentRequests.length === 0 ? (
                    <div className="profile-message">
                      No pending sent requests.
                    </div>
                  ) : (
                    <div className="connections-list">
                      {sentRequests.map((request) => (
                        <div
                          key={request._id}
                          className="connection-card"
                        >
                          <div className="profile-preview">
                            <div className="profile-avatar">
                              {request.recipientId
                                .photoUrl ? (
                                <img
                                  src={
                                    request
                                      .recipientId
                                      .photoUrl
                                  }
                                  alt={`${request.recipientId.firstName} ${request.recipientId.lastName}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <>
                                  {request.recipientId
                                    .firstName
                                    ?.charAt(0)
                                    .toUpperCase()}

                                  {request.recipientId
                                    .lastName
                                    ?.charAt(0)
                                    .toUpperCase()}
                                </>
                              )}
                            </div>

                            <div>
                              <h2>
                                {
                                  request
                                    .recipientId
                                    .firstName
                                }{" "}
                                {
                                  request
                                    .recipientId
                                    .lastName
                                }
                              </h2>

                              <p>
                                {
                                  request
                                    .recipientId
                                    .headline ||
                                  "No professional headline added"
                                }
                              </p>
                            </div>
                          </div>

                          <div className="connection-actions">
                            <button
                              type="button"
                              className="auth-button"
                              disabled
                            >
                              Pending
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Requests;