"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, MapPin, Calendar } from "lucide-react";

// Mock data for market analysis
const cities = [
  {
    value: "lagos",
    label: "Lagos",
    areas: ["Victoria Island", "Ikoyi", "Lekki", "Ikeja"],
  },
  {
    value: "abuja",
    label: "Abuja",
    areas: ["Maitama", "Asokoro", "Wuse II", "Garki"],
  },
  {
    value: "enugu",
    label: "Enugu",
    areas: ["GRA", "Independence Layout", "New Haven", "Coal Camp"],
  },
  {
    value: "portharcourt",
    label: "Port Harcourt",
    areas: ["Old GRA", "New GRA", "D-Line", "Ada George"],
  },
];

const generateMockData = (cityName: string, areaName: string) => {
  const basePrice = Math.random() * 50000000 + 20000000; // Base price between 20M - 70M
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
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const seasonalFactor = Math.sin((index / 12) * 2 * Math.PI) * 0.05; // Seasonal pattern
    const trend = index * 0.02; // Slight upward trend

    return {
      month,
      price: Math.round(basePrice * (1 + variation + seasonalFactor + trend)),
      avgPrice: Math.round(basePrice * (1 + trend)),
      city: cityName,
      area: areaName,
    };
  });
};

const calculateTrend = (data: any[]) => {
  if (data.length < 2) return 0;
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  return ((lastPrice - firstPrice) / firstPrice) * 100;
};

