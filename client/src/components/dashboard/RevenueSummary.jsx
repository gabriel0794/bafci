import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const RevenueSummary = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRevenues = async () => {
      try {
        const token = authService.getAuthToken();
        const response = await fetch('http://localhost:5000/api/revenue', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const data = await response.json();
        setRevenues(data);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenues();
  }, []);

  if (loading) return <div>Loading revenue data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const totalRevenue = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
  const totalAdded = revenues
    .filter(rev => parseFloat(rev.amount) > 0)
    .reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
  const totalExpenses = Math.abs(
    revenues
      .filter(rev => parseFloat(rev.amount) < 0)
      .reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
  );

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        
        {/* Added Revenue */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Added</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(totalAdded)}
          </div>
        </div>
        
        {/* Minused Revenue */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Expenses</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueSummary;
