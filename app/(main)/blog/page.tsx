"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, User, Search, Tag, Loader2 } from "lucide-react";
import { usePublishedBlogPosts, useDebounced } from "@/hooks/use-blog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FeaturedPostSkeleton,
  BlogPostsGridSkeleton,
} from "@/components/blog-skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "All",
  "Market Analysis",
  "Investment",
  "Buying Guide",
  "Commercial",
  "Finance",
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounced(searchQuery, 300);

  // Fetch published blog posts with debounced search
  const { posts, isLoading, error } = usePublishedBlogPosts({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    search: debouncedSearchQuery || undefined,
  });

  // Memoize filtered posts to avoid recalculation
  const { featuredPosts, regularPosts } = useMemo(() => {
    const featured = posts.filter((post) => post.featured);
    const regular = posts.filter((post) => !post.featured);
    return { featuredPosts: featured, regularPosts: regular };
  }, [posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateReadTime = (content: string | null) => {
    if (!content) return "5 min read";
    const wordsPerMinute = 200;
    const words = content.split(" ").length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Blog
          </h2>
          <p className="text-gray-600">
            There was an error loading the blog posts. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Real Estate Blog
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Expert insights, market analysis, and investment tips for the
              Nigerian real estate market
            </p>

            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-white text-gray-900"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full md:w-48 bg-white text-gray-900">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {isLoading ? (
        <FeaturedPostSkeleton />
      ) : featuredPosts.length > 0 ? (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="mb-12">
              <Badge
                variant="outline"
                className="mb-4 bg-orange-100 text-orange-600 border-orange-200"
              >
                Featured Article
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                Editor's Pick
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="secondary">{featuredPosts[0].category}</Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {featuredPosts[0].title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {featuredPosts[0].excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {featuredPosts[0].author_name || "Unknown"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(
                      featuredPosts[0].published_at ||
                        featuredPosts[0].created_at
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {calculateReadTime(featuredPosts[0].content)}
                  </div>
                </div>
                <Link href={`/blog/${featuredPosts[0].slug}`}>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Read Article
                  </Button>
                </Link>
              </div>
              <div className="relative">
                {featuredPosts[0].image_url ? (
                  <Image
                    src={featuredPosts[0].image_url}
                    alt={featuredPosts[0].title}
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-2xl object-cover w-full h-[400px]"
                  />
                ) : (
                  <div className="w-full h-[400px] bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container-custom">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Articles
            </h2>
            <p className="text-gray-600">
              Stay updated with the latest trends and insights in Nigerian real
              estate
            </p>
          </div>

          {isLoading ? (
            <BlogPostsGridSkeleton />
          ) : regularPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No blog posts found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                      {post.image_url ? (
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          width={400}
                          height={250}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}

                      <div className="p-6">
                        <Badge variant="outline" className="mb-3">
                          {post.category}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {post.author_name || "Unknown"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.published_at || post.created_at)}
                          </div>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                <Tag className="h-2 w-2" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
