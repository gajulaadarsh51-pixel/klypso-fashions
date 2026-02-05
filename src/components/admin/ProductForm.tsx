import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, ProductInput } from '@/hooks/useProducts';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: ProductInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Comprehensive size options - reorganized for better categorization
const sizeCategories = [
  {
    category: 'Kids',
    types: [
      { id: 'kids-tshirt', label: 'Kids T-Shirts & Shirts', sizes: ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-12Y', '12-14Y'] },
      { id: 'kids-pants', label: 'Kids Pants', sizes: ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-12Y', '12-14Y'] },
      { id: 'kids-shoes', label: 'Kids Shoes', sizes: ['EU 20', 'EU 21', 'EU 22', 'EU 23', 'EU 24', 'EU 25', 'EU 26', 'EU 27', 'EU 28', 'EU 29', 'EU 30', 'EU 31', 'EU 32', 'EU 33', 'EU 34', 'EU 35', 'EU 36'] },
    ]
  },
  {
    category: 'Men',
    types: [
      { id: 'men-tshirt', label: 'Men T-Shirts', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL'] },
      { id: 'men-shirt', label: 'Men Formal Shirts', sizes: ['14"', '14.5"', '15"', '15.5"', '16"', '16.5"', '17"', '17.5"', '18"'] },
      { id: 'men-pants', label: 'Men Pants', sizes: ['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"', '44"', '46"', '48"'] },
      { id: 'men-jeans', label: 'Men Jeans', sizes: ['28x30', '30x30', '30x32', '32x30', '32x32', '34x30', '34x32', '36x30', '36x32', '38x32', '40x32'] },
      { id: 'men-shoes', label: 'Men Shoes', sizes: ['US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13', 'US 14'] },
    ]
  },
  {
    category: 'Women',
    types: [
      { id: 'women-tshirt', label: 'Women T-Shirts', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
      { id: 'women-tops', label: 'Women Tops & Blouses', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'women-dresses', label: 'Women Dresses', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'women-pants', label: 'Women Pants', sizes: ['24"', '26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"'] },
      { id: 'women-jeans', label: 'Women Jeans', sizes: ['24x30', '26x30', '28x30', '28x32', '30x30', '30x32', '32x30', '32x32'] },
      { id: 'women-nightwear', label: 'Women Nightwear', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'saree-blouse', label: 'Saree Blouse', sizes: ['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"'] },
      { id: 'petticoat', label: 'Petticoat', sizes: ['26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"'] },
      { id: 'women-shoes', label: 'Women Shoes', sizes: ['US 4', 'US 5', 'US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11'] },
      { id: 'saree', label: 'Saree', sizes: ['One Size'] },
      { id: 'lehenga', label: 'Lehenga', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    ]
  },
  {
    category: 'Unisex',
    types: [
      { id: 'unisex', label: 'Unisex Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
    ]
  },
  {
    category: 'Accessories',
    types: [
      { id: 'watches', label: 'Watches', sizes: ['28mm', '32mm', '36mm', '38mm', '40mm', '42mm', '44mm', '46mm', 'Adjustable'] },
      { id: 'jewelry', label: 'Jewelry', sizes: ['16"', '17"', '18"', '19"', '20"', '21"', '22"', '24"', 'Adjustable'] },
      { id: 'belts', label: 'Belts', sizes: ['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"'] },
      { id: 'bags', label: 'Bags', sizes: ['One Size'] },
      { id: 'sunglasses', label: 'Sunglasses', sizes: ['One Size'] },
    ]
  },
  {
    category: 'Other',
    types: [
      { id: 'one-size', label: 'One Size', sizes: ['One Size'] },
      { id: 'custom', label: 'Custom Sizes', sizes: [] }
    ]
  }
];

// Flatten all size types for easy access
const allSizeTypes = sizeCategories.flatMap(cat => cat.types);

// Helper function to normalize text for comparison
const normalizeText = (text: string): string => {
  return text?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
};

// Function to detect size type based on product data
const detectSizeType = (product: Product): string => {
  if (!product) return 'custom';
  
  const existingSizes = product.sizes || [];
  const category = normalizeText(product.category);
  
  // Check for one size first
  if (existingSizes.length === 1 && existingSizes[0] === 'One Size') {
    // Check if it's a specific one-size product type
    if (category.includes('saree')) return 'saree';
    if (category.includes('bag') || category.includes('accessory')) return 'bags';
    return 'one-size';
  }
  
  // Try to detect based on product category first
  if (category.includes('women') || category.includes('woman') || category.includes('female') || category.includes('ladies')) {
    // Women's categories
    if (category.includes('saree') || category.includes('blouse')) return 'saree-blouse';
    if (category.includes('lehenga')) return 'lehenga';
    if (category.includes('petticoat')) return 'petticoat';
    if (category.includes('nightwear') || category.includes('nightdress')) return 'women-nightwear';
    if (category.includes('dress') || category.includes('gown')) return 'women-dresses';
    if (category.includes('top') || category.includes('blouse')) return 'women-tops';
    if (category.includes('jeans')) return 'women-jeans';
    if (category.includes('pant') || category.includes('trouser')) return 'women-pants';
    if (category.includes('shoe') || category.includes('footwear')) return 'women-shoes';
    if (category.includes('tshirt') || category.includes('t-shirt')) return 'women-tshirt';
    // Default women's
    return 'women-tops';
  }
  
  if (category.includes('men') || category.includes('man') || category.includes('male') || category.includes('gentlemen')) {
    // Men's categories
    if (category.includes('shirt') && (category.includes('formal') || category.includes('office'))) return 'men-shirt';
    if (category.includes('tshirt') || category.includes('t-shirt')) return 'men-tshirt';
    if (category.includes('jeans')) return 'men-jeans';
    if (category.includes('pant') || category.includes('trouser')) return 'men-pants';
    if (category.includes('shoe') || category.includes('footwear')) return 'men-shoes';
    // Default men's
    return 'men-tshirt';
  }
  
  if (category.includes('kid') || category.includes('child') || category.includes('baby')) {
    // Kids categories
    if (category.includes('shoe')) return 'kids-shoes';
    if (category.includes('pant')) return 'kids-pants';
    // Default kids
    return 'kids-tshirt';
  }
  
  if (category.includes('accessor') || category.includes('jewelry') || category.includes('watch')) {
    if (category.includes('watch')) return 'watches';
    if (category.includes('jewelry') || category.includes('necklace') || category.includes('bracelet')) return 'jewelry';
    if (category.includes('belt')) return 'belts';
    if (category.includes('bag')) return 'bags';
    if (category.includes('sunglass')) return 'sunglasses';
    return 'watches';
  }
  
  if (category.includes('unisex')) {
    return 'unisex';
  }
  
  // Fallback: Try to match sizes with available size types
  for (const sizeType of allSizeTypes) {
    if (sizeType.id === 'custom' || sizeType.id === 'one-size') continue;
    
    // Check if any size matches exactly
    const matchingSizes = existingSizes.filter(size => sizeType.sizes.includes(size));
    if (matchingSizes.length > 0) {
      // If most sizes match or we have a significant match
      if (matchingSizes.length >= existingSizes.length / 2) {
        return sizeType.id;
      }
    }
  }
  
  return 'custom';
};

// Function to convert Google Drive URL to direct image URL
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;
  
  // Check if it's a Google Drive URL
  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/|docs\.google\.com\/uc\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    // Return direct image link (as JPG, max width 1200px)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  
  return url;
};

// Function to check if URL is Google Drive
const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com');
};

// Function to extract file ID from Google Drive URL
const extractDriveFileId = (url: string): string | null => {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

const ProductForm = ({ product, onSubmit, onCancel, isLoading }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    original_price: undefined,
    category: '',
    subcategory: '',
    images: [''],
    sizes: ['M'],
    colors: [{ name: 'Black', hex: '#000000' }],
    stock: 0,
    is_new: false,
    is_on_sale: false,
    is_active: true,
  });

  // State for size type and custom sizes
  const [sizeType, setSizeType] = useState<string>('custom');
  const [customSizes, setCustomSizes] = useState<string[]>(['']);
  
  // Store original URLs for display
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(['']);

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      // Detect size type based on product data
      const detectedSizeType = detectSizeType(product);
      
      setSizeType(detectedSizeType);
      
      // If custom sizes, populate customSizes
      if (detectedSizeType === 'custom') {
        setCustomSizes(product.sizes.length > 0 ? product.sizes : ['']);
      }
      
      // Set form data
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        original_price: product.original_price || undefined,
        category: product.category,
        subcategory: product.subcategory || '',
        images: product.images.length > 0 ? product.images : [''],
        sizes: product.sizes,
        colors: product.colors.length > 0 ? product.colors : [{ name: 'Black', hex: '#000000' }],
        stock: product.stock,
        is_new: product.is_new,
        is_on_sale: product.is_on_sale,
        is_active: product.is_active,
      });
      
      // Store original URLs
      setOriginalImageUrls(product.images.length > 0 ? product.images : ['']);
    } else {
      // Reset to defaults for new product
      setFormData({
        name: '',
        description: '',
        price: 0,
        original_price: undefined,
        category: '',
        subcategory: '',
        images: [''],
        sizes: ['M'],
        colors: [{ name: 'Black', hex: '#000000' }],
        stock: 0,
        is_new: false,
        is_on_sale: false,
        is_active: true,
      });
      setSizeType('custom');
      setCustomSizes(['']);
      setOriginalImageUrls(['']);
    }
  }, [product]);

  // Update sizes when size type changes
  useEffect(() => {
    if (sizeType === 'custom') {
      // For custom sizes, use the customSizes array
      setFormData(prev => ({
        ...prev,
        sizes: customSizes.filter(size => size.trim() !== ''),
      }));
    } else if (sizeType === 'one-size') {
      // For one-size, select the only option
      setFormData(prev => ({
        ...prev,
        sizes: ['One Size'],
      }));
    } else {
      // For predefined size types, get the default sizes
      const selectedSizeType = allSizeTypes.find(type => type.id === sizeType);
      if (selectedSizeType) {
        // Select the middle size as default, or first size if only one
        const defaultSize = selectedSizeType.sizes.length > 0 
          ? selectedSizeType.sizes[Math.min(2, selectedSizeType.sizes.length - 1)]
          : '';
        
        setFormData(prev => ({
          ...prev,
          sizes: defaultSize ? [defaultSize] : [],
        }));
      }
    }
  }, [sizeType, customSizes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate category is not empty
    if (!formData.category.trim()) {
      alert('Category is required!');
      return;
    }
    
    // Convert Google Drive URLs before submitting
    const processedImages = (formData.images || [])
      .filter(img => img.trim() !== '')
      .map(img => convertGoogleDriveUrl(img));
    
    const cleanedData = {
      ...formData,
      images: processedImages,
    };
    onSubmit(cleanedData);
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ''],
    }));
    setOriginalImageUrls(prev => [...prev, '']);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
    setOriginalImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map((img, i) => (i === index ? convertGoogleDriveUrl(value) : img)) || [],
    }));
    // Store original URL for display
    setOriginalImageUrls(prev => 
      prev.map((img, i) => (i === index ? value : img))
    );
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...(prev.colors || []), { name: '', hex: '#000000' }],
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateColor = (index: number, field: 'name' | 'hex', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors?.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      ) || [],
    }));
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes?.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...(prev.sizes || []), size],
    }));
  };

  // Handle custom size management
  const addCustomSize = () => {
    setCustomSizes(prev => [...prev, '']);
  };

  const removeCustomSize = (index: number) => {
    setCustomSizes(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomSize = (index: number, value: string) => {
    setCustomSizes(prev => prev.map((size, i) => (i === index ? value : size)));
    
    // Update form data if this size type is selected
    if (sizeType === 'custom') {
      setFormData(prev => ({
        ...prev,
        sizes: prev.sizes?.map((size, i) => (i === index ? value : size)) || [],
      }));
    }
  };

  // Function to preview image (shows Google Drive thumbnail if applicable)
  const getImagePreview = (index: number): string => {
    const originalUrl = originalImageUrls[index] || '';
    if (originalUrl && isGoogleDriveUrl(originalUrl)) {
      const fileId = extractDriveFileId(originalUrl);
      if (fileId) {
        // Show smaller thumbnail for preview
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }
    // Return converted URL from formData for regular URLs
    return formData.images?.[index] || '';
  };

  // Get available sizes based on selected type
  const getAvailableSizes = () => {
    if (sizeType === 'custom') {
      return customSizes.filter(size => size.trim() !== '');
    }
    
    const selectedType = allSizeTypes.find(type => type.id === sizeType);
    return selectedType ? selectedType.sizes : [];
  };

  // Get selected size type label
  const getSizeTypeLabel = () => {
    const type = allSizeTypes.find(t => t.id === sizeType);
    return type ? type.label : 'Custom';
  };

  // Get category for selected size type
  const getSizeTypeCategory = () => {
    for (const category of sizeCategories) {
      const type = category.types.find(t => t.id === sizeType);
      if (type) return category.category;
    }
    return 'Other';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Men's T-Shirts, Women's Sarees, Kids Wear"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Type your category name
                </p>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="e.g., Casual Wear, Formal, Party Wear"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-medium">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="original_price">Original Price (₹)</Label>
                <Input
                  id="original_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.original_price || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    original_price: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="For sale items"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Images</h3>
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                <Plus size={16} className="mr-1" /> Add Image
              </Button>
            </div>
            {formData.images?.map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={originalImageUrls[index] || ''}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="Paste image URL or Google Drive link"
                    className="flex-1"
                  />
                  {(formData.images?.length || 0) > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeImage(index)}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
                
                {/* Image Preview */}
                {originalImageUrls[index] && (
                  <div className="flex items-center gap-4 p-2 border rounded-lg bg-muted/30">
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded border">
                      {getImagePreview(index) ? (
                        <img
                          src={getImagePreview(index)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-1">
                        {isGoogleDriveUrl(originalImageUrls[index]) 
                          ? '✓ Google Drive URL detected' 
                          : 'Regular Image URL'}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {isGoogleDriveUrl(originalImageUrls[index]) 
                          ? `File ID: ${extractDriveFileId(originalImageUrls[index]) || 'Unknown'}`
                          : originalImageUrls[index]}
                      </p>
                    </div>
                    
                    {isGoogleDriveUrl(originalImageUrls[index]) && (
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Auto-converted
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">
                How to use Google Drive URLs:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Paste any Google Drive file link</li>
                <li>Supported formats: .jpg, .png, .webp, .gif</li>
                <li>System will automatically convert to direct image link</li>
                <li>Example: https://drive.google.com/file/d/YOUR_FILE_ID/view</li>
              </ul>
            </div>
          </div>

          {/* Size Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Size Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sizeCategories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{category.category}</p>
                  <div className="flex flex-col gap-1">
                    {category.types.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSizeType(type.id)}
                        className={`px-3 py-2 text-left border rounded-lg transition-colors text-sm ${
                          sizeType === type.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-sm">
                Selected: <span className="font-medium">{getSizeTypeCategory()} - {getSizeTypeLabel()}</span>
              </p>
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Available Sizes</h3>
            
            {/* Custom Sizes Input (only shown when custom type is selected) */}
            {sizeType === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom Sizes</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomSize}>
                    <Plus size={14} className="mr-1" /> Add Size
                  </Button>
                </div>
                {customSizes.map((size, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={size}
                      onChange={(e) => updateCustomSize(index, e.target.value)}
                      placeholder={`Size ${index + 1} (e.g., 28-32, Small, etc.)`}
                      className="flex-1"
                    />
                    {customSizes.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeCustomSize(index)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Enter custom sizes for your product (one per line)
                </p>
              </div>
            )}
            
            {/* Size Selection Grid (for non-custom types) */}
            {sizeType !== 'custom' && sizeType !== 'one-size' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {getAvailableSizes().map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        formData.sizes?.includes(size)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click sizes to select/deselect. Currently selected: {formData.sizes?.join(', ') || 'None'}
                </p>
              </>
            )}
            
            {/* One Size Info */}
            {sizeType === 'one-size' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✓ This product will be marked as "One Size Fits All"
                </p>
                <p className="text-xs text-green-700 mt-1">
                  No size selection needed for customers. Perfect for accessories, scarves, etc.
                </p>
              </div>
            )}
            
            {/* Size Info based on type */}
            {sizeType.includes('shirt') && sizeType !== 'women-tops' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <span className="font-medium">Note:</span> 
                  {sizeType === 'men-shirt' 
                    ? ' Shirt sizes are based on collar measurement in inches.'
                    : ' T-Shirt sizes follow standard sizing (XS, S, M, L, XL).'}
                </p>
              </div>
            )}
            
            {sizeType.includes('pants') || sizeType.includes('jeans') ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <span className="font-medium">Note:</span> 
                  {sizeType.includes('jeans') 
                    ? ' Jeans sizes show Waist x Length (e.g., 32x32 means 32" waist, 32" length).'
                    : ' Pants sizes show waist measurement in inches.'}
                </p>
              </div>
            ) : null}
            
            {sizeType.includes('kids') ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <span className="font-medium">Kids Sizing:</span> Age-based sizes (e.g., 2-3Y means fits children 2-3 years old).
                </p>
              </div>
            ) : null}
            
            {sizeType.includes('saree') || sizeType.includes('petticoat') || sizeType.includes('blouse') ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-800">
                  <span className="font-medium">Traditional Wear:</span> 
                  {sizeType === 'saree-blouse' 
                    ? ' Blouse sizes are chest measurements in inches.'
                    : sizeType === 'petticoat'
                    ? ' Petticoat sizes are waist measurements in inches.'
                    : ' One size fits most.'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Colors</h3>
              <Button type="button" variant="outline" size="sm" onClick={addColor}>
                <Plus size={16} className="mr-1" /> Add Color
              </Button>
            </div>
            {formData.colors?.map((color, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={color.name}
                  onChange={(e) => updateColor(index, 'name', e.target.value)}
                  placeholder="Color name"
                  className="flex-1"
                />
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => updateColor(index, 'hex', e.target.value)}
                  className="w-10 h-10 p-1 border rounded cursor-pointer"
                />
                {(formData.colors?.length || 0) > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeColor(index)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Flags */}
          <div className="space-y-4">
            <h3 className="font-medium">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active (visible on store)</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_new">Mark as New</Label>
                <Switch
                  id="is_new"
                  checked={formData.is_new}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_on_sale">On Sale</Label>
                <Switch
                  id="is_on_sale"
                  checked={formData.is_on_sale}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_on_sale: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-gold hover:bg-gold/90 text-primary">
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;