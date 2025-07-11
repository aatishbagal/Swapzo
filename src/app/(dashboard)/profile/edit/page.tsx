"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import { ref, set, get, serverTimestamp } from "firebase/database";
import { useRouter } from 'next/navigation';
import { Clock, Edit } from "lucide-react";
import { 
  validateUsername, 
  canChangeUsername, 
  getUsernameChangeCooldownDays,
  reserveUsername,
  unreserveUsername
} from "@/lib/username-utils";

console.log("EditProfilePage module loaded");

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(50, {
    message: "Display name must not be longer than 50 characters.",
  }),
  email: z.string().email(),
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

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
  lastUsernameChange: number | null;
  createdAt: string | number;
}

export default function EditProfilePage() {
  console.log("EditProfilePage component rendering");
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [usernameValidationMessage, setUsernameValidationMessage] = useState("");
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch user profile from database
        const userProfileRef = ref(db, `userProfiles/${user.uid}`);
        const snapshot = await get(userProfileRef);
        const profileData = snapshot.val();
        
        if (profileData) {
          setUserProfile(profileData);
          profileForm.reset({
            displayName: profileData.displayName || "",
            email: profileData.email || "",
          });
          usernameForm.reset({
            username: profileData.username || "",
          });
        }
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [profileForm, usernameForm, router]);

  async function onSubmitProfile(data: ProfileFormValues) {
    if (!currentUser || !userProfile) {
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

      // Update profile in Realtime Database
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const updatedProfile = {
        ...userProfile,
        displayName: data.displayName,
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, updatedProfile);
      setUserProfile(updatedProfile);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
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
    if (!newUsername || newUsername === userProfile?.username) {
      setUsernameValidationMessage("");
      return;
    }

    setIsValidatingUsername(true);
    const result = await validateUsername(newUsername, currentUser?.uid);
    setUsernameValidationMessage(result.message);
    setIsValidatingUsername(false);
  }

  async function onSubmitUsername(data: UsernameFormValues) {
    if (!currentUser || !userProfile) return;

    const newUsername = data.username.toLowerCase();
    
    // Check if username is the same
    if (newUsername === userProfile.username) {
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
      await unreserveUsername(userProfile.username);
      
      // Reserve new username
      await reserveUsername(newUsername, currentUser.uid);

      // Update user profile
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const updatedProfile = {
        ...userProfile,
        username: newUsername,
        lastUsernameChange: Date.now(),
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, updatedProfile);
      setUserProfile(updatedProfile);
      
      toast({
        title: "Username Updated",
        description: "Your username has been successfully updated.",
      });
      
      setIsUsernameDialogOpen(false);
      
      // Redirect to new username profile
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading profile...</p></div>;
  }

  if (!currentUser || !userProfile) {
    return <div className="flex justify-center items-center h-screen"><p>Please sign in to view your profile.</p></div>;
  }

  const canEditUsername = canChangeUsername(userProfile.lastUsernameChange);
  const cooldownDays = getUsernameChangeCooldownDays(userProfile.lastUsernameChange);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your basic account information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
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
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} readOnly disabled />
                      </FormControl>
                      <FormDescription>
                        Your email address cannot be changed here.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Username Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Clock className="h-5 w-5" />
              Username Change Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• You can change your username once every 60 days</p>
              <p>• Your profile URL will change when you update your username</p>
              <p>• Choose carefully as frequent changes are not allowed</p>
              {userProfile.lastUsernameChange && (
                <p>• Next change available: {new Date(userProfile.lastUsernameChange + (60 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Username Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Username Settings
              <span className="text-sm text-muted-foreground">@{userProfile.username}</span>
            </CardTitle>
            <CardDescription>
              {canEditUsername 
                ? "You can change your username. After changing, you'll need to wait 60 days before changing it again."
                : `You can change your username again in ${cooldownDays} days.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Username</p>
                <p className="text-2xl font-bold">@{userProfile.username}</p>
                {userProfile.lastUsernameChange && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last changed: {new Date(userProfile.lastUsernameChange).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
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
                    <DialogTitle>Change Username</DialogTitle>
                    <DialogDescription>
                      Choose a new username. This will change your profile URL and you won't be able to change it again for 60 days.
                    </DialogDescription>
                  </DialogHeader>
                  {canEditUsername && (
                    <Form {...usernameForm}>
                      <form
                        onSubmit={usernameForm.handleSubmit(onSubmitUsername)}
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
                              <FormDescription>
                                Username can only contain letters, numbers, and underscores (3-20 characters).
                              </FormDescription>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}