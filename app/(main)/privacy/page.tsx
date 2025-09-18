import {
  Shield,
  Eye,
  Lock,
  Users,
  Globe,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center mb-4">
                  <Shield className="h-12 w-12 mr-4" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Privacy Policy
                </h1>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Cross Atlantic Properties Ltd - Protecting Your Privacy
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-6 w-6 mr-2 text-dnx-blue" />
                    Privacy Policy Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Cross Atlantic Properties Ltd operates the Cross Atlantic
                    Properties website, which provides real estate services
                    across multiple continents.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    This page is used to inform website visitors regarding our
                    policies with the collection, use, and disclosure of
                    Personal Information if anyone decided to use our Service,
                    the Cross Atlantic Properties website.
                  </p>
                  <p className="text-muted-foreground">
                    If you choose to use our Service, then you agree to the
                    collection and use of information in relation with this
                    policy. The Personal Information that we collect are used
                    for providing and improving the Service. We will not use or
                    share your information with anyone except as described in
                    this Privacy Policy.
                  </p>
                </CardContent>
              </Card>

              <Card className="mb-8">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    The terms used in this Privacy Policy have the same meanings
                    as in our Terms and Conditions, which is accessible at our
                    Terms of Use page, unless otherwise defined in this Privacy
                    Policy.
                  </p>
                </CardContent>
              </Card>

              {/* Privacy Policy Content */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-6 w-6 mr-2 text-dnx-blue" />
                      Information Collection and Use
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      For a better experience while using our Service, we may
                      require you to provide us with certain personally
                      identifiable information, including but not limited to
                      your name, phone number, and postal address. The
                      information that we collect will be used to contact or
                      identify you.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-dnx-blue" />
                      Log Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We want to inform you that whenever you visit our Service,
                      we collect information that your browser sends to us that
                      is called Log Data. This Log Data may include information
                      such as your computer's Internet Protocol ("IP") address,
                      browser version, pages of our Service that you visit, the
                      time and date of your visit, the time spent on those
                      pages, and other statistics.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-6 w-6 mr-2 text-dnx-blue" />
                      Cookies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Cookies are files with small amount of data that is
                        commonly used an anonymous unique identifier. These are
                        sent to your browser from the website that you visit and
                        are stored on your computer's hard drive.
                      </p>
                      <p className="text-muted-foreground">
                        Our website uses these "cookies" to collection
                        information and to improve our Service. You have the
                        option to either accept or refuse these cookies, and
                        know when a cookie is being sent to your computer. If
                        you choose to refuse our cookies, you may not be able to
                        use some portions of our Service.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-6 w-6 mr-2 text-dnx-blue" />
                      Service Providers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        We may employ third-party companies and individuals due
                        to the following reasons:
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>To facilitate our Service</li>
                        <li>To provide the Service on our behalf</li>
                        <li>To perform Service-related services or</li>
                        <li>
                          To assist us in analyzing how our Service is used.
                        </li>
                      </ul>
                      <p className="text-muted-foreground">
                        We want to inform our Service users that these third
                        parties have access to your Personal Information. The
                        reason is to perform the tasks assigned to them on our
                        behalf. However, they are obligated not to disclose or
                        use the information for any other purpose.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-6 w-6 mr-2 text-dnx-blue" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We value your trust in providing us your Personal
                      Information, thus we are striving to use commercially
                      acceptable means of protecting it. But remember that no
                      method of transmission over the internet, or method of
                      electronic storage is 100% secure and reliable, and we
                      cannot guarantee its absolute security.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-6 w-6 mr-2 text-dnx-blue" />
                      Links to Other Sites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Our Service may contain links to other sites. If you click
                      on a third-party link, you will be directed to that site.
                      Note that these external sites are not operated by us.
                      Therefore, we strongly advise you to review the Privacy
                      Policy of these websites. We have no control over, and
                      assume no responsibility for the content, privacy
                      policies, or practices of any third-party sites or
                      services.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-6 w-6 mr-2 text-dnx-blue" />
                      Children's Privacy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Our Services do not address anyone under the age of 13. We
                      do not knowingly collect personal identifiable information
                      from children under 13. In the case we discover that a
                      child under 13 has provided us with personal information,
                      we immediately delete this from our servers. If you are a
                      parent or guardian and you are aware that your child has
                      provided us with personal information, please contact us
                      so that we will be able to do necessary actions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dnx-orange border-2">
                  <CardHeader>
                    <CardTitle className="text-dnx-blue flex items-center">
                      <AlertCircle className="h-6 w-6 mr-2" />
                      Changes to This Privacy Policy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We may update our Privacy Policy from time to time. Thus,
                      we advise you to review this page periodically for any
                      changes. We will notify you of any changes by posting the
                      new Privacy Policy on this page. These changes are
                      effective immediately, after they are posted on this page.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <Card className="mt-12 bg-muted/30">
                <CardHeader>
                  <CardTitle>Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions or suggestions about our Privacy
                    Policy, do not hesitate to contact us.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-md bg-dnx-blue px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-dnx-blue/90"
                    >
                      Contact Us
                    </a>
                    <a
                      href="/terms"
                      className="inline-flex items-center justify-center rounded-md border border-dnx-blue px-4 py-2 text-sm font-medium text-dnx-blue shadow-sm transition-colors hover:bg-dnx-blue/10"
                    >
                      Terms of Use
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Last Updated */}
              <div className="text-center mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  Last updated:{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
