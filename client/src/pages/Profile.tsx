import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { updateUser } from "../store/authSlice";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface Experience {
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
}

interface Education {
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

interface ProfileUser {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  headline?: string;
  about?: string;
  location?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
}

interface ConnectionRequest {
  _id: string;
  requesterId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
    headline?: string;
  };
  recipientId: string;
  status: string;
}

function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { userId } = useParams();

  const currentUser = useSelector(
    (state: RootState) => state.auth.user
  );

  const [user, setUser] = useState<ProfileUser | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");

  const [experience, setExperience] =
    useState<Experience[]>([]);

  const [education, setEducation] =
    useState<Education[]>([]);

  const [relationshipStatus, setRelationshipStatus] =
    useState("");

  const [connectionId, setConnectionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relationshipLoading, setRelationshipLoading] =
    useState(false);
  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwnProfile = !userId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        let profileUser;

        if (userId) {
          const response = await api.get(
            `/users/${userId}`
          );

          profileUser = response.data.user;
        } else {
          const response = await api.get("/users/me");

          profileUser = response.data.user;
        }

        setUser(profileUser);

        setFirstName(profileUser.firstName || "");
        setLastName(profileUser.lastName || "");
        setPhotoUrl(profileUser.photoUrl || "");
        setHeadline(profileUser.headline || "");
        setAbout(profileUser.about || "");
        setLocation(profileUser.location || "");
        setSkills(profileUser.skills?.join(", ") || "");

        setExperience(profileUser.experience || []);
        setEducation(profileUser.education || []);
      } catch (error: any) {
        console.error("Get profile error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const fetchRelationship = async () => {
    if (!userId || !currentUser) {
      return;
    }

    try {
      setRelationshipLoading(true);

      const response = await api.get(
        `/connections/status/${userId}`
      );

      const status = response.data.status;

      setRelationshipStatus(status);
      setConnectionId("");

      if (status === "RESPOND") {
        const requestsResponse = await api.get(
          "/connections/requests"
        );

        const requests: ConnectionRequest[] =
          requestsResponse.data.requests || [];

        const matchingRequest = requests.find(
          (request) =>
            request.requesterId?._id === userId
        );

        if (matchingRequest) {
          setConnectionId(matchingRequest._id);
        }
      }
    } catch (error: any) {
      console.error(
        "Get relationship status error:",
        error
      );

      setRelationshipStatus("");
    } finally {
      setRelationshipLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationship();
  }, [userId, currentUser]);

  const handleConnect = async () => {
    if (!userId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.post("/connections/request", {
        userId,
      });

      setRelationshipStatus("PENDING");

      setSuccess("Connection request sent.");
    } catch (error: any) {
      console.error(
        "Send connection request error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send connection request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connectionId) {
      setError("Connection request not found.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.patch(
        `/connections/request/${connectionId}/accept`
      );

      setRelationshipStatus("CONNECTED");
      setConnectionId("");

      setSuccess("Connection request accepted.");
    } catch (error: any) {
      console.error(
        "Accept connection request error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to accept connection request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!connectionId) {
      setError("Connection request not found.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.patch(
        `/connections/request/${connectionId}/reject`
      );

      setRelationshipStatus("NONE");
      setConnectionId("");

      setSuccess("Connection request rejected.");
    } catch (error: any) {
      console.error(
        "Reject connection request error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to reject connection request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!userId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.delete(
        `/connections/${userId}`
      );

      setRelationshipStatus("NONE");

      setSuccess("Connection removed successfully.");
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
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    if (!userId) {
      return;
    }

    navigate(`/messages/${userId}`);
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setExperience((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addExperience = () => {
    setExperience((current) => [
      ...current,
      {
        role: "",
        company: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperience((current) =>
      current.filter(
        (_item, itemIndex) => itemIndex !== index
      )
    );
  };

  const handleEducationChange = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    setEducation((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addEducation = () => {
    setEducation((current) => [
      ...current,
      {
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducation((current) =>
      current.filter(
        (_item, itemIndex) => itemIndex !== index
      )
    );
  };

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
        photoUrl: photoUrl.trim(),
        headline,
        about,
        location,
        skills: skillsArray,
        experience,
        education,
      });

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setExperience(updatedUser.experience || []);
      setEducation(updatedUser.education || []);

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

  const getInitials = () => {
    const firstInitial =
      user?.firstName?.charAt(0).toUpperCase() || "";

    const lastInitial =
      user?.lastName?.charAt(0).toUpperCase() || "";

    return `${firstInitial}${lastInitial}`;
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
                <h1>
                  {isOwnProfile
                    ? "My Profile"
                    : "Member Profile"}
                </h1>

                <p>
                  {isOwnProfile
                    ? "Manage your professional information."
                    : "View professional information."}
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
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  getInitials()
                )}
              </div>

              <div>
                <h2>
                  {user?.firstName} {user?.lastName}
                </h2>

                <p>
                  {user?.headline ||
                    "No professional headline added"}
                </p>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="profile-relationship">
                <strong>Relationship: </strong>

                {relationshipLoading
                  ? "Checking..."
                  : relationshipStatus === "CONNECTED"
                  ? "Connected"
                  : relationshipStatus === "PENDING"
                  ? "Pending"
                  : relationshipStatus === "RESPOND"
                  ? "Respond"
                  : relationshipStatus === "NONE"
                  ? "Not connected"
                  : relationshipStatus === "SELF"
                  ? "This is your profile"
                  : "Unknown"}

                {!relationshipLoading && (
                  <div
                    className="connection-actions"
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    {relationshipStatus === "NONE" && (
                      <button
                        type="button"
                        className="auth-button"
                        onClick={handleConnect}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? "Sending..."
                          : "Connect"}
                      </button>
                    )}

                    {relationshipStatus ===
                      "PENDING" && (
                      <button
                        type="button"
                        className="auth-button"
                        disabled
                      >
                        Pending
                      </button>
                    )}

                    {relationshipStatus ===
                      "RESPOND" && (
                      <>
                        <button
                          type="button"
                          className="auth-button"
                          onClick={handleAccept}
                          disabled={
                            actionLoading ||
                            !connectionId
                          }
                        >
                          {actionLoading
                            ? "Processing..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          className="auth-button"
                          onClick={handleReject}
                          disabled={
                            actionLoading ||
                            !connectionId
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {relationshipStatus ===
                      "CONNECTED" && (
                      <>
                        <button
                          type="button"
                          className="auth-button"
                          onClick={handleMessage}
                        >
                          Message
                        </button>

                        <button
                          type="button"
                          className="auth-button"
                          onClick={handleRemove}
                          disabled={actionLoading}
                        >
                          {actionLoading
                            ? "Removing..."
                            : "Remove Connection"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {isOwnProfile ? (
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
                  <label htmlFor="photoUrl">
                    Profile photo URL
                  </label>

                  <input
                    id="photoUrl"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={(event) =>
                      setPhotoUrl(event.target.value)
                    }
                  />

                  <small className="form-help">
                    Add an image URL to display your profile photo.
                  </small>
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

                <div className="form-group">
                  <label>Experience</label>

                  {experience.map((item, index) => (
                    <div
                      key={index}
                      className="form-group"
                    >
                      <input
                        type="text"
                        placeholder="Role"
                        value={item.role}
                        onChange={(event) =>
                          handleExperienceChange(
                            index,
                            "role",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Company"
                        value={item.company}
                        onChange={(event) =>
                          handleExperienceChange(
                            index,
                            "company",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="month"
                        value={item.startDate}
                        onChange={(event) =>
                          handleExperienceChange(
                            index,
                            "startDate",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="month"
                        value={item.endDate || ""}
                        onChange={(event) =>
                          handleExperienceChange(
                            index,
                            "endDate",
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="auth-button"
                        onClick={() =>
                          removeExperience(index)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="auth-button"
                    onClick={addExperience}
                  >
                    Add Experience
                  </button>
                </div>

                <div className="form-group">
                  <label>Education</label>

                  {education.map((item, index) => (
                    <div
                      key={index}
                      className="form-group"
                    >
                      <input
                        type="text"
                        placeholder="Institution"
                        value={item.institution}
                        onChange={(event) =>
                          handleEducationChange(
                            index,
                            "institution",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Degree"
                        value={item.degree}
                        onChange={(event) =>
                          handleEducationChange(
                            index,
                            "degree",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="month"
                        value={item.startDate}
                        onChange={(event) =>
                          handleEducationChange(
                            index,
                            "startDate",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="month"
                        value={item.endDate || ""}
                        onChange={(event) =>
                          handleEducationChange(
                            index,
                            "endDate",
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="auth-button"
                        onClick={() =>
                          removeEducation(index)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="auth-button"
                    onClick={addEducation}
                  >
                    Add Education
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-button profile-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </form>
            ) : (
              <div className="profile-details">
                <div className="form-group">
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <p>
                    {user?.location ||
                      "No location added"}
                  </p>
                </div>

                <div className="form-group">
                  <label>About</label>
                  <p>
                    {user?.about ||
                      "No information added"}
                  </p>
                </div>

                <div className="form-group">
                  <label>Skills</label>

                  <p>
                    {user?.skills &&
                    user.skills.length > 0
                      ? user.skills.join(", ")
                      : "No skills added"}
                  </p>
                </div>

                <div className="form-group">
                  <label>Experience</label>

                  {user?.experience &&
                  user.experience.length > 0 ? (
                    user.experience.map(
                      (item, index) => (
                        <div key={index}>
                          <p>
                            <strong>
                              {item.role}
                            </strong>
                          </p>

                          <p>{item.company}</p>

                          <p>
                            {item.startDate} -{" "}
                            {item.endDate ||
                              "Present"}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <p>No experience added</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Education</label>

                  {user?.education &&
                  user.education.length > 0 ? (
                    user.education.map(
                      (item, index) => (
                        <div key={index}>
                          <p>
                            <strong>
                              {item.degree}
                            </strong>
                          </p>

                          <p>
                            {item.institution}
                          </p>

                          <p>
                            {item.startDate} -{" "}
                            {item.endDate ||
                              "Present"}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <p>No education added</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;