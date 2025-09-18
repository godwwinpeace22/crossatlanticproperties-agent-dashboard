"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Clock,
  Globe,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteBlogPost } from "@/hooks/use-blog";
import { BlogPost } from "@/lib/types";
import { QuillRenderer } from "@/components/quill-renderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BlogViewPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load blog post");
      router.push("/dashboard/admin/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      await deleteBlogPost(post.id);
      toast.success("Blog post deleted successfully");
      router.push("/dashboard/admin/blog");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-500">
            <Globe className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary">
            <Edit className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container-custom py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/admin/blog">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Posts
                  </Link>
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="container-custom py-8">
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading blog post...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container-custom py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/blog">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Posts
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Not Found Content */}
        <div className="container-custom py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Post Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The blog post you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/dashboard/admin/blog")}>
              Back to Blog Management
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/admin/blog")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author_name || "Unknown Author"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : "Not published"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views.toLocaleString()} views
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {post.status === "published" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Live
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/admin/blog/edit/${post.id}`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {/* Featured Image */}
                {post.image_url && (
                  <div className="mb-8">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      width={800}
                      height={400}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Excerpt */}
                {post.excerpt && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Excerpt
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Content
                  </h3>
                  <QuillRenderer content={post.content || ""} />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Details */}
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(post.status)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {post.category || "Uncategorized"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Slug
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {post.slug}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Featured
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {post.featured ? "Yes" : "No"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Created
                  </label>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                    <Clock className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Updated
                  </label>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                    <Clock className="h-3 w-3" />
                    {new Date(post.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {post.status === "published" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Live Post
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/dashboard/admin/blog/edit/${post.id}`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{post?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
