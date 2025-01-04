import { useUser } from "@/hooks/use-user";
import { useUserRides } from "@/hooks/use-rides";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ride } from "@db/schema";

const editRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateTime: z.string(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.number().min(1, "Must allow at least 1 rider"),
  address: z.string().min(1, "Address is required"),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
});

type EditRideForm = z.infer<typeof editRideSchema>;

function EditRideDialog({ ride, onSave }: { ride: Ride, onSave: (data: EditRideForm) => void }) {
  const form = useForm<EditRideForm>({
    resolver: zodResolver(editRideSchema),
    defaultValues: {
      title: ride.title,
      dateTime: new Date(ride.dateTime).toISOString().slice(0, 16),
      distance: ride.distance,
      difficulty: ride.difficulty as EditRideForm['difficulty'],
      maxRiders: ride.maxRiders,
      address: ride.address,
      rideType: ride.rideType as EditRideForm['rideType'],
      pace: ride.pace,
      terrain: ride.terrain as EditRideForm['terrain'],
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ride</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <label>Title</label>
            <Input {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label>Meeting Location</label>
            <Input {...form.register("address")} />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label>Date and Time</label>
            <Input type="datetime-local" {...form.register("dateTime")} />
          </div>

          <div className="space-y-2">
            <label>Distance (miles)</label>
            <Input type="number" {...form.register("distance", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <label>Difficulty</label>
            <select className="w-full p-2 border rounded" {...form.register("difficulty")}>
              <option value="E">E - Easy</option>
              <option value="D">D - Moderate</option>
              <option value="C">C - Hard</option>
              <option value="B">B - Challenging</option>
              <option value="A">A - Very Hard</option>
              <option value="AA">AA - Extreme</option>
            </select>
          </div>

          <div className="space-y-2">
            <label>Max Riders</label>
            <Input type="number" {...form.register("maxRiders", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <label>Ride Type</label>
            <select className="w-full p-2 border rounded" {...form.register("rideType")}>
              <option value="MTB">Mountain Bike</option>
              <option value="ROAD">Road</option>
              <option value="GRAVEL">Gravel</option>
            </select>
          </div>

          <div className="space-y-2">
            <label>Average Pace (mph)</label>
            <Input type="number" {...form.register("pace", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <label>Terrain</label>
            <select className="w-full p-2 border rounded" {...form.register("terrain")}>
              <option value="FLAT">Flat</option>
              <option value="HILLY">Hilly</option>
              <option value="MOUNTAIN">Mountain</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user, logout } = useUser();
  const { rides, isLoading, deleteRide, updateRide } = useUserRides();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Success",
        description: "Avatar updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "File size must be less than 5MB"
        });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleUpdate = (ride: Ride) => (data: EditRideForm) => {
    updateRide({ id: ride.id, data });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Profile</CardTitle>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                  <AvatarFallback>
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                  htmlFor="avatar-upload"
                >
                  <Upload className="h-6 w-6" />
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Username</h3>
                <p>{user?.username}</p>
                {user?.email && (
                  <>
                    <h3 className="text-lg font-medium mt-4">Email</h3>
                    <p>{user.email}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Rides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides?.map((ride) => (
              <Card key={ride.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ride.title}</CardTitle>
                    <div className="flex gap-2">
                      <EditRideDialog ride={ride} onSave={handleUpdate(ride)} />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this ride?')) {
                            deleteRide(ride.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(ride.dateTime), "PPP")}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Distance: {ride.distance} miles</div>
                    <div>Difficulty: {ride.difficulty}</div>
                    <div>Location: {ride.address}</div>
                    <div>Type: {ride.rideType}</div>
                    <div>Terrain: {ride.terrain}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rides?.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                You haven't created any rides yet
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}