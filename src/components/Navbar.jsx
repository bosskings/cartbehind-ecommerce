"use client"

import { useEffect, useState } from "react"
import { FaRegMoon, FaRegSun } from "react-icons/fa"
import { IoSearch } from "react-icons/io5"
import { FiShoppingBag } from "react-icons/fi"
import { LuLogIn, LuLogOut, LuMenu, LuPackage } from "react-icons/lu"
import { motion } from "framer-motion"
import { IoMdClose } from "react-icons/io"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useAuth } from "@/components/AuthContext"
import { useCart } from "@/components/CartContext"
import { useTheme } from "@/components/ThemeContext"

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { cartCount } = useCart()
  const { logoutUser, isUserAuthenticated } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"
  const isNavActive = !isHomePage || isScrolled
  const isDark = mounted && theme === "dark"

  useEffect(() => {
    if (!isHomePage) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    window.setTimeout(handleScroll, 0)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  const menuOptions = [
    { id: 1, label: "Beauty, Fragrances" },
    { id: 2, label: "Furniture" },
    { id: 3, label: "Groceries" },
    { id: 4, label: "Home Decorations" },
    { id: 5, label: "Mens Shoes" },
    { id: 6, label: "Home Watches" },
    { id: 7, label: "Home Accessories" },
  ]

  const searchInputClasses = isNavActive
    ? "border-gray-200 text-gray-700 placeholder:text-gray-400 dark:border-white/15 dark:text-gray-200 dark:placeholder:text-gray-500"
    : "border-white/40 text-white placeholder:text-white/70"
  const searchTextClasses = isNavActive
    ? "text-gray-700 placeholder:text-gray-400 dark:text-gray-200 dark:placeholder:text-gray-500"
    : "text-white placeholder:text-white/70"
  const inputBaseClass = "h-10 w-full rounded-full bg-transparent pl-4 pr-12 text-sm outline-none"
  const navTextClass = isNavActive ? "text-gray-900 dark:text-white" : "text-white"
  const iconButtonClass = isNavActive
    ? "hover:bg-gray-100 text-gray-900 dark:hover:bg-white/10 dark:text-white"
    : "hover:bg-white/15 text-white"

  const handleLogout = () => {
    logoutUser()
    toast.success("Logged out successfully.")
    setShowMenu(false)
    router.replace("/")
  }

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isNavActive
        ? "bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-[#0c0a14]/90 dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
        : "bg-transparent"
        }`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 w-full items-center justify-between gap-4 md:h-20">
          <Link href="/" className={`text-lg font-black tracking-[0.35em] ${navTextClass}`}>
            <Image
              src="/cart1.png"
              alt="CartBehind Logo"
              width={120}
              height={40}
            />
          </Link>

          <div
            className={`hidden md:flex w-[45%] items-center justify-between gap-4 rounded-full border pr-1 transition-all duration-200 ${searchInputClasses} focus-within:border-(--theme) focus-within:shadow-[0_0_8px_rgba(var(--theme-rgb),0.35)]`}
          >
            <input
              type="text"
              placeholder="Search for products, brands..."
              className={`${inputBaseClass} ${searchTextClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="cursor-pointer rounded-full bg-(--theme) p-2 text-(--theme-second) transition-all duration-300 hover:scale-110 hover:bg-[#280E89]">
              <IoSearch />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`rounded-full cursor-pointer p-2 md:hidden ${iconButtonClass}`}
              aria-label="Search"
            >
              <IoSearch size={20} />
            </button>

            <Link
              href="/track"
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${iconButtonClass}`}
              aria-label="Track parcel"
            >
              <LuPackage size={18} />
              <span className="hidden lg:inline">Track parcel</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full cursor-pointer p-2 ${iconButtonClass}`}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <FaRegSun size={20} /> : <FaRegMoon size={20} />}
            </button>

            {isUserAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className={`rounded-full cursor-pointer p-2 ${iconButtonClass}`}
                aria-label="Logout"
                title="Logout"
              >
                <LuLogOut size={20} />
              </button>
            ) : (
              <Link
                href="/login"
                className={`rounded-full p-2 ${iconButtonClass}`}
                aria-label="Login"
                title="Login"
              >
                <LuLogIn size={20} />
              </Link>
            )}

            <Link
              href="/cart"
              className={`relative rounded-full p-2 ${iconButtonClass}`}
              aria-label="Shopping cart"
            >
              <FiShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--theme-second) px-1 text-[10px] font-black text-(--theme)">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`rounded-full p-2 md:hidden ${iconButtonClass}`}
              aria-label={showMenu ? "Close menu" : "Open menu"}
            >
              {showMenu ? <IoMdClose size={20} /> : <LuMenu size={20} />}
            </button>
          </div>
        </div>

        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-2 flex w-full items-center justify-between gap-4 rounded-full border border-gray-300 bg-[#F5F5F5] pr-1 md:hidden dark:border-white/15 dark:bg-[#16131f]"
          >
            <input
              type="text"
              placeholder="Search for products, brands..."
              className={`${inputBaseClass} ${searchTextClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="rounded-full cursor-pointer bg-(--theme) p-2 text-(--theme-second) transition-all duration-300 hover:scale-110 hover:bg-[#280E89]">
              <IoSearch />
            </button>
          </motion.div>
        )}
      </div>

      {showMenu && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-7xl border-t border-black/5 bg-white/95 px-4 py-3 md:hidden dark:border-white/10 dark:bg-[#0c0a14]/95"
        >
          <Link
            href="/track"
            onClick={() => setShowMenu(false)}
            className="mb-1 flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-(--theme) hover:bg-(--theme)/10"
          >
            <LuPackage size={16} />
            Track parcel
          </Link>
          {isUserAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="mb-1 flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <LuLogOut size={16} />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setShowMenu(false)}
              className="mb-1 flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <LuLogIn size={16} />
              Login
            </Link>
          )}
          {menuOptions.map((option) => (
            <Link
              href="#"
              key={option.id}
              className="flex h-10 items-center rounded-lg px-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              {option.label}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default Navbar


