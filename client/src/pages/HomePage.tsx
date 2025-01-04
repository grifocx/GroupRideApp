import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import { MapComponent } from "@/components/MapComponent";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function HomePage() {
  const { rides, isLoading } = useRides();
  const [filters, setFilters] = useState<RideFilters>({
    search: "",
    rideType: "all",
    minDistance: 0,
    maxDistance: 100,
    difficulty: "all",
    terrain: "all",
  });

  const filteredRides = useMemo(() => {
    if (!rides) return [];

    return rides.filter((ride) => {
      // Text search
      if (
        filters.search &&
        !ride.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Ride type
      if (filters.rideType !== "all" && ride.rideType !== filters.rideType) {
        return false;
      }

      // Distance range
      if (
        ride.distance < filters.minDistance ||
        ride.distance > filters.maxDistance
      ) {
        return false;
      }

      // Difficulty
      if (filters.difficulty !== "all" && ride.difficulty !== filters.difficulty) {
        return false;
      }

      // Terrain
      if (filters.terrain !== "all" && ride.terrain !== filters.terrain) {
        return false;
      }

      return true;
    });
  }, [rides, filters]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Welcome Banner */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to CycleGroup</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Connect with fellow cyclists, join group rides, and explore new trails together. 
            Find your perfect riding group based on your style and experience level.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <RideSearch onFilterChange={setFilters} />
        </div>

        {/* Interactive Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Ride Map</h2>
          <div className="bg-card rounded-lg p-4">
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <MapComponent 
                rides={filteredRides}
                onMarkerClick={(ride) => {
                  // TODO: Implement ride detail view
                  console.log('Clicked ride:', ride);
                }}
              />
            )}
          </div>
        </div>

        {/* Ride List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Rides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />
              ))
            ) : (
              <>
                {filteredRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
                {filteredRides.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No rides found matching your criteria
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}