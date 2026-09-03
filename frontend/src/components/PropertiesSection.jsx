export default function PropertiesSection({ properties, loading, onSelectProperty, onCompare, comparedProperties }) {
  const getCompared = (p) => comparedProperties.some((c) => (c.property_id || c.id) === (p.property_id || p.id))

  return (
    <section id="properties" className="section bg-gradient-to-b from-white to-slate-50/50">
      <div className="container">
        <div className="reveal">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">Browse</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              Available Properties
            </h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">All properties across Mumbai and Pune with live data.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
                  <div className="skeleton h-4 w-32 rounded-lg" />
                  <div className="skeleton h-3 w-20 rounded-lg" />
                  <div className="flex gap-2 mt-4">
                    <div className="skeleton h-8 w-20 rounded-xl" />
                    <div className="skeleton h-8 w-16 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-lg font-bold text-slate-600">No properties found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p, i) => (
                <div
                  key={p.property_id || p.id || i}
                  className="reveal group bg-white rounded-[24px] border border-slate-100 hover:border-indigo-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                  style={{ transitionDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {p.name || p.property_name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{p.locality}, {p.city}</p>
                    </div>
                    {p.liveability_overall != null && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        p.liveability_overall >= 70 ? 'bg-emerald-50 text-emerald-600' :
                        p.liveability_overall >= 50 ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {Math.round(p.liveability_overall)}
                      </span>
                    )}
                  </div>

                  <div className="text-2xl font-extrabold text-slate-800 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    ₹{p.rent?.toLocaleString()}<span className="text-sm font-medium text-slate-400">/mo</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      {p.bedrooms} BHK
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {p.area_sqft?.toLocaleString()} sqft
                    </span>
                    {p.property_type && (
                      <span className="inline-flex items-center bg-indigo-50 rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-600 capitalize">
                        {p.property_type}
                      </span>
                    )}
                  </div>

                  {p.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-[10px] font-medium bg-slate-50 text-slate-500 rounded-lg px-2 py-1 capitalize">{a}</span>
                      ))}
                      {p.amenities.length > 3 && (
                        <span className="text-[10px] font-medium text-slate-400 rounded-lg px-2 py-1">+{p.amenities.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectProperty(p) }}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-indigo-50 text-xs font-semibold text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCompare(p) }}
                      className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        getCompared(p)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      {getCompared(p) ? '✓' : '+ Compare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
