"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export function useAuth() {
  const [authState, setAuthState] = useState<Omit<AuthState, "logout">>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error);
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
          });
          return;
        }

        setAuthState({
          user: user,
          loading: false,
          isAuthenticated: !!user,
        });
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        loading: false,
        isAuthenticated: !!session?.user,
      });
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Logout function
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });
  };

  return { ...authState, logout };
}
