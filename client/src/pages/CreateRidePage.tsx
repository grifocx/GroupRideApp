import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/NavBar";
import { RoutePlanner } from "@/components/RoutePlanner";
import type { InsertRide } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateTime: z.string(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.number().min(1, "Must allow at least 1 rider"),
  address: z.string().min(1, "Address is required"),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  routeUrl: z.string().optional(),
  description: z.string().optional(),
});

type CreateRideForm = z.infer<typeof createRideSchema>;

export default function CreateRidePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateRideForm>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      title: "",
      distance: 25,
      difficulty: "C",
      maxRiders: 20,
      address: "",
      dateTime: new Date().toISOString().slice(0, 16),
      rideType: "ROAD",
      pace: 20,
      terrain: "FLAT",
    },
  });

  const handleRouteChange = (route: {
    distance: number;
    elevationGain: number;
    difficulty: string;
    coordinates: [number, number][];
  }) => {
    // Update form with route data
    form.setValue('distance', Math.round(route.distance * 0.621371)); // Convert km to miles
    form.setValue('difficulty', route.difficulty);

    // Set terrain based on elevation gain
    if (route.elevationGain < 100) {
      form.setValue('terrain', 'FLAT');
    } else if (route.elevationGain < 500) {
      form.setValue('terrain', 'HILLY');
    } else {
      form.setValue('terrain', 'MOUNTAIN');
    }
  };

  const onSubmit = async (data: CreateRideForm) => {
    try {
      const formattedData: Partial<InsertRide> = {
        ...data,
        distance: Number(data.distance),
        maxRiders: Number(data.maxRiders),
        pace: Number(data.pace),
        dateTime: new Date(data.dateTime).toISOString(),
      };

      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to create ride");
      }

      toast({
        title: "Success",
        description: "Ride created successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ride",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Ride</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Plan Route</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on the map to add waypoints and create your route. The elevation profile and difficulty will be calculated automatically.
                  </p>
                  <RoutePlanner onRouteChange={handleRouteChange} />
                </div>
              </div>

              <div>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label>Title</label>
                    <Input
                      placeholder="Ride Title"
                      {...form.register("title")}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label>Meeting Location</label>
                    <Input
                      placeholder="Enter the starting point address"
                      {...form.register("address")}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label>Date and Time</label>
                    <Input
                      type="datetime-local"
                      {...form.register("dateTime")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label>Distance (miles)</label>
                    <Input
                      type="number"
                      {...form.register("distance", { valueAsNumber: true })}
                    />
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
                    <Input
                      type="number"
                      {...form.register("maxRiders", { valueAsNumber: true })}
                    />
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
                    <Input
                      type="number"
                      {...form.register("pace", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label>Terrain</label>
                    <select className="w-full p-2 border rounded" {...form.register("terrain")}>
                      <option value="FLAT">Flat</option>
                      <option value="HILLY">Hilly</option>
                      <option value="MOUNTAIN">Mountain</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit">Create Ride</Button>
                    <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}