export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span> Housing
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered real estate analytics platform. Make informed housing decisions with liveability scores, commute analysis, and personalized recommendations.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-300" style={{ fontFamily: 'var(--font-display)' }}>Features</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#map" className="hover:text-white transition-colors">Live Map</a></li>
                <li><a href="#properties" className="hover:text-white transition-colors">Browse Properties</a></li>
                <li><a href="#recommend" className="hover:text-white transition-colors">AI Recommendations</a></li>
                <li><a href="#compare" className="hover:text-white transition-colors">Compare</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-300" style={{ fontFamily: 'var(--font-display)' }}>Cities</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><span className="hover:text-white transition-colors cursor-pointer">Mumbai</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Pune</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© 2026 AI Housing Intelligence Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            Built with <span className="text-red-400 mx-0.5">♥</span> using React + FastAPI + Mapbox
          </div>
        </div>
      </div>
    </footer>
  )
}
