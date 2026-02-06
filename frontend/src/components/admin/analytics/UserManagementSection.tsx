import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DataTable, Column } from '../ui/DataTable';
import { StatCard } from '../ui/StatCard';
import type { UserAnalytics, Period } from '@/types/admin.types';
import { adminAnalyticsService } from '@/services/adminAnalytics.service';
import { toast } from 'react-toastify';

// Sanitize user-provided strings to prevent XSS from stored malicious names
function sanitizeDisplayName(name: string): string {
  if (!name) return '';
  return name.replace(/<[^>]*>/g, '').replace(/[<>'"&]/g, '').trim();
}

export interface UserManagementSectionProps {
  data: UserAnalytics | null;
  period: Period;
  loading?: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  data,
  period,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'CUSTOMER' | 'SPECIALIST' | 'ADMIN'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // User list state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const result = await adminAnalyticsService.listUsers({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        userType: userTypeFilter,
        status: statusFilter
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [currentPage, debouncedSearch, userTypeFilter, statusFilter]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userTypeFilter, statusFilter]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Add null checks for arrays
  const userTrends = data?.userTrends || [];

  const totalUsers = userTrends.reduce((sum, trend) => sum + (trend.count || 0), 0);
  // Handle both snake_case (from API) and camelCase property names
  const customerCount = userTrends.filter(t => (t.user_type || (t as any).userType) === 'CUSTOMER').reduce((sum, t) => sum + (t.count || 0), 0);
  const specialistCount = userTrends.filter(t => (t.user_type || (t as any).userType) === 'SPECIALIST').reduce((sum, t) => sum + (t.count || 0), 0);

  const handleUserAction = async (action: 'activate' | 'deactivate' | 'delete', userIds: string[]) => {
    if (userIds.length === 0) {
      toast.warning('Please select users first');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${userIds.length} user(s)?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminAnalyticsService.manageUsers({ action, userIds });
      toast.success(`Successfully ${action}d ${userIds.length} user(s)`);
      setSelectedUsers(new Set());
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} users`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedUsers.size === users.length && users.length > 0}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      ) as any,
      render: (user) => (
        <input
          type="checkbox"
          checked={selectedUsers.has(user.id)}
          onChange={() => toggleUserSelection(user.id)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {sanitizeDisplayName(user.firstName)} {sanitizeDisplayName(user.lastName)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
        </div>
      )
    },
    {
      key: 'userType',
      label: 'Type',
      sortable: true,
      render: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.userType === 'ADMIN'
              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
              : user.userType === 'SPECIALIST'
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
              : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
          }`}
        >
          {user.userType}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.isActive
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString()
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      sortable: true,
      render: (user) => user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={totalUsers || pagination.totalItems}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${period} period`}
        />
        <StatCard
          title="Customers"
          value={customerCount}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${((customerCount / Math.max(totalUsers || pagination.totalItems, 1)) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          title="Specialists"
          value={specialistCount}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${((specialistCount / Math.max(totalUsers || pagination.totalItems, 1)) * 100).toFixed(1)}% of total`}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="CUSTOMER">Customers</option>
                <option value="SPECIALIST">Specialists</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => fetchUsers()}
              disabled={usersLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              {selectedUsers.size} user(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUserAction('activate', Array.from(selectedUsers))}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleUserAction('deactivate', Array.from(selectedUsers))}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 disabled:opacity-50 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Deactivate
              </button>
              <button
                onClick={() => handleUserAction('delete', Array.from(selectedUsers))}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        pageSize={20}
        loading={usersLoading}
        emptyMessage="No users found matching your filters"
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {pagination.totalPages} ({pagination.totalItems} total users)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {users.length} of {pagination.totalItems} total users
      </div>
    </div>
  );
};

export default UserManagementSection;
