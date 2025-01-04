
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Heart, Share2, Info } from "lucide-react";
import type { Ride } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type RideCardProps = {
  ride: Ride & {
    owner: { username: string };
    participants: Array<{ user: { username: string } }>;
  };
};

const DifficultyDots = ({ level }: { level: string }) => {
  const dots = ['E', 'D', 'C', 'B', 'A'].indexOf(level) + 1;
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "w-3 h-3 rounded-full",
            i < dots ? "bg-green-500" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
};

export default function RideCard({ ride }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const handleJoinToggle = async () => {
    try {
      const endpoint = `/api/rides/${ride.id}/${isJoined ? 'unjoin' : 'join'}`;
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

  const isJoined = ride.participants.some(p => p.user.username === user?.username);
  const participantCount = ride.participants.length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-primary">{ride.title}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Heart className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 text-gray-600">
          <div className="flex items-center">
            <div className="text-xl">{format(new Date(ride.dateTime), "E, MMM d • h:mm a")}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-gray-600">Distance:</div>
              <div className="text-xl font-semibold">{ride.distance} km</div>
            </div>

            <div>
              <div className="text-gray-600">Difficulty:</div>
              <div className="flex items-center gap-3">
                <DifficultyDots level={ride.difficulty} />
                <span className="text-gray-600">({difficultyLabels[ride.difficulty]})</span>
              </div>
            </div>

            <div>
              <div className="text-gray-600">Riders:</div>
              <div className="text-xl font-semibold">{participantCount} / {ride.maxRiders}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{ride.owner.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-gray-600">by {ride.owner.username}</div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="text-blue-500">
              <Info className="h-4 w-4 mr-2" />
              Show Details
            </Button>
            <Button 
              variant={isJoined ? "default" : "default"}
              className={cn(
                "px-8 rounded-full",
                isJoined ? "bg-primary" : "bg-green-500 hover:bg-green-600"
              )}
              onClick={handleJoinToggle}
              disabled={!isJoined && participantCount >= ride.maxRiders}
            >
              {isJoined ? "Joined" : "Join"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const difficultyLabels = {
  'E': 'Beginner',
  'D': 'Novice',
  'C': 'Intermediate',
  'B': 'Advanced',
  'A': 'Expert',
  'AA': 'Professional'
} as const;
