"use client"

import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Check,
  CheckCircle2,
  Copy,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react"
import { blockAdminUser } from "@/lib/adminUsers"
import { getAdminToken } from "@/lib/cloudinary"
import { getApiErrorMessage, isAdminAuthError } from "@/lib/orders"

export default function UsersSection({
  users = [],
  loading = false,
  error = "",
  onRefresh,
  onUserBlocked,
  onAuthExpired,
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all | active | blocked | verified | unverified
  const [copiedId, setCopiedId] = useState(null)
  const [userToBlock, setUserToBlock] = useState(null)
  const [blockingId, setBlockingId] = useState(null)

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.active).length
    const blocked = users.filter((u) => !u.active).length
    const verified = users.filter((u) => u.isVerified).length

    return { total, active, blocked, verified }
  }, [users])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.email?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query)

      if (!matchesSearch) return false

      if (statusFilter === "active") return user.active
      if (statusFilter === "blocked") return !user.active
      if (statusFilter === "verified") return user.isVerified
      if (statusFilter === "unverified") return !user.isVerified

      return true
    })
  }, [users, searchQuery, statusFilter])

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success("User ID copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleConfirmBlock = async () => {
    if (!userToBlock) return

    const token = getAdminToken()
    if (!token) {
      onAuthExpired?.()
      return
    }

    setBlockingId(userToBlock.id)
    try {
      const response = await blockAdminUser(token, userToBlock.id)
      toast.success(response?.message || `User ${userToBlock.email} has been blocked.`)
      onUserBlocked?.(userToBlock.id)
      setUserToBlock(null)
    } catch (err) {
      if (isAdminAuthError(err)) {
        onAuthExpired?.()
        return
      }
      toast.error(getApiErrorMessage(err, "Failed to block user. Please try again."))
    } finally {
      setBlockingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="min-w-0 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="mt-3 text-3xl font-black tracking-tight">{loading ? "..." : stats.total}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#280E89]/10 text-(--theme)">
              <Users size={22} />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-gray-400">All registered customer accounts</p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-emerald-600">{loading ? "..." : stats.active}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserCheck size={22} />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-gray-400">Unrestricted accounts</p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Blocked Users</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-red-600">{loading ? "..." : stats.blocked}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <UserX size={22} />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-gray-400">Suspended or blocked accounts</p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Verified Emails</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-(--theme)">{loading ? "..." : stats.verified}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShieldCheck size={22} />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-gray-400">Completed email verification</p>
        </article>
      </section>

      {/* Main Content Area */}
      <section className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Users Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View user accounts, verification status, and manage account restrictions.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email or ID..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f5fb] pl-10 pr-4 text-sm outline-none transition focus:border-(--theme) dark:border-white/10 dark:bg-[#12101a]"
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh users list"
              title="Refresh users list"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Users", count: users.length },
            { id: "active", label: "Active", count: stats.active },
            { id: "blocked", label: "Blocked", count: stats.blocked },
            { id: "verified", label: "Verified", count: stats.verified },
            { id: "unverified", label: "Unverified", count: users.length - stats.verified },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                statusFilter === tab.id
                  ? "bg-(--theme) text-(--theme-second) shadow-sm"
                  : "border border-gray-200 bg-[#f7f5fb] text-gray-600 hover:border-(--theme) dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="rounded-xl bg-[#f7f5fb] px-4 py-12 text-center text-sm text-gray-500 dark:bg-[#12101a]">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-(--theme)" />
            Loading users list...
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={onRefresh} className="font-bold underline cursor-pointer">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <div className="rounded-xl bg-[#f7f5fb] px-4 py-12 text-center text-sm text-gray-500 dark:bg-[#12101a]">
            <Users size={32} className="mx-auto mb-2 opacity-40 text-gray-400" />
            <p className="font-bold text-gray-700 dark:text-gray-300">No users found</p>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery ? "Try refining your search query." : "There are currently no users in this view."}
            </p>
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && !error && filteredUsers.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f5fb] text-xs uppercase tracking-[0.16em] text-gray-500 dark:bg-[#12101a] dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-4">User</th>
                    <th className="px-4 py-4">User ID</th>
                    <th className="px-4 py-4">Email Verification</th>
                    <th className="px-4 py-4">Account Status</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {filteredUsers.map((user) => {
                    const isBlocked = !user.active
                    const isBlocking = blockingId === user.id

                    return (
                      <tr key={user.id} className="transition hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 font-black text-(--theme) uppercase">
                              {user.email ? user.email.charAt(0) : "U"}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-gray-900 dark:text-gray-100">{user.email}</p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Mail size={12} />
                                <span>Customer</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400" title={user.id}>
                              {user.id ? `${user.id.slice(0, 10)}...${user.id.slice(-6)}` : "—"}
                            </span>
                            {user.id && (
                              <button
                                type="button"
                                onClick={() => handleCopyId(user.id)}
                                className="cursor-pointer text-gray-400 hover:text-(--theme)"
                                title="Copy full ID"
                              >
                                {copiedId === user.id ? (
                                  <Check size={14} className="text-emerald-500" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {user.isVerified ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <CheckCircle2 size={13} />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              <XCircle size={13} />
                              Unverified
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-500/15 dark:text-red-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Blocked
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {isBlocked ? (
                            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-400 dark:border-white/10">
                              <UserX size={14} />
                              Blocked
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isBlocking}
                              onClick={() => setUserToBlock(user)}
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                            >
                              <ShieldAlert size={14} />
                              Block User
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-3 lg:hidden">
              {filteredUsers.map((user) => {
                const isBlocked = !user.active

                return (
                  <article
                    key={user.id}
                    className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 font-black text-(--theme) uppercase">
                          {user.email ? user.email.charAt(0) : "U"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900 dark:text-gray-100">{user.email}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="font-mono">{user.id ? `${user.id.slice(0, 8)}...` : ""}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(user.id)}
                              className="cursor-pointer hover:text-(--theme)"
                            >
                              {copiedId === user.id ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {user.active ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:bg-red-500/20 dark:text-red-300">
                          Blocked
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-200/60 pt-3 dark:border-white/10">
                      <div className="text-xs">
                        <span className="text-gray-400">Email: </span>
                        {user.isVerified ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
                        ) : (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Unverified</span>
                        )}
                      </div>

                      {isBlocked ? (
                        <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-400 dark:border-white/10">
                          Blocked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUserToBlock(user)}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                          <ShieldAlert size={13} />
                          Block
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* Block Confirmation Modal */}
      {userToBlock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#16131f] sm:rounded-2xl sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <ShieldAlert size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-gray-950 dark:text-white">Block User?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Are you sure you want to block <span className="font-bold text-gray-800 dark:text-gray-200">{userToBlock.email}</span>? This will deactivate their account privileges.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(blockingId)}
                onClick={() => setUserToBlock(null)}
                className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(blockingId)}
                onClick={handleConfirmBlock}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldAlert size={17} />
                {blockingId ? "Blocking..." : "Confirm Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
