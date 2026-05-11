import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";
import learningIllustration from "@/assets/learning-illustration.png";
import { BookOpen, Users, MessageCircle, Award, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Learn New Skills",
    description: "Access a wide variety of courses taught by industry experts and grow your skillset.",
  },
  {
    icon: Users,
    title: "Connect & Network",
    description: "Build meaningful connections with peers, mentors, and professionals in your field.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Communicate instantly with friends and study groups through our messaging platform.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Complete courses and earn certificates to showcase your achievements.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed progress tracking and analytics.",
  },
  {
    icon: Shield,
    title: "Safe Community",
    description: "Learn in a moderated, safe environment with active community guidelines.",
  },
];

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "500+", label: "Courses Available" },
  { value: "50+", label: "Expert Instructors" },
  { value: "95%", label: "Satisfaction Rate" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 lg:py-20">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              {/* <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                🎓 Welcome to SkillShare Campus
              </span> */}
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Learn, Connect & Grow Together
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                SkillShare Campus is your all-in-one platform for learning new skills, connecting with like-minded
                individuals, and building your professional network. Join thousands of learners on their journey to
                success.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <SignInForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to enhance your learning experience and help you achieve your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps and begin your learning journey today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up with your email or Google account to get started in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Explore & Enroll</h3>
              <p className="text-muted-foreground">
                Browse our catalog of courses and enroll in the ones that match your goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Learn & Connect</h3>
              <p className="text-muted-foreground">
                Complete lessons, earn certificates, and connect with fellow learners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join SkillShare Campus today and unlock access to hundreds of courses, a vibrant community, and tools to
            accelerate your growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/join"
              className="inline-flex items-center justify-center px-8 py-3 bg-background text-foreground font-semibold rounded-lg hover:bg-background/90 transition-colors"
            >
              Get Started Free
            </a>
            <a
              href="/courses"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              Browse Courses
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
