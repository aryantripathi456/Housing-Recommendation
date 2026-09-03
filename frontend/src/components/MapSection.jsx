import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getConfig } from '../services/api'

const FALLBACK_TOKEN = ''

function getPriceColor(rent) {
  if (rent <= 15000) return '#22c55e'
  if (rent <= 30000) return '#3b82f6'
  if (rent <= 50000) return '#f97316'
  return '#ef4444'
}

export default function MapSection({ properties, onSelectProperty }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const initMap = (token) => {
      mapboxgl.accessToken = token
      try {
        const m = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [73.2, 18.9],
          zoom: 10,
        })
        m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        m.addControl(new mapboxgl.ScaleControl(), 'bottom-right')
        m.on('error', () => setMapError(true))
        map.current = m
      } catch (e) {
        setMapError(true)
      }
    }

    getConfig().then((c) => initMap(c.mapbox_token || FALLBACK_TOKEN)).catch(() => initMap(FALLBACK_TOKEN))
  }, [])

  const updateMarkers = useCallback(() => {
    if (!map.current || !properties.length) return
    markers.current.forEach((m) => m.remove())
    markers.current = []
    const bounds = new mapboxgl.LngLatBounds()

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return
      const color = getPriceColor(p.rent || 0)
      const name = p.name || ''

      const el = document.createElement('div')
      el.style.cssText = `
        background: ${color};
        color: white;
        padding: 5px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        white-space: nowrap;
        text-align: center;
        border: 2.5px solid white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `
      el.innerHTML = `₹${((p.rent || 0) / 1000).toFixed(0)}K`
      el.title = `${name} - ₹${(p.rent || 0).toLocaleString()}/mo`
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.12)'; el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)' })

      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, maxWidth: '220px' }).setHTML(`
        <div style="min-width: 150px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px; font-family: 'Plus Jakarta Sans', sans-serif;">${name}</div>
          <div style="font-size: 11px; color: #94a3b8;">${p.locality || ''}, ${p.city || ''}</div>
          <div style="font-size: 14px; font-weight: 700; color: ${color}; margin-top: 6px;">₹${(p.rent || 0).toLocaleString()}/mo</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${p.bedrooms || ''} BHK · ${p.area_sqft || ''} sq ft</div>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([p.longitude, p.latitude]).setPopup(popup).addTo(map.current)
      el.addEventListener('click', () => onSelectProperty(p))
      markers.current.push(marker)
      bounds.extend([p.longitude, p.latitude])
    })

    if (markers.current.length > 0) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 13 })
    }
  }, [properties, onSelectProperty])

  useEffect(() => { updateMarkers() }, [updateMarkers])

  return (
    <section id="map" className="section">
      <div className="container">
        <div className="reveal">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">Interactive Map</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              Explore Properties on the Map
            </h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">Color-coded by rent range — green is budget-friendly, blue is moderate, orange is premium.</p>
          </div>

          <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-200/60" style={{ height: '520px' }}>
            {mapError ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Map unavailable</p>
                  <p className="text-xs text-slate-400">Check Mapbox token in backend .env</p>
                </div>
              </div>
            ) : (
              <div ref={mapContainer} className="w-full h-full" />
            )}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-slate-200/50 shadow-lg flex items-center gap-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>Under ₹15K</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>₹15K–30K</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>₹30K–50K</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>₹50K+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
