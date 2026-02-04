import { format } from 'date-fns';
import { Eye, ChevronDown, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Order, useUpdateOrderStatus, useUpdatePaymentStatus } from '@/hooks/useOrders';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Assuming you're using sonner for toast notifications

// OrderDetailsModal component
interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onGenerateInvoice: (order: Order) => void;
}

// Helper function to get image URLs
const getPublicImageUrl = (path?: string | string[]) => {
  if (!path) return "";

  // If it's an array, get the first image
  if (Array.isArray(path)) {
    if (path.length === 0) return "";
    return getPublicImageUrl(path[0]);
  }

  // If it's already a full URL, return it
  if (path.startsWith("http")) return path;

  // If it's a Supabase storage path, get the public URL
  try {
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);
    return data.publicUrl || "";
  } catch {
    return "";
  }
};

// Product Image Component with proper sizing
const ProductImage = ({
  src,
  alt,
  className = "w-full h-full",
  containerClassName = "",
  onClick,
}: {
  src?: string | string[];
  alt?: string;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
}) => {
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (src) {
      let finalUrl: string | string[] = "";
      
      // If it's an array (like in order items: item.images[0])
      if (Array.isArray(src)) {
        // Get the first image from the array
        finalUrl = src[0] || "";
      } else if (typeof src === 'string') {
        finalUrl = src;
      }
      
      // Handle different image formats
      if (finalUrl) {
        const url = getPublicImageUrl(finalUrl);
        setImageUrl(url);
      } else {
        setImageUrl("");
      }
    } else {
      setImageUrl("");
    }
    setError(false); // Reset error on src change
  }, [src]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border bg-gray-100 ${containerClassName} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      onClick={handleClick}
    >
      {error || !imageUrl ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-xs text-center p-2">No image</div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt || "Product"}
          onError={() => setError(true)}
          className={`${className} object-contain w-full h-full`}
        />
      )}
    </div>
  );
};

// Parse order items with improved image handling
const parseAllOrderItems = (order: Order) => {
  try {
    let raw;
    
    if (Array.isArray(order.items)) {
      raw = order.items;
    } else if (typeof order.items === "string") {
      try {
        raw = JSON.parse(order.items);
      } catch (parseError) {
        console.error("Error parsing order items:", parseError);
        raw = [];
      }
    } else {
      raw = [];
    }

    // Process all items and extract product information
    const allItems = raw
      .filter((item: any) => item && Object.keys(item).length > 0)
      .map((item: any) => {
        // Try different possible field names for product name
        const productName = 
          item.name ||
          item.product_name ||
          item.product?.name ||
          item.title ||
          item.product?.title ||
          item.productName ||
          "Product";
        
        // Handle images - FIXED: Check for images field (as stored in Checkout)
        let productImage: string | string[] = [];
        
        // First try item.images (as stored in Checkout.tsx)
        if (item.images && Array.isArray(item.images)) {
          productImage = item.images;
        } 
        // Then try item.image (single image)
        else if (item.image) {
          productImage = [item.image];
        }
        // Then try other fields from the product object
        else if (item.product?.images && Array.isArray(item.product.images)) {
          productImage = item.product.images;
        }
        else if (item.product?.image_url || item.product?.thumbnail) {
          const img = item.product.image_url || item.product.thumbnail;
          productImage = [img];
        }
        
        // Try different possible field names for price
        const price = 
          Number(item.price) ||
          Number(item.product?.price) ||
          Number(item.unit_price) ||
          Number(item.productPrice) ||
          0;
        
        // Try different possible field names for quantity
        const quantity = Number(item.quantity) || 1;
        
        const size = item.size || item.product_size || item.productSize || "";
        const color = item.color || item.product_color || item.productColor || "";
        
        // Try to get product ID if available
        const productId = item.product_id || item.product?.id || item.productId;
        
        return {
          ...item,
          productName,
          productImage,
          price,
          quantity,
          size,
          color,
          productId,
        };
      });

    return allItems;
  } catch (error) {
    console.error("Error in parseAllOrderItems:", error);
    return [];
  }
};

