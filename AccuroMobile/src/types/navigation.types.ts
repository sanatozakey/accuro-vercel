import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  ProductsTab: undefined;
  BookingTab: undefined;
  CartTab: undefined;
  ProfileTab: NavigatorScreenParams<UserStackParamList>;
};

// User Stack
export type UserStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  BookingHistory: undefined;
  BookingDetail: { bookingId: string };
  Quotations: undefined;
  QuotationDetail: { quotationId: string };
  PurchaseHistory: undefined;
  Reviews: undefined;
  Settings: undefined;
};

// Product Stack
export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
};

// Admin Drawer
export type AdminDrawerParamList = {
  AdminDashboard: undefined;
  BookingManagement: undefined;
  BookingEdit: { bookingId: string };
  ProductManagement: undefined;
  ProductEdit: { productId?: string };
  QuotationManagement: undefined;
  QuotationApproval: { quotationId: string };
  Analytics: undefined;
  Reports: undefined;
  UserManagement: undefined;
  RecommendationsMonitor: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Admin: NavigatorScreenParams<AdminDrawerParamList>;
  Home: undefined;
  About: undefined;
  Contact: undefined;
  Testimonials: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
