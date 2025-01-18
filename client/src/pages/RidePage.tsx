import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Users, Activity, Bike, Mountain, Link2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import type { Ride } from "@db/schema";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

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

export default function RidePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const { data: ride, isLoading } = useQuery<Ride & {
    owner: { username: string };
    participants: Array<{ user: { username: string } }>;
    comments: Array<{
      id: number;
      content: string;
      createdAt: string;
      isPinned: boolean;
      user: { username: string };
    }>;
  }>({
    queryKey: [`/api/rides/${id}`],
  });

  useEffect(() => {
    if (mapRef.current && ride && !mapInstanceRef.current) {
      const lat = parseFloat(ride.latitude);
      const lng = parseFloat(ride.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const map = L.map(mapRef.current).setView([lat, lng], 13);

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
  }, [ride?.latitude, ride?.longitude]);

  const handleJoinToggle = async () => {
    if (!ride) return;

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

      // Invalidate all related queries to trigger refreshes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/rides/${id}`] }), // Current ride page
        queryClient.invalidateQueries({ queryKey: ['/api/rides'] }), // Home page rides list
        queryClient.invalidateQueries({ queryKey: ['/api/rides/user/participating'] }), // Profile page participating rides
        queryClient.invalidateQueries({ queryKey: ['/api/rides/user/owned'] }), // Profile page owned rides
      ]);

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

  if (isLoading || !ride) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  const isJoined = ride.participants.some(p => p.user.username === user?.username);
  const participantCount = ride.participants.length;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <motion.main
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{ride.title}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(ride.dateTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.distance} miles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${difficultyColors[ride.difficulty as keyof typeof difficultyColors]}`} />
                      <span>{difficultyLabels[ride.difficulty as keyof typeof difficultyLabels]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.rideType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.terrain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.pace} mph pace</span>
                    </div>
                  </div>

                  <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
                    <div ref={mapRef} className="h-full w-full" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.address}</span>
                    </div>

                    {ride.route_url && (
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary" />
                        <a
                          href={ride.route_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-2"
                        >
                          View Route Details
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {ride.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{ride.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ x: 20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ride Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Organized by</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {ride.owner.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{ride.owner.username}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium">Participants ({participantCount}/{ride.maxRiders})</div>
                    <div className="mt-1.5 space-y-2">
                      {ride.participants.map((participant) => (
                        <div key={participant.user.username} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {participant.user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{participant.user.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={isJoined ? "default" : "outline"}
                    onClick={handleJoinToggle}
                    disabled={!isJoined && participantCount >= ride.maxRiders}
                  >
                    {isJoined ? "Leave Ride" : "Join Ride"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Comments Section */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const content = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;

                      try {
                        const response = await fetch(`/api/rides/${ride.id}/comments`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ content }),
                          credentials: 'include',
                        });

                        if (!response.ok) throw new Error('Failed to post comment');

                        queryClient.invalidateQueries({ queryKey: [`/api/rides/${id}`] });
                        (form.elements.namedItem('comment') as HTMLTextAreaElement).value = '';

                        toast({
                          title: "Success",
                          description: "Comment posted successfully",
                        });
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to post comment",
                        });
                      }
                    }} className="space-y-4">
                      <textarea
                        name="comment"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Write a comment..."
                      />
                      <Button type="submit">Post Comment</Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground">Please log in to comment</p>
                  )}

                  <div className="mt-6 space-y-4">
                    {ride.comments?.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {comment.user.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{comment.user.username}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                        {ride.ownerId === user?.id && !comment.isPinned && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/rides/${ride.id}/comments/${comment.id}/pin`, {
                                  method: 'POST',
                                  credentials: 'include',
                                });

                                if (!response.ok) throw new Error('Failed to pin comment');

                                queryClient.invalidateQueries({ queryKey: [`/api/rides/${id}`] });

                                toast({
                                  title: "Success",
                                  description: "Comment pinned successfully",
                                });
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: error instanceof Error ? error.message : "Failed to pin comment",
                                });
                              }
                            }}
                          >
                            Pin Comment
                          </Button>
                        )}
                        {comment.isPinned && (
                          <Badge variant="secondary">Pinned</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}