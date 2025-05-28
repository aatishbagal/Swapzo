"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { ref, onValue, get } from "firebase/database";
import { 
  User as UserIcon, 
  Star, 
  Trophy, 
  Calendar, 
  Package, 
  Search, 
  Send, 
  Tag,
  Edit,
  PackageOpen
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const swapRequestSchema = z.object({
  offerTitle: z.string().min(3, {
    message: "Offer title must be at least 3 characters.",
  }).max(100, {
    message: "Offer title must not be longer than 100 characters.",
  }),
  offerDescription: z.string().min(10, {
    message: "Offer description must be at least 10 characters.",
  }).max(500, {
    message: "Offer description must not be longer than 500 characters.",
  }),
  message: z.string().min(5, {
    message: "Message must be at least 5 characters.",
  }).max(300, {
    message: "Message must not be longer than 300 characters.",
  }),
});

type SwapRequestFormValues = z.infer<typeof swapRequestSchema>;

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
  createdAt: number | object;
  updatedAt: number | object;
}

interface Offer {
  id: string;
  title: string;
  category?: "Services" | "Items" | "Skills";
  description: string;
  createdAt: number | object;
  updatedAt: number | object;
}

interface Need {
  id: string;
  title: string;
  category?: "Services" | "Items" | "Skills";
  description: string;
  createdAt: number | object;
  updatedAt: number | object;
}

const categoryIcons = {
  Services: "🔧",
  Items: "📦",
  Skills: "🎯"
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapRequestOpen, setIsSwapRequestOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{type: 'offer' | 'need', item: Offer | Need} | null>(null);
  
  const userId = params.userId as string;
  const isOwnProfile = currentUser?.uid === userId;

  const form = useForm<SwapRequestFormValues>({
    resolver: zodResolver(swapRequestSchema),
    defaultValues: {
      offerTitle: "",
      offerDescription: "",
      message: "",
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/auth');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const userProfileRef = ref(db, `userProfiles/${userId}`);
        const snapshot = await get(userProfileRef);
        
        if (snapshot.exists()) {
          setProfileUser(snapshot.val());
        } else {
          toast({
            variant: "destructive",
            title: "User Not Found",
            description: "This user profile doesn't exist or hasn't completed onboarding.",
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user profile.",
        });
      }
    };

    const fetchUserOffers = () => {
      const userOffersRef = ref(db, `userOffers/${userId}`);
      return onValue(userOffersRef, (snapshot) => {
        const data = snapshot.val();
        const loadedOffers: Offer[] = [];
        for (const key in data) {
          loadedOffers.push({ id: key, ...data[key] });
        }
        setOffers(loadedOffers.sort((a, b) => (b.createdAt as number) - (a.createdAt as number)));
      });
    };

    const fetchUserNeeds = () => {
      const userNeedsRef = ref(db, `userNeeds/${userId}`);
      return onValue(userNeedsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedNeeds: Need[] = [];
        for (const key in data) {
          loadedNeeds.push({ id: key, ...data[key] });
        }
        setNeeds(loadedNeeds.sort((a, b) => (b.createdAt as number) - (a.createdAt as number)));
        setIsLoading(false);
      });
    };

    fetchUserProfile();
    const unsubscribeOffers = fetchUserOffers();
    const unsubscribeNeeds = fetchUserNeeds();

    return () => {
      unsubscribeOffers();
      unsubscribeNeeds();
    };
  }, [userId, toast, router]);

  const handleSwapRequest = (type: 'offer' | 'need', item: Offer | Need) => {
    if (isOwnProfile) {
      toast({
        variant: "destructive",
        title: "Invalid Action",
        description: "You cannot send a swap request to yourself.",
      });
      return;
    }
    
    setSelectedItem({ type, item });
    setIsSwapRequestOpen(true);
  };

  const onSubmitSwapRequest = async (data: SwapRequestFormValues) => {
    if (!currentUser || !selectedItem || !profileUser) return;

    try {
      // TODO: Implement notification system - this will be added later
      // For now, just show success message
      toast({
        title: "Swap Request Sent!",
        description: `Your swap request has been sent to ${profileUser.displayName}.`,
      });
      
      setIsSwapRequestOpen(false);
      setSelectedItem(null);
      form.reset();
    } catch (error: any) {
      console.error("Error sending swap request:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send your swap request. Please try again.",
      });
    }
  };

  const formatDate = (timestamp: number | object) => {
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString();
    }
    return 'Unknown';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading || !profileUser) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileUser.photoURL} alt={profileUser.displayName} />
              <AvatarFallback className="text-2xl">
                {getInitials(profileUser.displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {profileUser.displayName}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profileUser.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Trust Score: {profileUser.trustScore}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  XP: {profileUser.xp}
                </Badge>
              </div>
            </div>

            {isOwnProfile && (
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Needs</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Offers
        </h2>
        
        {offers.length === 0 ? (
          <Card className="text-center py-8">
            <CardHeader>
              <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>No Offers</CardTitle>
              <CardDescription>
                {isOwnProfile ? "You haven't listed any offers yet." : `${profileUser.displayName} hasn't listed any offers yet.`}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{offer.title}</CardTitle>
                  {offer.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span>{categoryIcons[offer.category]} {offer.category}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {offer.description}
                  </p>
                </CardContent>
                {!isOwnProfile && (
                  <div className="p-4 pt-0">
                    <Button 
                      className="w-full"
                      onClick={() => handleSwapRequest('offer', offer)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Swap Request
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Needs Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Search className="h-6 w-6" />
          Needs
        </h2>
        
        {needs.length === 0 ? (
          <Card className="text-center py-8">
            <CardHeader>
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>No Needs</CardTitle>
              <CardDescription>
                {isOwnProfile ? "You haven't listed any needs yet." : `${profileUser.displayName} hasn't listed any needs yet.`}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {needs.map((need) => (
              <Card key={need.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{need.title}</CardTitle>
                  {need.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span>{categoryIcons[need.category]} {need.category}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {need.description}
                  </p>
                </CardContent>
                {!isOwnProfile && (
                  <div className="p-4 pt-0">
                    <Button 
                      className="w-full"
                      onClick={() => handleSwapRequest('need', need)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Swap Request
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Swap Request Dialog */}
      <Dialog open={isSwapRequestOpen} onOpenChange={setIsSwapRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Swap Request</DialogTitle>
            <DialogDescription>
              Send a swap request to {profileUser.displayName} for their {selectedItem?.type}: "{selectedItem?.item.title}"
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSwapRequest)} className="space-y-4">
              <FormField
                control={form.control}
                name="offerTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are you offering?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Design Services, Guitar Lessons" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="offerDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe your offer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide details about what you're offering..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a personal message..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Send Request</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}