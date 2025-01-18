import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import Footer from "@/components/Footer";
import type { RideWithRelations } from "@/hooks/use-rides";

export default function ArchivedRidesPage() {
  const { data: rides, isLoading } = useQuery<RideWithRelations[]>({
    queryKey: ["/api/rides/archived"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Archived Rides</h1>
          <p className="text-muted-foreground">View past rides and their details</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rides?.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
            {rides?.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No archived rides found
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
