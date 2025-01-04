import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import { MapComponent } from "@/components/MapComponent";
import CalendarView from "@/components/CalendarView";
import { Loader2, Calendar as CalendarIcon, List } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type ViewMode = 'list' | 'calendar';

export default function HomePage() {
  const { rides, isLoading } = useRides();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
      if (
        filters.search &&
        !ride.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.rideType !== "all" && ride.rideType !== filters.rideType) {
        return false;
      }

      if (
        ride.distance < filters.minDistance ||
        ride.distance > filters.maxDistance
      ) {
        return false;
      }

      if (filters.difficulty !== "all" && ride.difficulty !== filters.difficulty) {
        return false;
      }

      if (filters.terrain !== "all" && ride.terrain !== filters.terrain) {
        return false;
      }

      // Date filtering
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Welcome Banner - More compact on mobile */}
      <section className="bg-primary text-primary-foreground py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Welcome to CycleGroup</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto">
            Connect with fellow cyclists, join group rides, and explore new trails together. 
            Find your perfect riding group based on your style and experience level.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <RideSearch onFilterChange={setFilters} />
          <div className="inline-flex rounded-md border shadow-sm">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-r-none ${viewMode === 'list' ? '' : 'border-r'}`}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2 rounded-l-none"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView rides={filteredRides} />
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-8">
            {/* Interactive Map - Full width on mobile */}
            <div className="order-2 lg:order-1">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Ride Map</h2>
              <div className="bg-card rounded-lg p-4 lg:sticky lg:top-4">
                <MapComponent 
                  rides={filteredRides}
                  onMarkerClick={(ride) => {
                    console.log('Clicked ride:', ride);
                  }}
                />
              </div>
            </div>

            {/* Ride List - Full width on mobile */}
            <div className="order-1 lg:order-2">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Available Rides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
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