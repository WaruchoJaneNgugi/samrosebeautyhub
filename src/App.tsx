import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import heroFallback from './assets/hero.png'
import './App.css'

const WHATSAPP_NUMBER = '254700000000'

type Service = { id: string; name: string; price: number; duration: string; category: string }
type Category = { id: string; name: string }

const REVIEWS = [
  { name: 'Amina W.', text: 'Best braids in town! Will definitely come back.' },
  { name: 'Grace M.', text: 'Fast service and very friendly staff. Loved it!' },
  { name: 'Fatuma A.', text: 'My nails have never looked this good. 10/10!' },
]

export default function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [heroUrl, setHeroUrl] = useState(heroFallback)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState<Service[]>([])

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'categories'), snap =>
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
    )
    const unsub2 = onSnapshot(collection(db, 'services'), snap =>
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))
    )
    getDoc(doc(db, 'settings', 'hero')).then(d => {
      if (d.exists()) setHeroUrl(d.data().url)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const allCategories = ['All', ...categories.map(c => c.name)]
  const filtered = activeCategory === 'All' ? services : services.filter(s => s.category === activeCategory)
  const total = selected.reduce((sum, s) => sum + s.price, 0)

  const toggle = (service: Service) =>
    setSelected(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    )

  const bookOnWhatsApp = () => {
    const lines = selected.map(s => `• ${s.name} – KSh ${s.price.toLocaleString()}`).join('%0A')
    const msg = `Hi, I'd like to book:%0A${lines}%0ATotal: KSh ${total.toLocaleString()}%0APreferred time: ___`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1 className="gold">Samrose Beauty Hub</h1>
          <p className="tagline">Book your appointment instantly on WhatsApp</p>
        </div>
        <a className="btn-wa" href={waLink} target="_blank" rel="noreferrer">💬 Chat on WhatsApp</a>
      </header>

      <section className="hero">
        <img src={heroUrl} alt="Salon" />
        <div className="hero-overlay">
          <p>Look Good. Feel Confident.</p>
          <a className="btn-primary" href="#services">View Services</a>
        </div>
      </section>

      <div className="tabs" id="services">
        {allCategories.map(cat => (
          <button
            key={cat}
            className={`tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="services">
        {filtered.map(service => {
          const isSelected = !!selected.find(s => s.id === service.id)
          return (
            <div key={service.id} className={`card glass ${isSelected ? 'selected' : ''}`}>
              <div>
                <h3>{service.name}</h3>
                <span className="duration">⏱ {service.duration}</span>
              </div>
              <div className="card-bottom">
                <strong>KSh {service.price.toLocaleString()}</strong>
                <button className={`btn-add ${isSelected ? 'added' : ''}`} onClick={() => toggle(service)}>
                  {isSelected ? '✓ Added' : '+ Add'}
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {selected.length > 0 && (
        <div className="panel glass">
          <h3>Your Booking</h3>
          <ul>
            {selected.map(s => (
              <li key={s.id}>
                <span>{s.name}</span>
                <span>KSh {s.price.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="total">Total: <strong>KSh {total.toLocaleString()}</strong></div>
          <button className="btn-book" onClick={bookOnWhatsApp}>📲 Book via WhatsApp</button>
        </div>
      )}

      <section className="hours glass">
        <h2>Business Hours</h2>
        <p>Mon – Sat: 9am – 8pm</p>
        <p>Sunday: Closed</p>
        <p className="walkin">Walk-ins &amp; bookings available</p>
      </section>

      <section className="reviews">
        <h2>What Clients Say</h2>
        <div className="review-grid">
          {REVIEWS.map((r, i) => (
            <div key={i} className="review glass">
              <p>⭐⭐⭐⭐⭐</p>
              <p>"{r.text}"</p>
              <strong>— {r.name}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="location glass">
        <h2>Find Us</h2>
        <p>📍 Nairobi, Kenya</p>
        <a className="btn-wa" href={waLink} target="_blank" rel="noreferrer">💬 WhatsApp Us</a>
      </section>

      <div className="sticky-bar">
        <button className="btn-book" onClick={() => selected.length ? bookOnWhatsApp() : window.open(waLink, '_blank')}>
          📲 Book Now on WhatsApp
        </button>
      </div>
    </div>
  )
}
