import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { BlogPost, BlogPostFilters, BlogStats } from "@/lib/types";
import { useMemo, useState, useEffect } from "react";

const supabase = createClient();

// Custom hook for debounced search
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fetcher function for SWR
const fetcher = async (key: string) => {
  const [, filters] = key.split("|");
  const parsedFilters: BlogPostFilters = filters ? JSON.parse(filters) : {};

  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply filters
  if (parsedFilters.category && parsedFilters.category !== "All") {
    query = query.eq("category", parsedFilters.category);
  }

  if (parsedFilters.status && parsedFilters.status !== "All") {
    query = query.eq("status", parsedFilters.status);
  }

  if (parsedFilters.search) {
    query = query.or(
      `title.ilike.%${parsedFilters.search}%,excerpt.ilike.%${parsedFilters.search}%`
    );
  }

  if (parsedFilters.featured !== undefined) {
    query = query.eq("featured", parsedFilters.featured);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as BlogPost[];
};

// Hook to fetch all blog posts with filters
export function useBlogPosts(filters: BlogPostFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    `blog-posts|${JSON.stringify(filters)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Dedupe requests for 1 minute
      revalidateIfStale: true,
      revalidateOnMount: true,
      refreshInterval: 0, // No automatic refresh
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    posts: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook to fetch published blog posts only (for public pages)
export function usePublishedBlogPosts(
  filters: Omit<BlogPostFilters, "status"> = {}
) {
  return useBlogPosts({ ...filters, status: "published" });
}

// Hook to fetch a single blog post by slug
export function useBlogPost(slug: string) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `blog-post-${slug}` : null,
    async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        throw error;
      }

      // Increment view count
      if (data) {
        await supabase
          .from("blog_posts")
          .update({ views: data.views + 1 })
          .eq("id", data.id);
      }

      return data as BlogPost;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes - longer cache for individual posts
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    post: data,
    isLoading,
    error,
    mutate,
  };
}

// Hook to fetch related blog posts
export function useRelatedBlogPosts(
  currentPostId: string,
  category: string,
  limit = 3
) {
  const { data, error, isLoading } = useSWR(
    currentPostId && category
      ? `related-posts-${currentPostId}-${category}`
      : null,
    async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("category", category)
        .neq("id", currentPostId)
        .order("views", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as BlogPost[];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    posts: data || [],
    isLoading,
    error,
  };
}

// Hook to fetch blog statistics (for admin dashboard)
export function useBlogStats() {
  const { data, error, isLoading } = useSWR(
    "blog-stats",
    async () => {
      const [totalResult, publishedResult, draftResult, viewsResult] =
        await Promise.all([
          supabase.from("blog_posts").select("id", { count: "exact" }),
          supabase
            .from("blog_posts")
            .select("id", { count: "exact" })
            .eq("status", "published"),
          supabase
            .from("blog_posts")
            .select("id", { count: "exact" })
            .eq("status", "draft"),
          supabase.from("blog_posts").select("views"),
        ]);

      const totalViews =
        viewsResult.data?.reduce((sum, post) => sum + (post.views || 0), 0) ||
        0;

      return {
        total: totalResult.count || 0,
        published: publishedResult.count || 0,
        drafts: draftResult.count || 0,
        totalViews,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data || { total: 0, published: 0, drafts: 0, totalViews: 0 },
    isLoading,
    error,
  };
}

// Function to create a new blog post
export async function createBlogPost(postData: Partial<BlogPost>) {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("User not authenticated");
  }

  // Get user profile for author info
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can create blog posts");
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...postData,
      author_id: user.user.id,
      author_name: profile.full_name || "Admin",
      published_at:
        postData.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as BlogPost;
}

// Function to update a blog post
export async function updateBlogPost(id: string, postData: Partial<BlogPost>) {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can update blog posts");
  }

  const updateData = { ...postData };

  // Set published_at if changing from draft to published
  if (postData.status === "published") {
    const { data: currentPost } = await supabase
      .from("blog_posts")
      .select("status, published_at")
      .eq("id", id)
      .single();

    if (currentPost?.status === "draft" && !currentPost.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as BlogPost;
}

// Function to delete a blog post
export async function deleteBlogPost(id: string) {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can delete blog posts");
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

// Function to upload blog image to Supabase storage
export async function uploadBlogImage(file: File): Promise<string> {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can upload blog images");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from("blog-images")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("blog-images").getPublicUrl(filePath);

  return publicUrl;
}
