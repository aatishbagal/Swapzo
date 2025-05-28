"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { ref, get, set, serverTimestamp } from "firebase/database";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search } from "lucide-react";
import { format } from "date-fns";

// Assuming these types are defined in a shared types file
interface Offer {
  id: string;
  title: string;
  description: string;
  category?: "Services" | "Items" | "Skills";
  userId: string;
  userDisplayName: string;
  createdAt: string;
}

interface Need {
  id: string;
  title: string;
  description: string;
  category?: "Services" | "Items" | "Skills";
  userId: string;
  userDisplayName: string;
  createdAt: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
  createdAt: string | number;
}

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name must not be longer than 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You must be logged in to view profiles.",
        });
        router.push("/auth");
        return;
      }
      setCurrentUser(user);
      fetchProfileData();
    });
    return () => unsubscribe();
  }, [userId, router, toast]);

  async function fetchProfileData() {
    try {
      // Fetch user profile
      const profileRef = ref(db, `userProfiles/${userId}`);
      const profileSnapshot = await get(profileRef);
      const profileData = profileSnapshot.val();
      if (!profileData) {
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "This user profile does not exist.",
        });
        router.push("/dashboard");
        return;
      }
      setProfile(profileData);

      // Set form default values for edit profile
      form.reset({ displayName: profileData.displayName || "" });

      // Fetch offers
      const offersRef = ref(db, `userOffers/${userId}`);
      const offersSnapshot = await get(offersRef);
      const offersData = offersSnapshot.val();
      const offersList = offersData
        ? Object.entries(offersData).map(([id, offer]: [string, any]) => ({
            id,
            ...offer,
          }))
        : [];
      setOffers(offersList);

      // Fetch needs
      const needsRef = ref(db, `userNeeds/${userId}`);
      const needsSnapshot = await get(needsRef);
      const needsData = needsSnapshot.val();
      const needsList = needsData
        ? Object.entries(needsData).map(([id, need]: [string, any]) => ({
            id,
            ...need,
          }))
        : [];
      setNeeds(needsList);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEditProfile(data: ProfileFormValues) {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No user is signed in.",
      });
      return;
    }

    try {
      // Update Firebase Auth display name
      await updateProfile(currentUser, {
        displayName: data.displayName,
      });

      // Update user profile in Realtime Database
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const snapshot = await get(userProfileRef);
      const existingProfileData = snapshot.val();

      const profileDataToSet = {
        uid: currentUser.uid,
        displayName: data.displayName,
        email: currentUser.email,
        photoURL: existingProfileData?.photoURL || null,
        xp: existingProfileData?.xp || 0,
        trustScore: existingProfileData?.trustScore || 50,
        createdAt: existingProfileData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, profileDataToSet);

      // Update local profile state
      setProfile(profileDataToSet);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      });
    }
  }

  const handleSwapRequest = (item: Offer | Need) => {
    // Placeholder for swap request functionality
    toast({
      title: "Coming Soon",
      description: "Swap request functionality will be implemented soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-muted-foreground">
                  {profile.displayName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <CardTitle>{profile.displayName}</CardTitle>
              <CardDescription>
                Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
              Trust: {profile.trustScore}
            </span>
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              XP: {profile.xp}
            </span>
            {isOwnProfile && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your account information.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleEditProfile)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{offers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{needs.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Offers Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Offers</h2>
              {offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Search className="h-12 w-12 mb-2" />
                  <p>No offers available.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((offer) => (
                    <Card key={offer.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <CardDescription>
                          {offer.category ? (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              {offer.category === "Services" && "🛠️"}
                              {offer.category === "Items" && "📦"}
                              {offer.category === "Skills" && "🎓"}
                              {offer.category}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              📂 Uncategorized
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {offer.description}
                        </p>
                        {!isOwnProfile && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => handleSwapRequest(offer)}
                          >
                            Send Swap Request
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Needs Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Needs</h2>
              {needs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Search className="h-12 w-12 mb-2" />
                  <p>No needs available.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {needs.map((need) => (
                    <Card key={need.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{need.title}</CardTitle>
                        <CardDescription>
                          {need.category ? (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              {need.category === "Services" && "🛠️"}
                              {need.category === "Items" && "📦"}
                              {need.category === "Skills" && "🎓"}
                              {need.category}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              📂 Uncategorized
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {need.description}
                        </p>
                        {!isOwnProfile && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => handleSwapRequest(need)}
                          >
                            Send Swap Request
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}