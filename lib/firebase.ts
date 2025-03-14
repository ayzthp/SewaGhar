import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase, ref, get, set, increment, push, update } from "firebase/database"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyC8q580wSDEbSDs4SKLMqjj5PtPHaHgRqw",
  authDomain: "gharsewa-442a2.firebaseapp.com",
  projectId: "gharsewa-442a2",
  storageBucket: "gharsewa-442a2.appspot.com",
  messagingSenderId: "306387121230",
  appId: "1:306387121230:web:c4d7888343d2881c1e7f1f",
  measurementId: "G-6N1H42ZWMZ",
  databaseURL: "https://gharsewa-442a2-default-rtdb.asia-southeast1.firebasedatabase.app",
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getDatabase(app)
const storage = getStorage(app)

export type ServiceRequest = {
  id: string
  customer_id: string
  provider_id: string | null
  description: string
  location: string
  wage: number
  contactNumber: string
  status: "pending" | "accepted" | "completed"
  createdAt: number
  updatedAt: number
  imageUrl?: string
  latitude?: number | null
  longitude?: number | null
}

export type ChatMessage = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  timestamp: number
  read: boolean
}

export type UnreadCounts = {
  [requestId: string]: number
}

export type Review = {
  id: string
  customer_id: string
  provider_id: string
  request_id: string
  rating: number
  comment: string
  createdAt: number
}

export type ProviderProfile = {
  id: string
  name: string
  email: string
  skills: string
  averageRating: number
  totalReviews: number
  bio?: string
  profilePicture?: string
}

export type CustomerProfile = {
  id: string
  name: string
  email: string
  userType: string
}

export type NotInterestedRequests = {
  [requestId: string]: boolean
}

export { app, auth, db, storage }

export const updateUnreadCount = async (requestId: string, senderId: string, receiverId: string) => {
  const unreadCountRef = ref(db, `unreadCounts/${receiverId}/${requestId}`)
  await set(unreadCountRef, increment(1))
}

export const resetUnreadCount = async (userId: string, requestId: string) => {
  const unreadCountRef = ref(db, `unreadCounts/${userId}/${requestId}`)
  await set(unreadCountRef, 0)
}

export const getUnreadCounts = async (userId: string): Promise<UnreadCounts> => {
  const unreadCountsRef = ref(db, `unreadCounts/${userId}`)
  const snapshot = await get(unreadCountsRef)
  return snapshot.val() || {}
}

export const addReview = async (review: Omit<Review, "id">) => {
  const reviewRef = push(ref(db, "reviews"))
  const newReview = { ...review, id: reviewRef.key! }
  await set(reviewRef, newReview)

  // Update provider's average rating and total reviews
  const providerRef = ref(db, `users/${review.provider_id}`)
  const providerSnapshot = await get(providerRef)
  const providerData = providerSnapshot.val()

  const newTotalReviews = (providerData.totalReviews || 0) + 1
  const newAverageRating = ((providerData.averageRating || 0) * (newTotalReviews - 1) + review.rating) / newTotalReviews

  await set(providerRef, {
    ...providerData,
    averageRating: newAverageRating,
    totalReviews: newTotalReviews,
  })
}

export const getProviderProfile = async (providerId: string): Promise<ProviderProfile | null> => {
  const providerRef = ref(db, `users/${providerId}`)
  const snapshot = await get(providerRef)
  return snapshot.val()
}

export const getProviderReviews = async (providerId: string): Promise<Review[]> => {
  const reviewsRef = ref(db, "reviews")
  const snapshot = await get(reviewsRef)
  const allReviews = snapshot.val()
  return Object.values(allReviews).filter((review: Review) => review.provider_id === providerId)
}

export const handleAccept = async (requestId: string) => {
  const user = auth.currentUser
  if (user) {
    try {
      const requestRef = ref(db, `service_requests/${requestId}`)
      await update(requestRef, {
        provider_id: user.uid,
        status: "accepted",
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error("Error accepting request:", error)
    }
  }
}

export const markRequestAsNotInterested = async (requestId: string, providerId?: string) => {
  const user = auth.currentUser
  if (user) {
    try {
      const providerIdToUse = providerId || user.uid

      // Add the request to the provider's not interested requests
      const notInterestedRef = ref(db, `providers/${providerIdToUse}/notInterestedRequests/${requestId}`)
      await set(notInterestedRef, true)

      // Update the service request status only if the current provider is assigned to it
      const requestRef = ref(db, `service_requests/${requestId}`)
      const requestSnapshot = await get(requestRef)
      const requestData = requestSnapshot.val()

      if (requestData && requestData.provider_id === providerIdToUse) {
        await update(requestRef, {
          status: "pending",
          provider_id: null,
          updatedAt: Date.now(),
        })
      }
    } catch (error) {
      console.error("Error marking request as not interested:", error)
    }
  }
}

export const getNotInterestedRequests = async (providerId: string): Promise<{ [key: string]: boolean }> => {
  const notInterestedRef = ref(db, `providers/${providerId}/notInterestedRequests`)
  const snapshot = await get(notInterestedRef)
  return snapshot.val() || {}
}

export const getNearbyProviders = async (latitude: number, longitude: number): Promise<any[]> => {
  const providersRef = ref(db, "users")
  const snapshot = await get(providersRef)
  const providersData = snapshot.val() || {}

  const nearbyProviders: any[] = []

  for (const providerId in providersData) {
    if (providersData.hasOwnProperty(providerId)) {
      const provider = providersData[providerId]
      if (provider.userType === "provider" && provider.latitude && provider.longitude) {
        const distance = calculateDistance(latitude, longitude, provider.latitude, provider.longitude)
        nearbyProviders.push({
          id: providerId,
          name: provider.name,
          distance: distance,
          averageRating: provider.averageRating,
          skills: provider.skills,
        })
      }
    }
  }

  nearbyProviders.sort((a, b) => a.distance - b.distance)
  return nearbyProviders
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180)
}

export const updateProviderLocation = async (providerId: string, latitude: number, longitude: number) => {
  try {
    const providerRef = ref(db, `users/${providerId}`)
    await update(providerRef, {
      latitude: latitude,
      longitude: longitude,
    })
  } catch (error) {
    console.error("Error updating provider location:", error)
    throw error // Re-throw the error to be handled by the caller
  }
}

