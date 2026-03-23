import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import MenuPage from "./components/MenuPage";
import HomeContent from "./components/HomeContent";
import ProductDetailPage from "./components/ProductDetailPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import CheckoutPage from "./components/CheckoutPage";
import CustomerProfilePage from "./components/customer/CustomerProfilePage";
import CustomerPointsPage from "./components/customer/CustomerPointsPage";
import StaffSchedulePage from "./components/staff/StaffSchedulePage";
import StaffAvailabilityPage from "./components/staff/StaffAvailabilityPage";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerDashboard from "./components/manager/ManagerDashboard";
import ManagerCustomersPage from "./components/manager/ManagerCustomersPage";
import ManagerEmployeesPage from "./components/manager/ManagerEmployeesPage";
import ManagerShiftsPage from "./components/manager/ManagerShiftsPage";
import ManagerPromotionsPage from "./components/manager/ManagerPromotionsPage";
import ManagerDiscountsPage from "./components/manager/ManagerDiscountsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomeContent },
      { path: "menu", Component: MenuPage },
      { path: "product/:slug", Component: ProductDetailPage },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "profile", Component: CustomerProfilePage },
      { path: "profile/points", Component: CustomerPointsPage },
      { path: "staff/schedule", Component: StaffSchedulePage },
      { path: "staff/availability", Component: StaffAvailabilityPage },
    ],
  },
  {
    path: "/manager",
    Component: ManagerLayout,
    children: [
      { index: true, Component: ManagerDashboard },
      { path: "customers", Component: ManagerCustomersPage },
      { path: "employees", Component: ManagerEmployeesPage },
      { path: "shifts", Component: ManagerShiftsPage },
      { path: "promotions", Component: ManagerPromotionsPage },
      { path: "discounts", Component: ManagerDiscountsPage },
    ],
  },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/forgot-password", Component: ForgotPasswordPage },
]);
