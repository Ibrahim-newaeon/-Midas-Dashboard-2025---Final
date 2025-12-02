import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BrowserQRCodeReader, BrowserBarcodeReader } from "@zxing/library";
import Tesseract, { createWorker, Worker } from "tesseract.js";

// Helper for timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("Timeout")), ms);
    promise
      .then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
};

const createInvoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email format").optional().or(z.literal("")),
  customerPhone: z.string().min(1, "Phone number is required"),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    productName: string;
    size: string;
    price: string;
    quantity: number;
  };
}

export default function CreateInvoice() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showTextScanner, setShowTextScanner] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const ocrWorkerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const form = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["/api/products", { limit: 100 }],
    enabled: showProductDialog,
  });

  // Pre-load OCR worker for instant text recognition
  const initOCRWorker = useCallback(async () => {
    if (ocrWorkerRef.current) return;
    try {
      const worker = await createWorker('eng');
      ocrWorkerRef.current = worker;
      setOcrReady(true);
      console.log("OCR worker ready for instant text scanning");
    } catch (error) {
      console.error("Failed to initialize OCR worker:", error);
    }
  }, []);

  // Cleanup camera and OCR worker on unmount
  useEffect(() => {
    return () => {
      stopQRScanner();
      stopTextScanner();
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate();
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  const stopQRScanner = () => {
    if (qrReaderRef.current) {
      qrReaderRef.current.reset();
      qrReaderRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const stopTextScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (textVideoRef.current && textVideoRef.current.srcObject) {
      const stream = textVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      textVideoRef.current.srcObject = null;
    }
  };

  // Fast QR Code Scanner
  const startQRScanner = async () => {
    try {
      setShowQRScanner(true);
      setIsScanning(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) throw new Error("Video element not ready");

      const qrCodeReader = new BrowserQRCodeReader();
      qrReaderRef.current = qrCodeReader;

      await qrCodeReader.decodeFromVideoDevice(
        null,
        videoRef.current,
        async (result, error) => {
          if (result) {
            stopQRScanner();
            setShowQRScanner(false);

            let productId = result.getText().trim();

            // Extract product ID from URL if present
            if (productId.includes('/products/')) {
              productId = productId.split('/products/')[1];
            }
            productId = productId.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();

            try {
              const response = await fetch(`/api/products/by-product-id/${productId}`, {
                credentials: 'include'
              });

              if (response.ok) {
                const product = await response.json();
                addProductToInvoice(product);
                toast({
                  title: "Success",
                  description: `Product "${product.productName}" added via QR code`,
                });
              } else {
                toast({
                  title: "Product Not Found",
                  description: `No product found with ID: ${productId}`,
                  variant: "destructive",
                });
              }
            } catch (err) {
              console.error("Error looking up product:", err);
              toast({
                title: "Error",
                description: "Failed to look up product",
                variant: "destructive",
              });
            } finally {
              setIsScanning(false);
            }
          }

          if (error && error.name !== 'NotFoundException') {
            console.error("QR scan error:", error);
          }
        }
      );
    } catch (error: any) {
      console.error("Failed to start QR scanner:", error);
      stopQRScanner();
      setShowQRScanner(false);
      setIsScanning(false);

      toast({
        title: "Camera Error",
        description: error.message?.includes('Permission')
          ? "Camera permission denied. Please allow camera access to scan QR codes."
          : "Failed to access camera. Please try uploading an image instead.",
        variant: "destructive",
      });
    }
  };

  const cancelQRScanner = () => {
    stopQRScanner();
    setShowQRScanner(false);
    setIsScanning(false);
  };

  // Fast Text Scanner using Camera + OCR
  const startTextScanner = async () => {
    try {
      setShowTextScanner(true);
      setIsScanning(true);

      if (!ocrWorkerRef.current) {
        toast({
          title: "Initializing...",
          description: "Preparing text recognition (first time only)",
        });
        await initOCRWorker();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!textVideoRef.current) throw new Error("Video element not ready");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      textVideoRef.current.srcObject = stream;
      await textVideoRef.current.play();

      toast({
        title: "Camera Ready",
        description: "Point at product label and tap 'Capture Text'",
      });
    } catch (error: any) {
      console.error("Failed to start text scanner:", error);
      stopTextScanner();
      setShowTextScanner(false);
      setIsScanning(false);

      toast({
        title: "Camera Error",
        description: error.message?.includes('Permission')
          ? "Camera permission denied. Please allow camera access."
          : "Failed to access camera. Please try uploading an image instead.",
        variant: "destructive",
      });
    }
  };

  const captureAndReadText = async () => {
    if (!textVideoRef.current || !canvasRef.current || !ocrWorkerRef.current) {
      toast({
        title: "Error",
        description: "Scanner not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScanning(true);
      toast({
        title: "Reading text...",
        description: "Scanning product label",
      });

      const video = textVideoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Canvas context not available");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Run OCR on the canvas
      const { data: { text } } = await ocrWorkerRef.current.recognize(canvas);
      const cleanedText = text.trim();

      if (cleanedText.length > 2) {
        stopTextScanner();
        setShowTextScanner(false);

        // Look up product by name
        const response = await fetch(`/api/products/by-name/${encodeURIComponent(cleanedText)}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const product = await response.json();
          addProductToInvoice(product);
          toast({
            title: "Success",
            description: `Product "${product.productName}" added via text scan`,
          });
        } else {
          toast({
            title: "Product Not Found",
            description: `No product found matching: ${cleanedText}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Text Found",
          description: "Could not find text in the image. Try moving closer to the label.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "Read Error",
        description: "Failed to read text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const cancelTextScanner = () => {
    stopTextScanner();
    setShowTextScanner(false);
    setIsScanning(false);
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: { invoice: any; items: any[] }) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      navigate("/invoices");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const addProductToInvoice = (product: any) => {
    if (selectedProducts.has(product.id)) {
      toast({
        title: "Info",
        description: "Product already added to invoice",
        variant: "destructive",
      });
      return;
    }

    if (product.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.productName} is out of stock and cannot be added to the invoice.`,
        variant: "destructive",
      });
      return;
    }

    const unitPrice = parseFloat(product.price);
    const newItem: InvoiceItem = {
      productId: product.id,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
      product: {
        id: product.id,
        productName: product.productName,
        size: product.size,
        price: product.price,
        quantity: product.quantity,
      },
    };

    setInvoiceItems(prev => [...prev, newItem]);
    setSelectedProducts(prev => new Set(Array.from(prev).concat([product.id])));
    setShowProductDialog(false);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;

    const item = invoiceItems[index];
    const availableStock = item.product.quantity;

    if (quantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} units of ${item.product.productName} are available in stock. Cannot add ${quantity} units.`,
        variant: "destructive",
      });
      return;
    }

    setInvoiceItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity,
        };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    const item = invoiceItems[index];
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.productId);
      return newSet;
    });
  };

  // Fast Upload Scanner - Try barcode/QR first, then server OCR
  const handleBarcodeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.src = e.target?.result as string;
        img.onload = async () => {
          try {
            let decodedText: string | null = null;
            let scanMethod = "";

            // Step 1: Try QR code first (fast)
            try {
              const qrCodeReader = new BrowserQRCodeReader();
              // Add timeout to prevent hanging on complex images
              const result = await withTimeout(
                qrCodeReader.decodeFromImageElement(img),
                2000 // 2 second timeout
              );
              decodedText = result.getText();
              scanMethod = "QR code";
            } catch (qrError) {
              // Step 2: Try barcode (fast)
              try {
                const barcodeReader = new BrowserBarcodeReader();
                // Add timeout for barcode as well
                const result = await withTimeout(
                  barcodeReader.decodeFromImageElement(img),
                  2000 // 2 second timeout
                );
                decodedText = result.getText();
                scanMethod = "barcode";
              } catch (barcodeError) {
                // Step 3: Use server-side OCR (fast - process on server)
                toast({
                  title: "Reading product name...",
                  description: "Sending to server for text recognition",
                });

                const formData = new FormData();
                formData.append('image', file);

                try {
                  const response = await fetch('/api/products/recognize-from-image', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                  });

                  if (response.ok) {
                    const result = await response.json();
                    const product = result.product;
                    addProductToInvoice(product);
                    toast({
                      title: "Success",
                      description: `Product "${product.productName}" added via text recognition`,
                    });
                    setIsScanning(false);
                    if (barcodeInputRef.current) {
                      barcodeInputRef.current.value = '';
                    }
                    return;
                  } else {
                    const errorResult = await response.json();
                    toast({
                      title: "Product Not Found",
                      description: `Recognized: "${errorResult.recognizedText}" - No matching product`,
                      variant: "destructive",
                    });
                    setIsScanning(false);
                    if (barcodeInputRef.current) {
                      barcodeInputRef.current.value = '';
                    }
                    return;
                  }
                } catch (ocrError) {
                  console.error("Server OCR error:", ocrError);
                  toast({
                    title: "OCR Error",
                    description: "Failed to process image. Please try again.",
                    variant: "destructive",
                  });
                  setIsScanning(false);
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.value = '';
                  }
                  return;
                }
              }
            }

            if (decodedText) {
              let lookupText = decodedText.trim();

              // Extract product ID from URL if present
              if (lookupText.includes('/products/')) {
                lookupText = lookupText.split('/products/')[1];
              }
              lookupText = lookupText.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();

              // Look up product by product ID (from QR/barcode)
              const endpoint = `/api/products/by-product-id/${encodeURIComponent(lookupText)}`;

              const response = await fetch(endpoint, { credentials: 'include' });

              if (response.ok) {
                const product = await response.json();
                addProductToInvoice(product);
                toast({
                  title: "Success",
                  description: `Product "${product.productName}" added via ${scanMethod}`,
                });
              } else {
                toast({
                  title: "Product Not Found",
                  description: `No product found with ID: ${lookupText}`,
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error("Scanning error:", error);
            toast({
              title: "Error",
              description: "An error occurred while processing the image.",
              variant: "destructive",
            });
          } finally {
            setIsScanning(false);
            if (barcodeInputRef.current) {
              barcodeInputRef.current.value = '';
            }
          }
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      toast({
        title: "Error",
        description: "Failed to read the image file",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal;

    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const onSubmit = async (data: CreateInvoiceForm) => {
    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the invoice",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      ...data,
      subtotal: subtotal.toFixed(2),
      discountPercentage: "0.0000",
      discountAmount: "0.00",
      taxRate: "0.0000",
      taxAmount: "0.00",
      total: total.toFixed(2),
    };

    const itemsData = invoiceItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: item.totalPrice.toFixed(2),
    }));

    createInvoiceMutation.mutate({
      invoice: invoiceData,
      items: itemsData,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Create New Invoice</h3>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Information */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-4">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter customer name"
                            {...field}
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@email.com"
                            {...field}
                            data-testid="input-customer-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            data-testid="input-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Customer address"
                            {...field}
                            data-testid="input-customer-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-foreground">Invoice Items</h4>
                  <div className="flex gap-2">
                    <input
                      ref={barcodeInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBarcodeUpload}
                      className="hidden"
                      data-testid="input-barcode-file"
                    />
                    <Button
                      type="button"
                      variant="default"
                      onClick={startTextScanner}
                      disabled={isScanning}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-read-text"
                    >
                      {isScanning && showTextScanner ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Reading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-font mr-2"></i>
                          Read Text (Fast)
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startQRScanner}
                      disabled={isScanning}
                      data-testid="button-scan-qr"
                    >
                      {isScanning && showQRScanner ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-qrcode mr-2"></i>
                          Scan QR
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => barcodeInputRef.current?.click()}
                      disabled={isScanning}
                      data-testid="button-upload-barcode"
                    >
                      {isScanning && !showQRScanner && !showTextScanner ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload mr-2"></i>
                          Upload
                        </>
                      )}
                    </Button>
                    <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                      <DialogTrigger asChild>
                        <Button type="button" data-testid="button-add-product">
                          <i className="fas fa-plus mr-2"></i>
                          Add Product
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Select Products</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        {(productsData as any)?.products?.length ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(productsData as any).products.map((product: any) => (
                              <Card
                                key={product.id}
                                className={`cursor-pointer transition-colors ${
                                  selectedProducts.has(product.id) ? 'bg-muted' : 'hover:bg-muted'
                                }`}
                                onClick={() => addProductToInvoice(product)}
                                data-testid={`product-option-${product.id}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex space-x-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                        {product.imageUrl ? (
                                          <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-16 h-16 rounded-md object-cover"
                                          />
                                        ) : (
                                          <i className="fas fa-image text-muted-foreground text-lg"></i>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-foreground truncate" data-testid={`product-name-${product.id}`}>
                                            {product.productName}
                                          </h5>
                                          <p className="text-sm text-muted-foreground mb-2" data-testid={`product-id-${product.id}`}>
                                            ID: {product.productId}
                                          </p>
                                        </div>
                                        {selectedProducts.has(product.id) && (
                                          <i className="fas fa-check text-accent ml-2 flex-shrink-0"></i>
                                        )}
                                      </div>

                                      {/* Product attributes */}
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                          <Badge variant="outline" className="text-xs" data-testid={`product-size-${product.id}`}>
                                            Size: {Array.isArray(product.size) ? product.size.join(', ') : product.size}
                                          </Badge>
                                          {product.color && (
                                            <Badge variant="outline" className="text-xs" data-testid={`product-color-${product.id}`}>
                                              {Array.isArray(product.color) ? product.color.join(', ') : product.color}
                                            </Badge>
                                          )}
                                          {product.manufacturer && (
                                            <Badge variant="secondary" className="text-xs" data-testid={`product-manufacturer-${product.id}`}>
                                              {product.manufacturer}
                                            </Badge>
                                          )}
                                        </div>

                                        {product.category && (
                                          <div className="flex items-center gap-1">
                                            <i className="fas fa-tag text-muted-foreground text-xs"></i>
                                            <span className="text-xs text-muted-foreground" data-testid={`product-category-${product.id}`}>
                                              {product.category}
                                            </span>
                                          </div>
                                        )}

                                        {product.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2"
                                             title={product.description}
                                             data-testid={`product-description-${product.id}`}>
                                            {product.description.length > 80
                                              ? product.description.substring(0, 80) + '...'
                                              : product.description}
                                          </p>
                                        )}

                                        <div className="flex items-center justify-between pt-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground" data-testid={`product-price-${product.id}`}>
                                              {formatCurrency(product.price)}
                                            </span>
                                            <Badge
                                              variant={product.quantity > 10 ? "secondary" : product.quantity > 0 ? "outline" : "destructive"}
                                              className="text-xs"
                                              data-testid={`product-stock-${product.id}`}
                                            >
                                              {product.quantity} in stock
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <i className="fas fa-box text-muted-foreground text-3xl mb-4"></i>
                            <p className="text-sm text-muted-foreground">No products available</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Invoice Items Table */}
                <div className="bg-background border border-input rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoiceItems.length > 0 ? (
                        invoiceItems.map((item, index) => (
                          <tr key={index} data-testid={`invoice-item-${index}`}>
                            <td className="px-4 py-3 text-sm text-foreground">{item.product.productName}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{Array.isArray(item.product.size) ? item.product.size.join(', ') : item.product.size}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={item.quantity}
                                min="1"
                                className="w-16"
                                onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                data-testid={`input-quantity-${index}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(item.totalPrice)}</td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                data-testid={`button-remove-${index}`}
                              >
                                <span className="text-xl font-light">×</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No items added. Click "Add Product" to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Invoice Totals */}
                {invoiceItems.length > 0 && (
                  <div className="bg-muted rounded-lg p-4 mt-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="text-foreground font-medium" data-testid="text-subtotal">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2">
                          <div className="flex justify-between text-base font-semibold">
                            <span className="text-foreground">Total:</span>
                            <span className="text-foreground" data-testid="text-total">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Add any additional notes..."
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/invoices")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  data-testid="button-create-invoice"
                >
                  <i className="fas fa-save mr-2"></i>
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={(open) => {
        if (!open) {
          cancelQRScanner();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                data-testid="video-qr-scanner"
              />
              <div className="absolute inset-0 border-4 border-accent pointer-events-none" style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 20%, 80% 20%, 80% 80%, 100% 80%, 100% 100%, 0 100%, 0 80%, 20% 80%, 20% 20%, 0 20%)'
              }}></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Position the QR code within the frame to scan
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={cancelQRScanner}
              className="w-full"
              data-testid="button-cancel-qr-scan"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Text Scanner Dialog - Fast OCR */}
      <Dialog open={showTextScanner} onOpenChange={(open) => {
        if (!open) {
          cancelTextScanner();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Read Product Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={textVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                data-testid="video-text-scanner"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-4 border-2 border-green-400 border-dashed pointer-events-none rounded-lg"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Point at the product ID text on the label, then tap "Capture"
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={captureAndReadText}
                disabled={isScanning}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="button-capture-text"
              >
                {isScanning ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Reading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-camera mr-2"></i>
                    Capture Text
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelTextScanner}
                data-testid="button-cancel-text-scan"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
