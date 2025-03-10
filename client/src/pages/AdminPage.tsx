import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, UserX, Settings, Pencil, Download } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type User = {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  emailVerified: boolean;
  display_name: string | null;
  zip_code: string | null;
  club: string | null;
  home_bike_shop: string | null;
  gender: string | null;
  birthdate: string | null;
  rideCount: number;
};

type Ride = {
  id: number;
  title: string;
  dateTime: string;
  distance: number;
  difficulty: string;
  maxRiders: number;
  address: string;
  rideType: string;
  pace: number;
  terrain: string;
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
  route_url?: string;
  description?: string;
};

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
  route_url: z.string().url().optional().or(z.literal('')),
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
      <DialogContent className="max-w-md">
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

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  const handleExportUsers = () => {
    if (!users) return;

    const headers = [
      'ID',
      'Username',
      'Email',
      'Admin',
      'Email Verified',
      'Display Name',
      'ZIP Code',
      'Club',
      'Home Bike Shop',
      'Gender',
      'Birthdate',
      'Rides Created',
      'Avatar URL'
    ];

    const csvData = users.map(user => {
      const fields = [
        user.id.toString(),
        user.username,
        user.email || 'Not provided',
        user.isAdmin ? 'Yes' : 'No',
        user.emailVerified ? 'Yes' : 'No',
        user.display_name || 'Not set',
        user.zip_code || 'Not set',
        user.club || 'Not set',
        user.home_bike_shop || 'Not set',
        user.gender || 'Not set',
        user.birthdate ? format(new Date(user.birthdate), 'yyyy-MM-dd') : 'Not set',
        user.rideCount?.toString() || '0',
        user.avatarUrl || ''
      ];

      return fields.map(field => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { data: rides, isLoading: ridesLoading } = useQuery<Ride[]>({
    queryKey: ['/api/admin/rides'],
    queryFn: async () => {
        const response = await fetch('/api/admin/rides', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch rides');
        }
        return response.json();
      }
  });

  const updateRideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: EditRideForm }) => {
      const response = await fetch(`/api/rides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rides'] });
      toast({
        title: "Success",
        description: "Ride updated successfully"
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

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}" and all their associated data?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rides'] });

      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user"
      });
    }
  };

  const handleDeleteRide = async (rideId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete ride "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rides/${rideId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['/api/admin/rides'] });
      toast({
        title: "Success",
        description: "Ride deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete ride"
      });
    }
  };

  const handleUpdateRide = (ride: Ride) => async (data: EditRideForm) => {
    await updateRideMutation.mutateAsync({ id: ride.id, data });
  };

  if (usersLoading || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Admin Dashboard</CardTitle>
            <Button 
              onClick={handleExportUsers}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export Users
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="rides">Rides</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Display Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Rides Created</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users?.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3">{user.id}</td>
                          <td className="px-4 py-3">{user.username}</td>
                          <td className="px-4 py-3">{user.email || 'Not provided'}</td>
                          <td className="px-4 py-3">{user.isAdmin ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3">{user.display_name || 'Not set'}</td>
                          <td className="px-4 py-3">{user.rideCount || 0}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="rides" className="mt-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Created By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rides?.map((ride) => (
                        <tr key={ride.id}>
                          <td className="px-4 py-3">{ride.id}</td>
                          <td className="px-4 py-3">{ride.title}</td>
                          <td className="px-4 py-3">{ride.owner.username}</td>
                          <td className="px-4 py-3">
                            {format(new Date(ride.dateTime), "PPP")}
                          </td>
                          <td className="px-4 py-3">{ride.rideType}</td>
                          <td className="px-4 py-3">
                            {ride.participants.length} / {ride.maxRiders}
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <EditRideDialog ride={ride} onSave={handleUpdateRide(ride)} />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRide(ride.id, ride.title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}