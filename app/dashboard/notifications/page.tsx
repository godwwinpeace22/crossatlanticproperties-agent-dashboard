import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  CreditCard,
  FileText,
  Home,
  Mail,
  MailCheck,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/format";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      `
      *,
      property_interest:property_interests(
        *,
        property:properties(*)
      ),
      kyc_submission:kyc_submissions(*),
      installment_payment:installment_payments(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Separate read and unread notifications
  const unreadNotifications = notifications?.filter((n) => !n.read) || [];
  const readNotifications = notifications?.filter((n) => n.read) || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "kyc_status":
        return FileText;
      case "payment_reminder":
        return Clock;
      case "payment_confirmed":
        return CheckCircle;
      case "interest_approved":
        return Home;
      case "interest_rejected":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "kyc_approved":
        return "text-green-600";
      case "kyc_rejected":
        return "text-red-600";
      case "payment_reminder":
        return "text-orange-600";
      case "payment_received":
      case "payment_approved":
      case "payment_confirmed":
        return "text-green-600";
      case "interest_approved":
        return "text-green-600";
      case "interest_rejected":
        return "text-red-600";
      case "commission_earned":
        return "text-purple-600";
      default:
        return "text-blue-600";
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "kyc_approved":
      case "payment_approved":
      case "payment_confirmed":
      case "interest_approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "kyc_rejected":
      case "interest_rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "payment_reminder":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "payment_received":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "commission_earned":
        return "bg-purple-100 text-purple-700 border-purple-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const formatNotificationType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your property interests and payments
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline">
            Mark All as Read ({unreadNotifications.length})
          </Button>
        )}
      </div>

      {/* Notification Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unreadNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {notifications?.filter(
                (n) =>
                  new Date(n.created_at) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Unread Notifications ({unreadNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Email
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreadNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const iconColor = getNotificationColor(notification.type);
                    const badgeColor = getNotificationBadgeColor(
                      notification.type
                    );

                    return (
                      <TableRow
                        key={notification.id}
                        className="bg-blue-50/50 hover:bg-blue-100/50"
                      >
                        <TableCell>
                          <Badge className="bg-blue-500 text-white border-0">
                            New
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${iconColor}`} />
                            <Badge variant="outline" className={badgeColor}>
                              {formatNotificationType(notification.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="max-w-md truncate">
                            {notification.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            title={
                              notification.email_sent
                                ? "Email sent"
                                : "Email not sent"
                            }
                          >
                            {notification.email_sent ? (
                              <MailCheck className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <Mail className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
                            Mark Read
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Read Notifications ({readNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Email
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const iconColor = getNotificationColor(notification.type);
                    const badgeColor = getNotificationBadgeColor(
                      notification.type
                    );

                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${iconColor}`} />
                            <Badge variant="outline" className={badgeColor}>
                              {formatNotificationType(notification.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="max-w-md truncate">
                            {notification.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            title={
                              notification.email_sent
                                ? "Email sent"
                                : "Email not sent"
                            }
                          >
                            {notification.email_sent ? (
                              <MailCheck className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <Mail className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Notifications State */}
      {(!notifications || notifications.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Notifications</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              You don't have any notifications yet. Once you express interest in
              properties or make payments, you'll receive updates here.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/(main)/properties">Browse Properties</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard/my-interests">View Interests</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
