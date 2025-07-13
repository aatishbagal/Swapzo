import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, 
  Trophy, 
  MessageCircle, 
  User, 
  ArrowLeftRight,
  Users
} from "lucide-react";

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
}

interface SimpleMatchDialogProps {
  match: { text: string; userIds: string[] } | null;
  userProfiles: Map<string, UserProfile>;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  onViewProfile: (username: string) => void;
}

export default function SimpleMatchDialog({
  match,
  userProfiles,
  isOpen,
  onClose,
  onStartChat,
  onViewProfile
}: SimpleMatchDialogProps) {
  if (!match) return null;

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Building";
  };

  const getXPLevel = (xp: number) => {
    if (xp >= 1000) return { level: "Expert", color: "bg-purple-500" };
    if (xp >= 500) return { level: "Advanced", color: "bg-blue-500" };
    if (xp >= 100) return { level: "Intermediate", color: "bg-green-500" };
    return { level: "Beginner", color: "bg-gray-500" };
  };

  const isChainMatch = match.text.toLowerCase().includes('chain');
  const primaryUserId = match.userIds[0];
  const primaryUser = primaryUserId ? userProfiles.get(primaryUserId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isChainMatch ? <Users className="h-5 w-5 text-primary" /> : <ArrowLeftRight className="h-5 w-5 text-primary" />}
            Swap Match Found!
          </DialogTitle>
          <DialogDescription>
            {isChainMatch ? 'Chain swap opportunity' : 'Direct swap opportunity'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Match Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {match.text}
              </p>
            </CardContent>
          </Card>

          {/* Primary User Profile */}
          {primaryUser && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {isChainMatch ? 'Primary Contact' : 'Match Partner'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={primaryUser.photoURL} alt={primaryUser.displayName} />
                    <AvatarFallback>{primaryUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{primaryUser.displayName}</h3>
                      <Badge variant="secondary" className="text-xs">
                        @{primaryUser.username}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span className={getTrustScoreColor(primaryUser.trustScore)}>
                          {primaryUser.trustScore}/100
                        </span>
                        <span className="text-xs">({getTrustScoreLabel(primaryUser.trustScore)})</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        <span>{primaryUser.xp} XP</span>
                        <Badge className={`text-xs ${getXPLevel(primaryUser.xp).color}`}>
                          {getXPLevel(primaryUser.xp).level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Users (for chain matches) */}
          {isChainMatch && match.userIds.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Other Participants
                </CardTitle>
                <CardDescription>
                  Additional users involved in this chain swap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {match.userIds.slice(1).map((userId, index) => {
                    const user = userProfiles.get(userId);
                    return (
                      <div key={userId} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                        {user ? (
                          <>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL} alt={user.displayName} />
                              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{user.displayName}</span>
                                <Badge variant="outline" className="text-xs">
                                  Step {index + 2}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Trust: {user.trustScore}/100</span>
                                <span>XP: {user.xp}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1">
                              <div className="h-3 bg-muted rounded animate-pulse mb-1" />
                              <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No User Data Available */}
          {!primaryUser && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Loading user profile information...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {primaryUser ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onViewProfile(primaryUser.username)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
              <Button 
                onClick={() => onStartChat(primaryUser.uid)}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 