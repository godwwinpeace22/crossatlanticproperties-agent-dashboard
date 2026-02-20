import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResendVerificationButton } from "@/components/resend-verification-button";

type SignUpSuccessPageProps = {
  searchParams: {
    email?: string;
    next?: string;
    role?: string;
  };
};

export default function SignUpSuccessPage({
  searchParams,
}: SignUpSuccessPageProps) {
  const email = searchParams.email;
  const role = searchParams.role === "agent" ? "agent" : "account";
  const loginHref = searchParams.next
    ? `/login?redirect=${encodeURIComponent(searchParams.next)}`
    : "/login";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Welcome to MLM Dashboard!
                </CardTitle>
                <CardDescription>
                  Check your email to verify your account
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  We&apos;ve sent a confirmation link to
                  {email ? ` ${email}` : " your email address"}. Open the
                  message and click the link to activate your {role}.
                </p>
                <div className="mb-4">
                  <ResendVerificationButton
                    email={email}
                    next={searchParams.next}
                  />
                </div>
                <Button asChild>
                  <Link href={loginHref}>Back to Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
