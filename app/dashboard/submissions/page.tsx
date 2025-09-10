import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, FileText, DollarSign, Calendar } from "lucide-react"

export default async function SubmissionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Get user submissions with property details
  const { data: submissions } = await supabase
    .from("payment_submissions")
    .select(`
      *,
      properties (name, price),
      reviewed_by_profile:profiles!payment_submissions_reviewed_by_fkey (full_name)
    `)
    .eq("submitter_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Submissions</h1>
          <p className="text-muted-foreground">Track your payment submissions and their approval status</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/submissions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Submission
          </Link>
        </Button>
      </div>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by submitting your first payment to build your network.
            </p>
            <Button asChild>
              <Link href="/dashboard/submissions/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Submission
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{submission.properties?.name}</CardTitle>
                    <CardDescription>
                      Buyer: {submission.buyer_name} ({submission.buyer_email})
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(submission.status)}>{submission.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">${Number(submission.amount).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-semibold">{new Date(submission.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {submission.reviewed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reviewed by</p>
                      <p className="font-semibold">{submission.reviewed_by_profile?.full_name || "Admin"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {submission.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{submission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
