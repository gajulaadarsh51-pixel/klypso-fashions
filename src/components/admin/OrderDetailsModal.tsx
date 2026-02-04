import { useEffect, useState } from "react"
import { X, Package, CreditCard } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Order } from "@/hooks/useOrders"

/* ---------------- HELPERS ---------------- */
const formatPrice = (price?: number) => {
  if (!price || isNaN(price)) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

const normalize = (v?: string) => v?.toLowerCase().trim() || ""

/* ---------------- SUPABASE IMAGE FIX ---------------- */
const getPublicImageUrl = (path?: string) => {
  if (!path) {
    console.log("getPublicImageUrl: No path provided")
    return ""
  }
  
  console.log("getPublicImageUrl: Original path =", path)
  
  // If it's already a full URL, return it
  if (path.startsWith("http")) {
    console.log("getPublicImageUrl: Already HTTP URL, returning as is")
    return path
  }

  // If it's a storage path without the bucket
  if (path.includes("product-images/")) {
    try {
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path)
      
      console.log("getPublicImageUrl: Generated URL =", data.publicUrl)
      return data.publicUrl || ""
    } catch (error) {
      console.error("getPublicImageUrl: Error getting public URL:", error)
      return ""
    }
  }

  // If it's just a filename, try to construct the path
  try {
    const fullPath = `product-images/${path}`
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fullPath)
    
    console.log("getPublicImageUrl: Constructed path =", fullPath, "URL =", data.publicUrl)
    return data.publicUrl || ""
  } catch (error) {
    console.error("getPublicImageUrl: Error with constructed path:", error)
    return ""
  }
}

/* ---------------- PRODUCT IMAGE ---------------- */
interface ProductImageProps {
  src?: string | any
  alt?: string
  onClick?: () => void
}

const ProductImage = ({
  src,
  alt,
  onClick,
}: ProductImageProps) => {
  const [error, setError] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    console.log("ProductImage received src:", src, "Type:", typeof src)
    
    if (!src) {
      console.log("ProductImage: No src provided")
      setImageUrl("")
      return
    }

    let finalSrc = src
    
    // Handle different formats
    if (Array.isArray(src)) {
      console.log("ProductImage: src is array, using first item")
      finalSrc = src[0]
    } else if (typeof src === 'object' && src !== null) {
      console.log("ProductImage: src is object, trying to extract URL")
      // Try to get URL from object
      finalSrc = src.url || src.publicUrl || src.image_url || ""
    }

    console.log("ProductImage: Final src to process:", finalSrc)
    
    if (finalSrc) {
      const url = getPublicImageUrl(finalSrc)
      console.log("ProductImage: Setting image URL to:", url)
      setImageUrl(url)
    } else {
      console.log("ProductImage: No valid src found")
      setImageUrl("")
    }
  }, [src])

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation()
      onClick()
    }
  }

  if (!imageUrl || error) {
    console.log("ProductImage: Showing fallback (error or no URL)")
    return (
      <div 
        className={`w-16 h-16 flex items-center justify-center rounded-lg border bg-muted ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={handleClick}
      >
        <Package size={22} className="text-muted-foreground" />
      </div>
    )
  }

  console.log("ProductImage: Rendering image with URL:", imageUrl)
  
  return (
    <img
      src={imageUrl}
      alt={alt || "Product"}
      onError={(e) => {
        console.log("ProductImage: Image failed to load:", imageUrl, "Error:", e)
        setError(true)
      }}
      onLoad={() => console.log("ProductImage: Image loaded successfully:", imageUrl)}
      className={`w-16 h-16 object-cover rounded-lg border bg-white ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={handleClick}
    />
  )
}

/* ---------------- PRODUCT LINK COMPONENT ---------------- */
interface ProductLinkProps {
  productId?: string
  productName?: string
  children: React.ReactNode
  className?: string
}

const ProductLink = ({
  productId,
  productName,
  children,
  className = "",
}: ProductLinkProps) => {
  const navigate = useNavigate()
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (productId) {
      navigate(`/product/${productId}`)
    }
  }

  if (!productId) {
    return <span className={className}>{children}</span>
  }

  return (
    <button
      onClick={handleClick}
      className={`${className} text-left hover:text-blue-600 hover:underline transition-colors`}
    >
      {children}
    </button>
  )
}

