import React from "react";
import { Outlet } from "react-router";
import { DemoDataProvider } from "../contexts/DemoDataContext";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <DemoDataProvider>
      <NotificationProvider>
        <ToastProvider>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </ToastProvider>
      </NotificationProvider>
    </DemoDataProvider>
  );
}
