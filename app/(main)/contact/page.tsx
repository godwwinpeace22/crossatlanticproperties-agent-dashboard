"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContactPage() {
  const router = useRouter();
  const [contactLoading, setContactLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [supportStatus, setSupportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const firstName = formData.get("first-name") as string;
    const lastName = formData.get("last-name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const interest = formData.get("interest") as string;
    const message = formData.get("message") as string;

    try {
      setContactLoading(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "contact",
          firstName,
          lastName,
          email,
          phone,
          interest,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to send message");
      }

      form.reset();
      router.push("/contact/success?type=contact");
    } catch (error) {
      setContactStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send message at the moment.",
      });
    } finally {
      setContactLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportStatus(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get("support-email") as string;
    const category = formData.get("support-type") as string;
    const subject = formData.get("support-subject") as string;
    const details = formData.get("support-details") as string;

    try {
      setSupportLoading(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "support",
          email,
          category,
          subject,
          details,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit support request");
      }

      form.reset();
      router.push("/contact/success?type=support");
    } catch (error) {
      setSupportStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit support request right now.",
      });
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-500 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Contact Us
                </h1>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  We're here to help with any questions about our virtual real
                  estate platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container-custom px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">
                    Have questions or feedback? We'd love to hear from you.
                  </p>
                </div>
                <div className="grid gap-6">
                  <Card className="shadow-none border">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          Our Headquarters
                        </h3>
                        <p className="text-muted-foreground">
                          Block D flat 4, Sky Memorial Complex
                          <br />
                          Wuse Zone 5, FCT, Abuja, Nigeria
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Email Us</h3>
                        <p className="text-muted-foreground">
                          General Inquiries: info@crossatlanticproperties.com
                          <br />
                          Support: support@crossatlanticproperties.com
                          <br />
                          Partnerships: info@crossatlanticproperties.com
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Call Us</h3>
                        <p className="text-muted-foreground">
                          Main Office: +234 806 158 2043, +234 708 611 2909
                          <br />
                          Customer Support: +44 743 546 8699
                          <br />
                          Hours: Monday-Friday, 8am-6pm WAT
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="space-y-4">
                <Tabs defaultValue="contact" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="contact"
                      disabled={contactLoading || supportLoading}
                    >
                      Contact Form
                    </TabsTrigger>
                    <TabsTrigger
                      value="support"
                      disabled={contactLoading || supportLoading}
                    >
                      Support Request
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="contact"
                    className="p-4 border rounded-md mt-2"
                  >
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <fieldset
                        disabled={contactLoading}
                        className="space-y-4 disabled:opacity-70"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First name</Label>
                            <Input
                              id="first-name"
                              name="first-name"
                              placeholder="John"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last name</Label>
                            <Input
                              id="last-name"
                              name="last-name"
                              placeholder="Doe"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            placeholder="johndoe@example.com"
                            type="email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            type="tel"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>I am interested in:</Label>
                          <RadioGroup
                            name="interest"
                            defaultValue="buying"
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="buying" id="buying" />
                              <Label htmlFor="buying" className="font-normal">
                                Buying property
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="selling" id="selling" />
                              <Label htmlFor="selling" className="font-normal">
                                Selling property
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="renting" id="renting" />
                              <Label htmlFor="renting" className="font-normal">
                                Renting property
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other" className="font-normal">
                                Other inquiry
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder="Please let us know how we can help you..."
                            className="min-h-[120px]"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {contactLoading ? "Sending..." : "Send Message"}
                        </Button>
                      </fieldset>
                      {contactStatus && (
                        <p
                          className={`text-sm ${
                            contactStatus.type === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {contactStatus.message}
                        </p>
                      )}
                    </form>
                  </TabsContent>
                  <TabsContent
                    value="support"
                    className="p-4 border rounded-md mt-2"
                  >
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <fieldset
                        disabled={supportLoading}
                        className="space-y-4 disabled:opacity-70"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="support-email">Email</Label>
                          <Input
                            id="support-email"
                            name="support-email"
                            placeholder="johndoe@example.com"
                            type="email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="support-type">Support Category</Label>
                          <RadioGroup
                            name="support-type"
                            defaultValue="technical"
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="technical"
                                id="technical"
                              />
                              <Label
                                htmlFor="technical"
                                className="font-normal"
                              >
                                Technical Issue
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="account" id="account" />
                              <Label htmlFor="account" className="font-normal">
                                Account Help
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="billing" id="billing" />
                              <Label htmlFor="billing" className="font-normal">
                                Billing Question
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="feedback" id="feedback" />
                              <Label htmlFor="feedback" className="font-normal">
                                Feedback/Suggestion
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="support-subject">Subject</Label>
                          <Input
                            id="support-subject"
                            name="support-subject"
                            placeholder="Brief description of your issue"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="support-details">Details</Label>
                          <Textarea
                            id="support-details"
                            name="support-details"
                            placeholder="Please provide as much detail as possible about your issue..."
                            className="min-h-[150px]"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={supportLoading}
                        >
                          {supportLoading
                            ? "Submitting..."
                            : "Submit Support Request"}
                        </Button>
                      </fieldset>
                      {supportStatus && (
                        <p
                          className={`text-sm ${
                            supportStatus.type === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {supportStatus.message}
                        </p>
                      )}
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Our Offices
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Visit us at one of our locations across Africa.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 place-items-stretch lg:flex lg:justify-center lg:items-stretch">
              <Card className="h-full min-h-[260px] flex flex-col">
                <CardContent className="p-6 h-full flex flex-col grow">
                  <h3 className="text-xl font-bold mb-2">Abuja, Nigeria</h3>
                  <p className="text-muted-foreground mb-4">
                    Block D flat 4, Sky Memorial Complex
                    <br />
                    Wuse Zone 5, FCT, Abuja, Nigeria
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Hours:</strong> Monday-Friday, 9am-5pm WAT
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full min-h-[260px] flex flex-col">
                <CardContent className="p-6 h-full flex flex-col grow">
                  <h3 className="text-xl font-bold mb-2">Nottingham, UK</h3>
                  <p className="text-muted-foreground mb-4">
                    The Ingenuity Lab, C16 The Ingenuity Centre
                    <br />
                    Jubilee Campus, University of Nottingham
                    <br />
                    Nottingham, UK
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Hours:</strong> Monday-Friday, 9am-5pm GMT
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
