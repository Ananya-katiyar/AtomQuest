import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'

// Status Badge

function StatusBadge({ status }) {
  const colors = {
    draft:     'bg-gray-100 text-gray-600',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-600',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Create Goal Form

function CreateGoalForm({ onGoalCreated }) {
  const [form, setForm] = useState({
    thrust_area: '',
    title:       '',
    description: '',
    uom_type:    'numeric',
    target:      '',
    weightage:   '',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await API.post('/goals/', {
        ...form,
        target:    parseFloat(form.target),
        weightage: parseFloat(form.weightage),
      })
      setForm({
        thrust_area: '',
        title:       '',
        description: '',
        uom_type:    'numeric',
        target:      '',
        weightage:   '',
      })
      onGoalCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Goal</h2>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Thrust Area</label>
            <input
              name="thrust_area"
              value={form.thrust_area}
              onChange={handleChange}
              placeholder="e.g. Sales, Operations"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Goal Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Increase Sales Revenue"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-gray-600 block mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the goal..."
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Unit of Measurement</label>
            <select
              name="uom_type"
              value={form.uom_type}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="numeric">Numeric (Higher is better)</option>
              <option value="percent">Percent (Higher is better)</option>
              <option value="timeline">Timeline (Lower is better)</option>
              <option value="zero">Zero (Zero = Success)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Target</label>
            <input
              name="target"
              type="number"
              value={form.target}
              onChange={handleChange}
              placeholder="e.g. 100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Weightage (%)</label>
            <input
              name="weightage"
              type="number"
              value={form.weightage}
              onChange={handleChange}
              placeholder="e.g. 20"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </form>
    </div>
  )
}

// Goal Card

function GoalCard({ goal, onAction }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await API.post(`/goals/${goal.id}/submit`)
      onAction()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">{goal.thrust_area}</p>
          <h3 className="font-semibold text-gray-800">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
          )}
        </div>
        <StatusBadge status={goal.status} />
      </div>

      <div className="flex gap-4 mt-3 text-sm text-gray-500">
        <span>Target: <strong>{goal.target}</strong></span>
        <span>Weightage: <strong>{goal.weightage}%</strong></span>
        <span>UoM: <strong>{goal.uom_type}</strong></span>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      {/* Submit button only for draft/rejected goals */}
      {(goal.status === 'draft' || goal.status === 'rejected') && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Approval'}
        </button>
      )}

      {goal.status === 'submitted' && (
        <p className="text-xs text-yellow-600 mt-3">
          ⏳ Waiting for manager approval
        </p>
      )}
      {goal.status === 'approved' && (
        <div className="mt-3">
            <p className="text-xs text-green-600 mb-2">✅ Approved — goal is locked</p>
            <CheckInForm goal={goal} />
    </div>
)}
    </div>
  )
}

// ─── CheckIn Form ─────────────────────────────────────────────────────────────

function CheckInForm({ goal }) {
  const [show,    setShow]    = useState(false)
  const [form,    setForm]    = useState({
    quarter:         'Q1',
    achievement:     '',
    progress_status: 'on_track'
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await API.post('/checkins/', {
        goal_id:         goal.id,
        quarter:         form.quarter,
        achievement:     parseFloat(form.achievement),
        progress_status: form.progress_status
      })
      setSuccess('Check-in logged successfully ✅')
      setForm({ quarter: 'Q1', achievement: '', progress_status: 'on_track' })
      setShow(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to log check-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow(!show)}
        className="text-xs text-blue-600 hover:underline"
      >
        {show ? 'Hide' : '📝 Log quarterly achievement'}
      </button>

      {show && (
        <form onSubmit={handleSubmit} className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Quarter</label>
              <select
                value={form.quarter}
                onChange={e => setForm({ ...form, quarter: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Q1">Q1 (July)</option>
                <option value="Q2">Q2 (October)</option>
                <option value="Q3">Q3 (January)</option>
                <option value="Q4">Q4 (March/April)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Achievement</label>
              <input
                type="number"
                value={form.achievement}
                onChange={e => setForm({ ...form, achievement: e.target.value })}
                placeholder={`Target: ${goal.target}`}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select
                value={form.progress_status}
                onChange={e => setForm({ ...form, progress_status: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="not_started">Not Started</option>
                <option value="on_track">On Track</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {error   && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Check-in'}
          </button>
        </form>
      )}
    </div>
  )
}

// Main Dashboard

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const [goals,   setGoals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [totalW,  setTotalW]  = useState(0)

  const fetchGoals = async () => {
    try {
      const res = await API.get('/goals/my')
      setGoals(res.data)
      const total = res.data
        .filter(g => g.status !== 'rejected')
        .reduce((sum, g) => sum + g.weightage, 0)
      setTotalW(total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGoals() }, [])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-800">AtomQuest Portal</h1>
          <p className="text-xs text-gray-400">Employee Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">

        {/* Weightage tracker */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Weightage</p>
            <p className="text-2xl font-bold text-gray-800">{totalW}%
              <span className="text-sm font-normal text-gray-400 ml-1">/ 100%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Goals Created</p>
            <p className="text-2xl font-bold text-gray-800">{goals.length}
              <span className="text-sm font-normal text-gray-400 ml-1">/ 8</span>
            </p>
          </div>
          <div>
            {totalW === 100
              ? <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Ready to submit ✅</span>
              : <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full">Need {100 - totalW}% more</span>
            }
          </div>
        </div>

        {/* Create Goal Form */}
        <CreateGoalForm onGoalCreated={fetchGoals} />

        {/* Goals List */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">My Goals</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-400 text-sm">No goals yet. Create your first goal above!</p>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onAction={fetchGoals} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}