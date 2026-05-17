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

// Goal Card

function GoalCard({ goal, onAction }) {
  const [comment, setComment]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')
  const [success, setSuccess]   = useState('')
  const [showComment, setShowComment] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    setError('')
    try {
      await API.post(`/goals/${goal.id}/approve`)
      setSuccess('Goal approved and locked ✅')
      onAction()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setError('')
    try {
      await API.post(`/goals/${goal.id}/reject`)
      setSuccess('Goal rejected')
      onAction()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

      {/* Goal Info */}
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

      {/* Goal Details */}
      <div className="flex gap-4 mt-3 text-sm text-gray-500">
        <span>Target: <strong>{goal.target}</strong></span>
        <span>Weightage: <strong>{goal.weightage}%</strong></span>
        <span>UoM: <strong>{goal.uom_type}</strong></span>
        <span>Employee ID: <strong>{goal.employee_id}</strong></span>
      </div>

      {/* Error / Success */}
      {error   && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {success && <p className="text-green-600 text-xs mt-2">{success}</p>}

      {/* Approve / Reject buttons for submitted goals */}
      {goal.status === 'submitted' && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            ✅ Approve
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* Check-in comment for approved goals */}
      {goal.status === 'approved' && (
        <div className="mt-4">
          <button
            onClick={() => setShowComment(!showComment)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showComment ? 'Hide comment' : '💬 Add check-in comment'}
          </button>

          {showComment && (
            <CheckInComment goalId={goal.id} />
          )}
        </div>
      )}
    </div>
  )
}

// Check-in Comment

function CheckInComment({ goalId }) {
  const [checkins,  setCheckins]  = useState([])
  const [comment,   setComment]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  useEffect(() => {
    API.get(`/checkins/goal/${goalId}`)
      .then(res => setCheckins(res.data))
      .catch(() => {})
  }, [goalId])

  const handleComment = async (checkinId) => {
    setLoading(true)
    setError('')
    try {
      await API.put(`/checkins/${checkinId}/comment`, {
        manager_comment: comment
      })
      setSuccess('Comment added ✅')
      setComment('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  if (checkins.length === 0) {
    return (
      <p className="text-xs text-gray-400 mt-2">
        No check-ins yet for this goal.
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {checkins.map(checkin => (
        <div key={checkin.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex gap-4 text-xs text-gray-500 mb-2">
            <span>Quarter: <strong>{checkin.quarter}</strong></span>
            <span>Achievement: <strong>{checkin.achievement}</strong></span>
            <span>Score: <strong>{checkin.score}%</strong></span>
            <span>Status: <strong>{checkin.progress_status}</strong></span>
          </div>

          {checkin.manager_comment && (
            <p className="text-xs text-blue-600 mb-2">
              💬 {checkin.manager_comment}
            </p>
          )}

          <div className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add your comment..."
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => handleComment(checkin.id)}
              disabled={loading || !comment}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>

          {error   && <p className="text-red-500 text-xs mt-1">{error}</p>}
          {success && <p className="text-green-600 text-xs mt-1">{success}</p>}
        </div>
      ))}
    </div>
  )
}

// Main Dashboard

export default function ManagerDashboard() {
  const { user, logout } = useAuth()
  const [goals,   setGoals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  const fetchGoals = async () => {
    try {
      const res = await API.get('/goals/team/all')
      setGoals(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGoals() }, [])

  const filtered = filter === 'all'
    ? goals
    : goals.filter(g => g.status === filter)

  const counts = {
    all:       goals.length,
    submitted: goals.filter(g => g.status === 'submitted').length,
    approved:  goals.filter(g => g.status === 'approved').length,
    rejected:  goals.filter(g => g.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-800">AtomQuest Portal</h1>
          <p className="text-xs text-gray-400">Manager Dashboard</p>
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Goals',   value: counts.all,       color: 'text-gray-800'  },
            { label: 'Pending',       value: counts.submitted,  color: 'text-yellow-600'},
            { label: 'Approved',      value: counts.approved,   color: 'text-green-600' },
            { label: 'Rejected',      value: counts.rejected,   color: 'text-red-500'   },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'submitted', 'approved', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && counts[tab] > 0 && (
                <span className="ml-1 text-xs">({counts[tab]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Goals List */}
        {loading ? (
          <p className="text-gray-400 text-sm">Loading team goals...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">No goals found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map(goal => (
              <GoalCard key={goal.id} goal={goal} onAction={fetchGoals} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}