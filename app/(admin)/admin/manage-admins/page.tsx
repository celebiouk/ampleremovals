"use client";

import { useState, useEffect } from "react";
import { Users, Activity, Shield, Plus, Trash2, Key, UserX, UserCheck, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AdminUser, AdminActivityLog, AdminRole } from "@/types";

export default function ManageAdminsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "activity">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<(AdminActivityLog & { admin_user?: { full_name: string; email: string; role: string } | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [changingPasswordUserId, setChangingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AdminRole>("admin");

  useEffect(() => {
    fetchUsers();
    if (activeTab === "activity") {
      fetchActivity();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json() as { success: boolean; users?: AdminUser[]; error?: string };
    if (data.success && data.users) {
      setUsers(data.users);
    } else {
      toast.error(data.error || "Failed to load users");
    }
    setIsLoading(false);
  };

  const fetchActivity = async () => {
    const res = await fetch("/api/admin/activity?limit=100");
    const data = await res.json() as { success: boolean; logs?: (AdminActivityLog & { admin_user?: { full_name: string; email: string; role: string } })[]; error?: string };
    if (data.success && data.logs) {
      setActivityLogs(data.logs);
    } else {
      toast.error(data.error || "Failed to load activity");
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword) {
      toast.error("All fields are required");
      return;
    }

    setIsCreatingUser(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newUserEmail,
        full_name: newUserName,
        password: newUserPassword,
        role: newUserRole,
      }),
    });

    const data = await res.json() as { success: boolean; error?: string };
    setIsCreatingUser(false);

    if (data.success) {
      toast.success("Admin user created successfully");
      setShowCreateForm(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("admin");
      fetchUsers();
    } else {
      toast.error(data.error || "Failed to create user");
    }
  };

  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json() as { success: boolean; error?: string };

    if (data.success) {
      toast.success("User deleted");
      setDeletingUserId(null);
      fetchUsers();
    } else {
      toast.error(data.error || "Failed to delete user");
    }
  };

  const changePassword = async (userId: string) => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });

    const data = await res.json() as { success: boolean; error?: string };

    if (data.success) {
      toast.success("Password changed successfully");
      setChangingPasswordUserId(null);
      setNewPassword("");
    } else {
      toast.error(data.error || "Failed to change password");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentStatus }),
    });

    const data = await res.json() as { success: boolean; error?: string };

    if (data.success) {
      toast.success(currentStatus ? "User deactivated" : "User activated");
      fetchUsers();
    } else {
      toast.error(data.error || "Failed to update user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-brand-purple-700" />
            Manage Admins
          </h2>
          <p className="text-sm text-slate-500 mt-1">Super Admin Dashboard — User Management & Activity</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-brand-purple-800 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          Admin Users
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "bg-brand-purple-800 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          Activity Log
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Create User Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">{users.length} admin user(s)</p>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple-700 text-white rounded-xl hover:bg-brand-purple-800 transition-colors text-sm font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Admin User
            </button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Create New Admin</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-sm bg-brand-purple-700 text-white rounded-xl hover:bg-brand-purple-800 disabled:opacity-50 flex items-center gap-2 font-bold"
                >
                  {isCreatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.email !== "ampleremovals@gmail.com" && (
                          <>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={user.is_active ? "Deactivate" : "Activate"}
                            >
                              {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setChangingPasswordUserId(user.id)}
                              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Change Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingUserId(user.id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user.email === "ampleremovals@gmail.com" && (
                          <span className="text-xs text-purple-600 font-medium">Main Super Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">{activityLogs.length} recent activities</p>
            <button
              onClick={fetchActivity}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Admin</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-GB")}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{log.admin_user?.full_name || "Unknown"}</p>
                          <p className="text-xs text-slate-500">{log.admin_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{log.action}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {log.metadata && <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingUserId}
        title="Delete Admin User"
        description="This will permanently delete this admin user and revoke their access. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => deletingUserId && deleteUser(deletingUserId)}
        onCancel={() => setDeletingUserId(null)}
      />

      {/* Change Password Dialog */}
      {changingPasswordUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-4 outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100"
              placeholder="New password (min 6 characters)"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setChangingPasswordUserId(null);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => changePassword(changingPasswordUserId)}
                className="px-4 py-2 text-sm bg-brand-purple-700 text-white rounded-xl hover:bg-brand-purple-800 font-bold"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
