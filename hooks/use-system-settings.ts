"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: "string" | "number" | "boolean" | "json";
  description?: string;
  category: string;
  is_public: boolean;
}

interface UseSystemSettingsReturn {
  settings: Record<string, any>;
  loading: boolean;
  error: string | null;
  getSetting: (key: string, defaultValue?: any) => any;
  refreshSettings: () => Promise<void>;
}

export function useSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const parseSettingValue = (setting: SystemSetting): any => {
    switch (setting.setting_type) {
      case "number":
        return Number(setting.setting_value);
      case "boolean":
        return setting.setting_value === "true";
      case "json":
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return setting.setting_value;
        }
      default:
        return setting.setting_value;
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("*");

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = parseSettingValue(setting);
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error("Error fetching system settings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue?: any): any => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();

    // Set up real-time subscription for settings changes
    const channel = supabase
      .channel("system_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    settings,
    loading,
    error,
    getSetting,
    refreshSettings,
  };
}

// Hook specifically for public settings that don't require authentication
export function usePublicSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const parseSettingValue = (setting: SystemSetting): any => {
    switch (setting.setting_type) {
      case "number":
        return Number(setting.setting_value);
      case "boolean":
        return setting.setting_value === "true";
      case "json":
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return setting.setting_value;
        }
      default:
        return setting.setting_value;
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("is_public", true);

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = parseSettingValue(setting);
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error("Error fetching public system settings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue?: any): any => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    getSetting,
    refreshSettings,
  };
}
