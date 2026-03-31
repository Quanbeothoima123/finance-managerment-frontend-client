import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
