import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { InsertRide } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateTime: z.string(),
  distance: z.number().min(1, "Distance must be at least 1km"),
  difficulty: z.number().min(1).max(5),
  maxRiders: z.number().min(1, "Must allow at least 1 rider"),
  latitude: z.string(),
  longitude: z.string(),
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
      difficulty: 3,
      maxRiders: 20,
      latitude: "45.5155",
      longitude: "-122.6789",
      dateTime: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    },
  });

  const onSubmit = async (data: CreateRideForm) => {
    try {
      const formattedData: InsertRide = {
        ...data,
        distance: Number(data.distance),
        difficulty: Number(data.difficulty),
        maxRiders: Number(data.maxRiders),
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
        throw new Error(error.message || "Failed to create ride");
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-[600px] mx-4">
        <CardHeader>
          <CardTitle>Create New Ride</CardTitle>
        </CardHeader>
        <CardContent>
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
              <label>Date and Time</label>
              <Input
                type="datetime-local"
                {...form.register("dateTime")}
              />
              {form.formState.errors.dateTime && (
                <p className="text-sm text-destructive">{form.formState.errors.dateTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Distance (km)</label>
              <Input
                type="number"
                {...form.register("distance", { valueAsNumber: true })}
              />
              {form.formState.errors.distance && (
                <p className="text-sm text-destructive">{form.formState.errors.distance.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Difficulty (1-5)</label>
              <Slider
                defaultValue={[form.getValues("difficulty")]}
                min={1}
                max={5}
                step={1}
                onValueChange={([value]) => form.setValue("difficulty", value)}
              />
              {form.formState.errors.difficulty && (
                <p className="text-sm text-destructive">{form.formState.errors.difficulty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Max Riders</label>
              <Input
                type="number"
                {...form.register("maxRiders", { valueAsNumber: true })}
              />
              {form.formState.errors.maxRiders && (
                <p className="text-sm text-destructive">{form.formState.errors.maxRiders.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit">Create Ride</Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}