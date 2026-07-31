"use client"

import { useState, useEffect } from "react"
import { FaRegMoon } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { FiShoppingBag } from "react-icons/fi";
import { LuMenu } from "react-icons/lu";
import { motion } from "framer-motion"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10); // adjust threshold as needed
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuOptions = [
    { "id": 1, "label": "Beauty, Fragrances" },
    { "id": 2, "label": "Furniture" },
    { "id": 3, "label": "Groceries" },
    { "id": 4, "label": "Home Decoration" },
    { "id": 5, "label": "Mens Shoes" },
    { "id": 6, "label": "Home Watches" },
    { "id": 7, "label": "Home Accessories" }
  ];

  return (
    <div
      className={`sticky top-0 z-50 left-0 right-0 transition-colors duration-300 ${isScrolled ? "bg-white/80" : "bg-transparent"
        }`}
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="relative w-full max-w-9xl mx-auto px-4 lg:px-8">
        <div className="w-full flex items-center justify-between h-16 md:h-20 gap-4">
          <a href="#">Rave</a>

          {/* Desktop search */}
          <div className="hidden md:flex w-[45%] items-center justify-between gap-4 rounded-full border border-gray-300 pr-1 transition-all duration-200 focus-within:border-[#f6c76f] focus-within:shadow-[0_0_5px_rgba(251,146,60,0.35)]">
            <input
              type="text"
              placeholder="Search for products, brands..."
              className="w-full h-10 rounded-full bg-transparent pl-4 pr-12 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-[var(--theme)] p-2 rounded-full text-black">
              <IoSearch />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer"
            >
              <IoSearch size={20} />
            </button>

            <button className="hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              <FaRegMoon size={20} />
            </button>

            <button className="hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              <FiShoppingBag size={20} />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer"
            >
              {showMenu ? <IoMdClose /> : <LuMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:hidden mb-2 flex w-full items-center justify-between gap-4 rounded-full border border-gray-300 bg-[#F5F5F5] pr-1 focus-within:border-[#f6c76f] focus-within:shadow-[0_0_5px_rgba(251,146,60,0.35)]"
          >
            <input
              type="text"
              placeholder="Search for products, brands..."
              className="w-full h-10 rounded-full bg-transparent pl-4 pr-12 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-[var(--theme)] p-2 rounded-full text-black">
              <IoSearch />
            </button>
          </motion.div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="border border-[#dcdcdc] flex flex-col overflow-y-auto w-full max-h-[60vh] p-4"
        >
          {menuOptions.map((option) => (
            <Link
              href="#"
              key={option.id}
              className="h-10 flex items-center p-2 rounded-lg hover:bg-[#8d9eb51e] text-sm"
            >
              {option.label}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Navbar;