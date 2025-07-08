'use client'

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Check, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";

const difficultyColors = {
  'E': 'bg-green-500',
  'D': 'bg-lime-500',
  'C': 'bg-yellow-500',
  'B': 'bg-orange-500',
  'A': 'bg-red-500',
  'AA': 'bg-purple-500'
} as const;

const difficultyLabels = {
  'E': 'Beginner',
  'D': 'Novice',
  'C': 'Intermediate',
  'B': 'Advanced',
  'A': 'Expert',
  'AA': 'Professional'
} as const;

interface RideCardProps {
  ride: Ride;
  onJoinToggle?: (rideId: number) => void;
  onEdit?: (rideId: number) => void;
  onShare?: (rideId: number) => void;
}

export default function RideCard({ ride, onJoinToggle, onEdit, onShare }: RideCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  
  // Mock current user - replace with actual auth
  const currentUser = { username: 'testuser' };
  
  const isJoined = ride.participants.some(p => p.user.username === currentUser?.username);
  const participantCount = ride.participants.length;

  const handleJoinToggle = async () => {
    if (!onJoinToggle) return;
    
    setIsJoining(true);
    try {
      await onJoinToggle(ride.id);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg active:scale-[0.98]",
      isJoined && "ring-2 ring-primary/50"
    )}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex justify-between items-start">
          <div className="cursor-pointer hover:text-primary transition-colors flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold line-clamp-2">
                {ride.title}
              </CardTitle>
              {ride.canEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => onEdit(ride.id)}
                  title="Edit ride"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(new Date(ride.dateTime), "E, MMM d • h:mm a")}
            </div>
          </div>
          {onShare && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2 h-8 w-8"
              onClick={() => onShare(ride.id)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {/* Map placeholder - will integrate with Leaflet later */}
      <div 
        className="relative bg-muted cursor-pointer"
        style={{ height: "calc(20vh - 16px)", maxHeight: "200px", minHeight: "120px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Map View</span>
        </div>
      </div>
      
      <CardContent className="pt-3 sm:pt-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Ride details */}
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2 min-w-[50%]">
              <span className="whitespace-nowrap">{ride.distance} miles</span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${difficultyColors[ride.difficulty]}`}
                  title={difficultyLabels[ride.difficulty]}
                />
                <span>{difficultyLabels[ride.difficulty]}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground sm:hidden whitespace-nowrap">
              {ride.rideType} • {ride.pace} mph pace
            </div>
          </div>

          {/* Owner and participant count */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {ride.owner.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground line-clamp-1 max-w-[90px] sm:max-w-[120px]">
                {ride.owner.username}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {participantCount} / {ride.maxRiders} riders
            </div>
          </div>

          {/* Join button */}
          <Button
            className="w-full h-10 sm:h-9"
            variant={isJoined ? "default" : "outline"}
            onClick={handleJoinToggle}
            disabled={isJoining || (!isJoined && participantCount >= ride.maxRiders)}
          >
            <div className="flex items-center gap-2">
              {isJoined ? (
                <>
                  <Check className="h-4 w-4" />
                  Joined
                </>
              ) : (
                "Join Ride"
              )}
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}