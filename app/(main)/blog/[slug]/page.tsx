"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  User,
  Share2,
  Heart,
  ArrowLeft,
  Tag,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BlogPost } from "@/lib/types";
import { QuillRenderer } from "@/components/quill-renderer";
import { useBlogPost, useRelatedBlogPosts } from "@/hooks/use-blog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BlogPostPageSkeleton,
  BlogPostSkeleton,
} from "@/components/blog-skeletons";

const supabase = createClient();

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Fetch blog post using optimized SWR hook
  const {
    post: blogPost,
    error: postError,
    isLoading: postLoading,
  } = useBlogPost(params.slug);

  // Fetch related posts using optimized hook (only after we have the main post)
  const {
    posts: relatedPosts,
    error: relatedError,
    isLoading: relatedLoading,
  } = useRelatedBlogPosts(blogPost?.id || "", blogPost?.category || "", 3);

  const loading = postLoading;
  const error =
    postError?.message || (postError ? "Failed to load blog post" : null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blogPost?.title,
        text: blogPost?.excerpt || undefined,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers without native sharing
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content?.split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  if (loading) {
    return <BlogPostPageSkeleton />;
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Blog Post Not Found"}
          </h2>
          <p className="text-gray-600 mb-4">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Navigation */}
      <div className="bg-gray-50 py-4">
        <div className="container-custom">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Meta Information */}
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">
                {blogPost.category || "Uncategorized"}
              </Badge>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {blogPost.author_name || "Unknown Author"}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(blogPost.published_at || blogPost.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {getReadTime(blogPost.content || "")}
                </div>
              </div>
            </div>

            {/* Title and Excerpt */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blogPost.title}
            </h1>
            {blogPost.excerpt && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {blogPost.excerpt}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  isLiked ? "text-red-500 border-red-500" : ""
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {likes}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Tags */}
            {blogPost.tags && blogPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {blogPost.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {blogPost.image_url && (
        <section className="py-8">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <Image
                src={blogPost.image_url}
                alt={blogPost.title}
                width={1200}
                height={600}
                className="w-full h-[400px] md:h-[500px] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <QuillRenderer content={blogPost.content || ""} />
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Related Articles
            </h2>
            {relatedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BlogPostSkeleton key={i} />
                ))}
              </div>
            ) : relatedPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {post.image_url && (
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          width={400}
                          height={250}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="hover:text-orange-500 transition-colors"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.author_name || "Unknown"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {getReadTime(post.content || "")}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="text-center mt-12">
                  <Link href="/blog">
                    <Button variant="outline" size="lg">
                      View All Articles
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No related articles found.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
