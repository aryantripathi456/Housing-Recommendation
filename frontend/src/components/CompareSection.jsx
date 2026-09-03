import { useState, useEffect } from 'react'
import { getLiveability } from '../services/api'

export default function CompareSection({ properties, onRemove }) {
  const [liveData, setLiveData] = useState({})

  useEffect(() => {
    properties.forEach((p) => {
      const id = p.property_id || p.id
      if (!liveData[id] && !p.liveability) {
        getLiveability(id).then((data) => {
          setLiveData((prev) => ({ ...prev, [id]: data }))
        }).catch(() => {})
      }
    })
  }, [properties])

  const getLive = (p) => {
    const id = p.property_id || p.id
    return p.liveability || liveData[id] || {}
  }

  if (!properties.length) return null

  const rows = [
    { label: 'Rent', format: (p) => p.rent ? `₹${p.rent.toLocaleString()}/mo` : 'N/A' },
    { label: 'Bedrooms', format: (p) => p.bedrooms ? `${p.bedrooms} BHK` : 'N/A' },
    { label: 'Area', format: (p) => p.area_sqft ? `${p.area_sqft} sqft` : 'N/A' },
    { label: 'Match Score', format: (p) => p.match_score != null ? `${p.match_score.toFixed(0)}%` : 'N/A', highlight: 'max', value: (p) => p.match_score },
    { label: 'Liveability', format: (p) => { const l = getLive(p); return l.overall != null ? `${l.overall.toFixed(0)}/100` : 'N/A' }, highlight: 'max', value: (p) => getLive(p).overall },
    { label: 'Transport', format: (p) => getLive(p).transport != null ? getLive(p).transport.toFixed(0) : 'N/A', highlight: 'max', value: (p) => getLive(p).transport },
    { label: 'Education', format: (p) => getLive(p).education != null ? getLive(p).education.toFixed(0) : 'N/A', highlight: 'max', value: (p) => getLive(p).education },
    { label: 'Healthcare', format: (p) => getLive(p).healthcare != null ? getLive(p).healthcare.toFixed(0) : 'N/A', highlight: 'max', value: (p) => getLive(p).healthcare },
    { label: 'Commute', format: (p) => p.commute?.transit_minutes != null ? `${p.commute.transit_minutes} min` : 'N/A', highlight: 'min', value: (p) => p.commute?.transit_minutes },
    { label: 'Amenities', format: (p) => p.amenities?.length ? p.amenities.join(', ') : 'N/A' },
  ]

  const getBest = (row) => {
    if (!row.highlight || !row.value) return -1
    let best = -1, bestVal = row.highlight === 'max' ? -Infinity : Infinity
    properties.forEach((p, i) => {
      const v = row.value(p)
      if (v == null) return
      if (row.highlight === 'max' && v > bestVal) { bestVal = v; best = i }
      if (row.highlight === 'min' && v < bestVal) { bestVal = v; best = i }
    })
    return best
  }

  return (
    <section id="compare" className="section-sm bg-gradient-to-b from-slate-50/50 to-white">
      <div className="container">
        <div className="reveal">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">Comparison</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              Side-by-Side Comparison
            </h2>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-5 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider w-44 rounded-tl-[28px]">Metric</th>
                  {properties.map((p, i) => (
                    <th key={p.property_id || p.id} className={`p-5 bg-slate-50 text-center min-w-[200px] ${i === properties.length - 1 ? 'rounded-tr-[28px]' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>{p.property_name || p.name}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{p.locality}, {p.city}</span>
                        <button onClick={() => onRemove(p)} className="text-[10px] text-red-400 hover:text-red-500 mt-1.5 font-medium transition-colors">Remove</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const best = getBest(row)
                  return (
                    <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">{row.label}</td>
                      {properties.map((p, i) => (
                        <td key={p.property_id || p.id} className={`p-4 text-center text-sm font-medium border-t border-slate-100 ${i === best ? 'bg-emerald-50/80 text-emerald-700 font-bold' : 'text-slate-600'}`}>
                          {row.format(p)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