/* ---------------- ORDER ITEMS PARSER ---------------- */
const parseAllOrderItems = (order: Order) => {
  try {
    console.log("parseAllOrderItems: Order ID =", order.id)
    console.log("parseAllOrderItems: Raw order.items =", order.items)
    console.log("parseAllOrderItems: Type of order.items =", typeof order.items)
    
    let raw: any[] = []

    if (Array.isArray(order.items)) {
      raw = order.items
      console.log("parseAllOrderItems: Items is already array")
    } else if (typeof order.items === "string") {
      try {
        raw = JSON.parse(order.items)
        console.log("parseAllOrderItems: Successfully parsed JSON string")
      } catch (parseError) {
        console.error("parseAllOrderItems: Error parsing JSON:", parseError)
        raw = []
      }
    } else {
      console.log("parseAllOrderItems: Items is not array or string, type:", typeof order.items)
    }

    console.log("parseAllOrderItems: Parsed raw items:", raw)

    // Enhanced parsing to include product ID
    const items = raw
      .filter((item) => {
        const hasData = item && Object.keys(item).length > 0
        console.log("parseAllOrderItems: Item", item, "hasData:", hasData)
        return hasData
      })
      .map((item, index) => {
        console.log(`parseAllOrderItems: Processing item ${index}:`, item)
        
        const productName =
          item.name ||
          item.title ||
          item.product_name ||
          item.product?.name ||
          item.product?.title ||
          "Product"

        console.log(`parseAllOrderItems: Item ${index} productName =`, productName)

        // Check ALL possible image sources
        let productImage = null
        
        // Check direct image fields
        const possibleImageFields = [
          'image',
          'product_image',
          'image_url',
          'productImage',
          'thumbnail',
          'product_thumbnail'
        ]
        
        for (const field of possibleImageFields) {
          if (item[field]) {
            productImage = item[field]
            console.log(`parseAllOrderItems: Found image in field '${field}':`, productImage)
            break
          }
        }
        
        // Check nested product object
        if (!productImage && item.product) {
          console.log("parseAllOrderItems: Checking product object:", item.product)
          
          // Check if product has images array
          if (item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
            productImage = item.product.images[0]
            console.log("parseAllOrderItems: Found image in product.images[0]:", productImage)
          }
          // Check other product image fields
          else if (item.product.image) {
            productImage = item.product.image
            console.log("parseAllOrderItems: Found image in product.image:", productImage)
          }
          else if (item.product.thumbnail) {
            productImage = item.product.thumbnail
            console.log("parseAllOrderItems: Found image in product.thumbnail:", productImage)
          }
          else if (item.product.product_image) {
            productImage = item.product.product_image
            console.log("parseAllOrderItems: Found image in product.product_image:", productImage)
          }
        }

        console.log(`parseAllOrderItems: Item ${index} final productImage =`, productImage)

        const price =
          Number(item.price) ||
          Number(item.product?.price) ||
          Number(item.unit_price) ||
          0

        const quantity = Number(item.quantity) || 1
        const size = item.size || item.product_size || ""
        const color = item.color || item.product_color || ""
        
        // Extract product ID
        const productId = 
          item.product_id || 
          item.product?.id || 
          item.productId

        const result = {
          ...item,
          productName,
          productImage,
          price,
          quantity,
          size,
          color,
          productId,
          originalItem: item
        }
        
        console.log(`parseAllOrderItems: Item ${index} result:`, result)
        return result
      })

    console.log("parseAllOrderItems: Final parsed items count:", items.length)
    console.log("parseAllOrderItems: Sample parsed item:", items.length > 0 ? items[0] : "No items")
    
    return items
  } catch (error) {
    console.error("Error in parseAllOrderItems:", error)
    return []
  }
}

