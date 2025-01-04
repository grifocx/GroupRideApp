import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import { MapComponent } from "@/components/MapComponent";
import CalendarView from "@/components/CalendarView";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { rides, isLoading } = useRides();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<RideFilters>({
    search: "",
    rideType: "all",
    minDistance: 0,
    maxDistance: 100,
    difficulty: "all",
    terrain: "all",
    startDate: null,
    endDate: null,
  });

  const filteredRides = useMemo(() => {
    if (!rides) return [];

    return rides.filter((ride) => {
      if (filters.search && !ride.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      if (filters.rideType !== "all" && ride.rideType !== filters.rideType) {
        return false;
      }

      if (ride.distance < filters.minDistance || ride.distance > filters.maxDistance) {
        return false;
      }

      if (filters.difficulty !== "all" && ride.difficulty !== filters.difficulty) {
        return false;
      }

      if (filters.terrain !== "all" && ride.terrain !== filters.terrain) {
        return false;
      }

      const rideDate = new Date(ride.dateTime);
      if (filters.startDate && rideDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && rideDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [rides, filters]);

  // Group rides by date for the calendar
  const ridesByDate = useMemo(() => {
    return filteredRides.reduce((acc, ride) => {
      const date = format(new Date(ride.dateTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(ride);
      return acc;
    }, {} as Record<string, typeof filteredRides>);
  }, [filteredRides]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Welcome Banner - More compact */}
      <section className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to RideGroops</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Connect with fellow cyclists, create & join group rides, and explore new road & trails together.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <RideSearch onFilterChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="h-[400px]">
                    <MapComponent 
                      rides={filteredRides}
                      onMarkerClick={(ride) => {
                        console.log('Clicked ride:', ride);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mini Calendar Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">This Month's Rides</h2>
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setLocation("/calendar")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Full Calendar
                    </Button>
                  </div>
                  <CalendarView 
                    rides={filteredRides}
                    compact={true}
                    ridesByDate={ridesByDate}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Rides Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Available Rides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
                {filteredRides.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No rides found matching your criteria
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}