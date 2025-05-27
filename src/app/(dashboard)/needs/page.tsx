"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { ref, onValue, push, set, remove, serverTimestamp, child } from "firebase/database";
import { PlusCircle, Edit, Trash2, Search, Tag } from "lucide-react";
import { useRouter } from 'next/navigation';

const needFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title must not be longer than 100 characters.",
  }),
  category: z.enum(["Services", "Items", "Skills"], {
    required_error: "Please select a category.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters.",
  }),
});

type NeedFormValues = z.infer<typeof needFormSchema>;

interface Need {
  id: string;
  title: string;
  category: "Services" | "Items" | "Skills";
  description: string;
  createdAt: number | object;
  updatedAt: number | object;
  userId?: string; // For allNeeds
  userDisplayName?: string; // For allNeeds
}

const categoryIcons = {
  Services: "🔧",
  Items: "📦",
  Skills: "🎯"
};

export default function MyNeedsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentNeed, setCurrentNeed] = useState<Need | null>(null);
  const [needToDelete, setNeedToDelete] = useState<string | null>(null);

  const form = useForm<NeedFormValues>({
    resolver: zodResolver(needFormSchema),
    defaultValues: {
      title: "",
      category: undefined,
      description: "",
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchNeeds = useCallback(() => {
    if (!currentUser) return;
    const userNeedsRef = ref(db, `userNeeds/${currentUser.uid}`);
    const unsubscribe = onValue(userNeedsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedNeeds: Need[] = [];
      for (const key in data) {
        loadedNeeds.push({ id: key, ...data[key] });
      }
      setNeeds(loadedNeeds.sort((a, b) => (b.createdAt as number) - (a.createdAt as number))); 
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching needs:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch your needs." });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  const handleDialogOpen = (need: Need | null = null) => {
    setCurrentNeed(need);
    if (need) {
      form.reset({ title: need.title, category: need.category, description: need.description });
    } else {
      form.reset({ title: "", category: undefined, description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentNeed(null);
    form.reset();
  };

  async function onSubmitNeed(data: NeedFormValues) {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }

    const needData = {
      title: data.title,
      category: data.category,
      description: data.description,
      updatedAt: serverTimestamp(),
    };

    const userDisplayName = currentUser.displayName || currentUser.email || "Anonymous Swapper";

    try {
      if (currentNeed) { // Editing existing need
        const userNeedRef = ref(db, `userNeeds/${currentUser.uid}/${currentNeed.id}`);
        const allNeedRef = ref(db, `allNeeds/${currentNeed.id}`);
        await set(userNeedRef, { ...currentNeed, ...needData, userId: undefined, userDisplayName: undefined }); // Remove user-specific data for userNeeds path
        await set(allNeedRef, { ...currentNeed, ...needData, userId: currentUser.uid, userDisplayName });
        toast({ title: "Need Updated", description: "Your need has been successfully updated." });
      } else { // Adding new need
        const newNeedRefUser = push(child(ref(db), `userNeeds/${currentUser.uid}`));
        const newNeedRefAll = ref(db, `allNeeds/${newNeedRefUser.key}`);
        
        const newNeedDataUser = { 
          ...needData, 
          createdAt: serverTimestamp(),
        };
        const newNeedDataAll = { 
          ...needData, 
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
          userDisplayName: userDisplayName
        };

        await set(newNeedRefUser, newNeedDataUser);
        await set(newNeedRefAll, newNeedDataAll);
        toast({ title: "Need Added", description: "Your new need has been successfully added." });
      }
      handleDialogClose();
    } catch (error: any) {
      console.error("Error saving need:", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save your need." });
    }
  }

  const handleDeleteNeed = (needId: string) => {
    setNeedToDelete(needId);
    setIsDeleteDialogOpen(true);
  };

  async function confirmDeleteNeed() {
    if (!currentUser || !needToDelete) return;
    try {
      const userNeedRef = ref(db, `userNeeds/${currentUser.uid}/${needToDelete}`);
      const allNeedRef = ref(db, `allNeeds/${needToDelete}`);
      await remove(userNeedRef);
      await remove(allNeedRef);
      toast({ title: "Need Deleted", description: "The need has been successfully deleted." });
    } catch (error: any) {
      console.error("Error deleting need:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: error.message || "Could not delete the need." });
    } finally {
      setIsDeleteDialogOpen(false);
      setNeedToDelete(null);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading your needs...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Needs</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogOpen()}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Need
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentNeed ? "Edit Need" : "Add New Need"}</DialogTitle>
              <DialogDescription>
                {currentNeed ? "Update the details of your need." : "Provide details for what you're looking for."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitNeed)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web Design Help, Vintage Guitar, Cooking Lessons" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Services">🔧 Services</SelectItem>
                          <SelectItem value="Items">📦 Items</SelectItem>
                          <SelectItem value="Skills">🎯 Skills</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what you're looking for in detail..."
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit">{currentNeed ? "Save Changes" : "Add Need"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {needs.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Needs Yet!</CardTitle>
            <CardDescription>You haven't listed any needs. Click "Add New Need" to share what you're looking for.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {needs.map((need) => (
            <Card key={need.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate flex items-center gap-2">
                  <span>{need.title}</span>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>{categoryIcons[need.category]} {need.category}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{need.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleDialogOpen(need)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteNeed(need.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your need.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNeed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}