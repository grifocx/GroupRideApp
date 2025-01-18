import { useUser } from "@/hooks/use-user";
import { useRides } from "@/hooks/use-rides";
import RideCard from "@/components/RideCard";
import { NavBar } from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollIndicator } from "@/components/ScrollIndicator";

export default function ArchivedRidesPage() {
  const { rides, isLoading } = useRides('archived'); // New parameter to fetch archived rides
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <ScrollIndicator />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Active Rides
          </Button>
          <h1 className="text-3xl font-bold">Archived Rides</h1>
          <p className="text-muted-foreground mt-2">
            View past rides that have been completed
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rides?.map((ride) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RideCard ride={ride} />
              </motion.div>
            ))}
            {!rides?.length && (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No archived rides found</p>
              </Card>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
