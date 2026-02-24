"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

function AgentRegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      setRedirectUrl(redirectParam);
    }
  }, [searchParams]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setErrors(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    if (data?.password !== data?.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    try {
      const finalRedirect = redirectUrl || "/dashboard";

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`,
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
            role: "agent",
          },
        },
      });

      if (error) throw error;

      if (!signUpData.user) {
        throw new Error("Unable to create account. Please try again.");
      }

      router.push(
        `/auth/signup-success?email=${encodeURIComponent(data.email)}&next=${encodeURIComponent(finalRedirect)}&role=agent`,
      );
    } catch (error: unknown) {
      setErrors({
        general: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 py-12">
      <div className="container grid flex-1 items-center justify-center gap-12 px-4 md:grid-cols-2 md:gap-16 lg:max-w-6xl lg:gap-20">
        <div className="hidden flex-col space-y-4 md:flex">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Become an Agent
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Join our network of professional real estate agents and start
              earning commissions
            </p>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold mb-2">Agent Benefits</h3>
              <ul className="text-left space-y-2">
                <li>• Multi-level commission structure</li>
                <li>• Professional tools and support</li>
                <li>• Build your own network</li>
                <li>• Flexible working schedule</li>
              </ul>
            </div>
          </div>
        </div>
        <Card className="mx-auto max-w-md border-0 sm:border shadow-none md:shadow order-1 md:order-2">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.jpg"
                alt="Crossatlantic Properties Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              Agent Registration
            </CardTitle>
            <CardDescription>
              Create your agent account to start earning commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {errors?.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors?.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors?.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.lastName[0]}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    className="pl-10"
                    required
                  />
                </div>
                {errors?.email && (
                  <p className="text-sm text-destructive">{errors.email[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
                {errors?.password && (
                  <p className="text-sm text-destructive">
                    {errors.password[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long and include a mix
                  of uppercase letters, numbers, and symbols.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="pl-10"
                    required
                  />
                </div>
                {errors?.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="flex items-start space-x-2">
                <input type="checkbox" id="terms" required className="mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Next Steps:
                </h4>
                <p className="text-sm text-blue-800">
                  After registration, you'll complete a verification process
                  including KYC documents and agent requirements before your
                  account is approved.
                </p>
              </div>
              <Button
                className="w-full bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                size="lg"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating Agent Account..." : "Register as Agent"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login${
                  redirectUrl
                    ? `?redirect=${encodeURIComponent(redirectUrl)}`
                    : ""
                }`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Looking to buy property?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register as Buyer
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function AgentRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <AgentRegisterPageContent />
    </Suspense>
  );
}
