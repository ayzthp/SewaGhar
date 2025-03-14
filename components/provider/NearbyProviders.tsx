"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNearbyProviders, updateProviderLocation } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"
import type { User } from "firebase/auth"

export default function NearbyProviders() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationUpdated, setLocationUpdated] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ latitude, longitude })

          try {
            // Update provider location in the database
            await updateProviderLocation(currentUser.uid, latitude, longitude)
            setLocationUpdated(true)

            // Fetch nearby providers
            const nearbyProviders = await getNearbyProviders(latitude, longitude)
            // Filter out the current provider
            const filteredProviders = nearbyProviders.filter((provider) => provider.id !== currentUser.uid)
            setProviders(filteredProviders.slice(0, 5)) // Show top 5 nearest providers
            setLoading(false)
          } catch (err) {
            console.error("Error:", err)
            setError("Failed to update location or load nearby providers")
            setLoading(false)
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError("Failed to get your location. Please enable location services.")
          setLoading(false)
        },
      )
    } else {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
    }
  }, [currentUser])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nearby Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p>Updating your location and loading nearby providers...</p>
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
        {locationUpdated && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            Your location has been updated successfully.
          </div>
        )}

        {location && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Your current location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {providers.length === 0 ? (
          <p>No other providers found in your area.</p>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{provider.name}</h3>
                <p className="text-sm text-gray-500">
                  {provider.distance.toFixed(1)} km away • {provider.skills}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>{provider.averageRating ? provider.averageRating.toFixed(1) : "New"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={() => {
              if (currentUser && location) {
                updateProviderLocation(currentUser.uid, location.latitude, location.longitude)
                  .then(() => setLocationUpdated(true))
                  .catch((err) => console.error("Error updating location:", err))
              }
            }}
            className="w-full"
          >
            Update My Location
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

