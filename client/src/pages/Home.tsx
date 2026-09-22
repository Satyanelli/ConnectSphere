import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { FormEvent } from "react";

import api from "../api/axios";
import Navbar from "../components/Navbar";

import type { RootState } from "../store/store";

interface PostAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  headline?: string;
}

interface Post {
  _id: string;
  author: PostAuthor;
  content: string;
  imageUrl?: string;
  likes: string[];
  createdAt: string;
}

interface CommentAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface Comment {
  _id: string;
  post: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
}

function Home() {
  const currentUser = useSelector(
    (state: RootState) => state.auth.user
  );

  const [posts, setPosts] = useState<Post[]>([]);

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [comments, setComments] = useState<
    Record<string, Comment[]>
  >({});

  const [commentText, setCommentText] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [likingPostId, setLikingPostId] = useState<string | null>(
    null
  );

  const [commentingPostId, setCommentingPostId] = useState<
    string | null
  >(null);

  const [loadingCommentsPostId, setLoadingCommentsPostId] =
    useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] =
    useState<string | null>(null);

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  // =========================
  // Fetch Posts
  // =========================

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/posts");

      console.log("Posts API response:", response.data);

      const receivedPosts = response.data.posts || [];

      setPosts(
        receivedPosts.map((post: any) => ({
          ...post,
          likes: Array.isArray(post.likes)
            ? post.likes
            : [],
        }))
      );
    } catch (error: any) {
      console.error("Get posts error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load posts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // =========================
  // Create Post
  // =========================

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

      const response = await api.post("/posts", {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      const newPost = {
        ...response.data.post,
        likes: Array.isArray(response.data.post.likes)
          ? response.data.post.likes
          : [],
      };

      setPosts((currentPosts) => [
        newPost,
        ...currentPosts,
      ]);

      setContent("");
      setImageUrl("");
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

  // =========================
  // Like / Unlike
  // =========================

  const handleLike = async (postId: string) => {
    try {
      setLikingPostId(postId);
      setError("");

      const response = await api.post(
        `/posts/${postId}/like`
      );

      console.log("Like API response:", response.data);

      const { likeCount, liked } = response.data;

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          const currentLikes = Array.isArray(post.likes)
            ? post.likes
            : [];

          let updatedLikes = [...currentLikes];

          if (liked) {
            if (
              currentUser &&
              !updatedLikes.includes(currentUser.id)
            ) {
              updatedLikes.push(currentUser.id);
            }
          } else {
            updatedLikes = updatedLikes.filter(
              (userId) => userId !== currentUser?.id
            );
          }

          return {
            ...post,
            likes: updatedLikes.slice(0, likeCount),
          };
        })
      );
    } catch (error: any) {
      console.error("Like post error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to like post."
      );
    } finally {
      setLikingPostId(null);
    }
  };

  // =========================
  // Fetch Comments
  // =========================

  const fetchComments = async (postId: string) => {
    try {
      setLoadingCommentsPostId(postId);
      setError("");

      const response = await api.get(
        `/comments/${postId}/comments`
      );

      console.log("Comments API response:", response.data);

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: response.data.comments || [],
      }));
    } catch (error: any) {
      console.error("Get comments error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load comments."
      );
    } finally {
      setLoadingCommentsPostId(null);
    }
  };

  // =========================
  // Add Comment
  // =========================

  const handleCommentSubmit = async (
    event: FormEvent<HTMLFormElement>,
    postId: string
  ) => {
    event.preventDefault();

    const text = commentText[postId]?.trim();

    if (!text) {
      return;
    }

    try {
      setCommentingPostId(postId);
      setError("");

      const response = await api.post(
        `/comments/${postId}/comments`,
        {
          content: text,
        }
      );

      console.log(
        "Create comment response:",
        response.data
      );

      const newComment = response.data.comment;

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: [
          ...(currentComments[postId] || []),
          newComment,
        ],
      }));

      setCommentText((currentText) => ({
        ...currentText,
        [postId]: "",
      }));
    } catch (error: any) {
      console.error("Create comment error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to add comment."
      );
    } finally {
      setCommentingPostId(null);
    }
  };

  // =========================
  // Delete Comment
  // =========================

  const handleDeleteComment = async (
    commentId: string,
    postId: string
  ) => {
    try {
      setDeletingCommentId(commentId);
      setError("");

      await api.delete(`/comments/${commentId}`);

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: currentComments[postId].filter(
          (comment) => comment._id !== commentId
        ),
      }));
    } catch (error: any) {
      console.error("Delete comment error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete comment."
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  // =========================
  // Delete Post
  // =========================

  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      setError("");

      await api.delete(`/posts/${postId}`);

      setPosts((currentPosts) =>
        currentPosts.filter(
          (post) => post._id !== postId
        )
      );

      setComments((currentComments) => {
        const updatedComments = {
          ...currentComments,
        };

        delete updatedComments[postId];

        return updatedComments;
      });
    } catch (error: any) {
      console.error("Delete post error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete post."
      );
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div>
      <Navbar />

      <main className="home-page">
        <div className="home-container">

          {/* =========================
              Page Header
              ========================= */}

          <div className="home-header">
            <h1>Home</h1>

            <p>
              Stay connected with your professional network.
            </p>
          </div>

          {/* =========================
              Create Post
              ========================= */}

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
                rows={4}
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

              <button
                type="submit"
                className="post-button"
                disabled={posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </form>
          </div>

          {/* =========================
              Error
              ========================= */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* =========================
              Loading
              ========================= */}

          {loading && (
            <div className="home-placeholder">
              <p>Loading posts...</p>
            </div>
          )}

          {/* =========================
              Empty State
              ========================= */}

          {!loading && !error && posts.length === 0 && (
            <div className="home-placeholder">
              <h2>No posts yet</h2>

              <p>
                Be the first person to share something.
              </p>
            </div>
          )}

          {/* =========================
              Feed
              ========================= */}

          {!loading && posts.length > 0 && (
            <div className="feed">
              {posts.map((post) => {
                const postLikes = Array.isArray(post.likes)
                  ? post.likes
                  : [];

                const isLiked = currentUser
                  ? postLikes.includes(currentUser.id)
                  : false;

                const isOwnPost = currentUser
                  ? post.author?._id === currentUser.id
                  : false;

                const postComments =
                  comments[post._id] || [];

                return (
                  <article
                    key={post._id}
                    className="post-card"
                  >
                    {/* =========================
                        Post Header
                        ========================= */}

                    <div className="post-header">
                      <div className="post-avatar">
                        {post.author?.firstName
                          ?.charAt(0)
                          .toUpperCase()}

                        {post.author?.lastName
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>
                          {post.author?.firstName}{" "}
                          {post.author?.lastName}
                        </h3>

                        <p>
                          {post.author?.headline ||
                            "ConnectSphere member"}
                        </p>

                        <small>
                          {new Date(
                            post.createdAt
                          ).toLocaleString()}
                        </small>
                      </div>
                    </div>

                    {/* =========================
                        Post Content
                        ========================= */}

                    <div className="post-content">
                      <p>{post.content}</p>

                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Post"
                          className="post-image"
                        />
                      )}
                    </div>

                    {/* =========================
                        Post Footer
                        ========================= */}

                    <div className="post-footer">
                      <span>
                        {postLikes.length}{" "}
                        {postLikes.length === 1
                          ? "like"
                          : "likes"}
                      </span>

                      <div>
                        <button
                          type="button"
                          className={`like-button ${
                            isLiked ? "liked" : ""
                          }`}
                          onClick={() =>
                            handleLike(post._id)
                          }
                          disabled={
                            likingPostId === post._id
                          }
                        >
                          {isLiked
                            ? "♥ Liked"
                            : "♡ Like"}
                        </button>

                        {/* Delete Own Post */}

                        {isOwnPost && (
                          <button
                            type="button"
                            className="delete-post-button"
                            onClick={() =>
                              handleDeletePost(
                                post._id
                              )
                            }
                            disabled={
                              deletingPostId ===
                              post._id
                            }
                          >
                            {deletingPostId === post._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* =========================
                        Comments
                        ========================= */}

                    <div className="comments-section">
                      <h4>Comments</h4>

                      {/* Add Comment */}

                      <form
                        onSubmit={(event) =>
                          handleCommentSubmit(
                            event,
                            post._id
                          )
                        }
                      >
                        <input
                          type="text"
                          className="create-post-input"
                          placeholder="Write a comment..."
                          value={
                            commentText[post._id] || ""
                          }
                          onChange={(event) =>
                            setCommentText(
                              (currentText) => ({
                                ...currentText,
                                [post._id]:
                                  event.target.value,
                              })
                            )
                          }
                        />

                        <button
                          type="submit"
                          className="post-button"
                          disabled={
                            commentingPostId ===
                            post._id
                          }
                        >
                          {commentingPostId === post._id
                            ? "Commenting..."
                            : "Comment"}
                        </button>
                      </form>

                      {/* View Comments */}

                      <button
                        type="button"
                        className="like-button"
                        onClick={() =>
                          fetchComments(post._id)
                        }
                        disabled={
                          loadingCommentsPostId ===
                          post._id
                        }
                      >
                        {loadingCommentsPostId ===
                        post._id
                          ? "Loading..."
                          : "View comments"}
                      </button>

                      {/* No Comments */}

                      {postComments.length === 0 &&
                        comments[post._id] && (
                          <p className="form-help">
                            No comments yet.
                          </p>
                        )}

                      {/* Comments List */}

                      {postComments.length > 0 && (
                        <div className="comments-list">
                          {postComments.map((comment) => (
                            <div
                              key={comment._id}
                              className="comment-item"
                            >
                              <strong>
                                {comment.author?.firstName}{" "}
                                {comment.author?.lastName}
                              </strong>

                              <p>
                                {comment.content}
                              </p>

                              <small>
                                {new Date(
                                  comment.createdAt
                                ).toLocaleString()}
                              </small>

                              {/* Delete Own Comment */}

                              {currentUser &&
                                comment.author?._id ===
                                  currentUser.id && (
                                  <button
                                    type="button"
                                    className="delete-comment-button"
                                    onClick={() =>
                                      handleDeleteComment(
                                        comment._id,
                                        post._id
                                      )
                                    }
                                    disabled={
                                      deletingCommentId ===
                                      comment._id
                                    }
                                  >
                                    {deletingCommentId ===
                                    comment._id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;