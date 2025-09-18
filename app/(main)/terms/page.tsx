import { FileText, Shield, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 mr-4" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Terms of Use
                </h1>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Cross Atlantic Properties Ltd - Terms and Conditions
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
                    <AlertCircle className="h-6 w-6 mr-2 text-dnx-blue" />
                    Important Notice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Use of this site is provided by Cross Atlantic Properties
                    Ltd subject to the following Terms and Conditions. Please
                    read these terms carefully before using our website.
                  </p>
                </CardContent>
              </Card>

              {/* Terms Content */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>1. Acceptance of Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your use constitutes acceptance of these Terms and
                      Conditions as at the date of your first use of the site.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>2. Modifications to Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Cross Atlantic Properties Ltd reserves the rights to
                      change these Terms and Conditions at any time by posting
                      changes online. Your continued use of this site after
                      changes are posted constitutes your acceptance of this
                      agreement as modified.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3. Lawful Use</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      You agree to use this site only for lawful purposes, and
                      in a manner which does not infringe the rights, or
                      restrict, or inhibit the use and enjoyment of the site by
                      any third party.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>4. Disclaimer of Warranties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      This site and the information, names, images, pictures,
                      logos regarding or relating to Cross Atlantic Properties
                      Ltd are provided "as is" without any representation or
                      endorsement made and without warranty of any kind whether
                      express or implied. In no event will Cross Atlantic
                      Properties Ltd be liable for any damages including,
                      without limitation, indirect or consequential damages, or
                      any damages whatsoever arising from the use or in
                      connection with such use or loss of use of the site,
                      whether in contract or in negligence.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>5. Site Functionality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Cross Atlantic Properties Ltd does not warrant that the
                      functions contained in the material contained in this site
                      will be uninterrupted or error free, that defects will be
                      corrected, or that this site or the server that makes it
                      available are free of viruses or bugs or represents the
                      full functionality, accuracy and reliability of the
                      materials.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>6. Copyright Restrictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Copyright restrictions: please refer to our Creative
                      Commons license terms governing the use of material on
                      this site.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>7. External Sites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Cross Atlantic Properties Ltd takes no responsibility for
                      the content of external Internet Sites.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>8. User Communications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Any communication or material that you transmit to, or
                      post on, any public area of the site including any data,
                      questions, comments, suggestions, or the like, is, and
                      will be treated as, non-confidential and non-proprietary
                      information.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>9. Conflicts in Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      If there is any conflict between these Terms and
                      Conditions and rules and/or specific terms of use
                      appearing on this site relating to specific material then
                      the latter shall prevail.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>10. Governing Law</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      These terms and conditions shall be governed and construed
                      in accordance with the laws of England and Wales. Any
                      disputes shall be subject to the exclusive jurisdiction of
                      the Courts of England and Wales.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dnx-orange border-2">
                  <CardHeader>
                    <CardTitle className="text-dnx-blue flex items-center">
                      <Shield className="h-6 w-6 mr-2" />
                      11. Acceptance Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground font-medium">
                      If these Terms and Conditions are not accepted in full,
                      the use of this site must be terminated immediately.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <Card className="mt-12 bg-muted/30">
                <CardHeader>
                  <CardTitle>Questions About These Terms?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms of Use, please
                    contact us through our official channels.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-md bg-dnx-blue px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-dnx-blue/90"
                    >
                      Contact Us
                    </a>
                    <a
                      href="/about"
                      className="inline-flex items-center justify-center rounded-md border border-dnx-blue px-4 py-2 text-sm font-medium text-dnx-blue shadow-sm transition-colors hover:bg-dnx-blue/10"
                    >
                      About Us
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
