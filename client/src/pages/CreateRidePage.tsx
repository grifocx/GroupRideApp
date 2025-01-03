import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { InsertRide } from "@db/schema";

export default function CreateRidePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<InsertRide>({
    defaultValues: {
      title: "",
      distance: 25,
      difficulty: 3,
      maxRiders: 20,
      latitude: "45.5155",
      longitude: "-122.6789",
      dateTime: new Date().toISOString(),
    },
  });

  const onSubmit = async (data: InsertRide) => {
    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
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
            <Input
              placeholder="Ride Title"
              {...form.register("title", { required: true })}
            />
            
            <Input
              type="datetime-local"
              {...form.register("dateTime", { required: true })}
            />

            <div className="space-y-2">
              <label>Distance (km)</label>
              <Input
                type="number"
                {...form.register("distance", { required: true, min: 1 })}
              />
            </div>

            <div className="space-y-2">
              <label>Difficulty (1-5)</label>
              <Slider
                min={1}
                max={5}
                step={1}
                {...form.register("difficulty")}
              />
            </div>

            <div className="space-y-2">
              <label>Max Riders</label>
              <Input
                type="number"
                {...form.register("maxRiders", { required: true, min: 1 })}
              />
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
