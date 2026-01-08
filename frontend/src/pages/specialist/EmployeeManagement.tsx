import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from '@/components/icons';

const API_URL = import.meta.env.VITE_API_URL;

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  specialties?: string;
  experience: number;
  workingHours: string;
  isActive: boolean;
  services: Array<{
    id: string;
    service: {
      id: string;
      name: string;
      basePrice: number;
      currency: string;
    };
    customPrice?: number;
    isAvailable: boolean;
  }>;
  _count: {
    bookings: number;
  };
}

const EmployeeManagement: React.FC = () => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [includeInactive]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/employees?includeInactive=${includeInactive}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setShowAddModal(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
              {t('employeeManagement.title') || 'Employee Management'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('employeeManagement.subtitle') || 'Manage your team members, their services, and availability'}
            </p>
          </div>
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <PlusIcon className="h-5 w-5" />
            {t('employeeManagement.addEmployee') || 'Add Employee'}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            {t('employeeManagement.showInactive') || 'Show inactive employees'}
          </label>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('employeeManagement.noEmployees') || 'No employees yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('employeeManagement.noEmployeesDescription') || 'Start building your team by adding your first employee'}
          </p>
          <button
            onClick={handleAddEmployee}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <PlusIcon className="h-5 w-5" />
            {t('employeeManagement.addFirstEmployee') || 'Add First Employee'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md ${
                !employee.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {employee.avatar ? (
                    <img
                      src={employee.avatar}
                      alt={`${employee.firstName} ${employee.lastName}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    {employee.title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {employee.title}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      /* TODO: Edit employee */
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 transition"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {employee.isActive && (
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {employee.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {employee.bio}
                </p>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <WrenchScrewdriverIcon className="h-4 w-4 text-gray-400" />
                  <span>{employee.services.length} services assigned</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span>{employee._count.bookings} bookings completed</span>
                </div>

                {employee.experience > 0 && (
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{employee.experience}</span> years
                    experience
                  </div>
                )}
              </div>

              {!employee.isActive && (
                <div className="mt-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    Inactive
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  /* TODO: View employee details */
                }}
                className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Employee
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Employee form coming soon...
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
