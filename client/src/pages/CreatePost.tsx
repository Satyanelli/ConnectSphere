
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function CreatePost() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleCreatePost = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }

    try {
      setPosting(true);
      setError("");

      await api.post("/posts", {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      setContent("");
      setImageUrl("");

      // Go back to Home after creating the post
      navigate("/");
    } catch (error: any) {
      console.error("Create post error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create post."
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <Navbar />

      <main className="home-page">
        <div className="home-container">
          <div className="home-header">
            <h1>Create Post</h1>

            <p>
              Share something with your professional
              network.
            </p>
          </div>

          <div className="create-post-card">
            <h2>Create a post</h2>

            <form onSubmit={handleCreatePost}>
              <textarea
                className="create-post-textarea"
                placeholder="What do you want to share?"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={6}
              />

              <input
                className="create-post-input"
                type="url"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(event.target.value)
                }
              />

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="post-button"
                disabled={posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreatePost;

