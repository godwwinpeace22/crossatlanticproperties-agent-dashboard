"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Home,
  Info,
  Mail,
  MailCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  formatCompactCurrency,
  formatDate,
  formatRelativeTime,
} from "@/lib/format";

export type NotificationWithRelations = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  email_sent?: boolean;
  property_interest?: {
    property?: {
      id?: string;
      name?: string;
      title?: string;
      price?: number;
      location?: string;
    };
  };
  installment_payment?: {
    amount?: number;
    due_date?: string;
    payment_status?: string;
  };
  kyc_submission?: {
    status?: string;
  };
};

interface NotificationsPanelProps {
  initialNotifications: NotificationWithRelations[];
}

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

const formatNotificationType = (type: string) =>
  type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const padWeek = (baseDate: Date) =>
  new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000);

export default function NotificationsPanel({
  initialNotifications,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] =
    useState<NotificationWithRelations[]>(initialNotifications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const { toast } = useToast();

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications]
  );

  const readNotifications = useMemo(
    () => notifications.filter((notification) => notification.read),
    [notifications]
  );

  const thisWeekCount = useMemo(() => {
    if (!notifications.length) return 0;
    const threshold = padWeek(new Date());
    return notifications.filter(
      (notification) => new Date(notification.created_at) > threshold
    ).length;
  }, [notifications]);

  const markNotificationsAsRead = async (ids: string[]) => {
    if (ids.length === 0) return false;
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to update notifications");
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          ids.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      toast({
        title: "Notifications updated",
        description: "Marked as read",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to mark notifications",
        variant: "destructive",
      });

      return false;
    }
  };

  const handleMarkAll = async () => {
    if (unreadNotifications.length === 0) return;
    setIsMarkingAll(true);
    await markNotificationsAsRead(
      unreadNotifications.map((notification) => notification.id)
    );
    setIsMarkingAll(false);
    setExpandedId((current) =>
      current && unreadNotifications.some((n) => n.id === current)
        ? null
        : current
    );
  };

  const toggleExpanded = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  const handleMarkSingle = async (id: string) => {
    setLoadingIds((current) => [...current, id]);
    const success = await markNotificationsAsRead([id]);
    setLoadingIds((current) => current.filter((value) => value !== id));

    if (success && expandedId === id) {
      setExpandedId(null);
    }
  };

  const renderDetailRow = (
    notification: NotificationWithRelations,
    colSpan: number
  ) => {
    const property = notification.property_interest?.property;
    const rawAmount = notification.installment_payment?.amount;
    const amount = Number(rawAmount ?? NaN);

    return (
      <TableRow key={`${notification.id}-details`} className="bg-slate-50/60">
        <TableCell colSpan={colSpan} className="border-t-0 py-3">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-background/80 p-4 space-y-3">
            <p className="text-sm text-slate-800 whitespace-pre-line">
              {notification.message}
            </p>
            <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
              {Number.isFinite(amount) && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Amount
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCompactCurrency(amount)}
                  </p>
                </div>
              )}
              {property && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Property
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {property.name || property.title || "Property"}
                  </p>
                  {property.location && (
                    <p className="text-[11px] text-muted-foreground">
                      {property.location}
                    </p>
                  )}
                  {property.price && (
                    <p className="text-[11px] text-muted-foreground">
                      Price {formatCompactCurrency(Number(property.price))}
                    </p>
                  )}
                </div>
              )}
              {notification.installment_payment?.due_date && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Due Date
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(notification.installment_payment.due_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your property interests and payments
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAll}
            disabled={isMarkingAll}
          >
            {isMarkingAll
              ? "Marking..."
              : `Mark All as Read (${unreadNotifications.length})`}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
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
              {thisWeekCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent notifications
            </p>
          </CardContent>
        </Card>
      </div>

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
                    const isExpanded = expandedId === notification.id;
                    const isMarking = loadingIds.includes(notification.id);

                    return (
                      <Fragment key={notification.id}>
                        <TableRow className="bg-blue-50/50 hover:bg-blue-100/50">
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="max-w-md truncate">
                                {notification.message}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpanded(notification.id)}
                                aria-label={
                                  isExpanded
                                    ? "Hide notification details"
                                    : "View notification details"
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkSingle(notification.id)}
                              disabled={isMarking}
                            >
                              {isMarking ? "Marking..." : "Mark Read"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && renderDetailRow(notification, 7)}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
                    const isExpanded = expandedId === notification.id;

                    return (
                      <Fragment key={notification.id}>
                        <TableRow>
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="max-w-md truncate">
                                {notification.message}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpanded(notification.id)}
                                aria-label={
                                  isExpanded
                                    ? "Hide notification details"
                                    : "View notification details"
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
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
                        {isExpanded && renderDetailRow(notification, 6)}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 && (
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
