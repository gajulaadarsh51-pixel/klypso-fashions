// pages/AdminReviews.tsx
import { useState, useEffect } from "react"
import { 
  Search, 
  Filter, 
  Star, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  Loader2,
  User,
  Package,
  Calendar,
  MessageSquare,
  AlertCircle,
  Mail,
  Phone
} from "lucide-react"
import { useAllReviews } from "@/hooks/useReviews"
import { ReviewsDebug } from "@/components/ReviewsDebug"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const AdminReviews = () => {
  const { reviews, isLoading, approveReview, deleteReview, refetch } = useAllReviews()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Add a retry mechanism
    if (reviews.length === 0 && !isLoading) {
      setTimeout(() => {
        refetch()
      }, 2000)
    }
  }, [reviews, isLoading, refetch])

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.comment?.toLowerCase().includes(search.toLowerCase()) ||
      review.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      review.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      review.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      review.user_full_name?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "approved" && review.is_approved) ||
      (statusFilter === "pending" && !review.is_approved)
    
    const matchesRating = 
      ratingFilter === "all" || 
      review.rating.toString() === ratingFilter

    return matchesSearch && matchesStatus && matchesRating
  })

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    )
  }

  // Calculate stats safely
  const totalReviews = reviews.length
  const pendingReviews = reviews.filter(r => !r.is_approved).length
  const approvedReviews = reviews.filter(r => r.is_approved).length
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0"

  return (
    <div className="p-6 space-y-6">
      {/* Render the debug component */}
      <ReviewsDebug />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customer Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Manage and moderate customer reviews
        </p>
      </div>

      {/* Debug info */}
      {reviews.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Reviews Found</AlertTitle>
          <AlertDescription>
            There are no reviews in the database. Make sure you have:
            1. Created the product_reviews table
            2. Inserted some test reviews
            3. Checked your database connection
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews, customers, products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[180px]">
            <Star className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{totalReviews}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{pendingReviews}</p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{approvedReviews}</p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">{averageRating}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Star className="h-6 w-6 text-blue-500 fill-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer Info</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        {reviews.length === 0 ? 'No reviews in database' : 'No reviews match your filters'}
                      </p>
                      {reviews.length === 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="mt-2"
                        >
                          Refresh
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id} className="group hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {review.product_name || 'Unknown Product'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium block">
                              {review.user_full_name || review.user_name || 'Customer'}
                            </span>
                            {review.user_email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{review.user_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {review.user_phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{review.user_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-medium">
                          {review.rating}.0
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm">
                        {review.comment}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {review.created_at ? format(new Date(review.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={review.is_approved ? "default" : "outline"}
                        className={cn(
                          "capitalize",
                          review.is_approved
                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20"
                        )}
                      >
                        {review.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!review.is_approved && (
                              <DropdownMenuItem
                                onClick={() => approveReview(review.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Review
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteReview(review.id)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : null}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminReviews