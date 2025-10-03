"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, MapPin, Info, X } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

// City color palette
const CITY_COLORS = [
  {
    stroke: "#f97316",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "text-orange-500",
  },
  {
    stroke: "#3b82f6",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-500",
  },
  {
    stroke: "#10b981",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: "text-green-500",
  },
  {
    stroke: "#8b5cf6",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    icon: "text-purple-500",
  },
  {
    stroke: "#ec4899",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    icon: "text-pink-500",
  },
  {
    stroke: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: "text-amber-500",
  },
];

interface MarketSettings {
  [cityName: string]: { basePrice: number; growthRate: number };
}

// Generate multi-city comparison data based on selected cities and their settings
const generateMultiCityData = (
  selectedCities: string[],
  marketSettings: MarketSettings
) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months.map((month, index) => {
    const dataPoint: any = { month };
    selectedCities.forEach((city) => {
      const metrics = marketSettings[city] || {
        basePrice: 35000000,
        growthRate: 0.025,
      };
      const variation = (Math.random() - 0.5) * 0.05;
      const growth = metrics.growthRate * index;
      dataPoint[city] = Math.round(
        metrics.basePrice * (1 + growth + variation)
      );
    });
    return dataPoint;
  });
};

export default function MarketAnalysisPage() {
  const { locations, isLoading } = useLocations();
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [multiCityData, setMultiCityData] = useState<any[]>([]);
  const [marketSettings, setMarketSettings] = useState<MarketSettings>({});
  const supabase = createClient();

  // Fetch market settings from database
  useEffect(() => {
    const fetchMarketSettings = async () => {
      const { data, error } = await supabase
        .from("market_analysis_settings")
        .select("city_name, base_price, growth_rate")
        .eq("is_active", true);

      if (data && !error) {
        const settings: MarketSettings = {};
        data.forEach((item) => {
          settings[item.city_name] = {
            basePrice: item.base_price,
            growthRate: item.growth_rate,
          };
        });
        setMarketSettings(settings);
      }
    };

    fetchMarketSettings();
  }, []);

  // Initialize with first 4 cities from database
  useEffect(() => {
    if (locations.length > 0 && selectedCities.length === 0) {
      const defaultCities = locations
        .slice(0, Math.min(4, locations.length))
        .map((loc) => loc.name);
      setSelectedCities(defaultCities);
    }
  }, [locations, selectedCities.length]);

  // Regenerate data when selected cities or settings change
  useEffect(() => {
    if (selectedCities.length > 0 && Object.keys(marketSettings).length > 0) {
      setMultiCityData(generateMultiCityData(selectedCities, marketSettings));
    }
  }, [selectedCities, marketSettings]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(price);
  };

  const formatTooltipPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  // Handle city selection
  const handleAddCity = (cityName: string) => {
    if (selectedCities.length < 4 && !selectedCities.includes(cityName)) {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  const handleRemoveCity = (cityName: string) => {
    setSelectedCities(selectedCities.filter((city) => city !== cityName));
  };

  // Available cities to add (not already selected)
  const availableCities = locations.filter(
    (loc) => !selectedCities.includes(loc.name)
  );

  // Get city stats with dynamic colors
  const cityStatsWithColors = useMemo(() => {
    return selectedCities.map((city, index) => ({
      city,
      colors: CITY_COLORS[index % CITY_COLORS.length],
    }));
  }, [selectedCities]);

  // Calculate highest growth city
  const highestGrowthCity = useMemo(() => {
    if (multiCityData.length === 0 || selectedCities.length === 0) return null;

    let maxGrowth = -Infinity;
    let topCity = "";

    selectedCities.forEach((city) => {
      const firstMonth = multiCityData[0]?.[city] || 0;
      const lastMonth = multiCityData[multiCityData.length - 1]?.[city] || 0;
      const growth =
        firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

      if (growth > maxGrowth) {
        maxGrowth = growth;
        topCity = city;
      }
    });

    return { city: topCity, growth: maxGrowth };
  }, [multiCityData, selectedCities]);

  // Calculate highest price city
  const highestPriceCity = useMemo(() => {
    if (multiCityData.length === 0 || selectedCities.length === 0) return null;

    let maxAvg = -Infinity;
    let topCity = "";

    selectedCities.forEach((city) => {
      const avgPrice =
        multiCityData.reduce((sum, item) => sum + (item[city] || 0), 0) /
        (multiCityData.length || 1);

      if (avgPrice > maxAvg) {
        maxAvg = avgPrice;
        topCity = city;
      }
    });

    return { city: topCity, avgPrice: maxAvg };
  }, [multiCityData, selectedCities]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
        <p className="text-muted-foreground">
          Compare land appreciation rates across cities
        </p>
      </div>

      {/* City Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Cities to Compare</CardTitle>
          <CardDescription>
            Choose up to 4 cities to compare their land appreciation rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Cities */}
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city, index) => (
              <Badge
                key={city}
                variant="secondary"
                className="text-sm py-2 px-3"
                style={{
                  backgroundColor:
                    CITY_COLORS[index % CITY_COLORS.length].stroke + "20",
                  color: CITY_COLORS[index % CITY_COLORS.length].stroke,
                  borderColor: CITY_COLORS[index % CITY_COLORS.length].stroke,
                }}
              >
                {city}
                <button
                  onClick={() => handleRemoveCity(city)}
                  className="ml-2 hover:opacity-70"
                  aria-label={`Remove ${city}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add City Dropdown */}
          {selectedCities.length < 4 && availableCities.length > 0 && (
            <div className="flex gap-2 items-center">
              <Select onValueChange={handleAddCity}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Add a city to compare" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}, {location.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                ({selectedCities.length}/4 cities selected)
              </span>
            </div>
          )}

          {selectedCities.length === 4 && (
            <p className="text-sm text-muted-foreground">
              Maximum of 4 cities reached. Remove a city to add another.
            </p>
          )}

          {selectedCities.length === 0 && (
            <p className="text-sm text-amber-600">
              Please select at least one city to view the analysis.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedCities.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Land Appreciation Comparison</CardTitle>
              <CardDescription>
                Compare appreciation rates over 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={multiCityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatPrice(value)} />
                    <Tooltip
                      formatter={(value: number) => formatTooltipPrice(value)}
                      labelStyle={{ color: "#000" }}
                    />
                    <Legend />
                    {selectedCities.map((city, index) => (
                      <Line
                        key={city}
                        type="monotone"
                        dataKey={city}
                        stroke={CITY_COLORS[index % CITY_COLORS.length].stroke}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cityStatsWithColors.map((stat) => {
                  const firstMonth = multiCityData[0]?.[stat.city] || 0;
                  const lastMonth =
                    multiCityData[multiCityData.length - 1]?.[stat.city] || 0;
                  const appreciation =
                    firstMonth > 0
                      ? ((lastMonth - firstMonth) / firstMonth) * 100
                      : 0;
                  const avgPrice =
                    multiCityData.reduce(
                      (sum, item) => sum + (item[stat.city] || 0),
                      0
                    ) / (multiCityData.length || 1);

                  return (
                    <Card
                      key={stat.city}
                      className={`${stat.colors.bg} ${stat.colors.border} border-2`}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-lg font-bold ${stat.colors.text}`}
                            >
                              {stat.city}
                            </h4>
                            <MapPin className={`h-5 w-5 ${stat.colors.icon}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Average Price
                            </p>
                            <p
                              className={`text-xl font-bold ${stat.colors.text}`}
                            >
                              {formatPrice(avgPrice)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp
                              className={`h-4 w-4 ${stat.colors.icon}`}
                            />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                12-Month Growth
                              </p>
                              <p
                                className={`text-lg font-bold ${stat.colors.text}`}
                              >
                                +{appreciation.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-current/20">
                            <p className="text-xs text-muted-foreground">
                              Current Value
                            </p>
                            <p
                              className={`text-sm font-semibold ${stat.colors.text}`}
                            >
                              {formatPrice(lastMonth)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
