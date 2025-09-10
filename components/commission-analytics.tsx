"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useState, useMemo } from "react"

interface Commission {
  id: string
  amount: string
  percentage: string
  level: number
  created_at: string
  purchase: {
    amount: string
    created_at: string
    property: { name: string }
    buyer: { full_name: string | null; email: string }
    seller: { full_name: string | null; email: string }
  }
}

interface CommissionAnalyticsProps {
  commissions: Commission[]
}

export function CommissionAnalytics({ commissions }: CommissionAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("6months")

  const filteredCommissions = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "3months":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "6months":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    return commissions.filter((c) => new Date(c.created_at) >= startDate)
  }, [commissions, timeRange])

  // Prepare data for earnings trend chart
  const earningsTrendData = useMemo(() => {
    const monthlyData: Record<string, number> = {}

    filteredCommissions.forEach((commission) => {
      const date = new Date(commission.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(commission.amount)
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        amount: Number(amount.toFixed(2)),
      }))
  }, [filteredCommissions])

  // Prepare data for level distribution
  const levelDistributionData = useMemo(() => {
    const levelData: Record<number, number> = {}

    filteredCommissions.forEach((commission) => {
      levelData[commission.level] = (levelData[commission.level] || 0) + Number(commission.amount)
    })

    return Object.entries(levelData).map(([level, amount]) => ({
      level: `Level ${level}`,
      amount: Number(amount.toFixed(2)),
    }))
  }, [filteredCommissions])

  // Prepare data for commission source pie chart
  const commissionSourceData = useMemo(() => {
    const sourceData: Record<string, number> = {}

    filteredCommissions.forEach((commission) => {
      const source = commission.level === 1 ? "Direct Sales" : `Level ${commission.level} Network`
      sourceData[source] = (sourceData[source] || 0) + Number(commission.amount)
    })

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

    return Object.entries(sourceData).map(([source, amount], index) => ({
      name: source,
      value: Number(amount.toFixed(2)),
      color: colors[index % colors.length],
    }))
  }, [filteredCommissions])

  if (commissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Commission Data</h3>
            <p className="text-muted-foreground">Start earning commissions to see analytics here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Commission Analytics</CardTitle>
              <CardDescription>Visual insights into your commission performance</CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Earnings Trend */}
            <div>
              <h4 className="text-sm font-medium mb-4">Earnings Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={earningsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Level Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4">Commission by Level</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={levelDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Sources</CardTitle>
          <CardDescription>Breakdown of earnings by source type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={commissionSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {commissionSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Source Breakdown</h4>
              {commissionSourceData.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="font-medium">${source.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
