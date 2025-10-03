import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PropertyInterestStatus {
  hasInterest: boolean;
  interestId: string | null;
  status: string | null;
  isLoading: boolean;
}

export function usePropertyInterest(
  propertyId: string
): PropertyInterestStatus {
  const { user, isAuthenticated } = useAuth();
  const [hasInterest, setHasInterest] = useState(false);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExistingInterest = async () => {
      if (!isAuthenticated || !user || !propertyId) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("property_interests")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("property_id", propertyId)
          .maybeSingle();

        if (error) {
          console.error("Error checking property interest:", error);
          setHasInterest(false);
          setInterestId(null);
          setStatus(null);
        } else if (data) {
          setHasInterest(true);
          setInterestId(data.id);
          setStatus(data.status);
        } else {
          setHasInterest(false);
          setInterestId(null);
          setStatus(null);
        }
      } catch (error) {
        console.error("Error checking property interest:", error);
        setHasInterest(false);
        setInterestId(null);
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingInterest();
  }, [propertyId, user, isAuthenticated]);

  return {
    hasInterest,
    interestId,
    status,
    isLoading,
  };
}
