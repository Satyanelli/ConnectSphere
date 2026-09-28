import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

interface ConnectionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  headline?: string;
}

function Connections() {
  const navigate = useNavigate();

  const [connections, setConnections] = useState<
    ConnectionUser[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/connections");

      setConnections(response.data.connections || []);
    } catch (error: any) {
      console.error("Get connections error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load connections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleRemove = async (userId: string) => {
    try {
      setActionLoading(userId);
      setError("");

      await api.delete(`/connections/${userId}`);

      setConnections((currentConnections) =>
        currentConnections.filter(
          (connection) => connection._id !== userId
        )
      );
    } catch (error: any) {
      console.error(
        "Remove connection error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to remove connection."
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
                <h1>My Connections</h1>

                <p>
                  People you are connected with.
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
                Loading connections...
              </div>
            ) : connections.length === 0 ? (
              <div className="profile-message">
                You don't have any connections yet.
              </div>
            ) : (
              <div className="connections-list">
                {connections.map((connection) => (
                  <div
                    key={connection._id}
                    className="connection-card"
                  >
                    <div className="profile-preview">
                      <div className="profile-avatar">
                        {connection.photoUrl ? (
                          <img
                            src={connection.photoUrl}
                            alt={`${connection.firstName} ${connection.lastName}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <>
                            {connection.firstName
                              ?.charAt(0)
                              .toUpperCase()}

                            {connection.lastName
                              ?.charAt(0)
                              .toUpperCase()}
                          </>
                        )}
                      </div>

                      <div>
                        <h2>
                          {connection.firstName}{" "}
                          {connection.lastName}
                        </h2>

                        <p>
                          {connection.headline ||
                            "No professional headline added"}
                        </p>

                        <p>
                          {connection.email}
                        </p>
                      </div>
                    </div>

                    <div className="connection-actions">
                      <button
                        type="button"
                        className="auth-button"
                        onClick={() =>
                          navigate(
                            `/profile/${connection._id}`
                          )
                        }
                      >
                        View Profile
                      </button>

                      <button
                        type="button"
                        className="auth-button"
                        onClick={() =>
                          handleRemove(connection._id)
                        }
                        disabled={
                          actionLoading ===
                          connection._id
                        }
                      >
                        {actionLoading ===
                        connection._id
                          ? "Removing..."
                          : "Remove Connection"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Connections;