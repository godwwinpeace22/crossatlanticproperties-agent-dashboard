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

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Authentication Error</CardTitle>
                <CardDescription>
                  There was a problem confirming your account
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  The confirmation link may have expired or been used already.
                  Please try signing up again or contact support if the problem
                  persists.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/auth/signup">Sign Up Again</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/login">Back to Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
