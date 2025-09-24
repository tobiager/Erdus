import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RootLayout() {
  const location = useLocation();
  
  // Skip layout for diagram page (it has its own full-bleed layout)
  if (location.pathname === '/diagramas') {
    return <Outlet />;
  }

  return (
    <div
      className="
        min-h-dvh flex flex-col transition-colors
        bg-gradient-to-b from-slate-50 to-slate-100
        dark:from-black dark:to-[#0a0a0a]
        text-slate-900 dark:text-slate-100
        overflow-x-hidden
      "
    >
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl w-full mx-auto px-4 py-10">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
