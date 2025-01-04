import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, UserX } from "lucide-react";
import { format } from "date-fns";

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  rides: any[];
};

type Ride = {
  id: number;
  title: string;
  dateTime: string;
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
};

export default function AdminPage() {
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: rides, isLoading: ridesLoading } = useQuery<Ride[]>({
    queryKey: ['/api/admin/rides'],
  });

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user and all their associated data?')) {
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

  const handleDeleteRide = async (rideId: number) => {
    if (!confirm('Are you sure you want to delete this ride?')) {
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
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
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
                        <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Rides Created</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users?.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3">{user.username}</td>
                          <td className="px-4 py-3">{user.isAdmin ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3">{user.rides.length}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
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
                        <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Created By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rides?.map((ride) => (
                        <tr key={ride.id}>
                          <td className="px-4 py-3">{ride.title}</td>
                          <td className="px-4 py-3">{ride.owner.username}</td>
                          <td className="px-4 py-3">
                            {format(new Date(ride.dateTime), "PPP")}
                          </td>
                          <td className="px-4 py-3">
                            {ride.participants.length}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRide(ride.id)}
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
