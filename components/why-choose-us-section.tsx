import { Shield, Zap, Users } from "lucide-react";

export function WhyChooseUsSection() {
  const features = [
    {
      icon: Shield,
      title: "Verified Properties",
      description:
        "Every property is thoroughly verified and authenticated by our expert team before listing.",
      features: [
        "Legal verification",
        "Property inspection",
        "Document authentication",
        "Owner verification",
      ],
    },
    {
      icon: Zap,
      title: "AI-Powered Matching",
      description:
        "Our advanced AI algorithm matches you with properties that perfectly fit your preferences.",
      features: [
        "Smart recommendations",
        "Preference learning",
        "Market analysis",
        "Price predictions",
      ],
    },
    {
      icon: Users,
      title: "Expert Support",
      description:
        "Get personalized assistance from our team of licensed real estate professionals.",
      features: [
        "24/7 support",
        "Licensed agents",
        "Legal assistance",
        "Financing help",
      ],
    },
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-blue-500/5 to-orange-500/5">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Why Choose <span className="gradient-text">Us</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're revolutionizing real estate in Africa with cutting-edge
            technology and unmatched service.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-gray-500 hover:shadow-xl transition-all duration-300 p-8 text-center animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <feature.icon className="h-16 w-16 mx-auto mb-6 text-dnx-blue" />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.features.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-center text-sm text-gray-500"
                  >
                    <div className="w-2 h-2 bg-dnx-orange rounded-full mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
