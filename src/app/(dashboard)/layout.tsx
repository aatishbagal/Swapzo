
"use client";

import type React from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { 
  LayoutGrid, 
  UserCircle, 
  Gift, 
  ListChecks, 
  MessageSquare, 
  History, 
  Settings2,
  Gem,
  LogOut,
  Users, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { findSwapMatchesAction } from './actions'; // Import the Server Action
import type { SuggestSwapMatchesOutput } from '@/ai/flows/suggest-swap-matches';

const sidebarNavItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/profile/edit", icon: UserCircle, label: "Profile" }, 
  { href: "/offers", icon: Gift, label: "My Offers" },
  { href: "/needs", icon: ListChecks, label: "My Needs" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/history", icon: History, label: "Swap History" },
  { href: "/settings", icon: Settings2, label: "Settings" },
];


function DashboardSidebarContent() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [matchResults, setMatchResults] = useState<SuggestSwapMatchesOutput | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setCurrentUser);
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been signed out successfully." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Out Failed", description: error.message });
    }
  };

  const handleFindSwapMatches = async () => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to find matches." });
      return;
    }
    setIsFindingMatches(true);
    setMatchError(null);
    setMatchResults(null);
    setIsMatchDialogOpen(true); 

    const result = await findSwapMatchesAction(currentUser.uid); 
    
    if ('error' in result) {
      setMatchError(result.error);
      toast({ variant: "destructive", title: "Match Finding Error", description: result.error, duration: 5000 });
    } else {
      setMatchResults(result);
      if(result.directMatches.length === 0 && result.chainMatches.length === 0) {
        toast({ title: "No Matches Found", description: "Try adding more offers or needs for better results.", duration: 5000 });
      } else {
        toast({ title: "Matches Found!", description: "Check the dialog for your potential swaps.", duration: 3000 });
      }
    }
    setIsFindingMatches(false);
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <div className={cn(
            "flex items-center gap-2",
            sidebarState === "collapsed" && "justify-center"
          )}>
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {sidebarNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex flex-col gap-2",
          sidebarState === "collapsed" && "items-center"
        )}>
          <AlertDialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
            <AlertDialogTrigger asChild>
               <Button 
                variant="default" 
                className={cn(
                  "w-full justify-start gap-2 p-2 bg-accent text-accent-foreground hover:bg-accent/90", 
                  sidebarState === "collapsed" && "w-auto justify-center"
                )}
                onClick={handleFindSwapMatches}
                disabled={isFindingMatches}
              >
                <Users className={cn("h-5 w-5", sidebarState === "collapsed" && "mr-0")} />
                {sidebarState === "expanded" && (isFindingMatches ? "Finding..." : "Find Swap Match")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Swap Matches</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 text-left max-h-[60vh] overflow-y-auto py-2">
                    {isFindingMatches && <p>Finding potential matches for you...</p>}
                    {matchError && <p className="text-destructive">Error: {matchError}</p>}
                    {matchResults && !isFindingMatches && (
                      <>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Direct Matches:</h3>
                          {matchResults.directMatches.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {matchResults.directMatches.map((match, index) => (
                                <li key={`direct-${index}`}>{match}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No direct matches found.</p>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Chain Matches:</h3>
                          {matchResults.chainMatches.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {matchResults.chainMatches.map((match, index) => (
                                <li key={`chain-${index}`}>{match}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No chain matches found.</p>
                          )}
                        </div>
                      </>
                    )}
                     {!isFindingMatches && !matchError && !matchResults && (
                        <p className="text-sm text-muted-foreground">Click "Find Swap Match" to see results.</p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsMatchDialogOpen(false)}>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start gap-2 p-2", sidebarState === "collapsed" && "w-auto justify-center")}>
                <Gem className={cn(sidebarState === "collapsed" && "mr-0")} />
                {sidebarState === "expanded" && <span>Upgrade Account</span>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Coming Soon!</AlertDialogTitle>
                <AlertDialogDescription>
                  The "Upgrade Account" feature is currently under development and will be available soon. Stay tuned for exciting new premium features!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
           <SidebarMenuButton
            onClick={handleSignOut}
            variant="ghost"
            className={cn("w-full justify-start", sidebarState === "collapsed" && "w-auto justify-center")}
            tooltip="Sign Out"
          >
            <LogOut />
            <span>Sign Out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <DashboardSidebarContent />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
