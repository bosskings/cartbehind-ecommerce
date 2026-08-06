"use client"

import { useState, useEffect } from "react"
import { FaRegMoon } from "react-icons/fa"
import { IoSearch } from "react-icons/io5"
import { FiShoppingBag } from "react-icons/fi"
import { LuMenu } from "react-icons/lu"
import { motion } from "framer-motion"
import { IoMdClose } from "react-icons/io"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCart } from "@/components/CartContext"

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { cartCount } = useCart()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isNavActive = isHomePage ? isScrolled : true

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true)
      return
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  const menuOptions = [
    { id: 1, label: "Beauty, Fragrances" },
    { id: 2, label: "Furniture" },
    { id: 3, label: "Groceries" },
    { id: 4, label: "Home Decoration" },
    { id: 5, label: "Mens Shoes" },
    { id: 6, label: "Home Watches" },
    { id: 7, label: "Home Accessories" },
  ]

  const searchInputClasses = isNavActive
    ? "border-gray-200 text-gray-700 placeholder:text-gray-400"
    : "border-white/40 text-white placeholder:text-white/70"

  const navTextClass = isNavActive ? "text-gray-900" : "text-white"
  const iconButtonClass = isNavActive
    ? "hover:bg-gray-100 text-gray-900"
    : "hover:bg-white/15 text-white"

  return (
    <div
      className={`fixed left-0 right-0 top shadow-lg-0 z-50 transition-all duration-300 ${isNavActive
        ? "bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        : "bg-transparent backdrop-blur-sm"
        }`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 w-full items-center justify-between gap-4 md:h-20">
          <a href="/" className={`text-lg font-black tracking-[0.35em] ${navTextClass}`}>
            RAVE
          </a>

          <div
            className={`hidden md:flex w-[45%] items-center justify-between gap-4 rounded-full border pr-1 transition-all duration-200 ${searchInputClasses} focus-within:border-(--theme) focus-within:shadow-[0_0_8px_rgba(40,14,137,0.35)]`}
          >
            <input
              type="text"
              placeholder="Search for products, brands..."
              className="h-10 w-full rounded-full bg-transparent pl-4 pr-12 text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="rounded-full bg-(--theme) p-2 text-[var(--theme-second)]">
              <IoSearch />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`rounded-full p-2 md:hidden ${iconButtonClass}`}
            >
              <IoSearch size={20} />
            </button>

            <button className={`rounded-full p-2 ${iconButtonClass}`}>
              <FaRegMoon size={20} />
            </button>

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
            className="mb-2 flex w-full items-center justify-between gap-4 rounded-full border border-gray-300 bg-[#F5F5F5] pr-1 md:hidden"
          >
            <input
              type="text"
              placeholder="Search for products, brands..."
              className="h-10 w-full rounded-full bg-transparent pl-4 pr-12 text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="rounded-full bg-(--theme) p-2 text-[var(--theme-second)]">
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
          className="mx-auto w-full max-w-7xl border-t border-black/5 bg-white/95 px-4 py-3 md:hidden"
        >
          {menuOptions.map((option) => (
            <Link
              href="#"
              key={option.id}
              className="flex h-10 items-center rounded-lg px-2 text-sm text-gray-700 hover:bg-gray-100"
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