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
import { Search, Edit, Clock } from "lucide-react";
import { format } from "date-fns";
import { 
  getUserIdFromUsername, 
  validateUsername, 
  canChangeUsername, 
  getUsernameChangeCooldownDays,
  reserveUsername,
  unreserveUsername
} from "@/lib/username-utils";

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
  username: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
  lastUsernameChange: number | null;
  createdAt: string | number;
}

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name must not be longer than 50 characters." }),
});

const usernameFormSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(20, { message: "Username must not be longer than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type UsernameFormValues = z.infer<typeof usernameFormSchema>;

export default function UserProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [usernameValidationMessage, setUsernameValidationMessage] = useState("");
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
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
  }, [username, router, toast]);

  async function fetchProfileData() {
    try {
      // Get user ID from username
      const userId = await getUserIdFromUsername(username);
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "This user profile does not exist.",
        });
        router.push("/dashboard");
        return;
      }

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

      // Set form default values
      profileForm.reset({ displayName: profileData.displayName || "" });
      usernameForm.reset({ username: profileData.username || "" });

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
    if (!currentUser || !profile) return;

    try {
      // Update Firebase Auth display name
      await updateProfile(currentUser, {
        displayName: data.displayName,
      });

      // Update user profile in Realtime Database
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const updatedProfile = {
        ...profile,
        displayName: data.displayName,
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, updatedProfile);
      setProfile(updatedProfile);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      });
    }
  }

  async function validateUsernameOnChange(newUsername: string) {
    if (!newUsername || newUsername === profile?.username) {
      setUsernameValidationMessage("");
      return;
    }

    setIsValidatingUsername(true);
    const result = await validateUsername(newUsername, currentUser?.uid);
    setUsernameValidationMessage(result.message);
    setIsValidatingUsername(false);
  }

  async function handleUsernameChange(data: UsernameFormValues) {
    if (!currentUser || !profile) return;

    const newUsername = data.username.toLowerCase();
    
    // Check if username is the same
    if (newUsername === profile.username) {
      setIsUsernameDialogOpen(false);
      return;
    }

    // Validate username
    const validation = await validateUsername(newUsername, currentUser.uid);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description: validation.message,
      });
      return;
    }

    try {
      // Unreserve old username
      await unreserveUsername(profile.username);
      
      // Reserve new username
      await reserveUsername(newUsername, currentUser.uid);

      // Update user profile
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const updatedProfile = {
        ...profile,
        username: newUsername,
        lastUsernameChange: Date.now(),
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, updatedProfile);
      
      toast({
        title: "Username Updated",
        description: "Your username has been successfully updated.",
      });
      
      setIsUsernameDialogOpen(false);
      
      // Redirect to new username URL
      router.push(`/profile/${newUsername}`);
    } catch (error: any) {
      console.error("Error updating username:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your username.",
      });
    }
  }

  const handleSwapRequest = (item: Offer | Need) => {
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

  const isOwnProfile = currentUser?.uid === profile.uid;
  const canEditUsername = canChangeUsername(profile.lastUsernameChange);
  const cooldownDays = getUsernameChangeCooldownDays(profile.lastUsernameChange);

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
              <CardTitle className="flex items-center gap-2">
                {profile.displayName}
                <span className="text-sm text-muted-foreground">@{profile.username}</span>
              </CardTitle>
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
              <div className="flex gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your account information.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(handleEditProfile)}
                        className="space-y-4"
                      >
                        <FormField
                          control={profileForm.control}
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

                <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!canEditUsername}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Username
                      {!canEditUsername && (
                        <Clock className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Username</DialogTitle>
                      <DialogDescription>
                        {canEditUsername 
                          ? "You can change your username. Note that you'll need to wait 60 days before changing it again."
                          : `You can change your username again in ${cooldownDays} days.`
                        }
                      </DialogDescription>
                    </DialogHeader>
                    {canEditUsername && (
                      <Form {...usernameForm}>
                        <form
                          onSubmit={usernameForm.handleSubmit(handleUsernameChange)}
                          className="space-y-4"
                        >
                          <FormField
                            control={usernameForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="your_username" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      validateUsernameOnChange(e.target.value);
                                    }}
                                  />
                                </FormControl>
                                {isValidatingUsername && (
                                  <p className="text-sm text-muted-foreground">
                                    Checking availability...
                                  </p>
                                )}
                                {usernameValidationMessage && (
                                  <p className={`text-sm ${
                                    usernameValidationMessage.includes("available") 
                                      ? "text-green-600" 
                                      : "text-red-600"
                                  }`}>
                                    {usernameValidationMessage}
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsUsernameDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Update Username</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
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