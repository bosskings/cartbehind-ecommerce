"use client"

import { useState } from "react"
import { FaRegMoon } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { FiShoppingBag } from "react-icons/fi";
import { LuMenu } from "react-icons/lu";
import { motion } from "framer-motion"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false)

  const getCategoryPath = (name) =>
    name === "All" ? "/" : `/category/${name.toLowerCase().replace(/\s+/g, "-")}`;

  const menuOptions = [
    { "id": 1, "label": "Beauty, Fragrances" },
    { "id": 2, "label": "Furniture" },
    { "id": 3, "label": "Groceries" },
    { "id": 4, "label": "Home Decoration" },
    { "id": 5, "label": "Mens Shoes" },
    { "id": 6, "label": "Home Watches" },
    { "id": 7, "label": "Home Accessories" }
  ]

  const categoryFilters = [
    { "id": 1, "name": "All" },
    { "id": 2, "name": "Beauty" },
    { "id": 3, "name": "Fragrances" },
    { "id": 4, "name": "Furniture" }
  ]



  return (
    <div
      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
      className="sticky top-0 z-50 left-0 right-0 bg-white/85" >

      <div className="relative w-full max-w-9xl mx-auto px-4 lg:px-8">

        <div className=" w-full flex items-center justify-between h-16 md:h-20 gap-4">

          <a href="#">Rave</a>

          <div
            className="
        hidden md:flex
        w-[45%]
        items-center
        justify-between
        gap-4
        rounded-full
        border border-gray-300
        bg-[#F5F5F5]
        pr-1cd rav
        transition-all duration-200
        focus-within:border-[#f6c76f]
        focus-within:shadow-[0_0_5px_rgba(251,146,60,0.35)]
        pr-1
  "
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
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              <IoSearch
                size={20}
              />
            </button>

            <button className="hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              <FaRegMoon
                size={20}
              />
            </button>

            <button className="hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              <FiShoppingBag
                size={20}
              />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden hover:bg-[#8d9eb51e] rounded-full p-2 cursor-pointer">
              {showMenu ? <IoMdClose /> :
                <LuMenu
                  size={20}
                />
              }
            </button>
          </div>

        </div>

        {/* Mobile Search */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="
        md:hidden 
        mb-2
        flex
        w-full
        items-center
        justify-between
        gap-4
        rounded-full
        border border-gray-300
        bg-[#F5F5F5]
        pr-1cd rav
        focus-within:border-[#f6c76f]
        focus-within:shadow-[0_0_5px_rgba(251,146,60,0.35)]
        pr-1
  "
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

        {/* Category filters */}
        <div className="w-full py-2 flex gap-2 overflow-x-auto">

          {categoryFilters.map((category) => (
            <Link
              key={category.id}
              href={getCategoryPath(category.name)}
              className={`${pathname === getCategoryPath(category.name)
                ? "bg-[var(--theme)]"
                : "hover:bg-gray-100"
                } font-medium rounded-full px-3.5 py-1.5 text-xs transition-colors`}
            >
              {category.name}
            </Link>
          ))}

        </div>

      </div>

      {/* Mobile Menu */}

      {
        showMenu && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className=" border border-[#dcdcdc] flex flex-col overflow-y-auto w-full max-h-[60vh] p-4">
            {menuOptions.map((option) => (

              <Link
                href="#"
                key={option.id}
                className="h-10 flex items-center p-2 rounded-lg hover:bg-[#8d9eb51e] text-sm">
                {option.label}
              </Link>
            ))}
          </motion.div>

        )
      }

    </div >

  )
}

export default Navbar

