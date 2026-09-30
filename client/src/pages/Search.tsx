import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  headline?: string;
  location?: string;
}

function Search() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const searchTerm = search.trim();

    if (!searchTerm) {
      setUsers([]);
      setSearched(false);
      setError("Please enter a name to search.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await api.get("/users/search", {
        params: {
          search: searchTerm,
        },
      });

      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error("Search users error:", error);

      setUsers([]);

      setError(
        error.response?.data?.message ||
          "Unable to search users."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    handleSearch();
  };

  const getInitials = (
    firstName: string,
    lastName: string
  ) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
      .toUpperCase();
  };

  return (
    <div>
      <Navbar />

      <main className="home-page">
        <div className="home-container">
          <div className="home-header">
            <h1>Search</h1>
            <p>
              Find members by their first or last name.
            </p>
          </div>

          <div className="create-post-card">
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <input
                  className="create-post-input"
                  type="text"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="post-button"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          {loading && (
            <div className="create-post-card">
              <p>Searching users...</p>
            </div>
          )}

          {!loading &&
            searched &&
            users.length === 0 &&
            !error && (
              <div className="create-post-card">
                <p>
                  No users found for "{search.trim()}".
                </p>
              </div>
            )}

          {!loading && users.length > 0 && (
            <div>
              {users.map((user) => (
                <div
                  key={user._id}
                  className="create-post-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "20px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#2563eb",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                        {getInitials(
                          user.firstName,
                          user.lastName
                        )}
                      </div>
                    )}

                    <div>
                      <h2>
                        {user.firstName} {user.lastName}
                      </h2>

                      {user.headline && (
                        <p>{user.headline}</p>
                      )}

                      {user.location && (
                        <p>{user.location}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="auth-button"
                    onClick={() =>
                      navigate(`/profile/${user._id}`)
                    }
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Search;