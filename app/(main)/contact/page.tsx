"use client";

import type React from "react";

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
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const firstName = formData.get("first-name") as string;
    const lastName = formData.get("last-name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const interest = formData.get("interest") as string;
    const message = formData.get("message") as string;

    const subject = `Contact Form - ${interest || "General Inquiry"}`;
    const body = `Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || "Not provided"}
Interest: ${interest}

Message:
${message}`;

    const mailtoLink = `mailto:info@crossatlanticproperties.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get("support-email") as string;
    const category = formData.get("support-type") as string;
    const subject = formData.get("support-subject") as string;
    const details = formData.get("support-details") as string;

    const emailSubject = `Support Request - ${category}: ${subject}`;
    const body = `From: ${email}
Category: ${category}
Subject: ${subject}

Details:
${details}`;

    const mailtoLink = `mailto:support@crossatlanticproperties.com?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
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
                  <Card>
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          Our Headquarters
                        </h3>
                        <p className="text-muted-foreground">
                          123 Innovation Way
                          <br />
                          Nairobi, Kenya
                          <br />
                          00100
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
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
                          Partnerships: partners@crossatlanticproperties.com
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Call Us</h3>
                        <p className="text-muted-foreground">
                          Main Office: +254 123 456 789
                          <br />
                          Customer Support: +254 987 654 321
                          <br />
                          Hours: Monday-Friday, 8am-6pm EAT
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="space-y-4">
                <Tabs defaultValue="contact" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contact">Contact Form</TabsTrigger>
                    <TabsTrigger value="support">Support Request</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="contact"
                    className="p-4 border rounded-md mt-2"
                  >
                    <form onSubmit={handleContactSubmit} className="space-y-4">
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
                        Send Message
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent
                    value="support"
                    className="p-4 border rounded-md mt-2"
                  >
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
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
                            <RadioGroupItem value="technical" id="technical" />
                            <Label htmlFor="technical" className="font-normal">
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
                      <Button type="submit" className="w-full">
                        Submit Support Request
                      </Button>
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video overflow-hidden rounded-lg mb-4">
                    <Image
                      src="/placeholder.svg?height=400&width=600"
                      width={600}
                      height={400}
                      alt="Nairobi Office"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Nairobi, Kenya</h3>
                  <p className="text-muted-foreground mb-4">
                    123 Innovation Way
                    <br />
                    Nairobi, Kenya
                    <br />
                    00100
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Hours:</strong> Monday-Friday, 8am-6pm EAT
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video overflow-hidden rounded-lg mb-4">
                    <Image
                      src="/placeholder.svg?height=400&width=600"
                      width={600}
                      height={400}
                      alt="Lagos Office"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Lagos, Nigeria</h3>
                  <p className="text-muted-foreground mb-4">
                    456 Victoria Island
                    <br />
                    Lagos, Nigeria
                    <br />
                    101233
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Hours:</strong> Monday-Friday, 9am-5pm WAT
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video overflow-hidden rounded-lg mb-4">
                    <Image
                      src="/placeholder.svg?height=400&width=600"
                      width={600}
                      height={400}
                      alt="Cape Town Office"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Cape Town, South Africa
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    789 Waterfront Blvd
                    <br />
                    Cape Town, South Africa
                    <br />
                    8001
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Hours:</strong> Monday-Friday, 8:30am-5:30pm SAST
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Find answers to common questions about our platform.
                </p>
              </div>
              <div className="grid w-full max-w-3xl gap-4 mt-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">
                      How do virtual tours work?
                    </h3>
                    <p className="text-muted-foreground">
                      Our virtual tours use 3D scanning technology to create
                      immersive, interactive experiences of properties. You can
                      navigate through spaces, view details, and get a realistic
                      feel for the property from anywhere in the world.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">
                      Are the property listings verified?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes, we verify all property listings on our platform to
                      ensure accuracy and authenticity. Our team works directly
                      with property owners and agents to validate information
                      before it's published.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">
                      How can I list my property on your platform?
                    </h3>
                    <p className="text-muted-foreground">
                      Property owners and agents can register on our platform
                      and submit their listings through our user-friendly
                      dashboard. We offer various packages for listings,
                      including options for virtual tours and enhanced
                      visibility.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">
                      What areas do you currently cover?
                    </h3>
                    <p className="text-muted-foreground">
                      We currently cover major cities across Africa, including
                      Nairobi, Lagos, Cape Town, Cairo, Accra, and more. We're
                      continuously expanding our coverage to include more
                      regions and properties.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
