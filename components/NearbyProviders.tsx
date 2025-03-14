import type React from "react"
import { useState, useEffect } from "react"
import { getNearbyProviders } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

interface Provider {
  id: string
  name: string
  distance: number
  averageRating?: number
  skills?: string
}

interface NearbyProvidersProps {
  latitude: number
  longitude: number
}

const NearbyProviders: React.FC<NearbyProvidersProps> = ({ latitude, longitude }) => {
  const [nearbyProviders, setNearbyProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNearbyProviders = async () => {
      try {
        const providers = await getNearbyProviders(latitude, longitude)
        setNearbyProviders(providers)
      } catch (error) {
        console.error("Error fetching nearby providers:", error)
        toast({
          title: "Error",
          description: "Failed to fetch nearby providers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyProviders()
  }, [latitude, longitude])

  if (loading) {
    return <div>Loading nearby providers...</div>
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Nearby Providers</h2>
      {nearbyProviders.length > 0 ? (
        <ul className="space-y-4">
          {nearbyProviders.map((provider) => (
            <li key={provider.id} className="border-b pb-4">
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <p>Distance: {provider.distance.toFixed(2)} km</p>
              <p>Rating: {provider.averageRating ? provider.averageRating.toFixed(1) : "N/A"}/5</p>
              <p>Services: {provider.skills || "Not specified"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No nearby providers found.</p>
      )}
    </div>
  )
}

export default NearbyProviders

