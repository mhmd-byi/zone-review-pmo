'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

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
  const [viewMode, setViewMode] = useState<'zone' | 'department'>('zone');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    console.log('=== SUMMARY RESULT STATE CHANGED ===');
    console.log('summaryResult:', summaryResult);
    console.log('isSummarizing:', isSummarizing);
  }, [summaryResult, isSummarizing]);

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const exportToPDF = () => {
    console.log('=== EXPORTING TO PDF ===');
    if (!summaryResult || summaryResult.error) {
      console.error('No valid summary result to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to split long text into lines
    const splitText = (text: string, maxWidth: number) => {
      return doc.splitTextToSize(text, maxWidth);
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Zone Review PMO Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Scope
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const scopeText = `Scope: ${summaryResult.scope.charAt(0).toUpperCase() + summaryResult.scope.slice(1)}-wise Analysis`;
    doc.text(scopeText, margin, yPosition);
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;
    doc.setTextColor(0);

    // Process each group
    (summaryResult.groups || []).forEach((group: any, groupIndex: number) => {
      checkPageBreak(40);

      // Group heading
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(group.name, margin, yPosition);
      yPosition += 8;

      // Metrics
      if (group.metrics) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        const metricsText = `Total: ${group.metrics.totalReviews} | Completed: ${group.metrics.completed || 0} | Draft: ${group.metrics.draft || 0}`;
        doc.text(metricsText, margin, yPosition);
        yPosition += 10;
        doc.setTextColor(0);
      }

      // Key Themes
      if (group.keyThemes && group.keyThemes.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Themes:', margin + 5, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        group.keyThemes.forEach((theme: string) => {
          checkPageBreak(15);
          const lines = splitText(`• ${theme}`, contentWidth - 10);
          lines.forEach((line: string) => {
            doc.text(line, margin + 10, yPosition);
            yPosition += 5;
          });
        });
        yPosition += 3;
      }

      // Issues
      if (group.issues && group.issues.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Issues:', margin + 5, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        group.issues.forEach((issue: string) => {
          checkPageBreak(15);
          const lines = splitText(`• ${issue}`, contentWidth - 10);
          lines.forEach((line: string) => {
            doc.text(line, margin + 10, yPosition);
            yPosition += 5;
          });
        });
        yPosition += 3;
      }

      // Action Items
      if (group.actionItems && group.actionItems.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Action Items:', margin + 5, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        group.actionItems.forEach((action: string) => {
          checkPageBreak(15);
          const lines = splitText(`• ${action}`, contentWidth - 10);
          lines.forEach((line: string) => {
            doc.text(line, margin + 10, yPosition);
            yPosition += 5;
          });
        });
        yPosition += 3;
      }

      // Add spacing between groups
      if (groupIndex < summaryResult.groups.length - 1) {
        yPosition += 5;
        checkPageBreak(10);
        doc.setDrawColor(200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    });

    // Highlights
    if (Array.isArray(summaryResult.highlights) && summaryResult.highlights.length > 0) {
      checkPageBreak(40);
      yPosition += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Highlights', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      summaryResult.highlights.forEach((highlight: string) => {
        checkPageBreak(15);
        const lines = splitText(`• ${highlight}`, contentWidth - 5);
        lines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });
    }

    // Save the PDF
    const fileName = `Zone_Review_Report_${summaryResult.scope}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    console.log('✓ PDF exported:', fileName);
  };

  // Group reviews by zone
  const reviewsByZone = filteredReviews.reduce((acc, review) => {
    const zoneName = review.zoneName || 'Unknown Zone';
    if (!acc[zoneName]) {
      acc[zoneName] = {};
    }
    const deptName = review.departmentName || 'Unknown Department';
    if (!acc[zoneName][deptName]) {
      acc[zoneName][deptName] = [];
    }
    acc[zoneName][deptName].push(review);
    return acc;
  }, {} as Record<string, Record<string, Review[]>>);

  // Group reviews by department
  const reviewsByDepartment = filteredReviews.reduce((acc, review) => {
    const deptName = review.departmentName || 'Unknown Department';
    if (!acc[deptName]) {
      acc[deptName] = {};
    }
    const zoneName = review.zoneName || 'Unknown Zone';
    if (!acc[deptName][zoneName]) {
      acc[deptName][zoneName] = [];
    }
    acc[deptName][zoneName].push(review);
    return acc;
  }, {} as Record<string, Record<string, Review[]>>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Review Records
        </h2>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('zone')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'zone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            View by Zone
          </button>
          <button
            onClick={() => setViewMode('department')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'department'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            View by Department
          </button>
          <button
            onClick={async () => {
              console.log('=== GENERATE REPORT BUTTON CLICKED ===');
              try {
                console.log('1. Setting loading state...');
                setIsSummarizing(true);
                setSummaryResult(null);
                
                const scope = viewMode === 'zone' ? 'zone' : 'department';
                console.log('2. Scope:', scope);
                console.log('3. Sending API request to /api/reports/summarize');
                
                const res = await fetch('/api/reports/summarize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ scope }),
                });
                
                console.log('4. Response received');
                console.log('Response status:', res.status, res.statusText);
                console.log('Response ok:', res.ok);
                
                const json = await res.json();
                console.log('5. Response JSON:', json);
                
                // Check if response contains an error
                if (!res.ok || json.error) {
                  console.error('❌ Error in response:', json);
                  setSummaryResult({ 
                    error: json.error || 'Failed to generate summary',
                    details: json.details || json.error
                  });
                } else {
                  console.log('✓ Success! Setting summary result');
                  setSummaryResult(json);
                }
              } catch (e: any) {
                console.error('❌ Exception caught:', e);
                console.error('Error name:', e.name);
                console.error('Error message:', e.message);
                console.error('Error stack:', e.stack);
                setSummaryResult({ 
                  error: 'Network error', 
                  details: e.message || 'Failed to connect to the server'
                });
              } finally {
                console.log('6. Resetting loading state');
                setIsSummarizing(false);
                console.log('=== GENERATE REPORT COMPLETED ===');
              }
            }}
            className="ml-auto px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={isSummarizing}
          >
            {isSummarizing
              ? (viewMode === 'zone' ? 'Summarizing Zones...' : 'Summarizing Departments...')
              : (viewMode === 'zone' ? 'Generate Zone Report' : 'Generate Department Report')}
          </button>
        </div>
        
        {/* Status Filter */}
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
      ) : viewMode === 'zone' ? (
        <div className="space-y-3">
          {Object.keys(reviewsByZone).sort().map((zoneName) => {
            const zoneId = `zone-${zoneName}`;
            const isExpanded = expandedGroups.has(zoneId);
            const departments = reviewsByZone[zoneName];
            const totalReviews = Object.values(departments).reduce((sum, reviews) => sum + reviews.length, 0);
            
            return (
              <div key={zoneName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Zone Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(zoneId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {zoneName}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </button>
                
                {/* Zone Content - Departments */}
                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {Object.keys(departments).sort().map((deptName) => {
                      const deptId = `${zoneId}-${deptName}`;
                      const isDeptExpanded = expandedGroups.has(deptId);
                      const deptReviews = departments[deptName];
                      
                      return (
                        <div key={deptName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* Department Header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(deptId)}
                            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isDeptExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {deptName}
                              </h4>
                            </div>
                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                              {deptReviews.length} review{deptReviews.length !== 1 ? 's' : ''}
                            </span>
                          </button>
                          
                          {/* Reviews */}
                          {isDeptExpanded && (
                            <div className="p-3 space-y-2">
                              {deptReviews.map((review) => (
                                <div
                                  key={review._id}
                                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => setSelectedReview(review)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {review.venue} | {review.day}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        By: {review.reviewerName} | {new Date(review.reviewDate).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {review.answers.length} questions answered
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        review.status === 'completed'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                      }`}
                                    >
                                      {review.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.keys(reviewsByDepartment).sort().map((deptName) => {
            const deptId = `dept-${deptName}`;
            const isExpanded = expandedGroups.has(deptId);
            const zones = reviewsByDepartment[deptName];
            const totalReviews = Object.values(zones).reduce((sum, reviews) => sum + reviews.length, 0);
            
            return (
              <div key={deptName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Department Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(deptId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {deptName}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-sm rounded-full">
                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </button>
                
                {/* Department Content - Zones */}
                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {Object.keys(zones).sort().map((zoneName) => {
                      const zoneId = `${deptId}-${zoneName}`;
                      const isZoneExpanded = expandedGroups.has(zoneId);
                      const zoneReviews = zones[zoneName];
                      
                      return (
                        <div key={zoneName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* Zone Header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(zoneId)}
                            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isZoneExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {zoneName}
                              </h4>
                            </div>
                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                              {zoneReviews.length} review{zoneReviews.length !== 1 ? 's' : ''}
                            </span>
                          </button>
                          
                          {/* Reviews */}
                          {isZoneExpanded && (
                            <div className="p-3 space-y-2">
                              {zoneReviews.map((review) => (
                                <div
                                  key={review._id}
                                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => setSelectedReview(review)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {review.venue} | {review.day}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        By: {review.reviewerName} | {new Date(review.reviewDate).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {review.answers.length} questions answered
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        review.status === 'completed'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                      }`}
                                    >
                                      {review.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Result */}
      {summaryResult && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Summary Report</h3>
            {!summaryResult.error && (
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to PDF
              </button>
            )}
          </div>
          {summaryResult.error ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-600 dark:text-red-400 font-medium">{summaryResult.error}</p>
                  {summaryResult.details && (
                    <p className="text-sm text-red-500 dark:text-red-300 mt-1">{summaryResult.details}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    <p className="font-semibold mb-1">Common causes:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Invalid or expired Gemini API key</li>
                      <li>API quota exceeded</li>
                      <li>Rate limit exceeded</li>
                      <li>Network connectivity issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Scope: <span className="font-medium">{summaryResult.scope}</span>
              </p>
              <div className="space-y-3">
                {(summaryResult.groups || []).map((g: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{g.name}</h4>
                      {g.metrics && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {g.metrics.totalReviews} total • {g.metrics.completed || 0} completed • {g.metrics.draft || 0} draft
                        </span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Themes</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc ml-4">
                          {(g.keyThemes || []).map((t: string, i: number) => (<li key={i}>{t}</li>))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Issues</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc ml-4">
                          {(g.issues || []).map((t: string, i: number) => (<li key={i}>{t}</li>))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Action Items</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc ml-4">
                          {(g.actionItems || []).map((t: string, i: number) => (<li key={i}>{t}</li>))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {Array.isArray(summaryResult.highlights) && summaryResult.highlights.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Highlights</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc ml-4">
                    {summaryResult.highlights.map((h: string, i: number) => (<li key={i}>{h}</li>))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview !== null && (
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
