import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import Footer from "@/components/Footer";
import { MapComponent } from "@/components/MapComponent";
import CalendarView from "@/components/CalendarView";
import { Loader2, Calendar as CalendarIcon, MapPin, Search, List } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { motion } from "framer-motion";

// Layout component
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

const ScrollButton = ({ targetId, children }: { targetId: string, children: React.ReactNode }) => {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    const offset = 80; // Account for fixed header
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="outline"
        onClick={handleClick}
        className="flex items-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {children}
      </Button>
    </motion.div>
  );
};

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
    showRecurring: false,
  });

  const filteredRides = useMemo(() => {
    if (!rides) return [];

    const currentDate = new Date();

    return rides.filter((ride) => {
      // Filter out past rides
      if (new Date(ride.dateTime) < currentDate) {
        return false;
      }

      // Apply text search filter
      if (filters.search && !ride.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Apply recurring filter
      if (filters.showRecurring && !ride.is_recurring) {
        return false;
      }

      // Apply ride type filter
      if (filters.rideType !== "all" && ride.rideType !== filters.rideType) {
        return false;
      }

      // Apply distance filter
      if (ride.distance < filters.minDistance || ride.distance > filters.maxDistance) {
        return false;
      }

      // Apply difficulty filter
      if (filters.difficulty !== "all" && ride.difficulty !== filters.difficulty) {
        return false;
      }

      // Apply terrain filter
      if (filters.terrain !== "all" && ride.terrain !== filters.terrain) {
        return false;
      }

      // Apply date range filter
      const rideDate = new Date(ride.dateTime);
      if (filters.startDate && rideDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && rideDate > filters.endDate) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
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
    <Layout>
      <ScrollIndicator />
      {/* Welcome Banner with Navigation */}
      <section className="bg-primary text-primary-foreground py-6 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold mb-2">Welcome to GroupRideApp</h1>
              <p className="text-lg max-w-2xl mx-auto">
                Connect with fellow cyclists, create & join group rides, and explore new road & trails together.
              </p>
            </motion.div>
          </div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center gap-4"
          >
            <ScrollButton targetId="search-section">
              <Search className="h-4 w-4" /> Find Rides
            </ScrollButton>
            <ScrollButton targetId="map-calendar-section">
              <MapPin className="h-4 w-4" /> View Map
            </ScrollButton>
            <ScrollButton targetId="rides-section">
              <List className="h-4 w-4" /> Browse Rides
            </ScrollButton>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-6">
        {/* Search Section */}
        <div id="search-section" className="mb-6 scroll-mt-16">
          <RideSearch onFilterChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Map and Calendar Section */}
            <div id="map-calendar-section" className="scroll-mt-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Section */}
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-4">Ride Locations</h2>
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

                {/* Calendar Section */}
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
            </div>

            {/* Rides Section */}
            <div id="rides-section" className="scroll-mt-16">
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
    </Layout>
  );
}