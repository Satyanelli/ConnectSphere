import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../store/store";
import { updateUser } from "../store/authSlice";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  headline?: string;
  about?: string;
  location?: string;
  skills?: string[];
}

function Profile() {
  const dispatch = useDispatch<AppDispatch>();

  const [user, setUser] = useState<ProfileUser | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/me");

        const profileUser = response.data.user;

        setUser(profileUser);

        setFirstName(profileUser.firstName || "");
        setLastName(profileUser.lastName || "");
        setHeadline(profileUser.headline || "");
        setAbout(profileUser.about || "");
        setLocation(profileUser.location || "");
        setSkills(profileUser.skills?.join(", ") || "");
      } catch (error: any) {
        console.error("Get profile error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      const response = await api.put("/users/me", {
        firstName,
        lastName,
        headline,
        about,
        location,
        skills: skillsArray,
      });

      const updatedUser = response.data.user;

      setUser(updatedUser);

      dispatch(updateUser(updatedUser));

      setSuccess("Profile updated successfully.");
    } catch (error: any) {
      console.error("Update profile error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-container">
            <div className="profile-message">
              Loading profile...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-container">
            <div className="profile-message error-message">
              {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-heading">
              <div>
                <h1>My Profile</h1>
                <p>
                  Manage your professional information.
                </p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <div className="profile-preview">
              <div className="profile-avatar">
                {user?.firstName?.charAt(0).toUpperCase()}
                {user?.lastName?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>
                  {user?.firstName} {user?.lastName}
                </h2>

                <p>
                  {user?.headline || "Add a professional headline"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    First name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    Last name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="headline">
                  Headline
                </label>

                <input
                  id="headline"
                  type="text"
                  placeholder="e.g. MERN Stack Developer"
                  value={headline}
                  onChange={(event) =>
                    setHeadline(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Hyderabad"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="about">
                  About
                </label>

                <textarea
                  id="about"
                  placeholder="Tell people about yourself"
                  value={about}
                  onChange={(event) =>
                    setAbout(event.target.value)
                  }
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">
                  Skills
                </label>

                <input
                  id="skills"
                  type="text"
                  placeholder="React, Node.js, MongoDB"
                  value={skills}
                  onChange={(event) =>
                    setSkills(event.target.value)
                  }
                />

                <small className="form-help">
                  Separate skills with commas.
                </small>
              </div>

              <button
                type="submit"
                className="auth-button profile-save-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;