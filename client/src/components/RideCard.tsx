import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import type { Ride } from "@db/schema";

type RideCardProps = {
  ride: Ride & {
    owner: { username: string };
    participants: Array<{ user: { username: string } }>;
  };
};

export default function RideCard({ ride }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useUser();

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

  const isJoined = ride.participants.some(p => p.user.username === user?.username);
  const participantCount = ride.participants.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ride.title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {format(new Date(ride.dateTime), "E, MMM d • h:mm a")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>Distance: {ride.distance} miles</div>
            <div>
              Difficulty: <span className="text-primary font-bold">{ride.difficulty}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              Riders: {participantCount} / {ride.maxRiders}
            </div>
            <Button
              onClick={handleJoin}
              disabled={isJoined || participantCount >= ride.maxRiders}
            >
              {isJoined ? "Joined" : "Join"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            by {ride.owner.username}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
