import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CommissionAnalytics } from "@/components/commission-analytics"
import { CommissionHistory } from "@/components/commission-history"
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react"

export default async function CommissionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get commission data with purchase and property details
  const { data: commissions } = await supabase
    .from("commissions")
    .select(`
      *,
      purchase:purchases (
        amount,
        created_at,
        property:properties (name),
        buyer:profiles!purchases_buyer_id_fkey (full_name, email),
        seller:profiles!purchases_seller_id_fkey (full_name, email)
      )
    `)
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate statistics
  const totalEarnings = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
  const thisMonthEarnings =
    commissions
      ?.filter((c) => {
        const commissionDate = new Date(c.created_at)
        const now = new Date()
        return commissionDate.getMonth() === now.getMonth() && commissionDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, c) => sum + Number(c.amount), 0) || 0

  const levelBreakdown =
    commissions?.reduce(
      (acc, c) => {
        acc[c.level] = (acc[c.level] || 0) + Number(c.amount)
        return acc
      },
      {} as Record<number, number>,
    ) || {}

  const totalTransactions = commissions?.length || 0
  const averageCommission = totalTransactions > 0 ? totalEarnings / totalTransactions : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Tracking</h1>
        <p className="text-muted-foreground">Monitor your earnings and commission performance</p>
      </div>

      {/* Commission Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Commission payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Breakdown */}
      {Object.keys(levelBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission by Level</CardTitle>
            <CardDescription>Breakdown of earnings by hierarchy level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {Object.entries(levelBreakdown).map(([level, amount]) => (
                <div key={level} className="text-center">
                  <div className="text-2xl font-bold text-primary">${amount.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Level {level}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Analytics */}
      <CommissionAnalytics commissions={commissions || []} />

      {/* Commission History */}
      <CommissionHistory commissions={commissions || []} />
    </div>
  )
}
