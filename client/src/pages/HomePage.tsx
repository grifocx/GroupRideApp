import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import RideSearch, { type RideFilters } from "@/components/RideSearch";
import Footer from "@/components/Footer";
import { MapComponent } from "@/components/MapComponent";
import CalendarView from "@/components/CalendarView";
import { Loader2, Calendar as CalendarIcon, MapPin, Search, List, Archive } from "lucide-react";
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
    const offset = 100; // Account for fixed header with some additional margin for mobile
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
        size="sm"
        onClick={handleClick}
        className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 
                  bg-primary/10 text-primary-foreground hover:bg-primary 
                  hover:text-primary-foreground border-primary-foreground/20
                  active:scale-95 transition-transform"
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
    // Subtract 24 hours from current date for archive threshold
    const archiveThreshold = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    console.log('Current date:', currentDate.toISOString());
    console.log('Archive threshold:', archiveThreshold.toISOString());

    return rides.filter((ride) => {
      const rideDate = new Date(ride.dateTime);
      console.log(`Ride ${ride.id} date:`, rideDate.toISOString(), 'Past threshold?:', rideDate < archiveThreshold);

      // Only show rides that are marked as active
      if (ride.status !== 'active') {
        console.log(`Ride ${ride.id} filtered out: not active`);
        return false;
      }

      // Rest of the filtering logic
      if (filters.search && !ride.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      if (filters.showRecurring && !ride.is_recurring) {
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
      <section className="bg-background border-b py-4 sm:py-6 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-4 sm:mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to GroupRideApp</h1>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Connect with fellow cyclists, create & join group rides, and explore new roads & trails together.
              </p>
            </motion.div>
          </div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-4"
          >
            <ScrollButton targetId="search-section">
              <Search className="h-4 w-4" /> <span className="sm:inline">Find Rides</span>
            </ScrollButton>
            <ScrollButton targetId="map-calendar-section">
              <MapPin className="h-4 w-4" /> <span className="sm:inline">View Map</span>
            </ScrollButton>
            <ScrollButton targetId="rides-section">
              <List className="h-4 w-4" /> <span className="sm:inline">Browse Rides</span>
            </ScrollButton>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Search Section */}
        <div id="search-section" className="mb-4 sm:mb-6 scroll-mt-20">
          <RideSearch onFilterChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Map and Calendar Section */}
            <div id="map-calendar-section" className="scroll-mt-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Map Section */}
                <Card className="relative" style={{ zIndex: 1 }}>
                  <CardContent className="p-3 sm:p-4">
                    <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Ride Locations</h2>
                    <div 
                      className="relative" 
                      style={{ 
                        height: "calc(30vh - 16px)", 
                        minHeight: "250px", 
                        maxHeight: "400px", 
                        zIndex: 1 
                      }}
                    >
                      <MapComponent
                        rides={filteredRides}
                        onMarkerClick={(ride) => {
                          console.log('Clicked ride:', ride);
                        }}
                        height="100%"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Section */}
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4 gap-2">
                      <h2 className="text-base sm:text-lg font-semibold">This Month's Rides</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 h-8 text-xs sm:text-sm"
                        onClick={() => setLocation("/calendar")}
                      >
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Full Calendar</span>
                      </Button>
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: "calc(30vh - 32px)" }}>
                      <CalendarView
                        rides={filteredRides}
                        compact={true}
                        ridesByDate={ridesByDate}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Rides Section */}
            <div id="rides-section" className="scroll-mt-20">
              <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-bold">Available Rides</h2>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 h-8 text-xs sm:text-sm"
                  onClick={() => setLocation('/archived')}
                >
                  <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>View Archived Rides</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
                {filteredRides.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-6 sm:py-8">
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