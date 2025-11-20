'use client';

import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  zoneName: string;
  departmentName: string;
  reviewDate: string;
  day: string;
  venue: string;
  aamil?: string;
  zonalHead?: string;
  zoneCapacity?: number;
  mumineenCount?: number;
  thaalCount?: number;
  reviewerName: string;
  status: string;
  answers: Array<{
    questionText: string;
    answer: string;
    rating?: number;
  }>;
  overallNotes?: string;
}

export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review Records
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No reviews found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedReview(review)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {review.zoneName} - {review.departmentName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Venue: {review.venue} | {review.day}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reviewed by: {review.reviewerName}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    review.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : review.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Date: {new Date(review.reviewDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {review.answers.length} questions answered
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedReview.zoneName} - {selectedReview.departmentName}
                  </h2>
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Date:</span> {selectedReview.day}, {new Date(selectedReview.reviewDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Venue:</span> {selectedReview.venue}
                    </p>
                    {selectedReview.aamil && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Aamil:</span> {selectedReview.aamil}
                      </p>
                    )}
                    {selectedReview.zonalHead && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Zonal Head:</span> {selectedReview.zonalHead}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2">
                      {selectedReview.zoneCapacity && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Capacity:</span> {selectedReview.zoneCapacity}
                        </p>
                      )}
                      {selectedReview.mumineenCount && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Mumineen:</span> {selectedReview.mumineenCount}
                        </p>
                      )}
                      {selectedReview.thaalCount && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Thaal:</span> {selectedReview.thaalCount}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Reviewed by:</span> {selectedReview.reviewerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedReview.answers.map((answer, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">
                    Q{index + 1}: {answer.questionText}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 ml-4">
                    {answer.answer}
                  </p>
                  {answer.rating && (
                    <div className="ml-4 mt-2 flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Rating:</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < answer.rating! ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {selectedReview.overallNotes && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Overall Notes:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedReview.overallNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
