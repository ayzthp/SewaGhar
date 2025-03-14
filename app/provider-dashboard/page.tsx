"use client"

import { useState, useEffect } from "react"
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database"
import { db, auth, getUnreadCounts, getNotInterestedRequests } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import type { ServiceRequest, UnreadCounts, CustomerProfile, Review } from "@/lib/firebase"
import Navbar from "@/components/Navbar"
import AvailableRequests from "@/components/provider/AvailableRequests"
import AcceptedRequests from "@/components/provider/AcceptedRequests"

export default function ProviderDashboard() {
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([])
  const [acceptedRequests, setAcceptedRequests] = useState<ServiceRequest[]>([])
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({})
  const [customerProfiles, setCustomerProfiles] = useState<{ [key: string]: CustomerProfile }>({})
  const [reviews, setReviews] = useState<Review[]>([])
  const [notInterestedRequests, setNotInterestedRequests] = useState<{ [key: string]: boolean }>({})
  const [blockedRequests, setBlockedRequests] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.push("/signin")
      return
    }

    const availableRequestsRef = ref(db, "service_requests")
    const availableRequestsQuery = query(availableRequestsRef, orderByChild("status"), equalTo("pending"))

    const unsubscribeAvailable = onValue(availableRequestsQuery, (snapshot) => {
      const requestsData = snapshot.val()
      const requestsList = requestsData
        ? Object.entries(requestsData).map(([id, data]) => ({ id, ...(data as ServiceRequest) }))
        : []
      setAvailableRequests(requestsList)
    })

    const acceptedRequestsRef = ref(db, "service_requests")
    const acceptedRequestsQuery = query(acceptedRequestsRef, orderByChild("provider_id"), equalTo(user.uid))

    const unsubscribeAccepted = onValue(acceptedRequestsQuery, (snapshot) => {
      const requestsData = snapshot.val()
      const requestsList = requestsData
        ? Object.entries(requestsData)
            .map(([id, data]) => ({ id, ...(data as ServiceRequest) }))
            .filter((request) => request.status === "accepted")
        : []
      setAcceptedRequests(requestsList)
    })

    // Fetch initial unread counts
    getUnreadCounts(user.uid).then(setUnreadCounts)

    // Set up real-time listener for unread counts
    const unreadCountsRef = ref(db, `unreadCounts/${user.uid}`)
    const unsubscribeUnreadCounts = onValue(unreadCountsRef, (snapshot) => {
      const counts = snapshot.val() || {}
      setUnreadCounts(counts)
    })

    // Fetch customer profiles
    const customersRef = ref(db, "users")
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const customersData = snapshot.val()
      const profiles: { [key: string]: CustomerProfile } = {}
      for (const [id, data] of Object.entries(customersData)) {
        if ((data as any).userType === "customer") {
          profiles[id] = data as CustomerProfile
        }
      }
      setCustomerProfiles(profiles)
    })

    const reviewsRef = ref(db, "reviews")
    const providerReviewsQuery = query(reviewsRef, orderByChild("provider_id"), equalTo(user.uid))

    const unsubscribeReviews = onValue(providerReviewsQuery, (snapshot) => {
      const reviewsData = snapshot.val()
      const reviewsList = reviewsData
        ? Object.entries(reviewsData).map(([id, data]) => ({ id, ...(data as Review) }))
        : []
      setReviews(reviewsList)
    })

    // Fetch not interested requests
    if (user) {
      getNotInterestedRequests(user.uid).then(setNotInterestedRequests)
    }

    return () => {
      unsubscribeAvailable()
      unsubscribeAccepted()
      unsubscribeUnreadCounts()
      unsubscribeCustomers()
      unsubscribeReviews()
    }
  }, [router])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const notInterestedRef = ref(db, `notInterested/${user.uid}`)
    const unsubscribeNotInterested = onValue(notInterestedRef, (snapshot) => {
      const notInterestedData = snapshot.val() || {}
      setNotInterestedRequests(notInterestedData)
    })

    const blockedRequestsRef = ref(db, `providers/${user.uid}/blockedRequests`)
    const unsubscribeBlockedRequests = onValue(blockedRequestsRef, (snapshot) => {
      const blockedRequestsData = snapshot.val() || {}
      setBlockedRequests(blockedRequestsData)
    })

    return () => {
      unsubscribeNotInterested()
      unsubscribeBlockedRequests()
    }
  }, [])

  const handleNotInterestedUpdate = (requestId: string) => {
    setNotInterestedRequests((prev) => ({ ...prev, [requestId]: true }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userType="provider" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Provider Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AvailableRequests
            requests={availableRequests.filter(
              (request) => !notInterestedRequests[request.id] && !blockedRequests[request.id],
            )}
            customerProfiles={customerProfiles}
            notInterestedRequests={notInterestedRequests}
            onNotInterestedUpdate={handleNotInterestedUpdate}
          />
          <AcceptedRequests
            requests={acceptedRequests}
            unreadCounts={unreadCounts}
            customerProfiles={customerProfiles}
            notInterestedRequests={notInterestedRequests}
            onNotInterestedUpdate={handleNotInterestedUpdate}
          />
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
          {reviews.length > 0 ? (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{review.comment}</p>
                  <p className="mt-1 text-sm text-gray-500">Rating: {review.rating}/5</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

