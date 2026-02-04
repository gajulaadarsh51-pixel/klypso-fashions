import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  ChevronRight,
  ChevronUp,
  X,
  PlusCircle,
  ExternalLink,
  Download,
  FileText,
  Printer,
  MapPin,
  User,
  Phone,
  Calendar,
  Truck,
  Heart, // Add Heart import
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext"; // Add this import
import { Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/* ---------------- HELPERS ---------------- */
const formatPrice = (price?: number) => {
  if (!price || isNaN(price)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const normalize = (v?: string) => v?.toLowerCase().trim() || "";

/* ---------------- COMPREHENSIVE IMAGE HANDLER ---------------- */
const getPublicImageUrl = (path?: string | string[] | any): string => {
  if (!path) return "";
  
  if (Array.isArray(path)) {
    if (path.length === 0) return "";
    const firstValidPath = path.find(item => 
      item && 
      typeof item === 'string' && 
      item.trim().length > 0
    );
    if (!firstValidPath) return "";
    return getPublicImageUrl(firstValidPath);
  }
  
  if (typeof path !== 'string') return "";
  
  const trimmedPath = path.trim();
  if (!trimmedPath) return "";
  
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    try {
      new URL(trimmedPath);
      return trimmedPath;
    } catch {
      return "";
    }
  }
  
  try {
    const cleanPath = trimmedPath.startsWith('/') ? trimmedPath.slice(1) : trimmedPath;
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(cleanPath);
    return data?.publicUrl || "";
  } catch (error) {
    console.error("Error getting public URL:", trimmedPath, error);
    return "";
  }
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
                  <div style="display: flex; justify-content space-between; margin-bottom: 6px;">
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
          margin: [10, 10, 10, 10], // Top, Right, Bottom, Left margins
          filename: `SSFashions-Invoice-${invoiceData.orderId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            width: 210 * 3.78, // A4 width in pixels
            height: 297 * 3.78, // A4 height in pixels
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

/* ---------------- AMOUNT IN WORDS FUNCTION ---------------- */
const amountInWords = (amount: number): string => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  if (amount === 0) return 'Zero';

  let num = Math.floor(amount);
  let words = '';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n] + ' ';
    if (n < 20) return teens[n - 10] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + units[n % 10] + ' ';
    return units[Math.floor(n / 100)] + ' Hundred ' + convertLessThanThousand(n % 100);
  };

  let i = 0;
  while (num > 0) {
    if (num % 1000 !== 0) {
      words = convertLessThanThousand(num % 1000) + thousands[i] + ' ' + words;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return words.trim() || 'Zero';
};

/* ---------------- STEPS ---------------- */
const steps = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out for delivery",
  "delivered",
  "cancelled",
];

const getStepIndex = (status: string) => {
  const index = steps.findIndex((s) => s === normalize(status));
  return index === -1 ? 0 : index;
};

/* ---------------- STATUS THEME ---------------- */
const getStatusTheme = (status: string) => {
  const s = normalize(status);

  switch (s) {
    case "pending":
      return {
        pill: "bg-gray-100 text-gray-700 border-gray-300",
        bar: "bg-gray-400",
        icon: "bg-gray-400",
      };
    case "confirmed":
    case "processing":
    case "packed":
      return {
        pill: "bg-yellow-100 text-yellow-700 border-yellow-300",
        bar: "bg-yellow-500",
        icon: "bg-yellow-500",
      };
    case "shipped":
      return {
        pill: "bg-blue-100 text-blue-700 border-blue-300",
        bar: "bg-blue-500",
        icon: "bg-blue-500",
      };
    case "out for delivery":
      return {
        pill: "bg-green-100 text-green-700 border-green-300",
        bar: "bg-green-500",
        icon: "bg-green-500",
      };
    case "delivered":
      return {
        pill: "bg-emerald-100 text-emerald-700 border-emerald-300",
        bar: "bg-emerald-600",
        icon: "bg-emerald-600",
      };
    case "cancelled":
    case "failed":
      return {
        pill: "bg-red-100 text-red-700 border-red-300",
        bar: "bg-red-500",
        icon: "bg-red-500",
      };
    default:
      return {
        pill: "bg-gray-100 text-gray-700 border-gray-300",
        bar: "bg-gray-400",
        icon: "bg-gray-400",
      };
  }
};

/* ---------------- PAYMENT THEME ---------------- */
const getPaymentTheme = (status?: string) => {
  const s = normalize(status);

  switch (s) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "failed":
      return "bg-red-100 text-red-700 border-red-300";
    case "refunded":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

/* ---------------- PRODUCT IMAGE COMPONENT ---------------- */
interface ProductImageProps {
  src?: string | string[] | any;
  alt?: string;
  containerClassName?: string;
  className?: string;
  onClick?: () => void;
}

const ProductImage = ({ src, alt, containerClassName = "w-14 h-14", className = "", onClick }: ProductImageProps) => {
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setLoading(true);
      const processedUrl = getPublicImageUrl(src);
      setImageUrl(processedUrl);
      setError(!processedUrl);
      setLoading(false);
    } else {
      setImageUrl("");
      setError(true);
      setLoading(false);
    }
  }, [src]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  if (loading) {
    return (
      <div 
        className={`${containerClassName} flex items-center justify-center rounded-lg border bg-gray-100 animate-pulse`}
      >
        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div 
        className={`${containerClassName} flex items-center justify-center rounded-lg border bg-gray-100 ${
          onClick ? 'cursor-pointer hover:opacity-80' : ''
        }`}
        onClick={handleClick}
      >
        <Package size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${containerClassName} relative ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
      <img
        src={imageUrl}
        alt={alt || "Product"}
        onError={() => setError(true)}
        className={`w-full h-full object-contain rounded-lg border bg-white ${className} ${
          onClick ? 'hover:opacity-80 transition-opacity' : ''}
        `}
        loading="lazy"
        onLoad={() => setLoading(false)}
        style={{ objectFit: 'contain' }}
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-lg"></div>
      )}
    </div>
  );
};

/* ---------------- PRODUCT LINK COMPONENT ---------------- */
interface ProductLinkProps {
  productId?: string;
  productName?: string;
  children: React.ReactNode;
  className?: string;
}

const ProductLink = ({ productId, productName, children, className = "" }: ProductLinkProps) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  if (!productId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      onClick={handleClick}
      className={`${className} text-left hover:text-blue-600 hover:underline transition-colors`}
      aria-label={`View ${productName || 'product'} details`}
    >
      {children}
    </button>
  );
};

/* ---------------- VERTICAL TIMELINE ---------------- */
interface VerticalTimelineProps {
  status: string;
  theme: ReturnType<typeof getStatusTheme>;
}

const VerticalTimeline = ({ status, theme }: VerticalTimelineProps) => {
  const currentStep = getStepIndex(status);

  return (
    <div className="mt-4">
      {steps.map((step, index) => {
        const active = index <= currentStep;

        return (
          <div key={step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  active ? theme.icon : "bg-gray-300"
                }`}
              />
              {index !== steps.length - 1 && (
                <div
                  className={`w-[2px] h-7 ${
                    active ? theme.bar : "bg-gray-300"
                  }`}
                />
              )}
            </div>

            <div className="pb-4">
              <p
                className={`text-sm capitalize font-medium ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </p>
              {index === currentStep && (
                <p className="text-xs text-muted-foreground">
                  {normalize(status) === "delivered"
                    ? "Item delivered successfully"
                    : "Item in progress"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- ENHANCED ORDER ITEM PARSER ---------------- */
interface ParsedOrderItem {
  productName: string;
  productImage: string | string[];
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  productId?: string;
  [key: string]: any;
}

const parseAllOrderItems = (order: Order): ParsedOrderItem[] => {
  try {
    let raw: any[] = [];
    
    if (Array.isArray(order.items)) {
      raw = order.items;
    } else if (typeof order.items === "string") {
      try {
        raw = JSON.parse(order.items);
      } catch {
        if (order.items.trim().length > 0) {
          raw = [order.items];
        }
      }
    } else if (order.items && typeof order.items === "object") {
      raw = [order.items];
    }

    const allItems: ParsedOrderItem[] = raw
      .filter((item: any) => {
        if (!item) return false;
        if (typeof item === 'object' && Object.keys(item).length === 0) return false;
        if (typeof item === 'string' && item.trim().length === 0) return false;
        return true;
      })
      .map((item: any) => {
        if (typeof item === 'string') {
          return {
            productName: "Product",
            productImage: [],
            price: 0,
            quantity: 1,
            productId: item,
          } as ParsedOrderItem;
        }

        const productName = 
          item.name ||
          item.product_name ||
          item.product?.name ||
          item.title ||
          item.product?.title ||
          item.productName ||
          "Product";
        
        let productImage: string | string[] = [];
        
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          productImage = item.images.filter((img: any) => 
            img && typeof img === 'string' && img.trim().length > 0
          );
        } else if (item.image) {
          if (Array.isArray(item.image)) {
            productImage = item.image.filter((img: any) => 
              img && typeof img === 'string' && img.trim().length > 0
            );
          } else if (typeof item.image === 'string' && item.image.trim().length > 0) {
            productImage = [item.image.trim()];
          }
        } else if (item.product) {
          if (item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
            productImage = item.product.images.filter((img: any) => 
              img && typeof img === 'string' && img.trim().length > 0
            );
          } else if (item.product.image && typeof item.product.image === 'string' && item.product.image.trim().length > 0) {
            productImage = [item.product.image.trim()];
          }
        }
        
        let price = 0;
        if (item.price !== undefined) {
          price = Number(item.price);
        } else if (item.product?.price !== undefined) {
          price = Number(item.product.price);
        } else if (item.unit_price !== undefined) {
          price = Number(item.unit_price);
        }
        
        const quantity = Number(item.quantity) || 1;
        const size = item.size || item.product_size || "";
        const color = item.color || item.product_color || "";
        const productId = item.product_id || item.product?.id || "";

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

/* ---------------- ENHANCED ORDER DETAILS MODAL ---------------- */
interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

const OrderDetailsModal = ({ order, onClose }: OrderDetailsModalProps) => {
  const navigate = useNavigate();
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const { isInWishlist, toggleWishlist } = useWishlist(); // Add this
  const [wishlistLoading, setWishlistLoading] = useState<string | null>(null); // Add this
  
  useEffect(() => {
    if (order.shipping_address && typeof order.shipping_address === 'string') {
      try {
        const parsed = JSON.parse(order.shipping_address);
        setShippingAddress(parsed);
      } catch (error) {
        console.error("Error parsing shipping address:", error);
      }
    } else if (typeof order.shipping_address === 'object') {
      setShippingAddress(order.shipping_address);
    }
  }, [order.shipping_address]);

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
  
  // Check if payment is done
  const isPaymentDone = normalize(order.payment_status) === "paid";

  const handleProductClick = (productId?: string) => {
    if (productId) {
      navigate(`/product/${productId}`);
      onClose();
    }
  };

  // Add wishlist handler
  const handleWishlistToggle = async (productId: string, productName: string) => {
    if (!productId) return;
    
    setWishlistLoading(productId);
    try {
      await toggleWishlist(productId, productName);
    } finally {
      setWishlistLoading(null);
    }
  };

  const handleGenerateInvoice = async () => {
    if (generatingInvoice) return;
    
    try {
      setGeneratingInvoice(true);
      toast.loading('Generating invoice...');
      
      // Calculate GST for each item (18% GST)
      const itemsWithGst = items.map(item => {
        const priceExcludingGst = item.price / 1.18; // Assuming price includes 18% GST
        const gstAmount = priceExcludingGst * 0.18;
        return {
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          gstAmount: gstAmount * item.quantity,
          size: item.size,
          color: item.color
        };
      });

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalGst = itemsWithGst.reduce((sum, item) => sum + item.gstAmount, 0);

      const invoiceData: InvoiceData = {
        orderId: order.id.slice(0, 8).toUpperCase(),
        orderDate: order.created_at,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        shippingAddress: shippingAddress,
        items: itemsWithGst,
        subtotal: subtotal,
        shipping: order.shipping_cost || 0,
        total: order.total || 0,
        totalGst: totalGst,
        status: order.status,
        paymentStatus: order.payment_status || 'pending'
      };

      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setGeneratingInvoice(false);
      toast.dismiss();
    }
  };

  // Fixed 2x2 image grid with consistent aspect ratio
  const renderImageGrid = () => {
    const imagesToShow = items.slice(0, 4);
    
    if (imagesToShow.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <Package className="h-12 w-12 text-gray-400" />
          <p className="ml-3 text-gray-500">No images available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-xl mx-auto">
        {imagesToShow.map((item, index) => (
          <div key={index} className="space-y-2 md:space-y-3">
            {/* Fixed aspect ratio container */}
            <div className="relative w-full aspect-square overflow-hidden rounded-lg md:rounded-xl border border-gray-200 md:border-2 md:border-gray-100 bg-white group">
              <ProductImage
                src={item.productImage}
                alt={item.productName}
                containerClassName="absolute inset-0"
                className="w-full h-full object-contain p-2 md:p-3"
                onClick={() => handleProductClick(item.productId)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none rounded-lg md:rounded-xl"></div>
            </div>
            {/* Product info */}
            <div className="text-center space-y-1">
              <p className="text-xs md:text-sm font-medium line-clamp-2 px-1">{item.productName}</p>
              <div className="flex items-center justify-center gap-1 md:gap-2 text-xs text-gray-500">
                <span>Qty: {item.quantity}</span>
                {item.size && (
                  <>
                    <span>•</span>
                    <span className="hidden sm:inline">Size: {item.size}</span>
                    <span className="sm:hidden">S: {item.size}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* MODAL CONTAINER - FIXED FOR MOBILE */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl sm:rounded-xl shadow-2xl overflow-y-auto">
          {/* Header - Mobile Optimized */}
          <div className="sticky top-0 bg-white border-b p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10">
            <div className="flex-1 w-full">
              <div className="flex items-start gap-3 mb-2">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                    Order Details
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <code className="text-xs md:text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </code>
                    <Badge 
                      variant="outline" 
                      className={`capitalize px-2 py-0.5 md:px-3 md:py-1 text-xs ${getStatusTheme(order.status).pill}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {items.length} item{items.length !== 1 ? 's' : ''} • {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
              {/* Only show invoice button if payment is done */}
              {isPaymentDone && (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  size="sm"
                  className="gap-1 md:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm h-8 md:h-10"
                >
                  {generatingInvoice ? (
                    <>
                      <div className="h-3 w-3 md:h-4 md:w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Invoice</span>
                    </>
                  )}
                </Button>
              )}
              <button 
                onClick={onClose} 
                className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close order details"
              >
                <X size={18} className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-8">
            {/* Product Images Grid */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
                <h3 className="font-medium text-base md:text-lg text-gray-800 flex items-center gap-2">
                  <Package size={16} className="h-4 w-4 md:h-5 md:w-5" />
                  Product Images
                </h3>
                <span className="text-xs md:text-sm text-gray-500">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              {renderImageGrid()}
              {items.length > 4 && (
                <p className="text-xs md:text-sm text-gray-500 mt-4 md:mt-6 text-center">
                  +{items.length - 4} more item{items.length - 4 > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Product Names with Links */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
              <h3 className="font-medium text-base md:text-lg text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <ShoppingBag size={16} className="h-4 w-4 md:h-5 md:w-5" />
                All Products
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between bg-white hover:bg-blue-50 px-3 py-2 md:px-4 md:py-3 rounded-lg border border-gray-200 transition-all hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border bg-white">
                          <ProductImage
                            src={item.productImage}
                            alt={item.productName}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain p-1"
                            onClick={() => handleProductClick(item.productId)}
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => handleProductClick(item.productId)}
                          className="group-hover:text-blue-600 transition-colors text-left w-full flex items-center gap-1 md:gap-2"
                        >
                          <span className="font-medium text-xs md:text-sm line-clamp-2 text-left">
                            {item.productName}
                          </span>
                          <ExternalLink size={10} className="h-3 w-3 md:h-3 md:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                        </button>
                        <div className="flex flex-wrap items-center gap-1 md:gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </span>
                          {item.size && (
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              Size: {item.size}
                            </span>
                          )}
                          <span className="text-xs font-medium text-blue-600">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Details with Wishlist Button */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <h3 className="font-medium text-base md:text-lg text-gray-800 flex items-center gap-2">
                  <FileText size={16} className="h-4 w-4 md:h-5 md:w-5" />
                  Order Details ({items.length} items)
                </h3>
                <span className="text-xs md:text-sm font-medium text-blue-600">
                  Total: {formatPrice(order.total || 0)}
                </span>
              </div>
              <div className="border rounded-lg divide-y bg-white">
                {items.length > 0 ? (
                  items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 md:p-4 flex flex-col sm:flex-row gap-3 md:gap-4 items-start hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        <div className="w-full h-48 sm:w-24 sm:h-24 rounded-lg overflow-hidden border bg-white">
                          <ProductImage 
                            src={item.productImage}
                            alt={item.productName}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain p-2"
                            onClick={() => handleProductClick(item.productId)}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 md:gap-4">
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleProductClick(item.productId)}
                              className="font-medium text-sm md:text-base mb-1 md:mb-2 hover:text-blue-600 transition-colors text-left flex items-center gap-1 md:gap-2"
                            >
                              <span className="line-clamp-2">{item.productName}</span>
                              <ExternalLink size={12} className="h-3 w-3 md:h-3 md:w-3 flex-shrink-0 mt-0.5" />
                            </button>
                            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 flex flex-wrap gap-1">
                              {item.size && (
                                <span className="inline-block px-2 py-0.5 md:py-1 bg-gray-100 rounded text-xs">Size: {item.size}</span>
                              )}
                              {item.color && (
                                <span className="inline-block px-2 py-0.5 md:py-1 bg-gray-100 rounded text-xs">Color: {item.color}</span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-600">
                              Quantity: {item.quantity} × {formatPrice(item.price)} each
                            </p>
                            {item.productId && (
                              <p className="text-xs text-gray-500 mt-1 md:mt-2">
                                Product ID: {item.productId}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right flex-shrink-0 sm:self-start">
                              <p className="font-medium text-base md:text-lg text-blue-600">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                            {/* Wishlist Button */}
                            {item.productId && (
                              <button
                                onClick={() => handleWishlistToggle(item.productId, item.productName)}
                                disabled={wishlistLoading === item.productId}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                aria-label={isInWishlist(item.productId) ? 'Remove from wishlist' : 'Add to wishlist'}
                              >
                                <Heart 
                                  size={18} 
                                  className={isInWishlist(item.productId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                                />
                              </button>
                            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
                <h3 className="font-medium text-base md:text-lg text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="h-4 w-4 md:h-5 md:w-5" />
                  Order Summary
                </h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center py-1 md:py-2 border-b">
                    <span className="text-sm md:text-base text-gray-600">Subtotal</span>
                    <span className="font-medium text-sm md:text-base">{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 md:py-2 border-b">
                    <span className="text-sm md:text-base text-gray-600">Shipping</span>
                    <span className="font-medium text-sm md:text-base">
                      {order.shipping_cost === 0
                        ? <span className="text-green-600">Free</span>
                        : formatPrice(order.shipping_cost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 md:pt-3 mt-1 md:mt-2 border-t">
                    <span className="text-base md:text-lg font-semibold">Total</span>
                    <span className="text-lg md:text-xl font-bold text-blue-600">{formatPrice(order.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
                <h3 className="font-medium text-base md:text-lg text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                  <User size={16} className="h-4 w-4 md:h-5 md:w-5" />
                  Customer Information
                </h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-start gap-2 md:gap-3">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{order.customer_name}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{order.customer_email}</p>
                    </div>
                  </div>
                  
                  {order.customer_phone && (
                    <div className="flex items-center gap-2 md:gap-3">
                      <Phone className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm md:text-base text-gray-700 truncate">{order.customer_phone}</span>
                    </div>
                  )}

                  {shippingAddress && (
                    <div className="pt-2 md:pt-4 mt-2 md:mt-4 border-t">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                        <h4 className="font-medium text-sm md:text-base text-gray-800">Shipping Address</h4>
                      </div>
                      <div className="bg-white p-3 md:p-4 rounded-lg border">
                        <p className="font-medium text-sm md:text-base mb-1 truncate">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{shippingAddress.address}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{shippingAddress.country}</p>
                        {shippingAddress.phone && (
                          <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2 truncate">Phone: {shippingAddress.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps and Payment Status */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="font-medium text-base md:text-lg text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                    <Calendar size={16} className="h-4 w-4 md:h-5 md:w-5" />
                    Order Timeline
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-gray-600">Ordered</span>
                      <span className="font-medium text-sm md:text-base truncate ml-2">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-gray-600">Last Updated</span>
                      <span className="font-medium text-sm md:text-base truncate ml-2">{formatDate(order.updated_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-gray-600">Payment Status</span>
                      <Badge 
                        variant="outline" 
                        className={`capitalize text-xs md:text-sm ${getPaymentTheme(order.payment_status)}`}
                      >
                        {order.payment_status || "pending"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="font-medium text-base md:text-lg text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                    <Truck size={16} className="h-4 w-4 md:h-5 md:w-5" />
                    Delivery Status
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-gray-600">Current Status</span>
                      <Badge className={`capitalize text-xs md:text-sm ${getStatusTheme(order.status).pill}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <VerticalTimeline status={order.status} theme={getStatusTheme(order.status)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 md:pt-6 border-t">
              {isPaymentDone ? (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-12"
                  size="lg"
                >
                  <Download size={18} className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">
                    {generatingInvoice ? 'Generating...' : 'Download Invoice'}
                  </span>
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-xs md:text-sm font-medium">
                    <CreditCard className="inline mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Invoice available after payment
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 gap-2 h-10 md:h-12"
                size="lg"
              >
                <Printer size={18} className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Print</span>
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 gap-2 h-10 md:h-12"
                size="lg"
              >
                <X size={18} className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Close</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------------- MAIN PAGE COMPONENT ---------------- */
const AccountOrders = () => {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    setIsAuthModalOpen,
    setAuthMode,
  } = useAuth();

  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["account-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      return data as unknown as Order[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
    }
  }, [authLoading, isAuthenticated, setAuthMode, setIsAuthModalOpen]);

  if (authLoading || isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-100 rounded-lg" />
          <div className="h-32 bg-gray-100 rounded-lg" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex items-center justify-center p-10">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">
            Please Login
          </h2>
          <p className="text-gray-600 mb-4">
            Login to view your order history
          </p>
          <Button
            onClick={() => {
              setAuthMode("login");
              setIsAuthModalOpen(true);
            }}
          >
            Login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
        {/* HEADER - REMOVED EXPORT ALL BUTTON */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              My Orders
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ORDERS LIST */}
        {orders.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-gray-50 rounded-2xl">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here
            </p>
            <Button 
              onClick={() => navigate("/products")}
              className="gap-2"
            >
              <ShoppingBag size={16} />
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-5 flex flex-col items-center">
            {orders.map((order) => {
              const theme = getStatusTheme(order.status);
              const items = parseAllOrderItems(order);
              const firstFourImages = items.slice(0, 4);
              const isExpanded = expandedOrderId === order.id;
              const isPaymentDone = normalize(order.payment_status) === "paid";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow w-full max-w-2xl group"
                >
                  {/* TOP SECTION */}
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {/* PRODUCT IMAGES - FIXED LAYOUT */}
                        <div className="flex flex-wrap gap-2">
                          {firstFourImages.map((item, idx) => (
                            <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden border bg-white">
                              <ProductImage
                                src={item.productImage}
                                alt={item.productName}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain p-1"
                                onClick={() => {
                                  if (item.productId) {
                                    navigate(`/product/${item.productId}`);
                                  }
                                }}
                              />
                            </div>
                          ))}
                          {items.length > 4 && (
                            <div 
                              className="w-14 h-14 flex items-center justify-center rounded-lg border bg-gray-100 relative cursor-pointer hover:opacity-80 group-hover:border-blue-300 transition-colors"
                              onClick={() => setSelectedOrder(order)}
                              aria-label={`View all ${items.length} items`}
                            >
                              <PlusCircle className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                +{items.length - 4}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PRODUCT NAMES - FIXED FOR MOBILE */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-semibold">
                            Products ({items.length} items):
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {formatPrice(order.total)}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                          {items.length > 0 ? (
                            items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <ProductLink
                                  productId={item.productId}
                                  productName={item.productName}
                                  className="flex-1"
                                >
                                  <div className="text-sm text-gray-700 line-clamp-2 hover:text-blue-600 transition-colors text-left">
                                    {item.productName}
                                    {item.quantity > 1 && ` x${item.quantity}`}
                                    {item.size && ` (Size: ${item.size})`}
                                  </div>
                                </ProductLink>
                                <span className="text-xs font-medium text-blue-600 whitespace-nowrap">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              No product names available
                            </span>
                          )}
                          {items.length > 3 && (
                            <div className="text-xs text-gray-500 mt-1">
                              +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard size={12} />
                            {order.payment_status || 'pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STATUS BADGES */}
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={`capitalize px-3 py-1.5 rounded-full border ${theme.pill}`}
                      >
                        {order.status}
                      </Badge>

                      {/* Only show invoice button if payment is done */}
                      {isPaymentDone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-blue-600"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FileText size={14} />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* TIMELINE (EXPANDABLE) */}
                  {isExpanded && (
                    <div className="mt-4 pl-4 border-l-2 border-blue-200">
                      <VerticalTimeline
                        status={order.status}
                        theme={theme}
                      />
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600"
                      onClick={() =>
                        setExpandedOrderId(
                          isExpanded ? null : order.id
                        )
                      }
                    >
                      {isExpanded ? (
                        <>
                          Hide Timeline
                          <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          View Timeline
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                      }}
                      className="gap-1"
                    >
                      <ExternalLink size={14} />
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
};

export default AccountOrders;