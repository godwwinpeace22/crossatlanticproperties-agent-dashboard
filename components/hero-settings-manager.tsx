"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const DEFAULT_TITLE = "Find Your Dream Home";
const DEFAULT_SUBTITLE =
  "Discover premium properties across Africa with intelligent matching technology that connects you to your perfect home or investment opportunity";

type SlideType = "image" | "video";

interface HeroSlide {
  type: SlideType;
  url: string;
  poster?: string;
}

const defaultSlides: HeroSlide[] = [
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
];

export function HeroSettingsManager() {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const slideCount = useMemo(() => slides.length, [slides.length]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value, setting_type")
        .in("setting_key", ["hero_title", "hero_subtitle", "hero_slides"]);

      if (error) throw error;

      const settingsMap = new Map<string, { value: string; type: string }>();
      data?.forEach((setting) => {
        settingsMap.set(setting.setting_key, {
          value: setting.setting_value,
          type: setting.setting_type,
        });
      });

      const storedTitle = settingsMap.get("hero_title")?.value;
      const storedSubtitle = settingsMap.get("hero_subtitle")?.value;
      const storedSlidesRaw = settingsMap.get("hero_slides")?.value;

      setTitle(storedTitle || DEFAULT_TITLE);
      setSubtitle(storedSubtitle || DEFAULT_SUBTITLE);

      if (storedSlidesRaw) {
        try {
          const parsedSlides = JSON.parse(storedSlidesRaw);
          if (Array.isArray(parsedSlides)) {
            const normalized = parsedSlides
              .map((slide) => {
                if (!slide || !slide.url) return null;
                const type = slide.type === "video" ? "video" : "image";
                return {
                  type,
                  url: String(slide.url),
                  poster: slide.poster ? String(slide.poster) : undefined,
                } as HeroSlide;
              })
              .filter(Boolean) as HeroSlide[];

            setSlides(normalized.length > 0 ? normalized : defaultSlides);
          }
        } catch {
          setSlides(defaultSlides);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load hero settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlide = () => {
    setSlides((prev) => [...prev, { type: "image", url: "" }]);
  };

  const handleRemoveSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlideChange = (
    index: number,
    field: keyof HeroSlide,
    value: string,
  ) => {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === index
          ? {
              ...slide,
              [field]: value,
            }
          : slide,
      ),
    );
  };

  const handleSave = async () => {
    const filteredSlides = slides
      .map((slide) => ({
        type: slide.type,
        url: slide.url.trim(),
        poster: slide.poster?.trim() || undefined,
      }))
      .filter((slide) => slide.url.length > 0);

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Hero title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("system_settings").upsert([
        {
          setting_key: "hero_title",
          setting_value: title.trim(),
          setting_type: "string",
          description: "Homepage hero title",
          category: "homepage",
          is_public: true,
        },
        {
          setting_key: "hero_subtitle",
          setting_value: subtitle.trim(),
          setting_type: "string",
          description: "Homepage hero subtitle",
          category: "homepage",
          is_public: true,
        },
        {
          setting_key: "hero_slides",
          setting_value: JSON.stringify(
            filteredSlides.length > 0 ? filteredSlides : defaultSlides,
          ),
          setting_type: "json",
          description: "Homepage hero slides (image/video)",
          category: "homepage",
          is_public: true,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hero settings updated successfully",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save hero settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Hero</CardTitle>
        <CardDescription>
          Update the hero title, subtitle, and background slides (image or
          video).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Hero Title</Label>
            <Input
              id="hero-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Find Your Dream Home"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Tip: use "|" to split the title into two lines, e.g. "Find Your |
              Dream Home".
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
            <Textarea
              id="hero-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Discover premium properties..."
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Slides</h4>
              <p className="text-sm text-muted-foreground">
                Add one or more slides. Each slide can be an image or video.
              </p>
            </div>
            <Button variant="outline" onClick={handleAddSlide}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </div>

          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div
                key={`${slide.type}-${index}`}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Slide {index + 1}</div>
                  {slideCount > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSlide(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={slide.type}
                      onChange={(e) =>
                        handleSlideChange(
                          index,
                          "type",
                          e.target.value as SlideType,
                        )
                      }
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Media URL</Label>
                    <Input
                      value={slide.url}
                      onChange={(e) =>
                        handleSlideChange(index, "url", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Video Poster (optional)</Label>
                    <Input
                      value={slide.poster || ""}
                      onChange={(e) =>
                        handleSlideChange(index, "poster", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Hero Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