// Function to convert number to words (for invoice)
const amountInWords = (num: number): string => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const toWords = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + toWords(n % 10000000) : '');
  };

  // Convert to integer rupees (removing paise)
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let words = toWords(rupees);
  
  if (paise > 0) {
    words += (words ? ' and ' : '') + toWords(paise) + ' Paise';
  }
  
  return words || 'Zero';
};

/* ---------------- INVOICE GENERATOR ---------------- */
interface InvoiceData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: any;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    gstAmount: number;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  totalGst: number;
  status: string;
  paymentStatus: string;
}

const generateInvoicePDF = async (invoiceData: InvoiceData) => {
  return new Promise<void>((resolve, reject) => {
    try {
      import('html2pdf.js').then((html2pdf) => {
        const element = document.createElement('div');
        
        // Truncate long product names for better display
        const truncateProductName = (name: string, maxLength: number = 40) => {
          if (name.length <= maxLength) return name;
          return name.substring(0, maxLength) + '...';
        };
        
        element.innerHTML = `
          <div style="font-family: 'Arial', sans-serif; max-width: 210mm; margin: 0 auto; padding: 15mm 20mm; color: #000; font-size: 12px; min-height: 297mm;">
            <!-- Header -->
            <div style="display: flex; flex-direction: column; gap: 10px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
              <div>
                <h1 style="font-size: 24px; font-weight: bold; color: #1a237e; margin: 0 0 6px 0; letter-spacing: 1px; text-align: center;">SS FASHIONS</h1>
                <p style="font-size: 11px; color: #555; margin: 0 0 3px 0; text-align: center;">Premium Clothing & Fashion Accessories</p>
                <p style="font-size: 11px; color: #555; margin: 0 0 3px 0; text-align: center;">123 Fashion Street, Mumbai, Maharashtra 400001</p>
                <p style="font-size: 11px; color: #555; margin: 0 0 3px 0; text-align: center;">Phone: +91 98765 43210 | Email: info@ssfashions.com</p>
                <p style="font-size: 11px; color: #555; margin: 0; text-align: center;">GSTIN: 27AABCU9603R1Z5</p>
              </div>
              <div style="text-align: center; margin-top: 5px;">
                <h2 style="font-size: 20px; font-weight: bold; color: #d32f2f; margin: 0 0 8px 0;">TAX INVOICE</h2>
                <p style="font-size: 10px; color: #666; margin: 0 0 2px 0;">Invoice No: SSF${invoiceData.orderId}</p>
                <p style="font-size: 10px; color: #666; margin: 0 0 2px 0;">Date: ${new Date(invoiceData.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p style="font-size: 10px; color: #666; margin: 0;">Order ID: ${invoiceData.orderId}</p>
              </div>
            </div>

            <!-- Company & Customer Info - Side by side -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div style="background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="font-size: 12px; font-weight: 600; color: #1a237e; margin: 0 0 6px 0; text-transform: uppercase;">Sold By</h3>
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #333; font-size: 11px;">SS Fashions</p>
                <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">123 Fashion Street</p>
                <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">Mumbai, Maharashtra 400001</p>
                <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">GSTIN: 27AABCU9603R1Z5</p>
                <p style="margin: 0; color: #555; font-size: 10px;">State: Maharashtra | Code: 27</p>
              </div>
              
              <div style="background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="font-size: 12px; font-weight: 600; color: #1a237e; margin: 0 0 6px 0; text-transform: uppercase;">Bill To</h3>
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #333; font-size: 11px;">${invoiceData.customerName}</p>
                <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">${invoiceData.customerEmail}</p>
                ${invoiceData.customerPhone ? `<p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">${invoiceData.customerPhone}</p>` : ''}
                ${invoiceData.shippingAddress ? `
                  <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">${invoiceData.shippingAddress.address}</p>
                  <p style="margin: 0 0 4px 0; color: #555; font-size: 10px;">${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.state} ${invoiceData.shippingAddress.zipCode}</p>
                  <p style="margin: 0; color: #555; font-size: 10px;">${invoiceData.shippingAddress.country}</p>
                ` : ''}
              </div>
            </div>

            <!-- Order Items Table -->
            <h3 style="font-size: 14px; font-weight: 600; color: #1a237e; margin: 0 0 10px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd;">ORDER DETAILS</h3>
            <div style="overflow-x: auto; margin-bottom: 15px;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 10px; table-layout: fixed;">
                <colgroup>
                  <col style="width: 5%;">
                  <col style="width: 40%;">
                  <col style="width: 8%;">
                  <col style="width: 15%;">
                  <col style="width: 15%;">
                  <col style="width: 17%;">
                </colgroup>
                <thead>
                  <tr style="background-color: #1a237e; color: white;">
                    <th style="padding: 6px 5px; text-align: center; font-weight: 600; border-right: 1px solid #ddd;">S.No</th>
                    <th style="padding: 6px 5px; text-align: left; font-weight: 600; border-right: 1px solid #ddd; word-wrap: break-word;">Product Description</th>
                    <th style="padding: 6px 5px; text-align: center; font-weight: 600; border-right: 1px solid #ddd;">Qty</th>
                    <th style="padding: 6px 5px; text-align: right; font-weight: 600; border-right: 1px solid #ddd;">Unit Price (₹)</th>
                    <th style="padding: 6px 5px; text-align: right; font-weight: 600; border-right: 1px solid #ddd;">GST (18%)</th>
                    <th style="padding: 6px 5px; text-align: right; font-weight: 600;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceData.items.map((item, index) => {
                    const gstPerItem = (item.price * 0.18).toFixed(2);
                    const totalPerItem = (item.price * item.quantity).toFixed(2);
                    const gstTotalPerItem = (item.gstAmount).toFixed(2);
                    const priceExcludingGst = (item.price / 1.18).toFixed(2);
                    const productName = truncateProductName(item.name, 40);
                    
                    return `
                      <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''} border-bottom: 1px solid #eee; page-break-inside: avoid;">
                        <td style="padding: 6px 5px; border-right: 1px solid #ddd; text-align: center; vertical-align: top;">${index + 1}</td>
                        <td style="padding: 6px 5px; border-right: 1px solid #ddd; vertical-align: top;">
                          <div style="font-weight: 500; font-size: 9px; line-height: 1.3; word-wrap: break-word;">${productName}</div>
                          ${item.size || item.color ? `
                            <div style="font-size: 8px; color: #666; margin-top: 2px;">
                              ${item.size ? `Size: ${item.size}` : ''}
                              ${item.color ? ` | Color: ${item.color}` : ''}
                            </div>
                          ` : ''}
                        </td>
                        <td style="padding: 6px 5px; text-align: center; border-right: 1px solid #ddd; vertical-align: top;">${item.quantity}</td>
                        <td style="padding: 6px 5px; text-align: right; border-right: 1px solid #ddd; vertical-align: top;">${priceExcludingGst}</td>
                        <td style="padding: 6px 5px; text-align: right; border-right: 1px solid #ddd; vertical-align: top;">${gstPerItem}</td>
                        <td style="padding: 6px 5px; text-align: right; font-weight: 500; vertical-align: top;">${totalPerItem}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Summary Section -->
            <div style="display: flex; justify-content: flex-end;">
              <div style="width: 100%; max-width: 280px; border: 1px solid #ddd; border-radius: 4px; page-break-inside: avoid;">
                <div style="background: #f5f5f5; padding: 8px 12px; border-bottom: 1px solid #ddd;">
                  <h4 style="font-size: 12px; font-weight: 600; color: #1a237e; margin: 0;">Amount Summary</h4>
                </div>
                <div style="padding: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; color: #555;">Subtotal (Excluding GST)</span>
                    <span style="font-size: 11px; font-weight: 500;">₹${(invoiceData.subtotal - invoiceData.totalGst).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; color: #555;">GST @18%</span>
                    <span style="font-size: 11px; font-weight: 500;">₹${invoiceData.totalGst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; color: #555;">Subtotal (Including GST)</span>
                    <span style="font-size: 11px; font-weight: 500;">₹${invoiceData.subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; color: #555;">Shipping Charges</span>
                    <span style="font-size: 11px; font-weight: 500;">${invoiceData.shipping === 0 ? 'FREE' : '₹' + invoiceData.shipping.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #ddd; margin-top: 8px;">
                    <span style="font-size: 13px; font-weight: 600;">Total Amount</span>
                    <span style="font-size: 14px; font-weight: 700; color: #1a237e;">₹${invoiceData.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ddd;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 10px; color: #555;">Amount in Words:</span>
                      <span style="font-size: 10px; font-weight: 500; text-align: right; max-width: 180px; word-wrap: break-word;">${amountInWords(invoiceData.total)} Rupees Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment & Status Info -->
            <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #ddd; page-break-inside: avoid;">
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
                <div>
                  <h4 style="font-size: 12px; font-weight: 600; color: #1a237e; margin: 0 0 6px 0;">Payment Details</h4>
                  <p style="font-size: 10px; color: #555; margin: 0 0 3px 0;">
                    <strong>Payment Status:</strong> 
                    <span style="color: ${invoiceData.paymentStatus === 'paid' ? '#388e3c' : '#f57c00'}; font-weight: 600; margin-left: 5px;">
                      ${invoiceData.paymentStatus.toUpperCase()}
                    </span>
                  </p>
                  <p style="font-size: 10px; color: #555; margin: 0 0 3px 0;">
                    <strong>Order Status:</strong> 
                    <span style="color: ${invoiceData.status === 'delivered' ? '#388e3c' : invoiceData.status === 'cancelled' ? '#d32f2f' : '#f57c00'}; font-weight: 600; margin-left: 5px; text-transform: capitalize;">
                      ${invoiceData.status}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 style="font-size: 12px; font-weight: 600; color: #1a237e; margin: 0 0 6px 0;">Terms & Conditions</h4>
                  <p style="font-size: 9px; color: #555; margin: 0; line-height: 1.4;">
                    • Goods once sold will not be taken back<br>
                    • All disputes subject to Mumbai jurisdiction<br>
                    • E. & O.E.
                  </p>
                </div>
              </div>

              <!-- Signature & Footer -->
              <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <p style="font-size: 10px; color: #555; margin: 0 0 8px 0;">Customer Signature</p>
                    <div style="border-top: 1px solid #666; width: 100%; max-width: 180px; padding-top: 4px;"></div>
                  </div>
                  <div>
                    <p style="font-size: 10px; color: #555; margin: 0 0 8px 0;">For SS Fashions</p>
                    <div style="border-top: 1px solid #666; width: 100%; max-width: 180px; padding-top: 4px;"></div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="margin-top: 20px; text-align: center; padding-top: 10px; border-top: 1px solid #ddd;">
                <p style="font-size: 9px; color: #777; margin-bottom: 4px;">
                  This is a computer generated invoice from SS Fashions and does not require a physical signature.
                </p>
                <p style="font-size: 8px; color: #999; margin-top: 4px;">
                  Invoice generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        `;

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `SSFashions-Invoice-${invoiceData.orderId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            width: 210 * 3.78,
            height: 297 * 3.78,
            windowWidth: 210 * 3.78,
            windowHeight: 297 * 3.78,
            letterRendering: true,
            allowTaint: true,
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true,
            hotfixes: ['px_scaling']
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
          enableLinks: true,
        };

        html2pdf.default()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            toast.success('Invoice downloaded successfully!');
            resolve();
          })
          .catch((err: Error) => {
            console.error('PDF generation error:', err);
            toast.error('Failed to generate invoice. Please try again.');
            reject(err);
          });
      }).catch(err => {
        console.error('Failed to load html2pdf:', err);
        toast.error('PDF library not available. Please try again later.');
        reject(err);
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice.');
      reject(error);
    }
  });
};

const OrderDetailsModal = ({ order, onClose, onGenerateInvoice }: OrderDetailsModalProps) => {
  const navigate = useNavigate();
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const items = parseAllOrderItems(order);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Parse shipping address if it's a string
  const getShippingAddress = () => {
    if (!order.shipping_address) return null;
    
    try {
      if (typeof order.shipping_address === 'string') {
        return JSON.parse(order.shipping_address);
      }
      return order.shipping_address;
    } catch {
      return null;
    }
  };

  const shippingAddress = getShippingAddress();

  const handleProductClick = (productId?: string) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  // Group images in 2x2 grid
  const firstFourImages = items.slice(0, 4);
  
  // Function to render 2x2 image grid with fixed sizes
  const renderImageGrid = () => {
    if (firstFourImages.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-48 border rounded-lg bg-gray-50">
          <span className="text-gray-400">No images available</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {firstFourImages.map((item: any, idx: number) => (
          <div key={idx} className="relative">
            <ProductImage
              src={item.productImage}
              alt={item.productName}
              containerClassName="h-48 w-full"
              onClick={() => handleProductClick(item.productId)}
            />
            {item.quantity > 1 && (
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                ×{item.quantity}
              </div>
            )}
            <div className="mt-2">
              <button
                onClick={() => handleProductClick(item.productId)}
                className="text-sm font-medium hover:text-blue-600 transition-colors text-left w-full truncate flex items-center gap-1"
              >
                {item.productName.length > 30 
                  ? item.productName.substring(0, 30) + '...' 
                  : item.productName}
                <ExternalLink size={12} />
              </button>
              {item.size && (
                <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleGenerateInvoice = () => {
    onGenerateInvoice(order);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal - Fixed with proper overflow handling */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          {/* Header - Fixed position at top of modal */}
          <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <Badge className="capitalize">{order.status}</Badge>
                <Badge variant="outline" className="capitalize">
                  Payment: {order.payment_status || "pending"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 font-mono mt-1">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {items.length} item{items.length !== 1 ? 's' : ''} • Placed on {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInvoice}
                className="flex items-center gap-2"
              >
                <FileText size={16} />
                Generate Invoice
              </Button>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-xl">×</span>
                </div>
              </button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            {/* Product Images Grid (2x2) */}
            <div>
              <h3 className="font-medium text-lg mb-4">Product Images</h3>
              {renderImageGrid()}
              {items.length > 4 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  +{items.length - 4} more item{items.length - 4 > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Product Names with Links */}
            <div>
              <h3 className="font-medium text-lg mb-3">All Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        <ProductImage
                          src={item.productImage}
                          alt={item.productName}
                          containerClassName="w-12 h-12"
                          onClick={() => handleProductClick(item.productId)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => handleProductClick(item.productId)}
                          className="group-hover:text-blue-600 transition-colors text-left w-full truncate flex items-center gap-2"
                        >
                          <span className="font-medium text-sm truncate">
                            {item.productName}
                          </span>
                          <ExternalLink size={12} />
                        </button>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </span>
                          {item.size && (
                            <span className="text-xs text-gray-500">
                              Size: {item.size}
                            </span>
                          )}
                          <span className="text-xs font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Details */}
            <div>
              <h3 className="font-medium text-lg mb-3">Order Details ({items.length} items)</h3>
              <div className="border rounded-lg divide-y">
                {items.length > 0 ? (
                  items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 flex gap-4 items-start hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <ProductImage 
                          src={item.productImage}
                          alt={item.productName}
                          containerClassName="w-24 h-24"
                          onClick={() => handleProductClick(item.productId)}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleProductClick(item.productId)}
                              className="font-medium text-base mb-1 hover:text-blue-600 transition-colors text-left flex items-center gap-2 truncate"
                            >
                              <span className="truncate">{item.productName}</span>
                              <ExternalLink size={14} />
                            </button>
                            <div className="text-sm text-gray-600 mb-1">
                              {item.size && (
                                <span className="inline-block mr-4">Size: {item.size}</span>
                              )}
                              {item.color && (
                                <span>Color: {item.color}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × {formatPrice(item.price)} each
                            </p>
                            {item.productId && (
                              <p className="text-xs text-gray-500 mt-2">
                                Product ID: {item.productId}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-lg">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No items found in this order
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary and Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-lg mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(order.subtotal || 0)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {order.shipping_cost === 0
                        ? "Free"
                        : formatPrice(order.shipping_cost || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatPrice(order.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-medium text-lg mb-3">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">{order.customer_name}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>{" "}
                    {order.customer_email}
                  </p>
                  {order.customer_phone && (
                    <p>
                      <span className="text-gray-600">Phone:</span>{" "}
                      {order.customer_phone}
                    </p>
                  )}
                  
                  {/* Shipping Address */}
                  {shippingAddress && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Shipping Address</h4>
                      <p className="text-sm">
                        {shippingAddress.firstName} {shippingAddress.lastName}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                        {shippingAddress.country}<br />
                        Phone: {shippingAddress.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-sm text-gray-500 pt-4 border-t pb-4">
              <p>
                <span className="font-medium">Ordered:</span> {formatDate(order.created_at)}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span> {formatDate(order.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main OrdersTable component
interface OrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-600',
  cancelled: 'bg-destructive',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-green-600',
  failed: 'bg-destructive',
  refunded: 'bg-gray-500',
};

const OrdersTable = ({ orders }: OrdersTableProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const orderStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out for delivery', 'delivered', 'cancelled'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  // Function to generate invoice data from order
  const prepareInvoiceData = (order: Order): InvoiceData => {
    const items = parseAllOrderItems(order);
    
    // Calculate GST (assuming 18% GST)
    const invoiceItems = items.map(item => {
      const gstAmount = (item.price * 0.18) * item.quantity;
      return {
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        gstAmount,
        size: item.size,
        color: item.color
      };
    });
    
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const totalGst = invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const shipping = order.shipping_cost || 0;
    const total = order.total || 0;
    
    // Parse shipping address if it's a string
    let shippingAddress = null;
    if (order.shipping_address) {
      try {
        if (typeof order.shipping_address === 'string') {
          shippingAddress = JSON.parse(order.shipping_address);
        } else {
          shippingAddress = order.shipping_address;
        }
      } catch {
        shippingAddress = null;
      }
    }
    
    return {
      orderId: order.id,
      orderDate: order.created_at,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress,
      items: invoiceItems,
      subtotal,
      shipping,
      total,
      totalGst,
      status: order.status,
      paymentStatus: order.payment_status || 'pending'
    };
  };

  const handleGenerateInvoice = async (order: Order) => {
    try {
      setIsGeneratingInvoice(true);
      const invoiceData = prepareInvoiceData(order);
      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Add invoice button to table actions
  const renderActions = (order: Order) => {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedOrder(order)}
          title="View Order Details"
        >
          <Eye size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleGenerateInvoice(order)}
          title="Generate Invoice"
          disabled={isGeneratingInvoice}
        >
          <FileText size={18} />
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Order ID</th>
              <th className="text-left p-4 font-medium text-sm">Customer</th>
              <th className="text-left p-4 font-medium text-sm">Items</th>
              <th className="text-left p-4 font-medium text-sm">Total</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Payment</th>
              <th className="text-left p-4 font-medium text-sm">Date</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => {
              // Parse items count
              let itemsCount = 0;
              try {
                if (Array.isArray(order.items)) {
                  itemsCount = order.items.length;
                } else if (typeof order.items === 'string') {
                  const parsed = JSON.parse(order.items);
                  itemsCount = Array.isArray(parsed) ? parsed.length : 0;
                }
              } catch {
                itemsCount = 0;
              }
              
              return (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{itemsCount} items</span>
                  </td>
                  <td className="p-4 font-medium">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <Badge className={`${statusColors[order.status] || 'bg-gray-500'} text-white`}>
                            {order.status}
                          </Badge>
                          <ChevronDown size={14} className="ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {orderStatuses.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => updateStatus.mutate({ id: order.id, status })}
                            className="capitalize"
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <Badge className={`${paymentStatusColors[order.payment_status] || 'bg-gray-500'} text-white`}>
                            {order.payment_status}
                          </Badge>
                          <ChevronDown size={14} className="ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {paymentStatuses.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => updatePaymentStatus.mutate({ id: order.id, payment_status: status })}
                            className="capitalize"
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="p-4">
                    {renderActions(order)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onGenerateInvoice={handleGenerateInvoice}
        />
      )}
    </>
  );
};

export default OrdersTable;