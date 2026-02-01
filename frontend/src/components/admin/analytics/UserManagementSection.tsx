import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { DataTable, Column } from '../ui/DataTable';
import { StatCard } from '../ui/StatCard';
import type { UserAnalytics, Period } from '@/types/admin.types';
import { adminAnalyticsService } from '@/services/adminAnalytics.service';
import { toast } from 'react-toastify';

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
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'CUSTOMER' | 'SPECIALIST' | 'ADMIN'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // Mock users - in production, fetch from backend
  const [users] = useState<User[]>([]);

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

  const totalUsers = data.userTrends.reduce((sum, trend) => sum + trend.count, 0);
  const customerCount = data.userTrends.filter(t => t.user_type === 'CUSTOMER').reduce((sum, t) => sum + t.count, 0);
  const specialistCount = data.userTrends.filter(t => t.user_type === 'SPECIALIST').reduce((sum, t) => sum + t.count, 0);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

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
      // Refresh user list here
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
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
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
            {user.firstName} {user.lastName}
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
          value={totalUsers}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${period} period`}
        />
        <StatCard
          title="Customers"
          value={customerCount}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${((customerCount / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          title="Specialists"
          value={specialistCount}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${((specialistCount / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total`}
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
        data={filteredUsers}
        pageSize={20}
        loading={loading}
        emptyMessage="No users found matching your filters"
      />

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredUsers.length} of {users.length} total users
      </div>
    </div>
  );
};

export default UserManagementSection;
