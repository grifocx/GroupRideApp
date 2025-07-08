import RideCard from '@/components/RideCard'
import type { Ride } from '@/types'

// Mock data for testing
const mockRide: Ride = {
  id: 1,
  title: "Saturday Morning Group Ride",
  dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  distance: 25,
  difficulty: 'C',
  maxRiders: 20,
  address: "Dupont Circle, Washington DC",
  latitude: "38.9096",
  longitude: "-77.0434",
  rideType: 'ROAD',
  pace: 18,
  terrain: 'FLAT',
  route_url: "https://www.strava.com/routes/123",
  description: "Join us for a fun Saturday morning ride!",
  status: 'active',
  ownerId: 1,
  owner: { username: 'rideorganizer' },
  participants: [
    { user: { username: 'rider1' } },
    { user: { username: 'rider2' } }
  ],
  canEdit: false
}

export default function Home() {
  const handleJoinToggle = async (rideId: number) => {
    console.log('Toggle join for ride:', rideId)
    // Will implement with Supabase later
  }

  const handleEdit = (rideId: number) => {
    console.log('Edit ride:', rideId)
    // Will implement navigation later
  }

  const handleShare = (rideId: number) => {
    console.log('Share ride:', rideId)
    // Will implement share functionality later
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">GroupRideApp - Next.js Version</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RideCard 
          ride={mockRide}
          onJoinToggle={handleJoinToggle}
          onEdit={handleEdit}
          onShare={handleShare}
        />
      </div>
    </main>
  )
}