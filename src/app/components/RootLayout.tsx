import React from "react";
import { Outlet } from "react-router";
import { AppDataProvider } from "../contexts/AppDataContext";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <AppDataProvider>
      <NotificationProvider>
        <ToastProvider>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </ToastProvider>
      </NotificationProvider>
    </AppDataProvider>
  );
}
