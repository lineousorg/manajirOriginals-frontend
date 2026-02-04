"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { Order } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-primary', bg: 'bg-primary/10', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" />
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

      <div className="space-y-6">
        {orders.map((order, index) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;

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
                    <span className="font-mono text-sm">{order.id}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                  {order.trackingNumber && (
                    <p className="text-sm text-muted-foreground">
                      Tracking: {order.trackingNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Progress */}
              {order.status !== 'cancelled' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    {['pending', 'processing', 'shipped', 'delivered'].map((step, i) => {
                      const stepIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                      const isCompleted = i <= stepIndex;
                      const isCurrent = step === order.status;

                      return (
                        <div key={step} className="flex-1 flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                          >
                            {i + 1}
                          </div>
                          {i < 3 && (
                            <div
                              className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                                i < stepIndex ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pending</span>
                    <span>Processing</span>
                    <span>Shipped</span>
                    <span>Delivered</span>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              <div className="flex items-start gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <p className="text-label mb-1">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                </div>
                <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersPage;
