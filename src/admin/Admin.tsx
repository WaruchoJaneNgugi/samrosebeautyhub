import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, setDoc, getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import './Admin.css'

type Category = { id: string; name: string }
type Service = { id: string; name: string; price: number; duration: string; category: string; imageUrl?: string }

export default function Admin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [heroUrl, setHeroUrl] = useState('')
  const [catName, setCatName] = useState('')
  const [svc, setSvc] = useState({ name: '', price: '', duration: '', category: '' })
  const [svcImage, setSvcImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'categories' | 'services' | 'hero'>('categories')
  const fileRef = useRef<HTMLInputElement>(null)
  const svcFileRef = useRef<HTMLInputElement>(null)

  // Live listeners
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

  const addCategory = async () => {
    if (!catName.trim()) return
    await addDoc(collection(db, 'categories'), { name: catName.trim() })
    setCatName('')
  }

  const deleteCategory = (id: string) => deleteDoc(doc(db, 'categories', id))

  const addService = async () => {
    if (!svc.name || !svc.price || !svc.category) return
    setUploading(true)
    let imageUrl = ''
    if (svcImage) {
      const storageRef = ref(storage, `services/${Date.now()}_${svcImage.name}`)
      await uploadBytes(storageRef, svcImage)
      imageUrl = await getDownloadURL(storageRef)
    }
    await addDoc(collection(db, 'services'), { ...svc, price: Number(svc.price), imageUrl })
    setSvc({ name: '', price: '', duration: '', category: '' })
    setSvcImage(null)
    setUploading(false)
  }

  const deleteService = (id: string) => deleteDoc(doc(db, 'services', id))

  const uploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const storageRef = ref(storage, 'hero/hero.jpg')
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await setDoc(doc(db, 'settings', 'hero'), { url })
    setHeroUrl(url)
    setUploading(false)
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>⚙️ <span className="gold">Admin Panel</span></h1>
        <p>Samrose Beauty Hub</p>
      </header>

      <div className="admin-tabs">
        {(['categories', 'services', 'hero'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <section className="admin-section glass">
          <h2>Categories</h2>
          <div className="input-row">
            <input
              placeholder="Category name (e.g. Hair)"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
            <button className="btn-gold" onClick={addCategory}>Add</button>
          </div>
          <ul className="item-list">
            {categories.map(c => (
              <li key={c.id}>
                <span>{c.name}</span>
                <button className="btn-del" onClick={() => deleteCategory(c.id)}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* SERVICES */}
      {tab === 'services' && (
        <section className="admin-section glass">
          <h2>Services</h2>
          <div className="form-grid">
            <input placeholder="Service name" value={svc.name} onChange={e => setSvc(p => ({ ...p, name: e.target.value }))} />
            <input placeholder="Price (KSh)" type="number" value={svc.price} onChange={e => setSvc(p => ({ ...p, price: e.target.value }))} />
            <input placeholder="Duration (e.g. 1 hr)" value={svc.duration} onChange={e => setSvc(p => ({ ...p, duration: e.target.value }))} />
            <select value={svc.category} onChange={e => setSvc(p => ({ ...p, category: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => svcFileRef.current?.click()}>
            {svcImage ? `📷 ${svcImage.name}` : '📷 Add Image (Optional)'}
          </button>
          <input ref={svcFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSvcImage(e.target.files?.[0] || null)} />
          <button className="btn-gold full" onClick={addService} disabled={uploading}>
            {uploading ? 'Adding...' : 'Add Service'}
          </button>
          <ul className="item-list">
            {services.map(s => (
              <li key={s.id}>
                <div>
                  {s.imageUrl && <img src={s.imageUrl} alt={s.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }} />}
                  <div>
                    <strong>{s.name}</strong>
                    <span className="meta">KSh {s.price.toLocaleString()} · {s.duration} · {s.category}</span>
                  </div>
                </div>
                <button className="btn-del" onClick={() => deleteService(s.id)}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* HERO IMAGE */}
      {tab === 'hero' && (
        <section className="admin-section glass">
          <h2>Hero Image</h2>
          {heroUrl && <img src={heroUrl} alt="Hero" className="hero-preview" />}
          <button className="btn-gold full" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '📷 Upload New Hero Image'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadHero} />
        </section>
      )}
    </div>
  )
}
