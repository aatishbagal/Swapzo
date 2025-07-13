"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { ref, set, get, serverTimestamp } from "firebase/database";
import { type User } from 'firebase/auth';
import { UserCircle, AlertCircle } from "lucide-react";
import { 
  validateUsername, 
  reserveUsername,
  generateUsernameFromEmail
} from "@/lib/username-utils";

const usernameFormSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(20, { message: "Username must not be longer than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
});

type UsernameFormValues = z.infer<typeof usernameFormSchema>;

interface UsernameSetupDialogProps {
  user: User;
  onUsernameCreated: (username: string) => void;
}

export function UsernameSetupDialog({ user, onUsernameCreated }: UsernameSetupDialogProps) {
  const { toast } = useToast();
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameValidationMessage, setUsernameValidationMessage] = useState("");
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    // Generate a suggested username from email
    if (user.email) {
      const suggested = generateUsernameFromEmail(user.email);
      setSuggestedUsername(suggested);
      form.setValue("username", suggested);
      validateUsernameOnChange(suggested);
    }
  }, [user.email, form]);

  async function validateUsernameOnChange(newUsername: string) {
    if (!newUsername) {
      setUsernameValidationMessage("");
      return;
    }

    setIsValidatingUsername(true);
    const result = await validateUsername(newUsername, user.uid);
    setUsernameValidationMessage(result.message);
    setIsValidatingUsername(false);
  }

  async function onSubmitUsername(data: UsernameFormValues) {
    const newUsername = data.username.toLowerCase();
    
    // Validate username
    const validation = await validateUsername(newUsername, user.uid);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description: validation.message,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Reserve the username
      await reserveUsername(newUsername, user.uid);

      // Update user profile
      const userProfileRef = ref(db, `userProfiles/${user.uid}`);
      const snapshot = await get(userProfileRef);
      const existingProfile = snapshot.val() || {};
      
      const updatedProfile = {
        ...existingProfile,
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'New Swapper',
        email: user.email || '',
        photoURL: user.photoURL || '',
        username: newUsername,
        trustScore: existingProfile.trustScore || 50,
        xp: existingProfile.xp || 0,
        lastUsernameChange: null, // First-time setup, so no cooldown
        createdAt: existingProfile.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await set(userProfileRef, updatedProfile);
      
      toast({
        title: "Username Created!",
        description: `Your username @${newUsername} has been set successfully.`,
      });
      
      onUsernameCreated(newUsername);
    } catch (error: any) {
      console.error("Error creating username:", error);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Could not create your username.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const useSuggestedUsername = () => {
    form.setValue("username", suggestedUsername);
    validateUsernameOnChange(suggestedUsername);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            Complete Your Profile Setup
          </DialogTitle>
          <DialogDescription>
            Welcome to SwapZo! To get started, please choose a unique username. This will be your identity on the platform and cannot be changed for 60 days once set.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Your username will be part of your profile URL</li>
              <li>Choose carefully - you can only change it once every 60 days</li>
              <li>Must be 3-20 characters (letters, numbers, underscores only)</li>
            </ul>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitUsername)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose Your Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="your_username" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          validateUsernameOnChange(e.target.value);
                        }}
                        className="pl-8"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        @
                      </span>
                    </div>
                  </FormControl>
                  {isValidatingUsername && (
                    <p className="text-sm text-muted-foreground">
                      Checking availability...
                    </p>
                  )}
                  {usernameValidationMessage && (
                    <p className={`text-sm ${
                      usernameValidationMessage.includes("available") 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {usernameValidationMessage}
                    </p>
                  )}
                  <FormDescription>
                    {suggestedUsername && (
                      <button
                        type="button"
                        onClick={useSuggestedUsername}
                        className="text-primary hover:underline text-xs"
                      >
                        💡 Use suggested: @{suggestedUsername}
                      </button>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={
                  isSubmitting || 
                  isValidatingUsername || 
                  !usernameValidationMessage.includes("available")
                }
              >
                {isSubmitting ? "Setting up..." : "Create Username & Continue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}