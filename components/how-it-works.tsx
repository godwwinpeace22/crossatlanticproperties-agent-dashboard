import { Search, Eye, MapPin, ThumbsUp } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Our platform makes finding your dream property simple and
              efficient.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 w-full max-w-5xl mt-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                <Search className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Search</h3>
              <p className="text-muted-foreground mt-2">
                Browse through our extensive collection of verified property
                listings.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Virtual Tour</h3>
              <p className="text-muted-foreground mt-2">
                Experience properties remotely through high-quality virtual
                tours.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Location Insights</h3>
              <p className="text-muted-foreground mt-2">
                Get detailed information about neighborhoods and nearby
                amenities.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Connect</h3>
              <p className="text-muted-foreground mt-2">
                Easily connect with property owners or agents to finalize your
                decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
