import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { InsertRide } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

const createRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string(),
  time: z.string(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.number().min(1, "Must allow at least 1 rider"),
  address: z.string().min(1, "Address is required"),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  route_url: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_type: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  recurring_day: z.coerce.number().min(0).max(31).optional(),
  recurring_time: z.string().optional(),
  recurring_end_date: z.string().optional(),
});

type CreateRideForm = z.infer<typeof createRideSchema>;

export default function CreateRidePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateRideForm>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      title: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      distance: 25,
      difficulty: "C",
      maxRiders: 20,
      address: "",
      rideType: "ROAD",
      pace: 20,
      terrain: "FLAT",
      route_url: "",
      description: "",
      is_recurring: false,
      recurring_type: "WEEKLY",
      recurring_day: 0,
      recurring_time: "09:00",
      recurring_end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
    },
  });

  const onSubmit = async (data: CreateRideForm) => {
    try {
      const dateTime = new Date(`${data.date}T${data.time}`);

      const formattedData: Partial<InsertRide> = {
        ...data,
        dateTime,
        distance: Number(data.distance),
        maxRiders: Number(data.maxRiders),
        pace: Number(data.pace),
      };

      // Clean up empty strings for optional fields
      if (!formattedData.route_url) {
        formattedData.route_url = null;
      }
      if (!formattedData.description) {
        formattedData.description = null;
      }

      // Handle recurring ride data
      if (formattedData.is_recurring) {
        formattedData.recurring_end_date = new Date(data.recurring_end_date);
        formattedData.recurring_time = data.time; // Use the same time as the first occurrence
      } else {
        delete formattedData.recurring_type;
        delete formattedData.recurring_day;
        delete formattedData.recurring_time;
        delete formattedData.recurring_end_date;
      }

      // Remove form-specific fields
      delete formattedData.date;
      delete formattedData.time;

      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Failed to create ride");
      }

      toast({
        title: "Success",
        description: formattedData.is_recurring 
          ? "Recurring ride series created successfully"
          : "Ride created successfully",
      });
      setLocation("/");
    } catch (error) {
      console.error('Create ride error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ride",
      });
    }
  };

  const isRecurring = form.watch("is_recurring");
  const recurringType = form.watch("recurring_type");

  const getRecurringDayLabel = () => {
    if (recurringType === "WEEKLY") {
      return "Day of Week";
    }
    return "Day of Month";
  };

  const getRecurringDayOptions = () => {
    if (recurringType === "WEEKLY") {
      return [
        { value: 0, label: "Sunday" },
        { value: 1, label: "Monday" },
        { value: 2, label: "Tuesday" },
        { value: 3, label: "Wednesday" },
        { value: 4, label: "Thursday" },
        { value: 5, label: "Friday" },
        { value: 6, label: "Saturday" },
      ];
    }
    return Array.from({ length: 31 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}${getDayOfMonthSuffix(i + 1)}`,
    }));
  };

  const getDayOfMonthSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <Card className="w-[600px] mx-4">
        <CardHeader>
          <CardTitle>Create New Ride</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Ride Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Saturday Morning Group Ride"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    {...form.register("time")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Meeting Location</Label>
                <Input
                  id="address"
                  placeholder="Enter the starting point address"
                  {...form.register("address")}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Ride Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ride Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (miles)</Label>
                  <Input
                    id="distance"
                    type="number"
                    {...form.register("distance", { valueAsNumber: true })}
                  />
                  {form.formState.errors.distance && (
                    <p className="text-sm text-destructive">{form.formState.errors.distance.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pace">Average Pace (mph)</Label>
                  <Input
                    id="pace"
                    type="number"
                    {...form.register("pace", { valueAsNumber: true })}
                  />
                  {form.formState.errors.pace && (
                    <p className="text-sm text-destructive">{form.formState.errors.pace.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select 
                    id="difficulty"
                    className="w-full p-2 border rounded" 
                    {...form.register("difficulty")}
                  >
                    <option value="E">E - Easy</option>
                    <option value="D">D - Moderate</option>
                    <option value="C">C - Hard</option>
                    <option value="B">B - Challenging</option>
                    <option value="A">A - Very Hard</option>
                    <option value="AA">AA - Extreme</option>
                  </select>
                  {form.formState.errors.difficulty && (
                    <p className="text-sm text-destructive">{form.formState.errors.difficulty.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRiders">Max Riders</Label>
                  <Input
                    id="maxRiders"
                    type="number"
                    {...form.register("maxRiders", { valueAsNumber: true })}
                  />
                  {form.formState.errors.maxRiders && (
                    <p className="text-sm text-destructive">{form.formState.errors.maxRiders.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rideType">Ride Type</Label>
                  <select 
                    id="rideType"
                    className="w-full p-2 border rounded" 
                    {...form.register("rideType")}
                  >
                    <option value="MTB">Mountain Bike</option>
                    <option value="ROAD">Road</option>
                    <option value="GRAVEL">Gravel</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrain">Terrain</Label>
                  <select 
                    id="terrain"
                    className="w-full p-2 border rounded" 
                    {...form.register("terrain")}
                  >
                    <option value="FLAT">Flat</option>
                    <option value="HILLY">Hilly</option>
                    <option value="MOUNTAIN">Mountain</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="route_url">Route URL (optional)</Label>
                <Input
                  id="route_url"
                  type="url"
                  placeholder="https://www.strava.com/routes/..."
                  {...form.register("route_url")}
                />
                {form.formState.errors.route_url && (
                  <p className="text-sm text-destructive">{form.formState.errors.route_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded min-h-[100px]"
                  placeholder="Add any additional details about the ride..."
                  {...form.register("description")}
                />
              </div>
            </div>

            <Separator />

            {/* Recurring Ride Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recurring Ride</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => form.setValue("is_recurring", checked)}
                  />
                  <Label htmlFor="is-recurring">Make this a recurring ride</Label>
                </div>
              </div>

              {isRecurring && (
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurring_type">Frequency</Label>
                      <select
                        id="recurring_type"
                        className="w-full p-2 border rounded"
                        {...form.register("recurring_type")}
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurring_day">{getRecurringDayLabel()}</Label>
                      <select
                        id="recurring_day"
                        className="w-full p-2 border rounded"
                        {...form.register("recurring_day", { valueAsNumber: true })}
                      >
                        {getRecurringDayOptions().map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurring_end_date">End Date</Label>
                    <Input
                      id="recurring_end_date"
                      type="date"
                      {...form.register("recurring_end_date")}
                    />
                    <p className="text-sm text-muted-foreground">
                      The ride series will end on this date (inclusive)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">
                {isRecurring ? "Create Ride Series" : "Create Ride"}
              </Button>
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