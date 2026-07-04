import { useState, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isConfigured } from './firebase'

const LOCAL_USER = { uid: 'local', displayName: 'Usuario Local', photoURL: null }
import { SABADO_ITEMS, SEMANA_ITEMS, getWeekKey, defaultChecklistState } from './defaultData'
import './App.css'

function loadLocal(weekKey) {
  try {
    const raw = localStorage.getItem('vp-' + weekKey)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveLocal(weekKey, state) {
  localStorage.setItem('vp-' + weekKey, JSON.stringify(state))
}

export default function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  const [user, setUser] = useState(undefined)
  const [syncing, setSyncing] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [dataReady, setDataReady] = useState(false)
  const [state, setState] = useState(defaultChecklistState())
  const [otroInput, setOtroInput] = useState('')

  const weekKey = useRef(getWeekKey()).current
  const firestoreUnsubRef = useRef(null)

  useEffect(() => {
    if (!isConfigured) { setUser(null); return }
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      if (!u) {
        if (firestoreUnsubRef.current) { firestoreUnsubRef.current(); firestoreUnsubRef.current = null }
        setState(loadLocal(weekKey) ?? defaultChecklistState())
        setDataReady(true)
      }
    })
    return unsub
  }, [weekKey])

  useEffect(() => {
    if (!user || !isConfigured) return
    setSyncing(true)
    const ref = doc(db, 'users', user.uid, 'checklists', weekKey)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setState(snap.data())
      } else {
        const local = loadLocal(weekKey) ?? defaultChecklistState()
        setDoc(ref, local)
      }
      setDataReady(true)
      setSyncing(false)
    })
    firestoreUnsubRef.current = unsub
    return () => { unsub(); firestoreUnsubRef.current = null }
  }, [user, weekKey])

  function persist(next) {
    setState(next)
    saveLocal(weekKey, next)
    if (user && isConfigured) {
      setSyncing(true)
      setDoc(doc(db, 'users', user.uid, 'checklists', weekKey), next)
        .finally(() => setSyncing(false))
    }
  }

  async function handleLogin() {
    if (!isConfigured) {
      setState(loadLocal(weekKey) ?? defaultChecklistState())
      setDataReady(true)
      setUser(LOCAL_USER)
      return
    }
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setAuthError(`No se pudo iniciar sesión (${e.code || e.message}).`)
    }
  }

  function handleLogout() {
    if (isConfigured) signOut(auth)
    setUser(undefined)
    setDataReady(false)
  }

  function toggleItem(section, item) {
    const next = { ...state, [section]: { ...state[section], [item]: !state[section]?.[item] } }
    persist(next)
  }

  function toggleOtro(idx) {
    const otros = state.otros.map((o, i) => i === idx ? { ...o, done: !o.done } : o)
    persist({ ...state, otros })
  }

  function deleteOtro(idx) {
    const otros = state.otros.filter((_, i) => i !== idx)
    persist({ ...state, otros })
  }

  function addOtro() {
    const text = otroInput.trim()
    if (!text) return
    persist({ ...state, otros: [...state.otros, { text, done: false }] })
    setOtroInput('')
  }

  function resetSection(section) {
    if (section === 'otros') persist({ ...state, otros: [] })
    else persist({ ...state, [section]: {} })
  }

  const sabDone = SABADO_ITEMS.filter(i => state.sabado?.[i]).length
  const semDone = SEMANA_ITEMS.filter(i => state.semana?.[i]).length
  const otrosDone = state.otros.filter(o => o.done).length
  const total = SABADO_ITEMS.length + SEMANA_ITEMS.length + state.otros.length
  const done = sabDone + semDone + otrosDone
  const totalPct = total ? Math.round((done / total) * 100) : 0

  const weekLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  if (user === undefined) {
    return <div className="app loading"><span>Cargando...</span></div>
  }

  if (!user) {
    return (
      <div className="app login-screen">
        <div className="login-box">
          <div className="login-icon">⚽</div>
          <h1>Vida Plena</h1>
          <p className="subtitle">Training Session Checklist</p>
          <p>Inicia sesión para sincronizar tu checklist en todos tus dispositivos.</p>
          {!isConfigured && (
            <p className="config-warning">
              ⚠️ Firebase no está configurado todavía. Por ahora los datos se guardan solo en este dispositivo.
            </p>
          )}
          {authError && <p className="auth-error">{authError}</p>}
          <button className="btn-google" onClick={handleLogin}>
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {isConfigured ? 'Continuar con Google' : 'Continuar'}
          </button>
        </div>
      </div>
    )
  }

  if (!dataReady) {
    return <div className="app loading"><span>Sincronizando...</span></div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚽ Vida Plena</h1>
        <p className="subtitle">Training Session Checklist</p>
        <div className="week-badge">Semana del {weekLabel}</div>
        <div className="user-row">
          {user.photoURL && <img className="user-avatar" src={user.photoURL} alt="" />}
          <span className="user-name">{user.displayName || user.email}</span>
          <button className="signout-btn" onClick={handleLogout}>Salir</button>
        </div>
        <div className="sync-indicator">
          {syncing && <><span className="spinner" /> Sincronizando...</>}
        </div>
      </header>

      <Section
        icon="📦" title="Para el Sábado"
        items={SABADO_ITEMS} doneMap={state.sabado}
        onToggle={item => toggleItem('sabado', item)}
        onReset={() => resetSection('sabado')}
      />

      <Section
        icon="📋" title="Entre Semana"
        items={SEMANA_ITEMS} doneMap={state.semana}
        onToggle={item => toggleItem('semana', item)}
        onReset={() => resetSection('semana')}
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🗒️</span> Otros</div>
          <span className="progress-text">
            {state.otros.length ? `${otrosDone}/${state.otros.length}` : ''}
          </span>
        </div>
        <div>
          {state.otros.map((o, idx) => (
            <div key={idx} className={'otros-item' + (o.done ? ' done' : '')}>
              <div className="check-box" onClick={() => toggleOtro(idx)} />
              <span className="otros-text" onClick={() => toggleOtro(idx)}>{o.text}</span>
              <button className="delete-btn" onClick={() => deleteOtro(idx)}>✕</button>
            </div>
          ))}
        </div>
        <div className="otros-input-row">
          <input
            type="text"
            placeholder="Agregar tarea..."
            value={otroInput}
            onChange={e => setOtroInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addOtro() }}
          />
          <button onClick={addOtro}>+ Agregar</button>
        </div>
        <div className="reset-row">
          <button className="reset-btn" onClick={() => resetSection('otros')}>↺ Reiniciar</button>
        </div>
      </div>

      <div className="summary">
        <div className="summary-item"><div className="num">{sabDone}/{SABADO_ITEMS.length}</div><div className="label">Sábado</div></div>
        <div className="divider" />
        <div className="summary-item"><div className="num">{semDone}/{SEMANA_ITEMS.length}</div><div className="label">Semana</div></div>
        <div className="divider" />
        <div className="summary-item"><div className="num">{otrosDone}/{state.otros.length || 0}</div><div className="label">Otros</div></div>
        <div className="divider" />
        <div className="summary-item"><div className="num">{totalPct}%</div><div className="label">Total</div></div>
      </div>

      {needRefresh && (
        <div className="update-banner">
          <span>Nueva versión disponible</span>
          <button onClick={() => updateServiceWorker(true)}>Actualizar</button>
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, items, doneMap, onToggle, onReset }) {
  const done = items.filter(i => doneMap?.[i]).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span>{icon}</span> {title}</div>
        <span className="progress-text">{done}/{items.length}</span>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      <ul className="checklist">
        {items.map(item => (
          <li key={item} className={doneMap?.[item] ? 'done' : ''} onClick={() => onToggle(item)}>
            <div className="check-box" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="reset-row">
        <button className="reset-btn" onClick={onReset}>↺ Reiniciar</button>
      </div>
    </div>
  )
}
