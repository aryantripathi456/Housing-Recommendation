import { useState } from 'react'

const personas = [
  { key: 'student', label: 'Student', icon: '🎓', description: 'Budget-friendly near campuses', color: 'from-blue-500 to-cyan-500' },
  { key: 'professional', label: 'Professional', icon: '💼', description: 'Short commute, modern amenities', color: 'from-indigo-500 to-purple-500' },
  { key: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Schools, safety, space', color: 'from-emerald-500 to-teal-500' },
  { key: 'senior', label: 'Senior', icon: '🏡', description: 'Healthcare, quiet, accessible', color: 'from-orange-500 to-amber-500' },
]

export default function RecommendSection({ onRecommend, recommendations, loading, onSelectProperty, onCompare, comparedProperties, currentPersona }) {
  const [persona, setPersona] = useState('')
  const [budget, setBudget] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [income, setIncome] = useState('')

  const getCompared = (p) => comparedProperties.some((c) => (c.property_id || c.id) === (p.property_id || p.id))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!persona || !budget) return
    onRecommend({
      persona,
      budget: Number(budget),
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      monthly_income: income ? Number(income) : undefined,
    })
  }

  return (
    <section id="recommend" className="section">
      <div className="container">
        <div className="reveal">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">AI Recommendations</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              Personalized For You
            </h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">Choose your persona and budget to get ranked recommendations.</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {personas.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPersona(p.key)}
                  className={`relative p-5 rounded-[20px] text-left transition-all duration-300 border-2 ${
                    persona === p.key
                      ? 'border-indigo-400 bg-white shadow-xl shadow-indigo-500/10 scale-[1.02]'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg'
                  }`}
                >
                  <span className="text-2xl block mb-2">{p.icon}</span>
                  <span className="text-sm font-bold text-slate-800 block" style={{ fontFamily: 'var(--font-display)' }}>{p.label}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{p.description}</span>
                  {persona === p.key && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Monthly Budget</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 30000"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Any</option>
                    <option value={1}>1 BHK</option>
                    <option value={2}>2 BHK</option>
                    <option value={3}>3 BHK</option>
                    <option value={4}>4 BHK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Monthly Income</label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 60000"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!persona || !budget}
                  className="py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Finding...' : 'Find Best Match'}
                </button>
              </div>
            </div>
          </form>

          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm">{personas.find((p) => p.key === currentPersona)?.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
                  Top matches for {currentPersona}
                </h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{recommendations.length} results</span>
              </div>

              <div className="space-y-3">
                {recommendations.map((r, i) => (
                  <div
                    key={r.property_id || i}
                    className="reveal bg-white rounded-[20px] border border-slate-100 hover:border-indigo-200 p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                    style={{ transitionDelay: `${Math.min(i * 40, 200)}ms` }}
                    onClick={() => onSelectProperty(r)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/20">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-bold text-slate-800 truncate" style={{ fontFamily: 'var(--font-display)' }}>{r.name || r.property_name}</h4>
                        <p className="text-xs text-slate-400 truncate">{r.locality}, {r.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:gap-8">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">₹{r.rent?.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                        <div className="text-[10px] text-slate-400">{r.bedrooms} BHK · {r.area_sqft} sqft</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`text-lg font-extrabold ${r.match_score >= 60 ? 'text-emerald-600' : r.match_score >= 40 ? 'text-amber-600' : 'text-slate-600'}`} style={{ fontFamily: 'var(--font-display)' }}>
                            {r.match_score?.toFixed(0)}%
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium uppercase">Match</div>
                        </div>
                        {r.liveability_score != null && (
                          <div className="text-center">
                            <div className="text-lg font-extrabold text-indigo-600" style={{ fontFamily: 'var(--font-display)' }}>
                              {r.liveability_score?.toFixed(0)}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium uppercase">Live</div>
                          </div>
                        )}
                        {r.commute_score != null && (
                          <div className="text-center">
                            <div className="text-lg font-extrabold text-purple-600" style={{ fontFamily: 'var(--font-display)' }}>
                              {r.commute_score?.toFixed(0)}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium uppercase">Commute</div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onCompare(r) }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                          getCompared(r)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                        }`}
                      >
                        {getCompared(r) ? '✓' : '+ Compare'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
