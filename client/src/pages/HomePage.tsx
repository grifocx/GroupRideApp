import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function HomePage() {
  const { rides, isLoading } = useRides();
  const [filters, setFilters] = useState<RideFilters>({
    search: "",
    rideType: "all",
    minDistance: 0,
    maxDistance: 100,
    difficulty: "C",
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

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
            {filteredRides.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No rides found matching your criteria
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}