"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNearbyProviders } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface NearbyProvidersProps {
  latitude: number
  longitude: number
}

export default function NearbyProviders({ latitude, longitude }: NearbyProvidersProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNearbyProviders = async () => {
      try {
        const nearbyProviders = await getNearbyProviders(latitude, longitude)
        setProviders(nearbyProviders.slice(0, 5)) // Show top 5 nearest providers
        setLoading(false)
      } catch (err) {
        console.error("Error fetching nearby providers:", err)
        setError("Failed to load nearby providers")
        setLoading(false)
      }
    }

    fetchNearbyProviders()
  }, [latitude, longitude])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nearby Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p>Loading nearby providers...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nearby Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearby Providers</CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p>No providers found in your area.</p>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-sm text-gray-500">
                    {provider.distance.toFixed(1)} km away • {provider.skills}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span>{provider.averageRating ? provider.averageRating.toFixed(1) : "New"}</span>
                  </div>
                </div>
                <Link href={`/provider-profile/${provider.id}`}>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

