
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { ref, onValue, push, set, remove, serverTimestamp, child } from "firebase/database";
import { PlusCircle, Edit, Trash2, PackageOpen } from "lucide-react";
import { useRouter } from 'next/navigation';

const offerFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title must not be longer than 100 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters.",
  }),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

interface Offer {
  id: string;
  title: string;
  description: string;
  createdAt: number | object;
  updatedAt: number | object;
  userId?: string; // For allOffers
  userDisplayName?: string; // For allOffers
}

export default function MyOffersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: "",
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

  const fetchOffers = useCallback(() => {
    if (!currentUser) return;
    const userOffersRef = ref(db, `userOffers/${currentUser.uid}`);
    const unsubscribe = onValue(userOffersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedOffers: Offer[] = [];
      for (const key in data) {
        loadedOffers.push({ id: key, ...data[key] });
      }
      setOffers(loadedOffers.sort((a, b) => (b.createdAt as number) - (a.createdAt as number))); 
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching offers:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch your offers." });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDialogOpen = (offer: Offer | null = null) => {
    setCurrentOffer(offer);
    if (offer) {
      form.reset({ title: offer.title, description: offer.description });
    } else {
      form.reset({ title: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentOffer(null);
    form.reset();
  };

  async function onSubmitOffer(data: OfferFormValues) {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }

    const offerData = {
      title: data.title,
      description: data.description,
      updatedAt: serverTimestamp(),
    };

    const userDisplayName = currentUser.displayName || currentUser.email || "Anonymous Swapper";

    try {
      if (currentOffer) { // Editing existing offer
        const userOfferRef = ref(db, `userOffers/${currentUser.uid}/${currentOffer.id}`);
        const allOfferRef = ref(db, `allOffers/${currentOffer.id}`);
        await set(userOfferRef, { ...currentOffer, ...offerData, userId: undefined, userDisplayName: undefined }); // Remove user-specific data for userOffers path
        await set(allOfferRef, { ...currentOffer, ...offerData, userId: currentUser.uid, userDisplayName });
        toast({ title: "Offer Updated", description: "Your offer has been successfully updated." });
      } else { // Adding new offer
        const newOfferRefUser = push(child(ref(db), `userOffers/${currentUser.uid}`));
        const newOfferRefAll = ref(db, `allOffers/${newOfferRefUser.key}`);
        
        const newOfferDataUser = { 
          ...offerData, 
          createdAt: serverTimestamp(),
        };
        const newOfferDataAll = { 
          ...offerData, 
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
          userDisplayName: userDisplayName
        };

        await set(newOfferRefUser, newOfferDataUser);
        await set(newOfferRefAll, newOfferDataAll);
        toast({ title: "Offer Added", description: "Your new offer has been successfully added." });
      }
      handleDialogClose();
    } catch (error: any) {
      console.error("Error saving offer:", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save your offer." });
    }
  }

  const handleDeleteOffer = (offerId: string) => {
    setOfferToDelete(offerId);
    setIsDeleteDialogOpen(true);
  };

  async function confirmDeleteOffer() {
    if (!currentUser || !offerToDelete) return;
    try {
      const userOfferRef = ref(db, `userOffers/${currentUser.uid}/${offerToDelete}`);
      const allOfferRef = ref(db, `allOffers/${offerToDelete}`);
      await remove(userOfferRef);
      await remove(allOfferRef);
      toast({ title: "Offer Deleted", description: "The offer has been successfully deleted." });
    } catch (error: any) {
      console.error("Error deleting offer:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: error.message || "Could not delete the offer." });
    } finally {
      setIsDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading your offers...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Offers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogOpen()}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
              <DialogDescription>
                {currentOffer ? "Update the details of your offer." : "Provide details for what you're offering."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitOffer)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Graphic Design Services, Vintage Lamp" {...field} />
                      </FormControl>
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
                          placeholder="Describe what you're offering in detail..."
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
                  <Button type="submit">{currentOffer ? "Save Changes" : "Add Offer"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Offers Yet!</CardTitle>
            <CardDescription>You haven't listed any offers. Click "Add New Offer" to share what you can provide.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{offer.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{offer.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleDialogOpen(offer)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteOffer(offer.id)}>
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
              This action cannot be undone. This will permanently delete your offer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOffer}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
