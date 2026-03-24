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
import CartPage from "./components/CartPage";
import ProfilePage from "./components/ProfilePage";
import MyOrdersPage from "./components/MyOrdersPage";
import PaymentResultPage from "./components/PaymentResultPage";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerDashboard from "./components/manager/ManagerDashboard";
import ManagerCustomersPage from "./components/manager/ManagerCustomersPage";
import ManagerEmployeesPage from "./components/manager/ManagerEmployeesPage";
import ManagerShiftsPage from "./components/manager/ManagerShiftsPage";
import ManagerPromotionsPage from "./components/manager/ManagerPromotionsPage";
import ManagerDiscountsPage from "./components/manager/ManagerDiscountsPage";
import ManagerBeveragesPage from "./components/manager/ManagerBeveragesPage";
import ManagerIngredientsPage from "./components/manager/ManagerIngredientsPage";
import ManagerCategoriesPage from "./components/manager/ManagerCategoriesPage";
import StaffLayout from "./components/staff/StaffLayout";
import StaffShiftsPage from "./components/staff/StaffShiftsPage";
import StaffOrdersPage from "./components/staff/StaffOrdersPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminAccountsPage from "./components/admin/AdminAccountsPage";
import AdminRolesPage from "./components/admin/AdminRolesPage";

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
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "profile", Component: ProfilePage },
      { path: "my-orders", Component: MyOrdersPage },
      { path: "payment/result", Component: PaymentResultPage },
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
      { path: "beverages", Component: ManagerBeveragesPage },
      { path: "ingredients", Component: ManagerIngredientsPage },
      { path: "categories", Component: ManagerCategoriesPage },
      { path: "promotions", Component: ManagerPromotionsPage },
      { path: "discounts", Component: ManagerDiscountsPage },
    ],
  },
  {
    path: "/staff",
    Component: StaffLayout,
    children: [
      { index: true, Component: StaffOrdersPage },
      { path: "shifts", Component: StaffShiftsPage },
      { path: "orders", Component: StaffOrdersPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminAccountsPage },
      { path: "accounts", Component: AdminAccountsPage },
      { path: "roles", Component: AdminRolesPage },
    ],
  },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/forgot-password", Component: ForgotPasswordPage },
]);
