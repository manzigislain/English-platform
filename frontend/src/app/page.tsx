"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Users, Award, Star, ChevronRight, Sparkles, TrendingUp, MessageCircle, Shield, CheckCircle2 } from "lucide-react";

const levels = [
  { name: "Seed", dariName: "تخم", type: "Free", price: "$0", color: "from-green-400 to-emerald-600", desc: "Start your English journey with everyday basics", features: ["Basic vocabulary", "Simple greetings", "Everyday phrases", "Pronunciation guides"] },
  { name: "Growth", dariName: "رشد", type: "Paid", price: "$9.99/mo", color: "from-blue-400 to-indigo-600", desc: "Expand your skills with structured courses", features: ["Grammar lessons", "Reading practice", "Writing skills", "Community access"] },
  { name: "Success", dariName: "موفقیت", type: "Premium", price: "$19.99/mo", color: "from-amber-400 to-yellow-600", desc: "Master English for career and life", features: ["Business English", "Interview prep", "Certificate", "1-on-1 mentoring"] },
];

const roadmapSteps = [
  { step: 1, title: "Learn Basics", icon: BookOpen, desc: "Start with greetings, family, food, and everyday conversations" },
  { step: 2, title: "Build Skills", icon: TrendingUp, desc: "Practice reading, writing, listening, and speaking" },
  { step: 3, title: "Join Community", icon: Users, desc: "Connect with fellow learners, ask questions, share stories" },
  { step: 4, title: "Earn Certificates", icon: Award, desc: "Complete courses and earn verifiable certificates" },
  { step: 5, title: "Access Opportunities", icon: Globe, desc: "Use your English skills for education, jobs, and beyond" },
];

const testimonials = [
  { name: "Ahmad R.", dariName: "احمد ر.", role: "Student from Kabul", text: "This platform changed my life. I can now speak English confidently and got a job at an NGO.", stars: 5 },
  { name: "Fatima H.", dariName: "فاطمه ح.", role: "University Student", text: "The Dari translations make it so easy to learn. I finally understand English grammar!", stars: 5 },
  { name: "Mohammad A.", dariName: "محمد ا.", role: "Job Seeker", text: "The Career English course helped me prepare for interviews. I got my dream job!", stars: 5 },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("accessToken"));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden px-4 py-20 text-white sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4" /> Learn English in Dari
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-6xl">
              Learn English.
              <br />
              <span className="text-amber-300">Build Confidence.</span>
              <br />
              Create Opportunities.
            </h1>
            <p className="mb-8 text-lg text-white/80 sm:text-xl">
              A complete English learning platform designed for Dari-speaking learners in Afghanistan.
              Start your journey today — for free.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={isLoggedIn ? "/student/dashboard" : "/auth/register"}
                className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Your Journey"}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/learn"
                className="flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { num: "10+", label: "Courses", icon: BookOpen },
              { num: "50+", label: "Lessons", icon: Star },
              { num: "1,000+", label: "Students", icon: Users },
              { num: "5,000+", label: "Words Learned", icon: Globe },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-text">{stat.num}</div>
                <div className="text-sm text-text-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Journey Roadmap */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Your Learning Journey</h2>
            <p className="mx-auto max-w-2xl text-text-light">A clear path from beginner to confident English speaker</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-primary/20 md:block" />
            <div className="space-y-8">
              {roadmapSteps.map((step) => (
                <div key={step.step} className="relative flex items-start gap-6 md:ml-0">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md flex-1">
                    <div className="mb-1 text-sm font-semibold text-primary">Step {step.step}</div>
                    <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                    <p className="text-text-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Levels */}
      <section className="bg-white py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Choose Your Level</h2>
            <p className="mx-auto max-w-2xl text-text-light">
              Start free and unlock more as you progress
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {levels.map((level) => (
              <Link
                key={level.name}
                href="/pricing"
                className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <div className={`bg-gradient-to-r ${level.color} p-6 text-white`}>
                  <div className="mb-1 text-sm font-semibold opacity-80">{level.type}</div>
                  <h3 className="text-2xl font-bold">{level.name} {level.name === 'Seed' ? '🌱' : level.name === 'Growth' ? '🌿' : '🌳'}</h3>
                  <div className="mt-2 text-3xl font-bold">{level.price}</div>
                </div>
                <div className="p-6">
                  <p className="mb-4 text-sm text-text-light">{level.desc}</p>
                  <ul className="space-y-2">
                    {level.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-white transition-all group-hover:bg-primary-dark">
                    {level.price === '$0' ? 'Get Started Free' : 'Subscribe Now'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Success Stories</h2>
            <p className="text-text-light">Hear from our learners in Afghanistan</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-text-light italic">"{t.text}"</p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-text-light">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-hero px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to Start Your Journey?</h2>
          <p className="mb-8 text-lg text-white/80">Join thousands of Dari-speaking learners and unlock your future with English.</p>
          <Link
            href={isLoggedIn ? "/student/dashboard" : "/auth/register"}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            {isLoggedIn ? "Continue Learning" : "Get Started Free"}
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">ED</div>
                <span className="text-lg font-bold text-primary">English Dari</span>
              </div>
              <p className="text-sm text-text-light">Empowering Dari-speaking learners through quality English education.</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Learn</h4>
              <ul className="space-y-2 text-sm text-text-light">
                <li>Courses</li>
                <li>Lessons</li>
                <li>Vocabulary</li>
                <li>Exercises</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Community</h4>
              <ul className="space-y-2 text-sm text-text-light">
                <li>Discussion</li>
                <li>Support</li>
                <li>Study Groups</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-text-light">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-text-light">
            © 2026 English Dari Learning Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
