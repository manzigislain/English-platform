"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Flag, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "QUESTION" });
  const [showNewPost, setShowNewPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPosts = async () => {
    try {
      const data = await api.community.getPosts(page);
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) return;
    setSubmitting(true);
    try {
      await api.community.createPost(newPost);
      setNewPost({ title: "", content: "", type: "QUESTION" });
      setShowNewPost(false);
      loadPosts();
    } catch (err: any) {
      alert(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await api.community.toggleLike(postId);
      setLikedPosts({ ...likedPosts, [postId]: res.liked });
      loadPosts();
    } catch { /* ignore */ }
  };

  const handleReport = async (postId: string) => {
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    try {
      await api.community.reportPost(postId, reason);
      alert("Report submitted. Thank you.");
    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="mt-2 text-text-light">Learn together, grow together</p>
      </div>

      {/* Create Post */}
      <button
        onClick={() => setShowNewPost(!showNewPost)}
        className="mb-8 flex w-full items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          +
        </div>
        <span className="text-text-light">Share something with the community...</span>
      </button>

      {showNewPost && (
        <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <input
            type="text"
            placeholder="Post title..."
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="mb-3 w-full rounded-lg border border-border px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            placeholder="Share your thoughts..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            rows={3}
            className="mb-3 w-full resize-none rounded-lg border border-border px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex items-center justify-between">
            <select
              value={newPost.type}
              onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="QUESTION">Question</option>
              <option value="TESTIMONY">Testimony</option>
              <option value="MOTIVATION">Motivation</option>
              <option value="LEARNING_TIP">Learning Tip</option>
            </select>
            <button
              onClick={handleCreatePost}
              disabled={submitting || !newPost.title || !newPost.content}
              className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(post.user?.fullName || "U").charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{post.user?.fullName || "Unknown"}</div>
                  <div className="text-xs text-text-light">{formatDate(post.createdAt)}</div>
                </div>
              </div>
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                post.type === "QUESTION" ? "bg-blue-50 text-blue-600" :
                post.type === "TESTIMONY" ? "bg-green-50 text-green-600" :
                post.type === "LEARNING_TIP" ? "bg-amber-50 text-amber-600" :
                "bg-purple-50 text-purple-600"
              )}>
                {post.type === "QUESTION" ? "Question" : post.type === "TESTIMONY" ? "Testimony" : post.type === "LEARNING_TIP" ? "Tip" : "Motivation"}
              </span>
            </div>

            <h3 className="mb-2 text-lg font-bold">{post.title}</h3>
            <p className="mb-4 text-text-light">{post.content}</p>

            <div className="flex items-center gap-6 border-t border-border pt-3">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 text-sm text-text-light transition-colors hover:text-red-500"
              >
                <Heart className={cn("h-4 w-4", likedPosts[post.id] && "fill-red-500 text-red-500")} />
                {(post._count?.likes || 0) + (likedPosts[post.id] ? 1 : 0)}
              </button>
              <button className="flex items-center gap-2 text-sm text-text-light transition-colors hover:text-primary">
                <MessageCircle className="h-4 w-4" />
                {post._count?.comments || 0}
              </button>
              <button onClick={() => handleReport(post.id)} className="ml-auto flex items-center gap-2 text-sm text-text-light transition-colors hover:text-red-500">
                <Flag className="h-4 w-4" /> Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-text-light" />
          <h3 className="mb-2 text-lg font-bold">No posts yet</h3>
          <p className="text-text-light">Be the first to share something with the community!</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-text-light">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
