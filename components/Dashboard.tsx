'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import ReviewList from './ReviewList';
import NewReviewForm from './NewReviewForm';
import AdminPanel from './AdminPanel';


interface DashboardProps {
  session: any;
}

export default function Dashboard({ session }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'new' | 'admin'>('reviews');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const handleReviewCreated = () => {
    setRefreshKey(prev => prev + 1);
    setEditingReviewId(null);
    setActiveTab('reviews');
  };

  const handleEditReview = (reviewId: string) => {
    setEditingReviewId(reviewId);
    setActiveTab('new');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Zone Review PMO
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {session.user?.name}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('reviews');
                setEditingReviewId(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => {
                setActiveTab('new');
                if (activeTab !== 'new') {
                  setEditingReviewId(null);
                }
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {editingReviewId ? 'Edit Review' : 'New Review'}
            </button>
            {session.user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Admin Panel
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'reviews' && <ReviewList key={refreshKey} onEditReview={handleEditReview} />}
        {activeTab === 'new' && <NewReviewForm onSuccess={handleReviewCreated} editReviewId={editingReviewId} />}
        {activeTab === 'admin' && session.user?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