export default function MarketAnalysisPage() {
  const [selectedCity, setSelectedCity] = useState("lagos");
  const [selectedArea, setSelectedArea] = useState("");
  const [marketData, setMarketData] = useState<any[]>([]);
  const [cityOverview, setCityOverview] = useState<any[]>([]);

  useEffect(() => {
    // Generate market data for selected city and area
    const city = cities.find((c) => c.value === selectedCity);
    if (city) {
      if (!selectedArea) {
        setSelectedArea(city.areas[0]);
      }

      const currentArea = selectedArea || city.areas[0];
      const data = generateMockData(city.label, currentArea);
      setMarketData(data);

      // Generate overview data for all areas in the city
      const overview = city.areas.map((area) => {
        const areaData = generateMockData(city.label, area);
        const trend = calculateTrend(areaData);
        const avgPrice =
          areaData.reduce((sum, item) => sum + item.price, 0) / areaData.length;

        return {
          area,
          avgPrice: Math.round(avgPrice),
          trend: Math.round(trend * 100) / 100,
          maxPrice: Math.max(...areaData.map((d) => d.price)),
          minPrice: Math.min(...areaData.map((d) => d.price)),
        };
      });

      setCityOverview(overview);
    }
  }, [selectedCity, selectedArea]);

  const overallTrend = calculateTrend(marketData);
  const currentCity = cities.find((c) => c.value === selectedCity);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Nigeria Real Estate Market Analysis
        </h1>
        <p className="text-muted-foreground">
          Price trends and market insights for major Nigerian cities
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {/* City and Area Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Market Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Area</label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCity?.areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Price
                  </p>
                  <p className="text-2xl font-bold">
                    {marketData.length > 0
                      ? formatPrice(
                          marketData.reduce(
                            (sum, item) => sum + item.price,
                            0
                          ) / marketData.length
                        )
                      : "₦0"}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    12-Month Trend
                  </p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {overallTrend > 0 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="text-green-500">
                          +{overallTrend.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <span className="text-red-500">
                          {overallTrend.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Market
                  </p>
                  <p className="text-2xl font-bold">{currentCity?.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedArea}
                  </p>
                </div>
                <Badge variant={overallTrend > 0 ? "default" : "destructive"}>
                  {overallTrend > 0 ? "Bullish" : "Bearish"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Price Trends</TabsTrigger>
          <TabsTrigger value="comparison">Area Comparison</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>
                Price Trend Analysis - {selectedArea}, {currentCity?.label}
              </CardTitle>
              <CardDescription>
                Monthly price movements over the past 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatPrice(value)} />
                    <Tooltip
                      formatter={(value: number) => [
                        formatTooltipPrice(value),
                        "Price",
                      ]}
                      labelStyle={{ color: "#000" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Area Comparison - {currentCity?.label}</CardTitle>
              <CardDescription>
                Average property prices across different areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityOverview}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" />
                    <YAxis tickFormatter={(value) => formatPrice(value)} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "avgPrice"
                          ? formatTooltipPrice(value)
                          : `${value}%`,
                        name === "avgPrice"
                          ? "Average Price"
                          : "12-Month Trend",
                      ]}
                      labelStyle={{ color: "#000" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="avgPrice"
                      fill="#2563eb"
                      name="Average Price"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cityOverview.map((area) => (
                  <Card key={area.area}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{area.area}</h4>
                        <p className="text-sm text-muted-foreground">
                          Avg: {formatPrice(area.avgPrice)}
                        </p>
                        <div className="flex items-center gap-2">
                          {area.trend > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              area.trend > 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {area.trend > 0 ? "+" : ""}
                            {area.trend}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-6">
            {/* Investment Opportunity Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-blue-900">
                    🏆 Prime Investment Window in Nigerian Real Estate
                  </h3>
                  <p className="text-blue-700 max-w-3xl mx-auto">
                    Nigeria's property market is experiencing unprecedented
                    growth driven by urbanization, economic expansion, and
                    increasing demand from both local and international
                    investors.
                    <strong>
                      {" "}
                      Don't miss this golden opportunity to secure your
                      financial future.
                    </strong>
                  </p>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Badge className="bg-green-100 text-green-800 px-4 py-2">
                      💰 15-25% Annual ROI Expected
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                      📈 Consistent Price Appreciation
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
                      🌍 International Investment Hub
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Why Invest Now?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-700">
                        Population Boom
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Nigeria's population of 220+ million is driving massive
                        housing demand.
                        <strong>
                          Early investors capture maximum appreciation.
                        </strong>
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-700">
                        Infrastructure Development
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Major projects like Lagos-Calabar coastal highway and
                        new airports are{" "}
                        <strong>tripling property values</strong> in strategic
                        locations.
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-700">
                        Economic Diversification
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Nigeria's shift from oil dependency to tech and services
                        is creating
                        <strong>new wealth centers</strong> and property
                        hotspots.
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-700">
                        Limited Supply, High Demand
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Housing deficit of 28+ million units creates
                        <strong>scarcity-driven price growth</strong> for
                        existing properties.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🚀 Investment Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800">
                        🏢 Buy & Hold Strategy
                      </h4>
                      <p className="text-sm text-green-700">
                        Purchase in emerging areas and hold for 3-5 years.
                        <strong>Average 20% annual appreciation</strong> in
                        prime locations.
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800">
                        🏠 Rental Income Focus
                      </h4>
                      <p className="text-sm text-blue-700">
                        Target areas with 8-12% rental yields.
                        <strong>Monthly passive income</strong> while property
                        appreciates.
                      </p>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800">
                        🏗️ Off-Plan Investments
                      </h4>
                      <p className="text-sm text-purple-700">
                        Buy during construction for 20-30% discounts.
                        <strong>Immediate equity gain</strong> upon completion.
                      </p>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-800">
                        📍 Location Diversification
                      </h4>
                      <p className="text-sm text-orange-700">
                        Spread investments across 2-3 cities to
                        <strong>minimize risk and maximize returns.</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Urgency Section */}
            <Card className="bg-gradient-to-r from-red-50 to-orange-100 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-red-800">
                    ⚡ Time-Sensitive Opportunity
                  </h3>
                  <p className="text-red-700 max-w-2xl mx-auto">
                    Property prices in prime Nigerian cities have increased by
                    <strong> 25-40% in the last 18 months.</strong> Industry
                    experts predict another 30% increase in the next 12 months
                    due to infrastructure projects and foreign investment
                    influx.
                  </p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <p className="text-lg font-bold text-red-800">
                      💡 Waiting Another Year Could Cost You ₦5-15 Million in
                      Appreciation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Market Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Current Market Dynamics</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>
                          Interest rates favorable for property investment
                          (12-15%)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>
                          Foreign exchange stability creating investor
                          confidence
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>
                          Government housing policies supporting private
                          investment
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>
                          Tech boom creating new millionaires seeking premium
                          properties
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Success Stories</h4>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>
                          "Bought in Lekki Phase 1 in 2020 for ₦45M, now worth
                          ₦78M. Best decision I ever made!"
                        </strong>{" "}
                        - Satisfied Investor
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚠️ Risk Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800">
                        Smart Investment Approach
                      </h4>
                      <p className="text-yellow-700 mt-1">
                        While Nigerian real estate offers excellent returns,
                        smart investors conduct due diligence, verify titles,
                        and work with reputable agents.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">
                        Mitigate Risks By:
                      </h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Verifying property titles and documentation</li>
                        <li>• Choosing established developers and locations</li>
                        <li>• Diversifying across multiple properties/areas</li>
                        <li>
                          • Working with licensed real estate professionals
                        </li>
                        <li>• Conducting thorough market research</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-blue-700 text-center">
                        <strong>
                          🛡️ Our platform connects you with verified properties
                          and trusted agents
                        </strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold">
                    🎯 Ready to Secure Your Financial Future?
                  </h3>
                  <p className="text-lg max-w-2xl mx-auto opacity-90">
                    Join thousands of smart investors who have already secured
                    their piece of Nigeria's booming real estate market. Browse
                    our verified properties and connect with expert agents
                    today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/properties"
                      className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                    >
                      🏠 Browse Premium Properties
                    </a>
                    <a
                      href="/contact"
                      className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
                    >
                      💬 Speak to Investment Expert
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
