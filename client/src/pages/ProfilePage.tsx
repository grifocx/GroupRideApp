import { useUser } from "@/hooks/use-user";
import { useUserRides } from "@/hooks/use-rides";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ride } from "@db/schema";
import { ProfileProgress } from "@/components/ProfileProgress";
import { RideStats } from "@/components/RideStats";
import { motion } from "framer-motion";
import { useState, memo } from "react";
import type { RiderPreferences } from "@db/schema";
import { useRidePreferences } from "@/hooks/use-ride-preferences"; // Assumed import


// EditRideForm schema update to handle date properly
const editRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateTime: z.string(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.coerce.number().min(1, "Must allow at least 1 rider"),
  address: z.string().min(1, "Address is required"),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  route_url: z.string().optional(),
  description: z.string().optional(),
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
      route_url: ride.route_url || '',
      description: ride.description || '',
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
            <label>Route URL (optional)</label>
            <Input
              type="url"
              placeholder="https://www.strava.com/routes/..."
              {...form.register("route_url")}
            />
            {form.formState.errors.route_url && (
              <p className="text-sm text-destructive">{form.formState.errors.route_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label>Description (optional)</label>
            <textarea
              className="w-full p-2 border rounded min-h-[100px]"
              placeholder="Add any additional details about the ride..."
              {...form.register("description")}
            />
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

const riderPreferencesSchema = z.object({
  preferredRideTypes: z.array(z.enum(['MTB', 'ROAD', 'GRAVEL']))
    .min(1, "Select at least one ride type"),
  preferredTerrains: z.array(z.enum(['FLAT', 'HILLY', 'MOUNTAIN']))
    .min(1, "Select at least one terrain type"),
  preferredDifficulties: z.array(z.enum(['E', 'D', 'C', 'B', 'A', 'AA']))
    .min(1, "Select at least one difficulty level"),
  minPace: z.number().min(1, "Minimum pace must be at least 1 mph").optional(),
  maxPace: z.number().optional(),
  preferredDistance: z.number().min(1, "Distance must be at least 1 mile").optional(),
  availableDays: z.array(z.string()).optional(),
  matchRadius: z.number().min(1, "Radius must be at least 1 mile").max(200, "Maximum radius is 200 miles").default(50),
}).refine((data) => {
  if (data.minPace && data.maxPace) {
    return data.maxPace > data.minPace;
  }
  return true;
}, {
  message: "Maximum pace must be greater than minimum pace",
  path: ["maxPace"],
});

// Memoized checkbox group component for better performance
const CheckboxGroup = memo(({
  options,
  name,
  register,
  label
}: {
  options: Array<{ value: string; label: string; }>;
  name: string;
  register: UseFormRegister<any>;
  label: string;
}) => (
  <div className="space-y-2">
    <label>{label}</label>
    <div className="flex gap-2 flex-wrap">
      {options.map(({ value, label }) => (
        <label key={value} className="flex items-center space-x-2">
          <input
            type="checkbox"
            value={value}
            {...register(name)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  </div>
));

CheckboxGroup.displayName = 'CheckboxGroup';

function RideBuddyPreferencesDialog() {
  const { preferences, updatePreferences, isUpdating } = useRidePreferences();
  const form = useForm<z.infer<typeof riderPreferencesSchema>>({
    resolver: zodResolver(riderPreferencesSchema),
    defaultValues: {
      preferredRideTypes: preferences?.preferredRideTypes || [],
      preferredTerrains: preferences?.preferredTerrains || [],
      preferredDifficulties: preferences?.preferredDifficulties || [],
      minPace: preferences?.minPace,
      maxPace: preferences?.maxPace,
      preferredDistance: preferences?.preferredDistance,
      availableDays: preferences?.availableDays || [],
      matchRadius: preferences?.matchRadius || 50,
    },
  });

  const { toast } = useToast();

  const onSubmit = async (data: z.infer<typeof riderPreferencesSchema>) => {
    try {
      await updatePreferences(data);
      toast({
        title: "Success",
        description: "Ride preferences updated successfully"
      });
    } catch (error) {
      console.error('Preferences update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences"
      });
    }
  };

  const rideTypeOptions = [
    { value: 'MTB', label: 'Mountain Bike' },
    { value: 'ROAD', label: 'Road' },
    { value: 'GRAVEL', label: 'Gravel' },
  ];

  const terrainOptions = [
    { value: 'FLAT', label: 'Flat' },
    { value: 'HILLY', label: 'Hilly' },
    { value: 'MOUNTAIN', label: 'Mountain' },
  ];

  const difficultyOptions = [
    { value: 'E', label: 'Easy' },
    { value: 'D', label: 'Moderate' },
    { value: 'C', label: 'Hard' },
    { value: 'B', label: 'Challenging' },
    { value: 'A', label: 'Very Hard' },
    { value: 'AA', label: 'Extreme' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Update Ride Preferences</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ride Buddy Preferences</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CheckboxGroup
            options={rideTypeOptions}
            name="preferredRideTypes"
            register={form.register}
            label="Preferred Ride Types"
          />
          {form.formState.errors.preferredRideTypes && (
            <p className="text-sm text-destructive">
              {form.formState.errors.preferredRideTypes.message}
            </p>
          )}

          <CheckboxGroup
            options={terrainOptions}
            name="preferredTerrains"
            register={form.register}
            label="Preferred Terrains"
          />
          {form.formState.errors.preferredTerrains && (
            <p className="text-sm text-destructive">
              {form.formState.errors.preferredTerrains.message}
            </p>
          )}

          <CheckboxGroup
            options={difficultyOptions}
            name="preferredDifficulties"
            register={form.register}
            label="Difficulty Levels"
          />
          {form.formState.errors.preferredDifficulties && (
            <p className="text-sm text-destructive">
              {form.formState.errors.preferredDifficulties.message}
            </p>
          )}

          <div className="space-y-2">
            <label>Pace Range (mph)</label>
            <div className="flex gap-4">
              <div>
                <label className="text-sm">Minimum</label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register("minPace", { valueAsNumber: true })}
                />
                {form.formState.errors.minPace && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.minPace.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm">Maximum</label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register("maxPace", { valueAsNumber: true })}
                />
                {form.formState.errors.maxPace && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.maxPace.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label>Preferred Distance (miles)</label>
            <Input
              type="number"
              {...form.register("preferredDistance", { valueAsNumber: true })}
            />
            {form.formState.errors.preferredDistance && (
              <p className="text-sm text-destructive">
                {form.formState.errors.preferredDistance.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label>Match Radius (miles)</label>
            <Input
              type="number"
              {...form.register("matchRadius", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum distance to search for ride buddies
            </p>
            {form.formState.errors.matchRadius && (
              <p className="text-sm text-destructive">
                {form.formState.errors.matchRadius.message}
              </p>
            )}
          </div>

          <CheckboxGroup
            options={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ value: day, label: day }))}
            name="availableDays"
            register={form.register}
            label="Available Days"
          />

          <div className="flex justify-end gap-2">
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save Preferences'
              )}
            </Button>
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleUpdate = (ride: Ride) => async (data: EditRideForm) => {
    try {
      await updateRide({
        id: ride.id,
        data: {
          ...data,
          dateTime: new Date(data.dateTime),
        },
      });
    } catch (error) {
      console.error('Failed to update ride:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update ride"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Overview</CardTitle>
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatarUrl} alt={user?.username ?? "User"} />
                    <AvatarFallback>
                      {(user?.username ?? "U").slice(0, 2).toUpperCase()}
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
                </motion.div>
                <div className="space-y-4 flex-grow">
                  <h2 className="text-2xl font-bold">{user?.display_name ?? user?.username ?? "User"}</h2>
                  <ProfileProgress user={user} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p className="mt-1">{user?.username ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Display Name</h3>
                    <p className="mt-1">{user?.display_name ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="mt-1">{user?.email ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Zip Code</h3>
                    <p className="mt-1">{user?.zip_code ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Club</h3>
                    <p className="mt-1">{user?.club ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Home Bike Shop</h3>
                    <p className="mt-1">{user?.home_bike_shop ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                    <p className="mt-1">{user?.gender ?? "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Birthdate</h3>
                    <p className="mt-1">
                      {user?.birthdate ? format(new Date(user.birthdate), 'MMMM d, yyyy') : "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);

                        const closeDialog = () => {
                          const closeButton = document.querySelector('[aria-label="Close"]');
                          if (closeButton instanceof HTMLButtonElement) {
                            closeButton.click();
                          }
                        };

                        const payload = {
                          display_name: formData.get('display_name'),
                          zip_code: formData.get('zip_code'),
                          club: formData.get('club'),
                          home_bike_shop: formData.get('home_bike_shop'),
                          gender: formData.get('gender'),
                          birthdate: formData.get('birthdate'),
                          email: formData.get('email'),
                        };

                        try {
                          const response = await fetch('/api/user/profile', {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload),
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            throw new Error(await response.text());
                          }

                          await response.json();
                          await queryClient.invalidateQueries({ queryKey: ['user'] });

                          toast({
                            title: "Success",
                            description: "Profile updated successfully"
                          });

                          closeDialog();
                        } catch (error) {
                          console.error('Profile update error:', error);
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error instanceof Error ? error.message : "Failed to update profile"
                          });
                        }
                      }} className="space-y-4">
                        <div className="space-y-2">
                          <label>Display Name</label>
                          <Input name="display_name" defaultValue={user?.display_name || ''} />
                        </div>
                        <div className="space-y-2">
                          <label>Email</label>
                          <Input name="email" type="email" defaultValue={user?.email || ''} />
                        </div>
                        <div className="space-y-2">
                          <label>Zip Code</label>
                          <Input name="zip_code" defaultValue={user?.zip_code || ''} />
                        </div>
                        <div className="space-y-2">
                          <label>Club</label>
                          <Input name="club" defaultValue={user?.club || ''} />
                        </div>
                        <div className="space-y-2">
                          <label>Home Bike Shop</label>
                          <Input name="home_bike_shop" defaultValue={user?.home_bike_shop || ''} />
                        </div>
                        <div className="space-y-2">
                          <label>Gender</label>
                          <select name="gender" className="w-full p-2 border rounded" defaultValue={user?.gender || ''}>
                            <option value="">Prefer not to say</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="NB">Non-Binary</option>
                            <option value="O">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label>Birthdate</label>
                          <Input
                            type="date"
                            name="birthdate"
                            defaultValue={user?.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : ''}
                          />
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

                  <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={form.handleSubmit(async (data) => {
                        try {
                          const response = await fetch('/api/user/change-password', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              currentPassword: data.currentPassword,
                              newPassword: data.newPassword,
                            }),
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            throw new Error(await response.text());
                          }

                          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });

                          toast({
                            title: "Success",
                            description: "Password updated successfully"
                          });

                          form.reset();
                          setIsChangePasswordOpen(false);
                        } catch (error) {
                          console.error('Password change error:', error);
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error instanceof Error ? error.message : "Failed to change password"
                          });
                        }
                      })}>
                        <div className="space-y-2">
                          <label>Current Password</label>
                          <Input
                            type="password"
                            {...form.register("currentPassword")}
                          />
                          {form.formState.errors.currentPassword && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label>New Password</label>
                          <Input
                            type="password"
                            {...form.register("newPassword")}
                          />
                          {form.formState.errors.newPassword && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.newPassword.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label>Confirm New Password</label>
                          <Input
                            type="password"
                            {...form.register("confirmPassword")}
                          />
                          {form.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Change Password</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 space-y-8"
        >
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Created Rides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rides?.filter(ride => ride.ownerId === user?.id).map((ride) => (
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
              {rides?.filter(ride => ride.ownerId === user?.id).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You haven't created any rides yet
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Rides You've Joined</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rides?.filter(ride => ride.ownerId !== user?.id).map((ride) => (
                <Card key={ride.id}>
                  <CardHeader>
                    <div className="flex justifybetween items-start">
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
                      <p>
                        {format(new Date(ride.dateTime), 'PPP')} at{' '}
                        {format(new Date(ride.dateTime), 'p')}
                      </p>
                      <p>{ride.address}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Distance: {ride.distance} miles</span>
                        <span>Pace: {ride.pace} mph</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Difficulty: {ride.difficulty}</span>
                        <span>Terrain: {ride.terrain}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Type: {ride.rideType}</span>
                        <span>Spots: {ride.maxRiders}</span>
                      </div>
                      {ride.description && (
                        <p className="text-sm mt-2">{ride.description}</p>
                      )}
                      {ride.route_url && (
                        <a
                          href={ride.route_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Route
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rides?.filter(ride => ride.ownerId !== user?.id).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You haven't joined any rides yet
                </div>
              )}
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Ride Buddy Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Set your riding preferences to find compatible riding buddies in your area.
                </p>
                <RideBuddyPreferencesDialog />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}