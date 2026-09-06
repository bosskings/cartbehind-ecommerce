export function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  )
}

export function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-(--theme) focus:shadow-[0_0_0_3px_rgba(var(--theme-rgb),0.12)] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100 ${extra}`
}
