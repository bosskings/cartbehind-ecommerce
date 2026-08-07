import React from "react";
import { FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { CiMail } from "react-icons/ci";
import Image from "next/image";




const footerColumns = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Press", "Blog"],
  },
  {
    title: "Help",
    links: ["Help Center", "Shipping Info", "Returns & Refunds", "Size Guide"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  },
];

const socialLinks = [
  { icon: FaInstagram, label: "Instagram", href: "#" },
  { icon: FaXTwitter, label: "Twitter", href: "#" },
  { icon: FaYoutube, label: "YouTube", href: "#" },
  { icon: CiMail, label: "Email", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-black/80 mt-20 rounded-t-4xl">
      {/* Newsletter */}
      <div className="border-b border-white/10 px-8 py-14 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Get exclusive deals
            </h3>
            <p className="mt-2 text-[15px] text-[#9B9BA5]">
              Subscribe for early access to sales and new arrivals.
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-gray-100 p-1.5 pl-5 focus-within:border-gray-500">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-transparent text-sm placeholder-[#6E6E78] focus:outline-none"
            />
            <button className="flex shrink-0 items-center gap-1.5 bg-[var(--theme)] rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--theme-second)] transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="px-8 py-14 md:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="mb-5 text-xs font-bold tracking-[0.15em] text-black">
                {col.title.toUpperCase()}
              </p>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[15px] text-[#B4B4BE] hover:text-white transition-colors "
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect column */}
          <div>
            <p className="mb-5 text-xs font-bold tracking-[0.15em] text-[#7A7A85]">
              CONNECT
            </p>
            <div className="mb-5 flex gap-2.5">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#B4B4BE] transition-colors hover:border-[#C77DFF]/50 hover:text-[#C77DFF]"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-[#7A7A85]">
              We accept all major credit cards, bank transfers, and mobile
              payments.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-8 py-7 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">

            <span className="text-base font-extrabold tracking-tight text-white">
              <Image
                src="/icon.svg"
                alt="Cart Behind Logo"
                width={100}
                height={40}
              />
            </span>
          </div>

          <p className="text-sm text-[#7A7A85]">
            © 2026 Rave. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}