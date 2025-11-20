'use client';

import { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<'zones' | 'departments' | 'questions'>('zones');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Admin Panel
      </h2>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('zones')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'zones'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Zones
        </button>
        <button
          onClick={() => setActiveSection('departments')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'departments'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveSection('questions')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'questions'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Questions
        </button>
      </div>

      {activeSection === 'zones' && <ZoneManager />}
      {activeSection === 'departments' && <DepartmentManager />}
      {activeSection === 'questions' && <QuestionManager />}
    </div>
  );
}

function ZoneManager() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [zones, setZones] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones');
      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = editingId ? `/api/zones/${editingId}` : '/api/zones';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        setMessage(editingId ? 'Zone updated successfully!' : 'Zone added successfully!');
        setName('');
        setDescription('');
        setEditingId(null);
        setShowForm(false);
        fetchZones();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save zone');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone: { _id: string; name: string; description?: string }) => {
    setEditingId(zone._id);
    setName(zone.name);
    setDescription(zone.description || '');
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      const response = await fetch(`/api/zones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Zone deleted successfully!');
        fetchZones();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete zone');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setShowForm(false);
    setMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Zones Management
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Zone
          </button>
        )}
      </div>
      
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {editingId ? 'Edit Zone' : 'Add New Zone'}
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zone Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., North Zone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Add description..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : editingId ? 'Update Zone' : 'Add Zone'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Zones List */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          All Zones ({zones.length})
        </h4>
        {zones.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No zones found. Add your first zone above.
          </p>
        ) : (
          zones.map((zone) => (
            <div
              key={zone._id}
              className="flex justify-between items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {zone.name}
                </h5>
                {zone.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {zone.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(zone)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(zone._id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DepartmentManager() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = editingId ? `/api/departments/${editingId}` : '/api/departments';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        setMessage(editingId ? 'Department updated successfully!' : 'Department added successfully!');
        setName('');
        setDescription('');
        setEditingId(null);
        setShowForm(false);
        fetchDepartments();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save department');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept: { _id: string; name: string; description?: string }) => {
    setEditingId(dept._id);
    setName(dept.name);
    setDescription(dept.description || '');
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Department deleted successfully!');
        fetchDepartments();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete department');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setShowForm(false);
    setMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Departments Management
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Department
          </button>
        )}
      </div>
      
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {editingId ? 'Edit Department' : 'Add New Department'}
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., IT Department"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Add description..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : editingId ? 'Update Department' : 'Add Department'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Departments List */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          All Departments ({departments.length})
        </h4>
        {departments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No departments found. Add your first department above.
          </p>
        ) : (
          departments.map((dept) => (
            <div
              key={dept._id}
              className="flex justify-between items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {dept.name}
                </h5>
                {dept.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {dept.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(dept)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept._id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuestionManager() {
  const [text, setText] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [order, setOrder] = useState('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!departmentId) {
      setMessage('Please select a department');
      setLoading(false);
      return;
    }

    const selectedDepartment = departments.find(d => d._id === departmentId);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          departmentId,
          departmentName: selectedDepartment?.name,
          order: parseInt(order) || 0 
        }),
      });

      if (response.ok) {
        setMessage('Question added successfully!');
        setText('');
        setDepartmentId('');
        setOrder('0');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to add question');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Add New Question
      </h3>
      
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Question Text *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., How satisfied are you with the service quality?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Department *
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Order
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Adding...' : 'Add Question'}
        </button>
      </form>
    </div>
  );
}
