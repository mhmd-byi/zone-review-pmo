'use client';

import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

interface Department {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  text: string;
  category?: string;
  departmentId: string;
  departmentName: string;
}

interface DepartmentReview {
  departmentId: string;
  departmentName: string;
  feedbacks: FeedbackEntry[];
}

interface FeedbackEntry {
  id: string;
  feedback: string;
}

interface Answer {
  questionId: string;
  questionText: string;
  answer: string;
  rating?: number;
}

interface NewReviewFormProps {
  onSuccess: () => void;
  editReviewId?: string | null;
}

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export default function NewReviewForm({ onSuccess, editReviewId }: NewReviewFormProps) {
  const [zones, setZones] = useState<{ _id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [questionsByDepartment, setQuestionsByDepartment] = useState<Record<string, Question[]>>({});
  
  const [reviewDate, setReviewDate] = useState('');
  const [day, setDay] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [venue, setVenue] = useState('');
  const [aamil, setAamil] = useState('');
  const [zonalHead, setZonalHead] = useState('');
  const [zoneCapacity, setZoneCapacity] = useState('');
  const [mumineenCount, setMumineenCount] = useState('');
  const [thaalCount, setThaalCount] = useState('');
  
  const [departmentReviews, setDepartmentReviews] = useState<DepartmentReview[]>([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZonesAndDepartments();
  }, []);

  useEffect(() => {
    if (departments.length > 0) {
      fetchAllQuestions();
    }
  }, [departments]);

  useEffect(() => {
    if (editReviewId && departments.length > 0) {
      loadReviewForEdit();
    }
  }, [editReviewId, departments]);

  const fetchZonesAndDepartments = async () => {
    try {
      const [zonesRes, depsRes] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/departments'),
      ]);

      if (zonesRes.ok) setZones(await zonesRes.json());
      if (depsRes.ok) setDepartments(await depsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const allQuestions: Question[] = await response.json();
        
        // Group questions by department
        const grouped: Record<string, Question[]> = {};
        allQuestions.forEach((q) => {
          if (!grouped[q.departmentId]) {
            grouped[q.departmentId] = [];
          }
          grouped[q.departmentId].push(q);
        });
        
        setQuestionsByDepartment(grouped);
        
        // Only initialize if not editing
        if (!editReviewId) {
          // Initialize department reviews with one feedback entry per department
          const initialReviews: DepartmentReview[] = departments.map(dept => ({
            departmentId: dept._id,
            departmentName: dept.name,
            feedbacks: [createNewFeedbackEntry()]
          }));
          
          setDepartmentReviews(initialReviews);
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const loadReviewForEdit = async () => {
    console.log('=== LOADING REVIEW FOR EDIT ===');
    console.log('Edit Review ID:', editReviewId);
    
    try {
      const response = await fetch(`/api/reviews/${editReviewId}`);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const review = await response.json();
        console.log('Loaded review data:', review);
        
        // Populate basic fields
        setReviewDate(review.reviewDate.split('T')[0]);
        setDay(review.day);
        setSelectedZone(review.zoneId || '');
        setVenue(review.venue || '');
        setAamil(review.aamil || '');
        setZonalHead(review.zonalHead || '');
        setZoneCapacity(review.zoneCapacity?.toString() || '');
        setMumineenCount(review.mumineenCount?.toString() || '');
        setThaalCount(review.thaalCount?.toString() || '');
        setOverallNotes(review.overallNotes || '');
        setStatus(review.status || 'draft');
        
        console.log('Basic fields populated');
        console.log('Review answers:', review.answers);
        console.log('Departments:', departments);
        
        // Group answers by department - using departmentId from the review
        const deptReviewsMap = new Map<string, string[]>();
        
        // Each answer has the same feedback for all questions in that department
        // We need to extract unique feedbacks per department
        review.answers?.forEach((answer: any) => {
          // Find department by name since answers don't have departmentId
          const dept = departments.find(d => d.name === review.departmentName);
          if (dept) {
            if (!deptReviewsMap.has(dept._id)) {
              deptReviewsMap.set(dept._id, []);
            }
            // Add feedback if it's not already added
            const existingFeedbacks = deptReviewsMap.get(dept._id)!;
            if (!existingFeedbacks.includes(answer.answer)) {
              existingFeedbacks.push(answer.answer);
            }
          }
        });
        
        console.log('Department reviews map:', Array.from(deptReviewsMap.entries()));
        
        // Create department reviews structure
        const loadedReviews: DepartmentReview[] = departments.map(dept => {
          const feedbacks = deptReviewsMap.get(dept._id) || [];
          const feedbackEntries = feedbacks.length > 0 
            ? feedbacks.map(feedback => ({
                id: Math.random().toString(36).substr(2, 9),
                feedback: feedback
              }))
            : [createNewFeedbackEntry()];
          
          return {
            departmentId: dept._id,
            departmentName: dept.name,
            feedbacks: feedbackEntries
          };
        });
        
        console.log('Loaded department reviews:', loadedReviews);
        setDepartmentReviews(loadedReviews);
        
        // Expand the department that has the review
        const deptWithReview = departments.find(d => d.name === review.departmentName);
        if (deptWithReview) {
          setExpandedDepartments(new Set([deptWithReview._id]));
          console.log('Expanded department:', deptWithReview.name);
        }
        
        console.log('✓ Review loaded successfully');
      } else {
        console.error('Failed to fetch review, status:', response.status);
        setError('Failed to load review for editing');
      }
    } catch (error) {
      console.error('Error loading review for edit:', error);
      setError('Failed to load review for editing');
    }
  };

  const createNewFeedbackEntry = (): FeedbackEntry => ({
    id: Math.random().toString(36).substr(2, 9),
    feedback: '',
  });

  const addFeedbackEntry = (departmentId: string) => {
    setDepartmentReviews(prev => prev.map(deptReview => {
      if (deptReview.departmentId === departmentId) {
        return {
          ...deptReview,
          feedbacks: [...deptReview.feedbacks, createNewFeedbackEntry()]
        };
      }
      return deptReview;
    }));
  };

  const removeFeedbackEntry = (departmentId: string, entryId: string) => {
    setDepartmentReviews(prev => prev.map(deptReview => {
      if (deptReview.departmentId === departmentId) {
        return {
          ...deptReview,
          feedbacks: deptReview.feedbacks.filter(f => f.id !== entryId)
        };
      }
      return deptReview;
    }));
  };

  const handleFeedbackChange = (departmentId: string, entryId: string, value: string) => {
    setDepartmentReviews(prev => prev.map(deptReview => {
      if (deptReview.departmentId === departmentId) {
        return {
          ...deptReview,
          feedbacks: deptReview.feedbacks.map(entry => {
            if (entry.id === entryId) {
              return { ...entry, feedback: value };
            }
            return entry;
          })
        };
      }
      return deptReview;
    }));
  };

  const handleFeedbackRatingChange = (departmentId: string, entryId: string, rating: number) => {
    // Rating functionality removed
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!reviewDate || !day || !selectedZone || !venue) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const zone = zones.find((z) => z._id === selectedZone);

    try {
      if (editReviewId) {
        // Update existing review
        const allAnswers: any[] = [];
        
        departmentReviews.forEach(deptReview => {
          const questions = questionsByDepartment[deptReview.departmentId] || [];
          
          deptReview.feedbacks.forEach(feedbackEntry => {
            if (feedbackEntry.feedback.trim() !== '') {
              questions.forEach(q => {
                allAnswers.push({
                  questionId: q._id,
                  questionText: q.text,
                  departmentName: deptReview.departmentName,
                  answer: feedbackEntry.feedback,
                  rating: undefined,
                });
              });
            }
          });
        });
        
        const reviewData = {
          zoneId: selectedZone,
          zoneName: zone?.name,
          reviewDate,
          day,
          venue,
          aamil: aamil || undefined,
          zonalHead: zonalHead || undefined,
          zoneCapacity: zoneCapacity ? parseInt(zoneCapacity) : undefined,
          mumineenCount: mumineenCount ? parseInt(mumineenCount) : undefined,
          thaalCount: thaalCount ? parseInt(thaalCount) : undefined,
          answers: allAnswers,
          overallNotes,
          status,
        };
        
        const response = await fetch(`/api/reviews/${editReviewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        });
        
        if (response.ok) {
          onSuccess();
        } else {
          setError('Failed to update review. Please try again.');
        }
      } else {
        // Create new reviews (existing logic)
        const allPromises: Promise<any>[] = [];
        
        departmentReviews.forEach(deptReview => {
          const questions = questionsByDepartment[deptReview.departmentId] || [];
          
          deptReview.feedbacks.forEach(feedbackEntry => {
            if (feedbackEntry.feedback.trim() !== '') {
              // Create answers array from questions with the same feedback
              const answers = questions.map(q => ({
                questionId: q._id,
                questionText: q.text,
                answer: feedbackEntry.feedback,
                rating: undefined,
              }));
              
              const reviewData = {
                zoneId: selectedZone,
                zoneName: zone?.name,
                departmentId: deptReview.departmentId,
                departmentName: deptReview.departmentName,
                reviewDate,
                day,
                venue,
                aamil: aamil || undefined,
                zonalHead: zonalHead || undefined,
                zoneCapacity: zoneCapacity ? parseInt(zoneCapacity) : undefined,
                mumineenCount: mumineenCount ? parseInt(mumineenCount) : undefined,
                thaalCount: thaalCount ? parseInt(thaalCount) : undefined,
                answers,
                overallNotes,
                status,
              };
              
              allPromises.push(
                fetch('/api/reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(reviewData),
                })
              );
            }
          });
        });

        const results = await Promise.all(allPromises);
        const allSuccess = results.every(r => r.ok);
        
        if (allSuccess) {
          onSuccess();
        } else {
          setError('Some reviews failed to submit. Please try again.');
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {editReviewId ? 'Edit Review' : 'Create New Review'}
      </h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Review Details Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Review Details
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a day</option>
                {daysOfWeek.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zone *
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Venue *
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter venue name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aamil (Optional)
              </label>
              <input
                type="text"
                value={aamil}
                onChange={(e) => setAamil(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter aamil name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zonal Head (Optional)
              </label>
              <input
                type="text"
                value={zonalHead}
                onChange={(e) => setZonalHead(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter zonal head name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zone Capacity (Optional)
              </label>
              <input
                type="number"
                value={zoneCapacity}
                onChange={(e) => setZoneCapacity(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mumineen Count (Optional)
              </label>
              <input
                type="number"
                value={mumineenCount}
                onChange={(e) => setMumineenCount(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thaal Count (Optional)
              </label>
              <input
                type="number"
                value={thaalCount}
                onChange={(e) => setThaalCount(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Department Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Department Reviews
          </h3>
          
          {departmentReviews.map((deptReview) => {
            const isExpanded = expandedDepartments.has(deptReview.departmentId);
            const hasContent = deptReview.feedbacks.some(f => f.feedback.trim() !== '');
            
            return (
            <div key={deptReview.departmentId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDepartment(deptReview.departmentId)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    {deptReview.departmentName}
                  </h4>
                </div>
                {hasContent && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs rounded-full">
                    Has feedback
                  </span>
                )}
              </button>
              
              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-4">
                  
                  {/* Display questions (static) */}
                  {questionsByDepartment[deptReview.departmentId]?.length === 0 || !questionsByDepartment[deptReview.departmentId] ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      No questions available for this department.
                    </p>
                  ) : (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Questions:
                      </p>
                      <div className="space-y-2">
                        {questionsByDepartment[deptReview.departmentId].map((question, idx) => (
                          <p key={question._id} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                            {idx + 1}. {question.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Feedback entries */}
                  <div className="space-y-3 mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Feedback Entries:
                    </p>
                    {deptReview.feedbacks.map((feedbackEntry, feedbackIndex) => (
                      <div key={feedbackEntry.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Feedback #{feedbackIndex + 1}
                          </span>
                          {deptReview.feedbacks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeedbackEntry(deptReview.departmentId, feedbackEntry.id)}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <RichTextEditor
                          value={feedbackEntry.feedback}
                          onChange={(value) => handleFeedbackChange(deptReview.departmentId, feedbackEntry.id, value)}
                          placeholder="Enter your feedback..."
                        />
                      </div>
                    ))}
                  </div>
              
                  <button
                    type="button"
                    onClick={() => addFeedbackEntry(deptReview.departmentId)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    + Add Another Feedback
                  </button>
                </div>
              )}
            </div>
          );
          })}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overall Notes (Optional)
          </label>
          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Add any additional notes or comments..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            onClick={() => setStatus('draft')}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading && status === 'draft' ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            onClick={() => setStatus('completed')}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading && status === 'completed' ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
