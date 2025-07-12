"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !user.emailVerified) {
        router.push("/auth");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);
  
  
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
        {/* Swap Activity Chart */}
        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
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
             <Button variant="link" className="mt-4 text-primary">Improve Profile</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
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
  );
}