import type React from "react"
import type { Review } from "@/lib/firebase"
import { Star } from "lucide-react"

interface ReviewsListProps {
  reviews: Review[]
  customerProfiles: { [key: string]: { name: string } }
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews = [], customerProfiles = {} }) => {
  const sortedReviews = [...reviews].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200">
        {sortedReviews.map((review) => (
          <li key={review.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-600 truncate">
                {customerProfiles[review.customer_id]?.name || "Anonymous Customer"}
              </p>
              <div className="ml-2 flex-shrink-0 flex">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{review.comment}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ReviewsList

