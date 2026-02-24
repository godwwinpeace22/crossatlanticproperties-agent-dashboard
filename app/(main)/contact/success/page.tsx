import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ContactSuccessPageProps = {
  searchParams: {
    type?: string;
  };
};

export default function ContactSuccessPage({
  searchParams,
}: ContactSuccessPageProps) {
  const isSupport = searchParams?.type === "support";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Message Sent Successfully</h1>
        <p className="mt-2 text-muted-foreground">
          {isSupport
            ? "Your support request has been submitted. Our team will get back to you shortly."
            : "Thanks for contacting us. We've received your message and will respond soon."}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/contact">Back to Contact</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
