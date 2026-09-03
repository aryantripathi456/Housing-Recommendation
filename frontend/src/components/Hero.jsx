import { useState } from 'react'

const cities = ['Mumbai', 'Pune']
const bedroomOptions = [
  { label: 'Any', value: '' },
  { label: '1 BHK', value: 1 },
  { label: '2 BHK', value: 2 },
  { label: '3 BHK', value: 3 },
  { label: '4 BHK', value: 4 },
]

export default function Hero({ onSearch, propertyCount }) {
  const [city, setCity] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [minRent, setMinRent] = useState('')
  const [maxRent, setMaxRent] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch({ city, bedrooms, min_rent: minRent, max_rent: maxRent })
  }

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50/30" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12 text-center pt-24 pb-16">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl px-4 py-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">{propertyCount} properties available</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.2s', fontFamily: 'var(--font-display)' }}
        >
          Find Your Perfect{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Home
          </span>
        </h1>

        <p
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          AI-powered real estate intelligence. Compare liveability, commute times, and neighborhood scores — all in one place.
        </p>

        <form onSubmit={handleSearch} className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 p-3 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>

              <div className="flex-1 flex gap-2">
                {bedroomOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setBedrooms(opt.value)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                      bedrooms === opt.value
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  className="w-28 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="w-28 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 border-0 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-center gap-8 mt-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {[
            { label: 'Properties', value: propertyCount, icon: '🏠' },
            { label: 'Cities', value: '2', icon: '🏙️' },
            { label: 'POI Data', value: '7,600+', icon: '📍' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center">
              <span className="text-2xl block mb-1">{icon}</span>
              <span className="text-xl font-bold text-slate-800 block" style={{ fontFamily: 'var(--font-display)' }}>{value}</span>
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
