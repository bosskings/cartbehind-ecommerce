import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { OrderProvider } from "@/components/OrderContext";
import { AuthProvider } from "@/components/AuthContext";
import AuthRouteGuard from "@/components/AuthRouteGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CartBehind",
  description: "CartBEhind Ecommerce Store",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <AuthRouteGuard>
              <CartProvider>
                <OrderProvider>{children}</OrderProvider>
              </CartProvider>
            </AuthRouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
