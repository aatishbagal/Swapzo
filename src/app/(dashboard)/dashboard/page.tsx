"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { 
  PackageOpen, 
  Repeat2, 
  CheckCircle2, 
  MessageSquare, 
  Users,
  MoreHorizontal,
  Star,
  UserCircle,
  Search,
  TrendingUp,
  Activity
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import SwapMatchesDisplay from '@/components/swap-matches-display';

// Dummy data for charts and lists
const swapActivityData = [
  { month: "Jan", swaps: 3 },
  { month: "Feb", swaps: 5 },
  { month: "Mar", swaps: 8 },
  { month: "Apr", swaps: 6 },
  { month: "May", swaps: 9 },
  { month: "Jun", swaps: 7 },
];

const chartConfig = {
  swaps: {
    label: "Swaps",
    color: "hsl(var(--primary))",
  },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

const recentActivity = [
  { id: 1, type: "message", user: "Alice B.", item: "Vintage Lamp", snippet: "Is it still available?", time: "2m ago", icon: <MessageSquare className="h-5 w-5 text-primary" /> },
  { id: 2, type: "match", user: "Bob C.", item: "Guitar Lessons", snippet: "New direct match found!", time: "1h ago", icon: <Users className="h-5 w-5 text-green-500" /> },
  { id: 3, type: "review", user: "Carol D.", item: "Handmade Scarf", rating: 5, snippet: "Left you a 5-star review.", time: "3h ago", icon: <Star className="h-5 w-5 text-yellow-500" /> },
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !user.emailVerified) {
        router.push("/auth");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  
  useEffect(() => {
    // Simulate profile completion calculation
    let completion = 0;
    if (currentUser?.displayName) completion += 25;
    if (currentUser?.photoURL) completion += 25;
    // Add more checks for profile fields relevant to SwapZo
    // For example, if user has listed offers or needs
    completion += 30; // Mocking some other fields
    setProfileCompletion(completion);
  }, [currentUser]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Swapper'}!
          </p>
        </div>
        <Button onClick={() => router.push('/profile/edit')} variant="outline">
          <UserCircle className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Matches
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                <PackageOpen className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 since last week</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Swaps</CardTitle>
                <Repeat2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">1 new offer received</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Swaps</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">27</div>
                <p className="text-xs text-muted-foreground">+5 this month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Completion */}
            <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to get better matches!</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                   <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-secondary"
                      strokeWidth="3"
                      fill="none"
                      stroke="currentColor"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary"
                      strokeWidth="3"
                      strokeDasharray={`${profileCompletion}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      stroke="currentColor"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-primary">{profileCompletion}%</span>
                  </div>
                </div>
                 <Button variant="link" className="mt-4 text-primary" onClick={() => router.push('/profile/edit')}>
                   Improve Profile
                 </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates on your swaps and interactions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-4 p-3 hover:bg-secondary/50 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {activity.icon}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{activity.snippet}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === "review" ? `By ${activity.user} for ${activity.item}` : `${activity.item} with ${activity.user}`}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">{activity.time}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Activity</Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to help you get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => router.push('/offers')}
                >
                  <PackageOpen className="h-6 w-6" />
                  <span className="text-sm">Add Offers</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => router.push('/needs')}
                >
                  <Search className="h-6 w-6" />
                  <span className="text-sm">Add Needs</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('matches')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Find Matches</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => router.push('/profile/edit')}
                >
                  <UserCircle className="h-6 w-6" />
                  <span className="text-sm">Edit Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <SwapMatchesDisplay />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Swap Activity Chart */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Your Swap Activity</CardTitle>
              <CardDescription>Monthly overview of your swap engagements.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={swapActivityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Line type="monotone" dataKey="swaps" stroke="var(--color-swaps)" strokeWidth={3} dot={{r:5, fill: "var(--color-swaps)"}} activeDot={{r:7}}/>
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Additional analytics cards can go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Trust Score Trend</CardTitle>
                <CardDescription>How your trust score has evolved</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Chart coming soon...</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Swap Categories</CardTitle>
                <CardDescription>Breakdown of your swap types</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Chart coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}