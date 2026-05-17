import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useState, useEffect } from 'react'
import API from '../api/axios'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444']

// Bar Chart — Goals by Status

function GoalsByStatus({ goals }) {
  const data = [
    { name: 'Draft',     value: goals.filter(g => g.status === 'draft').length     },
    { name: 'Submitted', value: goals.filter(g => g.status === 'submitted').length },
    { name: 'Approved',  value: goals.filter(g => g.status === 'approved').length  },
    { name: 'Rejected',  value: goals.filter(g => g.status === 'rejected').length  },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Goals by Status</h3>
      <p className="text-xs text-gray-400 mb-4">Distribution of all goals across statuses</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" name="Goals" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Pie Chart — Goals by Thrust Area

function GoalsByThrustArea({ goals }) {
  // group by thrust area
  const grouped = goals.reduce((acc, g) => {
    acc[g.thrust_area] = (acc[g.thrust_area] || 0) + 1
    return acc
  }, {})

  const data = Object.entries(grouped).map(([name, value]) => ({ name, value }))

  const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Goals by Thrust Area</h3>
      <p className="text-xs text-gray-400 mb-4">Breakdown of goals by category</p>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// Bar Chart — Goals by UoM Type

function GoalsByUoM({ goals }) {
  const data = [
    { name: 'Numeric',  value: goals.filter(g => g.uom_type === 'numeric').length  },
    { name: 'Percent',  value: goals.filter(g => g.uom_type === 'percent').length  },
    { name: 'Timeline', value: goals.filter(g => g.uom_type === 'timeline').length },
    { name: 'Zero',     value: goals.filter(g => g.uom_type === 'zero').length     },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Goals by UoM Type</h3>
      <p className="text-xs text-gray-400 mb-4">Distribution of measurement types</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" name="Goals" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Score Summary

function ScoreSummary({ checkins }) {
  const scores   = checkins.filter(c => c.score !== null).map(c => c.score)
  const avgScore = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 0

  const byQuarter = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
    name:  q,
    score: (() => {
      const qs = checkins.filter(c => c.quarter === q && c.score !== null)
      return qs.length
        ? parseFloat((qs.reduce((a, b) => a + b.score, 0) / qs.length).toFixed(1))
        : 0
    })()
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Average Score by Quarter</h3>
      <p className="text-xs text-gray-400 mb-4">
        Overall avg score: <strong>{avgScore}%</strong> across {scores.length} check-ins
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={byQuarter} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="score" name="Avg Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Main Analytics Component

export default function Analytics() {
  const [goals,    setGoals]    = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      API.get('/goals/admin/all'),
      API.get('/checkins/admin/all')
    ])
    .then(([goalsRes, checkinsRes]) => {
      setGoals(goalsRes.data)
      setCheckins(checkinsRes.data)
    })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <p className="text-gray-400 text-sm">Loading analytics...</p>
  )

  return (
    <div className="space-y-6">

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Goals',     value: goals.length,                                          color: 'text-gray-800'   },
          { label: 'Approved',        value: goals.filter(g => g.status === 'approved').length,     color: 'text-green-600'  },
          { label: 'Total Check-ins', value: checkins.length,                                       color: 'text-blue-600'   },
          { label: 'Avg Score',       value: checkins.length
              ? (checkins.filter(c=>c.score).reduce((a,b)=>a+b.score,0)/checkins.filter(c=>c.score).length).toFixed(1)+'%'
              : '—',                                                                                 color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-6">
        <GoalsByStatus    goals={goals} />
        <GoalsByThrustArea goals={goals} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6">
        <GoalsByUoM    goals={goals} />
        <ScoreSummary  checkins={checkins} />
      </div>

    </div>
  )
}