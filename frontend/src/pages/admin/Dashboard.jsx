import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import Analytics from '../../components/Analytics'

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

// Users Table

function UsersTable({ users, onRefresh }) {
  const [editing,    setEditing]    = useState(null)
  const [managerId,  setManagerId]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleUpdate = async (userId) => {
    setLoading(true)
    setError('')
    try {
      await API.put(`/auth/users/${userId}`, {
        manager_id: parseInt(managerId)
      })
      setEditing(null)
      setManagerId('')
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Manager ID</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400">{user.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
              <td className="px-4 py-3 text-gray-500">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.role === 'admin'    ? 'bg-purple-100 text-purple-700' :
                  user.role === 'manager'  ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {editing === user.id ? (
                  <input
                    type="number"
                    value={managerId}
                    onChange={e => setManagerId(e.target.value)}
                    className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="ID"
                  />
                ) : (
                  user.manager_id || '—'
                )}
              </td>
              <td className="px-4 py-3">
                {editing === user.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(user.id)}
                      disabled={loading}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(user.id); setManagerId(user.manager_id || '') }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-red-500 text-xs p-4">{error}</p>}
    </div>
  )
}

// Goals Table

function GoalsTable({ goals, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleUnlock = async (goalId) => {
    setLoading(true)
    setError('')
    try {
      await API.post(`/goals/${goalId}/unlock`)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to unlock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Title</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Weightage</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Locked</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {goals.map(goal => (
            <tr key={goal.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400">{goal.id}</td>
              <td className="px-4 py-3 text-gray-500">#{goal.employee_id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{goal.title}</td>
              <td className="px-4 py-3 text-gray-500">{goal.weightage}%</td>
              <td className="px-4 py-3"><StatusBadge status={goal.status} /></td>
              <td className="px-4 py-3">
                {goal.is_locked
                  ? <span className="text-xs text-red-500">🔒 Locked</span>
                  : <span className="text-xs text-green-600">🔓 Open</span>
                }
              </td>
              <td className="px-4 py-3">
                {goal.is_locked && (
                  <button
                    onClick={() => handleUnlock(goal.id)}
                    disabled={loading}
                    className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50"
                  >
                    Unlock
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-red-500 text-xs p-4">{error}</p>}
    </div>
  )
}

// Completion Report

function CompletionReport() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/checkins/admin/report')
      .then(res => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400 text-sm">Loading report...</p>
  if (!report) return <p className="text-gray-400 text-sm">No report available.</p>

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total Approved Goals</p>
          <p className="text-2xl font-bold text-gray-800">{report.total_goals}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Goals with Check-ins</p>
          <p className="text-2xl font-bold text-green-600">{report.goals_with_checkins}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-600">{report.completion_rate}</p>
        </div>
      </div>

      {/* Report table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Goal</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Target</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Check-ins</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Has Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {report.report.map(row => (
              <tr key={row.goal_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{row.title}</td>
                <td className="px-4 py-3 text-gray-500">#{row.employee_id}</td>
                <td className="px-4 py-3 text-gray-500">{row.target}</td>
                <td className="px-4 py-3 text-gray-500">{row.checkins.length}</td>
                <td className="px-4 py-3">
                  {row.has_checkin
                    ? <span className="text-xs text-green-600">✅ Yes</span>
                    : <span className="text-xs text-red-500">❌ No</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Escalation Log

function EscalationLogs() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = () => {
    API.get('/escalations/')
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleTrigger = async () => {
    await API.post('/escalations/trigger')
    fetchLogs()
  }

  const handleResolve = async (id) => {
    await API.put(`/escalations/${id}/resolve`)
    fetchLogs()
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing all escalation flags. Resolve them after taking action.
        </p>
        <button
          onClick={handleTrigger}
          className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600"
        >
          ⚡ Run Escalation Check Now
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-sm">No escalations found. Everything is on track ✅</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">User ID</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Reason</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{log.user_id}</td>
                  <td className="px-4 py-3 text-gray-800">{log.reason}</td>
                  <td className="px-4 py-3">
                    {log.resolved
                      ? <span className="text-xs text-green-600">✅ Resolved</span>
                      : <span className="text-xs text-red-500">🔴 Active</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Main Dashboard

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [tab,    setTab]    = useState('users')
  const [users,  setUsers]  = useState([])
  const [goals,  setGoals]  = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [usersRes, goalsRes] = await Promise.all([
        API.get('/auth/users'),
        API.get('/goals/admin/all')
      ])
      setUsers(usersRes.data)
      setGoals(goalsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const tabs = [
    { id: 'users',   label: '👥 Users' },
    { id: 'goals',   label: '🎯 All Goals' },
    { id: 'report',  label: '📊 Report' },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'escalations', label: '⚠️ Escalations' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-800">AtomQuest Portal</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
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

      <div className="max-w-6xl mx-auto p-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Total Goals</p>
            <p className="text-2xl font-bold text-gray-800">{goals.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Approved Goals</p>
            <p className="text-2xl font-bold text-green-600">
              {goals.filter(g => g.status === 'approved').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <>
            {tab === 'users'  && <UsersTable users={users} onRefresh={fetchData} />}
            {tab === 'goals'  && <GoalsTable goals={goals} onRefresh={fetchData} />}
            {tab === 'report' && <CompletionReport />}
            {tab === 'analytics' && <Analytics />}
            {tab === 'escalations' && <EscalationLogs />}
          </>
        )}

      </div>
    </div>
  )
}