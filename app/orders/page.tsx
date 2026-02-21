"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import useApi from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth.store";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import "animate.css";

// API Response type
interface ApiOrderResponse {
  id: number;
  userId: number;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
  };
}

// Order Item type for detailed order
interface OrderItem {
  id: number;
  variantId: number;
  quantity: number;
  price: string;
  variant: {
    id: number;
    sku: string;
    product: {
      id: number;
      name: string;
    };
  };
}

// Detailed Order type
interface ApiOrderDetailResponse {
  id: number;
  userId: number;
  status: string;
  paymentMethod: string;
  total: string;
  items: OrderItem[];
  user: {
    id: number;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Map API uppercase status to lowercase for display
const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: "pending",
    PAID: "paid",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    CANCELED: "cancelled",
  };
  return statusMap[status.toUpperCase()] || "pending";
};

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Pending",
  },
  paid: {
    icon: CreditCard,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Paid",
  },
  shipped: {
    icon: Truck,
    color: "text-gray-700",
    bg: "bg-primary/10",
    label: "Shipped",
  },
  delivered: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Delivered",
  },
  cancelled: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Cancelled",
  },
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<ApiOrderResponse[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] =
    useState<ApiOrderDetailResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { get, error: apiError } = useApi();
  const { user } = useAuthStore();

  // Fetch order details
  const fetchOrderDetails = async (orderId: number) => {
    setIsLoadingDetails(true);
    try {
      const response = await get<{ data: ApiOrderDetailResponse }>(
        `/orders/${orderId}`,
      );
      setOrderDetails(response.data);
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle view details click
  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDetails(null);
    setIsModalOpen(true);
    fetchOrderDetails(orderId);
  };

  useEffect(() => {
    const loadOrders = async () => {
      setIsOrdersLoading(true);
      try {
        const response = await get<{ data: ApiOrderResponse[] }>("/orders");
        const allOrders = response.data || [];

        // Filter orders for the logged-in user
        if (user?.id) {
          const userId = Number(user.id);
          const filteredOrders = allOrders.filter(
            (order) => order.userId === userId,
          );
          setOrders(filteredOrders);
        } else {
          setOrders(allOrders);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setIsOrdersLoading(false);
      }
    };
    loadOrders();
  }, [get, user]);

  const loading = isOrdersLoading;
  const error = apiError
    ? "Failed to load orders. Please try again later."
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fashion py-16">
        <EmptyState
          icon={<Package size={64} />}
          title="Something went wrong"
          description={error}
          action={
            <Link href="/products" className="btn-primary-fashion">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-fashion py-16">
        <EmptyState
          icon={<Package size={64} />}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={
            <Link href="/products" className="btn-primary-fashion">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-fashion py-8 md:py-12">
      <h1 className="heading-section mb-8">Order History</h1>

      <div className="space-y-6 min-h-screen">
        {orders.map((order, index) => {
          const orderStatus = mapStatus(order.status);
          const status = statusConfig[orderStatus as keyof typeof statusConfig];
          const StatusIcon = status?.icon || Clock;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/30 rounded-xl p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm">#{order.id}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status?.bg || "bg-gray-100"} ${status?.color || "text-gray-600"}`}
                    >
                      <StatusIcon size={12} />
                      {status?.label || order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{order.total}</p>
                  <p className="text-sm text-muted-foreground">
                    Payment: {order.paymentMethod.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Order Progress */}
              {orderStatus !== "cancelled" && (
                <div className="mb-6">
                  <div className="flex items-start">
                    {["pending", "paid", "shipped", "delivered"].map(
                      (step, i, arr) => {
                        const steps = [
                          "pending",
                          "paid",
                          "shipped",
                          "delivered",
                        ];
                        const stepIndex = steps.indexOf(orderStatus);

                        const isCompleted = i <= stepIndex;
                        const isCurrent = step === orderStatus;
                        const isLast = i === arr.length - 1;

                        return (
                          <div
                            key={step}
                            className="flex-1 relative flex flex-col items-center text-center"
                          >
                            {/* Line */}
                            {!isLast && (
                              <div
                                className={`absolute top-4 left-1/2 w-full h-1 -z-10 ${
                                  i < stepIndex ? "bg-primary" : "bg-muted"
                                }`}
                              />
                            )}

                            {/* Circle */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                isCompleted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                            >
                              {i + 1}
                            </div>

                            {/* Label */}
                            <span className="mt-2 text-xs text-muted-foreground capitalize">
                              {step}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-label mb-1">Order ID</p>
                  <p className="text-sm text-muted-foreground">#{order.id}</p>
                </div>
                <button
                  onClick={() => handleViewDetails(order.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate__animated animate__fadeIn ">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-medium">#{orderDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusConfig[
                        mapStatus(
                          orderDetails.status,
                        ) as keyof typeof statusConfig
                      ]?.bg || "bg-gray-100"
                    } ${
                      statusConfig[
                        mapStatus(
                          orderDetails.status,
                        ) as keyof typeof statusConfig
                      ]?.color || "text-gray-600"
                    }`}
                  >
                    {statusConfig[
                      mapStatus(
                        orderDetails.status,
                      ) as keyof typeof statusConfig
                    ]?.icon &&
                      React.createElement(
                        statusConfig[
                          mapStatus(
                            orderDetails.status,
                          ) as keyof typeof statusConfig
                        ].icon,
                        { size: 12 },
                      )}
                    {statusConfig[
                      mapStatus(
                        orderDetails.status,
                      ) as keyof typeof statusConfig
                    ]?.label || orderDetails.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">৳{orderDetails.total}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items
                </h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {item.variant.product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.variant.sku} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        ৳{Number(item.price) * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Payment Method
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {orderDetails.paymentMethod.replace("_", " ")}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Order Date
                  </p>
                  <p className="font-medium">
                    {new Date(orderDetails.createdAt).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Failed to load order details
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