/* ---------------- PROPS ---------------- */
interface OrderDetailsModalProps {
  order: Order
  onClose: () => void
}

/* ---------------- COMPONENT ---------------- */
const OrderDetailsModal = ({
  order,
  onClose,
}: OrderDetailsModalProps) => {
  const navigate = useNavigate()
  const items = parseAllOrderItems(order)

  console.log("OrderDetailsModal: Items count =", items.length)
  console.log("OrderDetailsModal: First item =", items.length > 0 ? items[0] : "No items")

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleProductClick = (productId?: string) => {
    if (productId) {
      navigate(`/product/${productId}`)
      onClose()
    }
  }

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
          {/* HEADER */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Order Details
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""} in this order
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>

          {/* CONTENT */}
          <div className="p-6 space-y-6">
            {/* STATUS */}
            <div className="flex flex-wrap gap-3">
              <Badge className="capitalize">
                {order.status}
              </Badge>

              <Badge variant="outline" className="capitalize">
                <CreditCard className="h-3 w-3 mr-1 inline" />
                {order.payment_status || "pending"}
              </Badge>
            </div>

            {/* PRODUCTS BADGES - SHOW EACH ITEM SEPARATELY WITH QUANTITY */}
            <div>
              <h3 className="font-medium mb-2">
                Products in this order
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item: any, idx: number) => {
                  return (
                    <ProductLink
                      key={idx}
                      productId={item.productId}
                      productName={item.productName}
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        {item.productName} 
                        <span className="ml-1 font-semibold">
                          (X{item.quantity})
                        </span>
                      </Badge>
                    </ProductLink>
                  )
                })}
              </div>
            </div>

            {/* ORDER ITEMS LIST */}
            <div>
              <h3 className="font-medium mb-2">
                Order Items ({items.length})
              </h3>

              <div className="border rounded-lg divide-y">
                {items.map((item: any, index: number) => {
                  console.log(`Rendering item ${index}:`, item)
                  return (
                    <div
                      key={index}
                      className="p-4 flex gap-4 items-center hover:bg-gray-50/50 transition-colors"
                    >
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName}
                        onClick={() => handleProductClick(item.productId)}
                      />

                      <div className="flex-1">
                        <ProductLink
                          productId={item.productId}
                          productName={item.productName}
                          className="font-medium text-base block"
                        >
                          {item.productName}
                        </ProductLink>

                        <div className="text-sm text-muted-foreground">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && (
                            <span className="ml-2">
                              Color: {item.color}
                            </span>
                          )}
                        </div>

                        <p className="text-sm mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <h3 className="font-medium mb-2">
                Order Summary
              </h3>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal
                  </span>
                  <span>
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Shipping
                  </span>
                  <span>
                    {order.shipping_cost === 0
                      ? "Free"
                      : formatPrice(order.shipping_cost)}
                  </span>
                </div>

                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* CUSTOMER INFO */}
            <div>
              <h3 className="font-medium mb-2">
                Customer Information
              </h3>

              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <p>
                  <span className="text-muted-foreground">
                    Name:
                  </span>{" "}
                  {order.customer_name}
                </p>

                <p>
                  <span className="text-muted-foreground">
                    Email:
                  </span>{" "}
                  {order.customer_email}
                </p>

                {order.customer_phone && (
                  <p>
                    <span className="text-muted-foreground">
                      Phone:
                    </span>{" "}
                    {order.customer_phone}
                  </p>
                )}
              </div>
            </div>

            {/* TIMESTAMPS */}
            <div className="text-sm text-muted-foreground">
              <p>
                Ordered: {formatDate(order.created_at)}
              </p>
              <p>
                Updated: {formatDate(order.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderDetailsModal