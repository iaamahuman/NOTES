import { BookOpen, Users, Download, Star, Heart, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Total Notes", value: "50K+", icon: BookOpen },
  { label: "Active Students", value: "10K+", icon: Users },
  { label: "Downloads", value: "500K+", icon: Download },
  { label: "Universities", value: "1K+", icon: Star },
];

const features = [
  {
    icon: BookOpen,
    title: "Rich Content Support",
    description: "Upload and preview PDFs, images, and documents with ease"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Connect with students worldwide and share knowledge"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security"
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description: "Lightning-fast search and instant file previews"
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">About Quill</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
            Empowering students worldwide to share knowledge and succeed together through 
            collaborative learning and note sharing.
          </p>
          <div className="flex justify-center">
            <Badge className="bg-white/20 text-white hover:bg-white/30">
              Trusted by students at 1000+ universities
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We believe that knowledge should be accessible to everyone. Quill provides a platform 
            where students can share their study materials, learn from each other, and build a 
            global community of learners. Together, we're making education more collaborative 
            and accessible.
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Quill?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Story Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="text-gray-600 space-y-4">
              <p>
                Quill started in 2023 as a simple idea: what if students could easily share 
                their best study notes with classmates and students around the world? Our 
                founders, all university students themselves, experienced firsthand the 
                challenges of finding quality study materials.
              </p>
              <p>
                Today, Quill has grown into a thriving community where students from over 
                1,000 universities share knowledge, support each other's learning journeys, 
                and build lasting connections. Every note uploaded, every comment shared, 
                and every interaction makes our community stronger.
              </p>
              <p>
                We're committed to keeping Quill accessible, user-friendly, and focused on 
                what matters most: helping students succeed in their academic journeys.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Community First</h3>
              <p className="text-gray-600">
                Every decision we make prioritizes our community of learners and their needs.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trust & Safety</h3>
              <p className="text-gray-600">
                We maintain the highest standards of privacy, security, and academic integrity.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously improve our platform to enhance the learning experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
