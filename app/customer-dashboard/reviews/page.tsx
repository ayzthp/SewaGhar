"use client"

import { useState, useEffect } from "react"
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database"
import { db, auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import type { Review } from "@/lib/firebase"
import Navbar from "@/components/Navbar"
import ReviewsList from "@/components/customer/ReviewsList"

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const router = useRouter()

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.push("/signin")
      return
    }

    const reviewsRef = ref(db, "reviews")
    const userReviewsQuery = query(reviewsRef, orderByChild("customer_id"), equalTo(user.uid))

    const unsubscribe = onValue(userReviewsQuery, (snapshot) => {
      const reviewsData = snapshot.val()
      const reviewsList = reviewsData
        ? Object.entries(reviewsData).map(([id, data]) => ({ id, ...(data as Review) }))
        : []
      setReviews(reviewsList)
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userType="customer" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Recent Reviews</h1>
        <ReviewsList reviews={reviews} />
      </div>
    </div>
  )
}

