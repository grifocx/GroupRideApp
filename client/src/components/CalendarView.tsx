import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Ride } from "@db/schema";
import RideCard from "./RideCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type RideWithRelations = Ride & {
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
};

type CalendarViewProps = {
  rides: RideWithRelations[];
  compact?: boolean;
  ridesByDate?: Record<string, RideWithRelations[]>;
};

export default function CalendarView({ rides, compact = false, ridesByDate: propRidesByDate }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Group rides by date if not provided
  const ridesByDate = propRidesByDate || rides.reduce((acc, ride) => {
    const date = format(new Date(ride.dateTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(ride);
    return acc;
  }, {} as Record<string, RideWithRelations[]>);

  // Get dates that have rides
  const datesWithRides = Object.keys(ridesByDate).map(date => new Date(date));

  // Get rides for selected date
  const selectedRides = selectedDate 
    ? ridesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  if (compact) {
    return (
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ hasRide: datesWithRides }}
          modifiersStyles={{
            hasRide: {
              fontWeight: 'bold',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))'
            }
          }}
          className="rounded-md border w-full"
        />
        {selectedDate && selectedRides.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">
              Rides on {format(selectedDate, 'MMMM d')}
            </h3>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {selectedRides.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{ride.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(ride.dateTime), 'h:mm a')}
                      </div>
                    </div>
                    <Badge>{ride.difficulty}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1">
        <CardContent className="pt-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasRide: datesWithRides }}
            modifiersStyles={{
              hasRide: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))'
              }
            }}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedDate ? (
                <>Rides on {format(selectedDate, 'MMMM d, yyyy')}</>
              ) : (
                'Select a date to view rides'
              )}
            </h3>
            {selectedDate && (
              <Button 
                variant="ghost" 
                onClick={() => setSelectedDate(undefined)}
              >
                Show All Dates
              </Button>
            )}
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {selectedRides.length > 0 ? (
                selectedRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {selectedDate 
                    ? 'No rides scheduled for this date' 
                    : 'Select a date to view scheduled rides'}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}