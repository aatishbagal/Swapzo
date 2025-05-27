
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
import { auth, db } from '@/lib/firebase'; // Make sure db is correctly exported from firebase.ts
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import { ref, set, get, child, serverTimestamp } from "firebase/database"; // Import serverTimestamp
import { useRouter } from 'next/navigation';

console.log("EditProfilePage module loaded"); // Debug log

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(50, {
    message: "Display name must not be longer than 50 characters.",
  }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// This is the page for editing the profile
export default function EditProfilePage() {
  console.log("EditProfilePage component rendering"); // Debug log
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        form.reset({
          displayName: user.displayName || "",
          email: user.email || "",
        });
      } else {
        router.push('/auth'); // Redirect if not logged in
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [form, router]);

  async function onSubmit(data: ProfileFormValues) {
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

      // Update/Create profile in Realtime Database
      const userProfileRef = ref(db, `userProfiles/${currentUser.uid}`);
      const snapshot = await get(userProfileRef);
      const existingProfileData = snapshot.val();
      
      const profileDataToSet = {
        uid: currentUser.uid,
        displayName: data.displayName,
        email: currentUser.email, // Email usually doesn't change here, taken from Auth
        photoURL: currentUser.photoURL || null,
        xp: existingProfileData?.xp || 0, // Preserve existing or default to 0
        trustScore: existingProfileData?.trustScore || 50, // Preserve existing or default to 50
        createdAt: existingProfileData?.createdAt || serverTimestamp(), // Preserve or set new
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, profileDataToSet);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      // Optionally, redirect or give other feedback
      // router.push('/dashboard/profile'); // Example redirect
    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading profile...</p></div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's good practice for robustness.
    return <div className="flex justify-center items-center h-screen"><p>Please sign in to view your profile.</p></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your account information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <FormField
                control={form.control}
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
    </div>
  );
}
