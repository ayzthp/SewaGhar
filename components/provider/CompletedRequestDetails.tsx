import type React from "react"
import type { ServiceRequest } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CompletedRequestDetailsProps {
  request: ServiceRequest
}

const CompletedRequestDetails: React.FC<CompletedRequestDetailsProps> = ({ request }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{request.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Description:</strong> {request.description}
        </p>
        <p>
          <strong>Location:</strong> {request.location}
        </p>
        <p>
          <strong>Wage:</strong> ${request.wage}
        </p>
        <p>
          <strong>Completed on:</strong> {new Date(request.updatedAt).toLocaleDateString()}
        </p>
        {request.imageUrl && (
          <img src={request.imageUrl || "/placeholder.svg"} alt="Request" className="mt-4 w-full h-auto rounded-lg" />
        )}
      </CardContent>
    </Card>
  )
}

export default CompletedRequestDetails

