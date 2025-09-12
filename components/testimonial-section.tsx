import Image from "next/image";
import { Quote } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "This platform made finding our dream home so much easier. The virtual tours saved us countless hours of physical visits.",
    author: "Sarah Johnson",
    role: "Homeowner",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote:
      "As a real estate agent, this platform has revolutionized how I showcase properties to clients across different countries.",
    author: "Michael Okafor",
    role: "Real Estate Agent",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote:
      "The detailed neighborhood information helped me make an informed decision about my investment property purchase.",
    author: "Amina Diallo",
    role: "Property Investor",
    avatar: "/placeholder.svg?height=100&width=100",
  },
];

export default function TestimonialSection() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What Our Clients Say
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Hear from people who have found their perfect properties through
              our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-left">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="mb-4">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.author}
                      width={48}
                      height={48}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.author}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
