import { useRides } from "@/hooks/use-rides";
import { NavBar } from "@/components/NavBar";
import CalendarView from "@/components/CalendarView";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";

export default function CalendarPage() {
  const { rides, isLoading } = useRides();

  const ridesByDate = useMemo(() => {
    if (!rides) return {};
    
    return rides.reduce((acc, ride) => {
      const date = format(new Date(ride.dateTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(ride);
      return acc;
    }, {} as Record<string, typeof rides>);
  }, [rides]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Ride Calendar</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <CalendarView 
            rides={rides || []} 
            ridesByDate={ridesByDate}
          />
        )}
      </main>
    </div>
  );
}
