import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import Converter from "./pages/Converter";
import Documentation from "./pages/Documentation";
import DiagramsPage from "./diagrams/DiagramsPage";
import "./styles.css";
import "./i18n";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Home directo en "/"
      { index: true, element: <Home /> },

      // Alias: /home → /
      { path: "home", element: <Navigate to="/" replace /> },

      { path: "converter", element: <Converter /> },
      { path: "documentation", element: <Documentation /> },
      
      // Diagrams with hub and project routes
      { path: "diagrams", element: <DiagramsPage /> },
      { path: "diagrams/:id", element: <DiagramsPage /> },
      
      // Legacy route redirect
      { path: "diagramas", element: <Navigate to="/diagrams" replace /> },

      // Fallback: cualquier otra ruta → /
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

