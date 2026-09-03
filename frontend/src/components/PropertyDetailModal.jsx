import { useState, useEffect } from 'react'
import { getLiveability, getPriceTrends } from '../services/api'
import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip)

export default function PropertyDetailModal({ property, onClose, onCompare, persona }) {
  const [liveability, setLiveability] = useState(null)
  const [trends, setTrends] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const id = property.property_id || property.id
    Promise.all([
      getLiveability(id).catch(() => null),
      getPriceTrends(id).catch(() => []),
    ]).then(([live, t]) => {
      setLiveability(live)
      setTrends(t)
    })
  }, [property])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const radarData = liveability ? {
    labels: ['Transport', 'Education', 'Healthcare', 'Shopping', 'Environment'],
    datasets: [{
      data: [liveability.transport, liveability.education, liveability.healthcare, liveability.shopping, liveability.environment],
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderColor: 'rgba(99, 102, 241, 0.7)',
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      borderWidth: 2,
    }],
  } : null

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false, stepSize: 20 },
        grid: { color: 'rgba(0,0,0,0.04)' },
        pointLabels: { font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' }, color: '#64748b' },
      },
    },
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'liveability', label: 'Liveability' },
    { key: 'commute', label: 'Commute' },
    { key: 'trends', label: 'Price Trends' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>{property.name || property.property_name}</h2>
            <p className="text-xs text-slate-400">{property.locality}, {property.city}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCompare(property)}
              className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-xs font-semibold text-slate-600 hover:text-indigo-600 rounded-xl transition-all"
            >
              + Compare
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative py-3 px-4 text-xs font-semibold transition-colors ${
                activeTab === t.key ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {activeTab === t.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Rent', value: `₹${property.rent?.toLocaleString()}`, sub: '/month' },
                  { label: 'Bedrooms', value: property.bedrooms, sub: 'BHK' },
                  { label: 'Area', value: property.area_sqft?.toLocaleString(), sub: 'sqft' },
                  { label: 'Type', value: property.property_type || 'N/A', sub: '' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                    <div className="text-xs text-slate-400 font-medium mb-1">{label}</div>
                    <div className="text-xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>{value}</div>
                    {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
                  </div>
                ))}
              </div>

              {property.amenities?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span key={a} className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-xl capitalize">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.match_score != null && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recommendation Scores</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-extrabold text-indigo-600" style={{ fontFamily: 'var(--font-display)' }}>{property.match_score?.toFixed(0)}%</div>
                      <div className="text-[10px] text-slate-500">Match Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-purple-600" style={{ fontFamily: 'var(--font-display)' }}>{property.price_score?.toFixed(0)}%</div>
                      <div className="text-[10px] text-slate-500">Price Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-pink-600" style={{ fontFamily: 'var(--font-display)' }}>{property.commute_score?.toFixed(0)}%</div>
                      <div className="text-[10px] text-slate-500">Commute Score</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'liveability' && (
            <div className="space-y-6 animate-fade-in-up">
              {liveability ? (
                <>
                  <div className="text-center">
                    <div className="text-5xl font-extrabold text-indigo-600" style={{ fontFamily: 'var(--font-display)' }}>{liveability.overall?.toFixed(1)}</div>
                    <div className="text-xs text-slate-400 mt-1">Overall Liveability Score</div>
                  </div>
                  <div className="h-[280px]">
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Transport', value: liveability.transport, color: 'bg-blue-500' },
                      { label: 'Education', value: liveability.education, color: 'bg-purple-500' },
                      { label: 'Healthcare', value: liveability.healthcare, color: 'bg-red-500' },
                      { label: 'Shopping', value: liveability.shopping, color: 'bg-amber-500' },
                      { label: 'Environment', value: liveability.environment, color: 'bg-emerald-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                          <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500">{label}</div>
                        <div className="text-sm font-bold text-slate-700">{value?.toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="skeleton w-32 h-32 rounded-full mx-auto mb-4" />
                  <p className="text-sm text-slate-400">Loading liveability data...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'commute' && (
            <div className="space-y-6 animate-fade-in-up">
              {property.commute ? (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Driving', value: property.commute.driving_minutes, unit: 'min', icon: '🚗', color: 'from-orange-50 to-amber-50 border-orange-200' },
                    { label: 'Transit', value: property.commute.transit_minutes, unit: 'min', icon: '🚇', color: 'from-blue-50 to-indigo-50 border-blue-200' },
                    { label: 'Walking', value: property.commute.walking_minutes, unit: 'min', icon: '🚶', color: 'from-emerald-50 to-teal-50 border-emerald-200' },
                  ].map(({ label, value, unit, icon, color }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5 text-center`}>
                      <span className="text-2xl block mb-2">{icon}</span>
                      <div className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>{value ?? 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{value != null ? unit : 'No data'}</div>
                      <div className="text-xs font-semibold text-slate-600 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No commute data</p>
                  <p className="text-xs text-slate-400">Use the Recommend feature with a workplace location to see commute times</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4 animate-fade-in-up">
              {trends.length > 0 ? (
                <>
                  <div className="h-[200px] relative">
                    <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const rents = trends.map((t) => t.avg_rent)
                        const min = Math.min(...rents) * 0.95
                        const max = Math.max(...rents) * 1.05
                        const range = max - min || 1
                        const w = 400 / (trends.length - 1 || 1)
                        const points = trends.map((t, i) => `${i * w},${150 - ((t.avg_rent - min) / range) * 130}`)
                        return (
                          <>
                            <polygon points={`0,150 ${points.join(' ')} ${(trends.length - 1) * w},150`} fill="url(#trendGrad)" />
                            <polyline points={points.join(' ')} fill="none" stroke="rgb(99,102,241)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((pt, i) => {
                              const [x, y] = pt.split(',')
                              return <circle key={i} cx={x} cy={y} r="3.5" fill="rgb(99,102,241)" stroke="white" strokeWidth="2" />
                            })}
                          </>
                        )
                      })()}
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Latest</div>
                      <div className="text-sm font-bold text-slate-800">₹{trends[trends.length - 1]?.avg_rent?.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">6 Months Ago</div>
                      <div className="text-sm font-bold text-slate-800">₹{trends[trends.length - 7]?.avg_rent?.toLocaleString() || trends[0]?.avg_rent?.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Trend</div>
                      <div className={`text-sm font-bold ${trends[trends.length - 1]?.avg_rent >= trends[0]?.avg_rent ? 'text-red-500' : 'text-emerald-500'}`}>
                        {trends[trends.length - 1]?.avg_rent >= trends[0]?.avg_rent ? '↑' : '↓'} {Math.abs(((trends[trends.length - 1]?.avg_rent - trends[0]?.avg_rent) / trends[0]?.avg_rent) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400">Loading price trends...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
