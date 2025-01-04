import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Map, MapPin, Share2, Copy, ExternalLink } from "lucide-react";
import { FaTwitter, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Ride } from "@db/schema";

type RideCardProps = {
  ride: Ride & {
    owner: { username: string };
    participants: Array<{ user: { username: string } }>;
  };
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

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/rides/${ride.id}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "Successfully joined the ride",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join ride",
      });
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/rides/${ride.id}`;
    const shareText = `Join me for a ${ride.distance} mile ${ride.rideType.toLowerCase()} ride: ${ride.title}`;

    if (platform) {
      let shareLink = '';

      switch (platform) {
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case 'whatsapp':
          shareLink = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
          break;
      }

      window.open(shareLink, '_blank', 'noopener,noreferrer');
    } else {
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
    }
  };

  const isJoined = ride.participants.some(p => p.user.username === user?.username);
  const participantCount = ride.participants.length;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold">{ride.title}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(ride.dateTime), "E, MMM d • h:mm a")}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
                    <FaTwitter className="mr-2 h-4 w-4" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
                    <FaFacebook className="mr-2 h-4 w-4" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">
                    <FaWhatsapp className="mr-2 h-4 w-4" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare()} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <div className="relative h-32 bg-muted">
            <div ref={mapRef} className="h-full w-full" />
            {(!ride.latitude || !ride.longitude) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ride.distance} miles</span>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${difficultyColors[ride.difficulty as keyof typeof difficultyColors]}`}
                      title={difficultyLabels[ride.difficulty as keyof typeof difficultyLabels]}
                    />
                    <span>{difficultyLabels[ride.difficulty as keyof typeof difficultyLabels]}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {ride.owner.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {ride.owner.username}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {participantCount} / {ride.maxRiders} riders
                </div>
              </div>

              <Button
                className="w-full"
                variant={isJoined ? "secondary" : "default"}
                onClick={handleJoin}
                disabled={isJoined || participantCount >= ride.maxRiders}
              >
                {isJoined ? "Joined" : "Join Ride"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0">
        <div className="p-4">
          <h4 className="font-semibold mb-2">{ride.title}</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Location:</span> {ride.address}
            </div>
            <div>
              <span className="font-medium">Type:</span> {ride.rideType}
            </div>
            <div>
              <span className="font-medium">Terrain:</span> {ride.terrain}
            </div>
            <div>
              <span className="font-medium">Pace:</span> {ride.pace} mph
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}