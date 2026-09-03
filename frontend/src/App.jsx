import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MapSection from './components/MapSection'
import PropertiesSection from './components/PropertiesSection'
import RecommendSection from './components/RecommendSection'
import CompareSection from './components/CompareSection'
import Footer from './components/Footer'
import PropertyDetailModal from './components/PropertyDetailModal'
import { getProperties, getRecommendations, getMapData } from './services/api'

function App() {
  const [properties, setProperties] = useState([])
  const [mapData, setMapData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [persona, setPersona] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ city: '', bedrooms: '', min_rent: '', max_rent: '' })
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [comparedProperties, setComparedProperties] = useState([])

  const propertiesRef = useRef(null)
  const mapRef = useRef(null)
  const recommendRef = useRef(null)
  const compareRef = useRef(null)

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const loadProperties = useCallback(async (f) => {
    setLoading(true)
    try {
      const params = f || {}
      const [props, map] = await Promise.all([
        getProperties(params).catch(() => []),
        getMapData().catch(() => []),
      ])
      setProperties(props)
      setMapData(map)
    } catch (err) {
      console.error('Failed to load properties:', err)
    }
    setLoading(false)
  }, [])

  const loadRecommendations = useCallback(async (params) => {
    setLoading(true)
    try {
      const data = await getRecommendations(params)
      setRecommendations(data)
      setPersona(params.persona)
      setTimeout(() => scrollTo(recommendRef), 100)
    } catch (err) {
      console.error('Failed to load recommendations:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProperties({})
  }, [loadProperties])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [properties, recommendations])

  const toggleCompare = useCallback((property) => {
    setComparedProperties((prev) => {
      const id = property.property_id || property.id
      const exists = prev.find((p) => (p.property_id || p.id) === id)
      if (exists) return prev.filter((p) => (p.property_id || p.id) !== id)
      if (prev.length >= 3) return prev
      return [...prev, property]
    })
  }, [])

  const handleSearch = (newFilters) => {
    setFilters(newFilters)
    loadProperties(newFilters)
    setTimeout(() => scrollTo(propertiesRef), 100)
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onNavigate={{ properties: () => scrollTo(propertiesRef), map: () => scrollTo(mapRef), recommend: () => scrollTo(recommendRef), compare: () => scrollTo(compareRef) }}
      />
      <Hero onSearch={handleSearch} propertyCount={properties.length} />
      <div ref={mapRef}>
        <MapSection properties={mapData} onSelectProperty={setSelectedProperty} />
      </div>
      <div ref={propertiesRef}>
        <PropertiesSection
          properties={properties}
          loading={loading}
          onSelectProperty={setSelectedProperty}
          onCompare={toggleCompare}
          comparedProperties={comparedProperties}
        />
      </div>
      <div ref={recommendRef}>
        <RecommendSection
          onRecommend={loadRecommendations}
          recommendations={recommendations}
          loading={loading}
          onSelectProperty={setSelectedProperty}
          onCompare={toggleCompare}
          comparedProperties={comparedProperties}
          currentPersona={persona}
        />
      </div>
      {comparedProperties.length > 0 && (
        <div ref={compareRef}>
          <CompareSection
            properties={comparedProperties}
            onRemove={toggleCompare}
          />
        </div>
      )}
      <Footer />

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onCompare={toggleCompare}
          persona={persona}
        />
      )}
    </div>
  )
}

export default App
