
"use client"; 

import React from "react"; 
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog, BrainCircuit, MessageCircle, Star, MapPin, Repeat, CheckCircle, Gift, Zap, Lightbulb, Sparkles, ListChecks, Users, ArrowDown } from "lucide-react";
import Link from "next/link";
// import SwapzoLogoSrc from '@/assets/Swapzo-logo_V1.png'; // No longer needed as we use public path

export default function Home() {
  const features = [
    {
      icon: <UserCog className="h-10 w-10 text-primary" />,
      title: "Profile Management",
      description: "Create your detailed swap profile. List what you offer—skills, items, services—and specify what you're looking for in return.",
      id: "profile-management"
    },
    {
      icon: <BrainCircuit className="h-10 w-10 text-primary" />,
      title: "Intelligent Matching",
      description: "Our AI-powered Barter Engine analyzes your needs and offers, suggesting perfect direct or multi-party chain swaps.",
      id: "intelligent-matching"
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-primary" />,
      title: "Secure Messaging",
      description: "Connect and chat securely with potential swap partners. Negotiate terms, agree on conditions, and arrange your exchange privately.",
      id: "secure-messaging"
    },
    {
      icon: <Star className="h-10 w-10 text-primary" />,
      title: "Rating & Reviews",
      description: "Build trust within the community. Rate your swap experiences and read reviews from others to ensure accountability.",
      id: "rating-reviews"
    },
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: "Location-Based Swaps",
      description: "Find swaps nearby or globally. Filter offers and needs by proximity for local goods or connect worldwide for services.",
      id: "location-based"
    },
    {
      icon: <Gift className="h-10 w-10 text-primary" />,
      title: "Universal Swap Wallet",
      description: "Easily add skills, services, or items you can offer, plus specify what you’re looking for in your personal swap wallet.",
      id: "swap-wallet"
    },
  ];

  const howItWorksSteps = [
    {
      icon: <UserCog className="h-8 w-8 text-accent" />, 
      title: "Create Your Profile",
      description: "List what you offer (skills, items, services) and what you need. Be specific to find the best matches!"
    },
    {
      icon: <Zap className="h-8 w-8 text-accent" />, 
      title: "Match & Propose",
      description: "Our AI finds direct or chain swaps. Propose exchanges to users whose needs and offers align with yours."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-accent" />, 
      title: "Negotiate & Complete",
      description: "Chat securely, agree on terms, and complete your swap. Rate your experience to build community trust."
    }
  ];

  return (
    <div className="flex flex-col items-center -mt-[4.5rem]">
      <section
  id="splash-screen"
  className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
>
  {/* Background Gradient Layer */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/30 dark:from-primary/20 dark:via-background dark:to-accent/20 -z-10" />

  {/* Centered Foreground Content */}
  <div className="container mx-auto px-4 md:px-6 text-center z-10">
    <div className="mx-auto max-w-3xl space-y-8">
      <Image
        src="/assets/Swapzo-logo_V1.png"
        alt="SwapZo Logo"
        width={120}
        height={120}
        className="mb-6 mx-auto"
        priority
        data-ai-hint="logo brand"
      />
      <p className="text-lg text-foreground/80 md:text-xl lg:text-2xl">
        <b>Exchange What You Have. Discover What You Need.</b>
      </p>
      <p className="text-md text-muted-foreground md:text-lg">
        A global platform for direct peer-to-peer exchange of skills, services, and goods—no money, just mutual value. Join the circular economy revolution!
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow" id="cta-main-hero">
          <Link href="/auth">Get Started Now</Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow">
          <Link href="#how-it-works">Learn More</Link>
        </Button>
      </div>
    </div>
  </div>
</section>


      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How SwapZo Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
                <CardHeader className="items-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    {React.cloneElement(step.icon, { className: "h-8 w-8 text-accent" })}
                  </div>
                  <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Placeholder Image Section / Possibilities */}
      <section id="possibilities" className="w-full py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="overflow-hidden shadow-xl">
            <Image
              src="/assets/barter.png"
              alt="Diverse items and services being exchanged"
              width={1200}
              height={600}
              className="w-full object-cover"
              data-ai-hint="barter exchange"
            />
            <CardContent className="p-6 text-center">
              <CardTitle className="text-2xl font-bold mb-2">Unlock a World of Possibilities</CardTitle>
              <CardDescription className="text-muted-foreground">
                From handmade crafts and professional skills to everyday items and unique experiences, SwapZo connects you to a vibrant community ready to trade.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Core Features
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.id} className="flex flex-col items-center p-6 text-center shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  {React.cloneElement(feature.icon, { className: "h-10 w-10 text-primary" })}
                </div>
                <CardTitle className="mb-2 text-xl font-semibold">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why SwapZo Section */}
      <section id="why-swapzo" className="w-full py-16 md:py-24 bg-secondary dark:bg-gradient-to-br dark:from-purple-800 dark:via-slate-700 dark:to-accent"> 
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> 
            Why Choose SwapZo?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Embrace a sustainable, cashless lifestyle. SwapZo empowers community-based solutions, making barter practical and attractive in today's world. Reduce waste, save money, and connect with like-minded individuals.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center p-4">
              <Repeat className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sustainable Living</h3>
              <p className="text-muted-foreground">Promote a circular economy by exchanging goods and services, reducing consumption and waste.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cost-Effective</h3>
              <p className="text-muted-foreground">Access what you need without spending money. Offer your talents and possessions in return.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <UsersIcon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community Focused</h3>
              <p className="text-muted-foreground">Build meaningful connections by engaging in direct, mutually beneficial exchanges with people near and far.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta-final" className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to Start Swapping?
          </h2>
          <p className="mb-8 max-w-xl mx-auto text-lg text-muted-foreground">
            Join SwapZo today and unlock a world of possibilities. Sign up is free and easy!
          </p>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/auth">Create Your Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Placeholder for UsersIcon if not directly available in lucide-react
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
