import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Copy, Check, Repeat, Pencil, Share2, Mail, MessageSquare } from "lucide-react";
import { FaTwitter, FaFacebook } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import L from "leaflet";
import type { Ride } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RideWithRelations = Ride & {
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
  canEdit?: boolean;
};

type RideCardProps = {
  ride: RideWithRelations;
};

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

export default function RideCard({ ride }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const lat = parseFloat(ride.latitude);
      const lng = parseFloat(ride.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const map = L.map(mapRef.current, {
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          touchZoom: false,
          doubleClickZoom: false
        }).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map);
        mapInstanceRef.current = map;
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ride.latitude, ride.longitude]);

  const handleJoinToggle = async () => {
    try {
      const isJoined = ride.participants.some(p => p.user.username === user?.username);
      const endpoint = `/api/rides/${ride.id}/${isJoined ? 'leave' : 'join'}`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: "Success",
        description: isJoined ? "Left the ride" : "Successfully joined the ride",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isJoined ? 'leave' : 'join'} ride`,
      });
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/rides/${ride.id}`;
    const shareText = `Join me for a ${ride.distance} mile ${ride.rideType.toLowerCase()} ride: ${ride.title}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodedText} ${encodedUrl}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Success",
            description: "Link copied to clipboard",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to copy link",
          });
        }
        break;
    }
  };

  const isJoined = ride.participants.some(p => p.user.username === user?.username);
  const participantCount = ride.participants.length;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg active:scale-[0.98]",
      isJoined && "ring-2 ring-primary/50"
    )}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex justify-between items-start">
          <div
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => setLocation(`/rides/${ride.id}`)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold line-clamp-2">
                {ride.title}
              </CardTitle>
              {ride.canEdit === true && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/rides/${ride.id}/edit`);
                  }}
                  title="Edit ride"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(new Date(ride.dateTime), "E, MMM d • h:mm a")}
            </div>
            {ride.is_recurring && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <Repeat className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">
                  Recurring {ride.recurring_type} ride
                  {ride.recurring_end_date && ` until ${format(new Date(ride.recurring_end_date), "MMM d, yyyy")}`}
                </span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 h-8 w-8 touch-manipulation" 
                style={{zIndex: 10}}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleShare('twitter')}>
                <FaTwitter className="mr-2 h-4 w-4" />
                Share on Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('facebook')}>
                <FaFacebook className="mr-2 h-4 w-4" />
                Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('email')}>
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('sms')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Share via SMS
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {/* Map area with slightly more height on larger screens */}
      <div 
        className="relative bg-muted cursor-pointer"
        style={{ height: "calc(20vh - 16px)", maxHeight: "200px", minHeight: "120px" }}
        onClick={() => setLocation(`/rides/${ride.id}`)}
      >
        <div ref={mapRef} className="h-full w-full" style={{ zIndex: 0 }} />
        {(!ride.latitude || !ride.longitude) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <CardContent className="pt-3 sm:pt-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Ride details - more responsive layout */}
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2 min-w-[50%]">
              <span className="whitespace-nowrap">{ride.distance} miles</span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${difficultyColors[ride.difficulty as keyof typeof difficultyColors]}`}
                  title={difficultyLabels[ride.difficulty as keyof typeof difficultyLabels]}
                />
                <span>{difficultyLabels[ride.difficulty as keyof typeof difficultyLabels]}</span>
              </div>
            </div>
            
            {/* Additional ride type info on mobile */}
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

          {/* Join button with larger touch target */}
          <Button
            className="w-full h-10 sm:h-9 touch-manipulation"
            variant={isJoined ? "default" : "outline"}
            onClick={handleJoinToggle}
            disabled={!isJoined && participantCount >= ride.maxRiders}
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