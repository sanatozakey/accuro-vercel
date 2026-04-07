import { useQuery } from '@tanstack/react-query';
import bookingService from '../services/bookingService';
import activityLogService from '../services/activityLogService';
import productService from '../services/productService';

interface Booking {
  _id: string;
  date: string;
  time: string;
  company: string;
  contactName: string;
  status: string;
  isCompleted?: boolean;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stockQuantity: number;
  stockStatus: string;
}

async function fetchDashboardData() {
  const [bookingsRes, activityRes, lowStockRes] = await Promise.all([
    bookingService.getAll(),
    activityLogService.getAll({ limit: 10 }),
    productService.getLowStockProducts().catch(() => ({ data: [] })),
  ]);

  const allBookings = bookingsRes.data || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayBookings = allBookings.filter((b: Booking) => {
    const bookingDate = new Date(b.date);
    return bookingDate >= today && bookingDate <= todayEnd;
  });

  const pendingBookings = allBookings.filter((b: Booking) => b.status === 'pending');
  const confirmedBookings = allBookings.filter((b: Booking) =>
    b.status === 'confirmed' && new Date(b.date) >= today
  );

  const thisMonthBookings = allBookings.filter((b: Booking) => {
    const bookingDate = new Date(b.date);
    return bookingDate >= monthStart;
  });

  const completedThisMonth = thisMonthBookings.filter((b: Booking) =>
    b.status === 'completed'
  ).length;

  return {
    todayBookings,
    pendingBookings,
    confirmedBookings,
    lowStockProducts: (lowStockRes.data || []) as LowStockProduct[],
    recentActivity: activityRes.data || [],
    totalBookingsThisMonth: thisMonthBookings.length,
    completedThisMonth,
  };
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}
