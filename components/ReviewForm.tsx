"use client"

import type React from "react"

import { useState } from "react"
import { ref, update, push } from "firebase/database"
import { db, auth } from "@/lib/firebase"
import { Star } from "lucide-react"

interface ReviewFormProps {
  requestId: string
  onClose: () => void
  onSubmit: () => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({ requestId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user) return

    const reviewRef = push(ref(db, "reviews"))
    const review = {
      requestId,
      customerId: user.uid,
      rating,
      comment,
      createdAt: Date.now(),
    }

    await update(reviewRef, review)
    await update(ref(db, `service_requests/${requestId}`), { reviewed: true })

    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Leave a Review</h2>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            <Star fill={star <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review here..."
        className="w-full h-32 p-2 border rounded"
        required
      />
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
          Submit Review
        </button>
      </div>
    </form>
  )
}

export default ReviewForm

