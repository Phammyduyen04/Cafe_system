import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import CoffeaNavbar from "./CoffeaNavbar";
import CoffeaFooter from "./CoffeaFooter";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-[#f1f0ee] min-h-screen overflow-x-hidden flex flex-col">
      <CoffeaNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <CoffeaFooter />
    </div>
  );
}