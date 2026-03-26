import { useState } from 'react'

const USERS = [
  { id: 'u1', name: 'Ishita (Admin)', role: 'admin',      pw: 'admin123' },
  { id: 'u2', name: 'Rahul',          role: 'marketing',  pw: 'mkt123'   },
  { id: 'u3', name: 'Suresh',         role: 'production', pw: 'prod123'  },
  { id: 'u4', name: 'Dinesh',         role: 'dispatch',   pw: 'disp123'  },
  { id: 'u5', name: 'Priya',          role: 'accounts',   pw: 'acc123'   },
]

const SEED_ORDERS = [
  {
    id: 'ORD-001', customer: 'MSEDCL', product: 'AAAC Rabbit 7/3.35mm', qty: 45,
    status: 'dispatched', tender: '2025-01-10',
    costing: { pr: 187500, mr: 195000, al: 0.285 },
    po: { no: 'MSEDCL/PO/2025/441', date: '2025-01-18' },
    alA: { bk: 12825, sp: 0, sup: 'Hindalco', date: '2025-01-20' },
    prod: { start: '2025-01-22', end: '2025-02-10', done: true },
    dispatches: [
      { id: 'd1', date: '2025-02-12', drums: 'D-101,D-102,D-103', km: 20, inv: 'INV-2025-041' },
      { id: 'd2', date: '2025-02-18', drums: 'D-104,D-105', km: 25, inv: 'INV-2025-058' },
    ],
    invoice: { no: 'INV-2025-041', amt: 8775000, date: '2025-02-12' },
    log: [
      { id: 'a1', action: 'Order Created', user: 'Rahul', role: 'marketing', ts: '2025-01-10T10:00:00Z' },
      { id: 'a2', action: 'Production rate submitted', user: 'Suresh', role: 'production', ts: '2025-01-14T14:00:00Z' },
    ],
  },
  {
    id: 'ORD-002', customer: 'GETCO Gujarat', product: 'ACSR Dog 6/4.72mm', qty: 80,
    status: 'production', tender: '2025-02-01',
    costing: { pr: 210000, mr: 218000, al: 0.394 },
    po: { no: 'GETCO/2025/0082', date: '2025-02-10' },
    alA: { bk: 31520, sp: 0, sup: 'Vedanta', date: '2025-02-12' },
    prod: { start: '2025-02-15', end: null, done: false },
    dispatches: [], invoice: null, log: [],
  },
  {
    // This one shows correctly in Production's dashboard
    id: 'ORD-003', customer: 'CESC Kolkata', product: 'AAAC Weasel 7/2.59mm', qty: 30,
    status: 'costing_pending_production', tender: '2025-03-01',
    costing: { pr: null, mr: null, al: null },
    po: null, alA: null, prod: null, dispatches: [], invoice: null, log: [],
  },
]

const SEED_AL = { phy: 12400, bk: 8200, min: 3000 }

const ROLES = { admin: 'Admin', marketing: 'Marketing', production: 'Production', dispatch: 'Dispatch', accounts: 'Accounts' }
const RC = { admin: '#1a1a2e', marketing: '#0f4c75', production: '#1b6b3a', dispatch: '#7b2d00', accounts: '#4a1942' }
const RB = { admin: '#e8e8f0', marketing: '#dceeff', production: '#d4f0df', dispatch: '#ffe8d6', accounts: '#f3d8f0' }

const ST = {
  costing_pending_production: { lbl: 'Awaiting Prod Rate',     own: 'production', c: '#1b6b3a' },
  costing_pending_marketing:  { lbl: 'Awaiting Final Rate',    own: 'marketing',  c: '#0f4c75' },
  order_confirmed:            { lbl: 'PO Pending',             own: 'marketing',  c: '#0f4c75' },
  al_arranging:               { lbl: 'Arrange AL',             own: 'production', c: '#1b4332' },
  production:                 { lbl: 'In Production',          own: 'production', c: '#2e7d32' },
  ready_dispatch:             { lbl: 'Ready for Dispatch',     own: 'dispatch',   c: '#7b2d00' },
  dispatched:                 { lbl: 'Dispatched',             own: 'accounts',   c: '#4a1942' },
  invoiced:                   { lbl: 'Invoiced',               own: 'admin',      c: '#37474f' },
  closed:                     { lbl: 'Closed',                 own: null,         c: '#78909c' },
}
const PIPE = Object.keys(ST)

const fmt  = n => n == null ? '—' : Number(n).toLocaleString('en-IN')
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const uid  = () => Math.random().toString(36).slice(2, 7)
const tod  = () => new Date().toISOString().split('T')[0]

// ── VERSION CHECK — bumping this clears all old localStorage automatically ──
const DATA_VERSION = 'v6'
if (localStorage.getItem('tf_version') !== DATA_VERSION) {
  ['tf_orders','tf_al','tf_alev','tf_audit'].forEach(k => localStorage.removeItem(k))
  localStorage.setItem('tf_version', DATA_VERSION)
}

function useLS(k, iv) {
  const [v, sv] = useState(() => {
    try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : iv }
    catch { return iv }
  })
  const set = (x) => {
    sv(prev => {
      const nv = typeof x === 'function' ? x(prev) : x
      try { localStorage.setItem(k, JSON.stringify(nv)) } catch {}
      return nv
    })
  }
  return [v, set]
}

const S = {
  card:  { background: '#fff', border: '0.5px solid #e2ddd4', borderRadius: 12, padding: '16px 18px' },
  inp:   { fontFamily: 'Syne, sans-serif', fontSize: 13, border: '0.5px solid #ccc', borderRadius: 8, padding: '8px 10px', background: '#fff', color: '#1a1a1a', width: '100%', outline: 'none', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', color: '#888', marginBottom: 5 },
  bg:    '#f5f3ee',
  muted: '#888',
  accent:'#c8401a',
}

function Btn({ children, primary, danger, sm, full, onClick, disabled, style = {} }) {
  const [h, sh] = useState(false)
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: sm ? '5px 12px' : '8px 16px', borderRadius: 8, fontSize: sm ? 12 : 13, fontWeight: 500,
        border: primary ? 'none' : danger ? 'none' : '0.5px solid #ccc',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : 'auto',
        background: primary ? '#c8401a' : danger ? (h ? '#fecaca' : '#fee2e2') : h ? '#f0ede8' : 'transparent',
        color: primary ? '#fff' : danger ? '#b91c1c' : '#1a1a1a',
        transition: 'background .15s', ...style
      }}
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
    >{children}</button>
  )
}

function Fg({ label, children }) {
  return <div style={{ marginBottom: 13 }}>{label && <label style={S.label}>{label}</label>}{children}</div>
}

function RRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f0ede8', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value ?? <span style={{ color: '#bbb' }}>—</span>}</span>
    </div>
  )
}

function Chip({ label, color }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: color + '22', color }}>{label}</span>
}

function Tag({ role }) {
  return <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: RB[role] || '#eee', color: RC[role] || '#333' }}>{ROLES[role] || role}</span>
}

function StageBar({ status, height = 4 }) {
  const si = PIPE.indexOf(status)
  return (
    <div style={{ display: 'flex', gap: 2, margin: '10px 0' }}>
      {PIPE.map((s, i) => (
        <div key={s} title={ST[s]?.lbl} style={{ flex: 1, height, borderRadius: 2, background: i < si ? '#c8401a' : i === si ? '#f97316' : '#e2ddd4' }} />
      ))}
    </div>
  )
}

function SLink({ active, onClick, icon, label, badge }) {
  const [h, sh] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        color: active ? '#c8401a' : '#888', cursor: 'pointer', border: 'none',
        background: active ? '#fff0eb' : h ? '#f0ede8' : 'transparent', width: '100%', textAlign: 'left' }}>
      <span>{icon}</span><span>{label}</span>
      {badge > 0 && <span style={{ marginLeft: 'auto', background: '#c8401a', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{badge}</span>}
    </button>
  )
}

function ICard({ title, role, children }) {
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}{role && <Tag role={role} />}
      </div>
      {children}
    </div>
  )
}

// ── SUCCESS POPUP ──────────────────────────────────────────────────────────────
function SuccessPopup({ order, onClose, onView }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', width: 440, boxShadow: '0 24px 60px rgba(0,0,0,.2)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: '#d4f0df', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Order Created!</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{order.customer}</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{order.product} · {order.qty} km</div>
        <div style={{ display: 'inline-block', background: '#f5f3ee', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontFamily: 'monospace', color: '#c8401a', fontWeight: 600, marginBottom: 20 }}>{order.id}</div>

        <div style={{ background: '#d4f0df', border: '1px solid #a8d8b9', borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1b6b3a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>✓ Sent to Production</div>
          <div style={{ fontSize: 13, color: '#2d5a3d', lineHeight: 1.6 }}>
            Production (Suresh) will now see this order in their dashboard and submit a rate + AL requirement.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn sm onClick={onClose}>Back to Orders</Btn>
          <Btn primary sm onClick={onView}>View Order →</Btn>
        </div>
      </div>
    </div>
  )
}

// ── NEW ORDER FORM ─────────────────────────────────────────────────────────────
function NewOrderForm({ onSave, onCancel }) {
  const [customer, setCustomer] = useState('')
  const [product, setProduct]   = useState('')
  const [qty, setQty]           = useState('')
  const [date, setDate]         = useState(tod())
  const ok = customer.trim() && product.trim() && qty
  return (
    <div style={{ ...S.card, marginBottom: 16, border: '1px solid #c8401a', background: '#fff8f6' }}>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>New Order / Tender</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Fg label="Customer Name"><input style={S.inp} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. MSEDCL" /></Fg>
        <Fg label="Product"><input style={S.inp} value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. AAAC Rabbit 7/3.35mm" /></Fg>
        <Fg label="Quantity (km)"><input style={S.inp} type="number" value={qty} onChange={e => setQty(e.target.value)} /></Fg>
        <Fg label="Tender Date"><input style={S.inp} type="date" value={date} onChange={e => setDate(e.target.value)} /></Fg>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Btn sm onClick={onCancel}>Cancel</Btn>
        <Btn primary sm disabled={!ok} onClick={() => onSave({ customer: customer.trim(), product: product.trim(), qty: Number(qty), date })}>Create Order →</Btn>
      </div>
    </div>
  )
}

// ── APP ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [orders, setOrders] = useLS('tf_orders', SEED_ORDERS)
  const [al, setAl]         = useLS('tf_al', SEED_AL)
  const [alEv, setAlEv]     = useLS('tf_alev', [])
  const [audit, setAudit]   = useLS('tf_audit', [])
  const [user, setUser]     = useState(null)
  const [page, setPage]     = useState('dashboard')
  const [oid, setOid]       = useState(null)

  const addLog = (orderId, action) => {
    const ev = { id: uid(), orderId, action, user: user.name, role: user.role, ts: new Date().toISOString() }
    setAudit(a => [ev, ...a])
    if (orderId) setOrders(os => os.map(o => o.id === orderId ? { ...o, log: [ev, ...(o.log || [])] } : o))
  }
  const upd = (id, patch, label = 'Updated') => {
    setOrders(os => os.map(o => o.id === id ? { ...o, ...patch } : o))
    addLog(id, label)
  }

  if (!user) return <Login onLogin={setUser} />

  const pending = orders.filter(o => ST[o.status]?.own === user.role)
  const detail  = oid ? orders.find(o => o.id === oid) : null
  const go = p => { setPage(p); setOid(null) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: S.bg }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: '#fff', borderRight: '0.5px solid #e2ddd4', display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ marginBottom: 24, paddingLeft: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: '#c8401a', marginBottom: 2 }}>Technofibre</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Order Management</div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'dashboard', icon: '▦', label: 'Dashboard' },
            { id: 'orders',    icon: '≡', label: 'Orders', badge: pending.length },
            { id: 'al',        icon: '⚡', label: 'AL Stock' },
            { id: 'audit',     icon: '◉', label: 'Audit' },
            ...(user.role === 'admin' ? [{ id: 'admin', icon: '⚙', label: 'Admin' }] : []),
          ].map(l => <SLink key={l.id} active={page === l.id} onClick={() => go(l.id)} icon={l.icon} label={l.label} badge={l.badge || 0} />)}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ background: RB[user.role] || '#eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: RC[user.role] }}>{user.name}</div>
            <div style={{ fontSize: 11, color: RC[user.role], opacity: .7, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{ROLES[user.role]}</div>
          </div>
          <Btn full sm onClick={() => setUser(null)}>Sign out</Btn>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {page === 'dashboard' && <Dashboard orders={orders} al={al} user={user} pending={pending} go={go} openOrder={id => { setOid(id); setPage('orders') }} />}
        {page === 'orders' && !detail && <Orders orders={orders} user={user} setOrders={setOrders} open={id => setOid(id)} addLog={addLog} />}
        {page === 'orders' && detail && <Detail order={detail} user={user} upd={upd} addLog={addLog} al={al} setAl={setAl} alEv={alEv} setAlEv={setAlEv} back={() => setOid(null)} />}
        {page === 'al'    && <ALPage al={al} setAl={setAl} alEv={alEv} setAlEv={setAlEv} user={user} addLog={addLog} />}
        {page === 'audit' && <AuditPage audit={audit} />}
        {page === 'admin' && user.role === 'admin' && <AdminPage orders={orders} setOrders={setOrders} al={al} setAl={setAl} user={user} addLog={addLog} />}
      </div>
    </div>
  )
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [sel, setSel] = useState('')
  const [pw, setPw]   = useState('')
  const [err, setErr] = useState('')
  const go = () => {
    const u = USERS.find(x => x.id === sel)
    if (!u) { setErr('Select a user'); return }
    if (u.pw !== pw) { setErr('Wrong password'); return }
    onLogin(u)
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: '#c8401a', marginBottom: 6 }}>Technofibre Industries</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Order Management</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Sign in to your workspace</div>
        </div>
        <Fg label="Select User">
          <select value={sel} onChange={e => { setSel(e.target.value); setErr('') }} style={S.inp}>
            <option value="">— Choose —</option>
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLES[u.role]})</option>)}
          </select>
        </Fg>
        <Fg label="Password">
          <input type="password" placeholder="Password" value={pw} style={S.inp}
            onChange={e => { setPw(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && go()} />
        </Fg>
        {err && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 10 }}>⚠ {err}</div>}
        <Btn primary full onClick={go}>Sign In →</Btn>
        <div style={{ marginTop: 14, padding: 12, background: '#f5f3ee', borderRadius: 8, fontSize: 12, color: '#888' }}>
          <strong>Passwords:</strong> admin123 · mkt123 · prod123 · disp123 · acc123
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
function Dashboard({ orders, al, user, pending, go, openOrder }) {
  const active = orders.filter(o => !['closed','invoiced'].includes(o.status))
  const low    = al.phy < al.min
  const bySt   = PIPE.reduce((a, s) => { a[s] = orders.filter(o => o.status === s).length; return a }, {})
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888' }}>Welcome back</div>
        <div style={{ fontSize: 24, fontWeight: 500, marginTop: 3 }}>{user.name.split(' ')[0]}'s Dashboard</div>
      </div>
      {low && <div style={{ background: '#fff3cd', border: '0.5px solid #ffc107', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#856404', marginBottom: 16 }}>⚠ AL Physical stock ({fmt(al.phy)} kg) below minimum ({fmt(al.min)} kg).</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          [active.length,         'Active Orders',  `${orders.filter(o=>o.status==='closed').length} closed`, null],
          [`${fmt(al.phy)} kg`,   'AL Physical',    `${(al.phy/1000).toFixed(2)} MT`,  low ? '#856404' : null],
          [`${fmt(al.bk)} kg`,    'AL Booking',     'in transit',                       null],
          [`${fmt(al.phy+al.bk)} kg`, 'Total AL',  'physical + booked',                '#c8401a'],
        ].map(([v,l,s,c]) => (
          <div key={l} style={{ background: '#fff', border: '0.5px solid #e2ddd4', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', color: '#888' }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 500, margin: '5px 0 2px', color: c || '#1a1a1a' }}>{v}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Your Pending Actions <span style={{ color: '#c8401a' }}>({pending.length})</span></span>
            <Btn sm onClick={() => go('orders')}>All orders →</Btn>
          </div>
          {pending.length === 0
            ? <div style={{ background: '#f5f3ee', borderRadius: 10, padding: '16px', fontSize: 13, color: '#888', textAlign: 'center' }}>✓ No pending actions for you right now.</div>
            : pending.map(o => (
              <div key={o.id} onClick={() => openOrder(o.id)}
                style={{ background: '#fff', border: '1px solid #c8401a', borderRadius: 10, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customer}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{o.product} · {o.id}</div>
                  </div>
                  <span style={{ fontSize: 10, background: '#fff0eb', color: '#c8401a', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Action needed</span>
                </div>
                <div style={{ background: '#fff0eb', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#c8401a', fontWeight: 500 }}>
                  → {ST[o.status]?.lbl} — click to open
                </div>
              </div>
            ))
          }
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Pipeline</div>
          <div style={S.card}>
            {Object.entries(ST).filter(([k]) => k !== 'closed').map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f0ede8' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: v.c, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12 }}>{v.lbl}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: bySt[k] > 0 ? '#c8401a' : '#ccc' }}>{bySt[k] || 0}</div>
                {v.own && <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', fontWeight: 500, width: 64, textAlign: 'right' }}>{v.own}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ORDERS LIST ────────────────────────────────────────────────────────────────
function Orders({ orders, user, setOrders, open, addLog }) {
  const [showNew, setShowNew]      = useState(false)
  const [successOrder, setSuccess] = useState(null)
  const [q, setQ]                  = useState('')
  const [filter, setFilter]        = useState('all')
  const canCreate = ['admin','marketing'].includes(user.role)

  const create = ({ customer, product, qty, date }) => {
    const o = {
      id: `ORD-${String(orders.length + 1).padStart(3,'0')}`,
      customer, product, qty,
      status: 'costing_pending_production', // skip tender_received — goes straight to Production
      tender: date,
      costing: { pr: null, mr: null, al: null },
      po: null, alA: null, prod: null, dispatches: [], invoice: null, log: [],
    }
    setOrders(os => [o, ...os])
    addLog(o.id, 'Order Created — sent to Production for costing')
    setShowNew(false)
    setSuccess(o)
  }

  const filtered = orders.filter(o => {
    const mf = filter === 'all' ? true : filter === 'mine' ? ST[o.status]?.own === user.role : o.status === filter
    const mq = !q || [o.customer, o.id, o.product].some(x => x.toLowerCase().includes(q.toLowerCase()))
    return mf && mq
  })

  return (
    <div>
      {successOrder && (
        <SuccessPopup
          order={successOrder}
          onClose={() => setSuccess(null)}
          onView={() => { open(successOrder.id); setSuccess(null) }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>Orders</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{orders.length} total</div>
        </div>
        {canCreate && <Btn primary onClick={() => setShowNew(s => !s)}>{showNew ? '✕ Cancel' : '+ New Order'}</Btn>}
      </div>

      {showNew && <NewOrderForm onSave={create} onCancel={() => setShowNew(false)} />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ ...S.inp, width: 200, flexShrink: 0 }} />
        {[['all','All'],['mine','My Actions'],['production','In Production'],['ready_dispatch','Dispatch']].map(([k,l]) => (
          <Btn key={k} primary={filter===k} sm onClick={() => setFilter(k)}>{l}</Btn>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>No orders found.</div>
        : filtered.map(o => <OCard key={o.id} o={o} user={user} onClick={() => open(o.id)} />)
      }
    </div>
  )
}

function OCard({ o, user, onClick }) {
  const [h, sh] = useState(false)
  const m = ST[o.status] || {}
  const mine = m.own === user.role
  const td = (o.dispatches || []).reduce((s, d) => s + (d.km || 0), 0)
  return (
    <div onClick={onClick} onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
      style={{ background: '#fff', border: `0.5px solid ${mine ? '#c8401a' : h ? '#bbb' : '#e2ddd4'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'DM Mono, monospace' }}>{o.id}</span>
            {mine && <span style={{ fontSize: 10, background: '#fff0eb', color: '#c8401a', padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>Action needed</span>}
          </div>
          <div style={{ fontWeight: 500, fontSize: 15 }}>{o.customer}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{o.product} · {o.qty} km</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Chip label={m.lbl} color={m.c || '#666'} />
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Owner: {m.own ? ROLES[m.own] : '—'}</div>
        </div>
      </div>
      <StageBar status={o.status} />
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888' }}>
        {o.po && <span>PO: <strong style={{ fontFamily: 'DM Mono, monospace' }}>{o.po.no}</strong></span>}
        {(o.dispatches||[]).length > 0 && <span>{o.dispatches.length} dispatch(es) · {td} km</span>}
        {o.alA && <span>AL: <strong>{fmt((o.alA.bk||0)+(o.alA.sp||0))} kg</strong></span>}
      </div>
    </div>
  )
}

// ── ORDER DETAIL ───────────────────────────────────────────────────────────────
function Detail({ order: o, user, upd, addLog, al, setAl, alEv, setAlEv, back }) {
  const [tab, setTab] = useState('overview')
  const m  = ST[o.status] || {}
  const si = PIPE.indexOf(o.status)
  const isActor = m.own === user.role || user.role === 'admin'
  const nk = PIPE[si + 1]
  const tabs = ['overview','costing','production','dispatches','invoicing','audit']

  return (
    <div>
      <Btn sm onClick={back} style={{ marginBottom: 12 }}>← Back</Btn>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'DM Mono, monospace' }}>{o.id}</span>
            <Chip label={m.lbl} color={m.c || '#666'} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{o.customer}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{o.product} · {o.qty} km</div>
        </div>
        {isActor && nk && (
          <Btn primary onClick={() => upd(o.id, { status: nk }, `→ ${ST[nk]?.lbl}`)}>Mark: {ST[nk]?.lbl} →</Btn>
        )}
      </div>
      {isActor && nk && (
        <div style={{ background: '#fff0eb', border: '1px solid #f4c4b0', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#c8401a' }}>
          <strong>Action needed from you:</strong> Click the button above to advance this order to <strong>"{ST[nk]?.lbl}"</strong>.
        </div>
      )}
      {!isActor && m.own && (
        <div style={{ background: '#f5f3ee', border: '0.5px solid #e2ddd4', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#888' }}>
          Waiting on <strong style={{ color: RC[m.own] }}>{ROLES[m.own]}</strong> to take action on this order.
        </div>
      )}
      <StageBar status={o.status} height={5} />
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e2ddd4', marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: tab===t ? '2px solid #c8401a' : '2px solid transparent',
              fontSize: 12, fontWeight: 500, color: tab===t ? '#c8401a' : '#888', cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      {tab === 'overview'   && <OvTab o={o} user={user} upd={upd} />}
      {tab === 'costing'    && <CoTab o={o} user={user} upd={upd} />}
      {tab === 'production' && <PrTab o={o} user={user} upd={upd} al={al} setAl={setAl} alEv={alEv} setAlEv={setAlEv} />}
      {tab === 'dispatches' && <DiTab o={o} user={user} upd={upd} />}
      {tab === 'invoicing'  && <InTab o={o} user={user} upd={upd} />}
      {tab === 'audit'      && <AuTab o={o} />}
    </div>
  )
}

function OvTab({ o, user, upd }) {
  const [po, setPo]   = useState('')
  const [pod, setPod] = useState(tod())
  const canMkt = ['marketing','admin'].includes(user.role)
  const sm = ST[o.status] || {}
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <ICard title="Order Details">
        <RRow label="ID"       value={<span style={{ fontFamily: 'DM Mono, monospace' }}>{o.id}</span>} />
        <RRow label="Customer" value={o.customer} />
        <RRow label="Product"  value={o.product} />
        <RRow label="Qty"      value={`${o.qty} km`} />
        <RRow label="Status"   value={<Chip label={sm.lbl} color={sm.c||'#666'} />} />
        <RRow label="Owner"    value={sm.own ? <span style={{ fontWeight: 500, color: RC[sm.own] }}>{ROLES[sm.own]}</span> : '—'} />
      </ICard>
      <ICard title="PO Confirmation" role="marketing">
        {o.po
          ? <><RRow label="PO No." value={<span style={{ fontFamily: 'DM Mono, monospace' }}>{o.po.no}</span>} /><RRow label="Date" value={fmtD(o.po.date)} /></>
          : <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>Not yet confirmed.</div>
        }
        {canMkt && !o.po && o.costing?.mr && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #f0ede8' }}>
            <Fg label="PO Number"><input style={S.inp} value={po} onChange={e => setPo(e.target.value)} placeholder="e.g. PO/2025/001" /></Fg>
            <Fg label="Date"><input style={S.inp} type="date" value={pod} onChange={e => setPod(e.target.value)} /></Fg>
            <Btn primary sm onClick={() => { if (!po) return; upd(o.id, { po: { no: po, date: pod }, status: 'al_arranging' }, 'PO confirmed — sent to Production for AL') }}>Confirm PO → Send to Production</Btn>
          </div>
        )}
      </ICard>
      <ICard title="Rates">
        <RRow label="Prod Rate"   value={o.costing?.pr ? `₹ ${fmt(o.costing.pr)} / km` : 'Pending'} />
        <RRow label="Final Rate"  value={o.costing?.mr ? `₹ ${fmt(o.costing.mr)} / km` : 'Pending'} />
        <RRow label="AL per km"   value={o.costing?.al ? `${o.costing.al} MT` : 'Pending'} />
        <RRow label="AL Required" value={o.costing?.al ? `${fmt(Math.round(o.costing.al*o.qty*1000))} kg` : '—'} />
      </ICard>
      <ICard title="AL Arrangement">
        {o.alA
          ? <><RRow label="Booking" value={`${fmt(o.alA.bk)} kg`} /><RRow label="Spot" value={`${fmt(o.alA.sp)} kg`} /><RRow label="Supplier" value={o.alA.sup} /></>
          : <div style={{ color: '#aaa', fontSize: 13 }}>Not yet arranged.</div>
        }
      </ICard>
    </div>
  )
}

function CoTab({ o, user, upd }) {
  const [pr, setPr] = useState(o.costing?.pr || '')
  const [al, setAl] = useState(o.costing?.al || '')
  const [mr, setMr] = useState(o.costing?.mr || '')
  const canP = ['production','admin'].includes(user.role)
  const canM = ['marketing','admin'].includes(user.role)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <ICard title="Production Rate" role="production">
        {o.costing?.pr
          ? <><RRow label="Rate" value={`₹ ${fmt(o.costing.pr)} / km`} /><RRow label="AL/km" value={`${o.costing.al} MT`} /></>
          : <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>Awaiting rate.</div>
        }
        {canP && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #f0ede8' }}>
            <Fg label="Rate (₹/km)"><input style={S.inp} type="number" value={pr} onChange={e => setPr(e.target.value)} /></Fg>
            <Fg label="AL per km (MT)"><input style={S.inp} type="number" step=".001" value={al} onChange={e => setAl(e.target.value)} placeholder="e.g. 0.285" /></Fg>
            <Btn primary sm onClick={() => { if (!pr||!al) return; upd(o.id, { costing: { ...o.costing, pr: Number(pr), al: Number(al) }, status: 'costing_pending_marketing' }, 'Prod rate submitted') }}>Submit Rate</Btn>
          </div>
        )}
      </ICard>
      <ICard title="Marketing Final Rate" role="marketing">
        {o.costing?.mr
          ? <><RRow label="Final Rate" value={`₹ ${fmt(o.costing.mr)} / km`} />{o.costing.pr && <RRow label="Margin" value={`₹ ${fmt(o.costing.mr - o.costing.pr)} / km`} />}</>
          : <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>Awaiting.</div>
        }
        {canM && o.costing?.pr && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #f0ede8' }}>
            <Fg label="Final Rate (₹/km)"><input style={S.inp} type="number" value={mr} onChange={e => setMr(e.target.value)} /></Fg>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn sm onClick={() => { if (!mr) return; upd(o.id, { costing: { ...o.costing, mr: Number(mr) }, status: 'costing_pending_production' }, 'Sent back') }}>Iterate</Btn>
              <Btn primary sm onClick={() => { if (!mr) return; upd(o.id, { costing: { ...o.costing, mr: Number(mr) }, status: 'order_confirmed' }, 'Final confirmed') }}>Confirm Final</Btn>
            </div>
          </div>
        )}
      </ICard>
      {o.costing?.al && (
        <div style={{ ...S.card, gridColumn: '1/-1' }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>AL Requirement</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[['Order Qty',`${o.qty} km`],['AL/km',`${o.costing.al} MT`],['Total MT',`${(o.costing.al*o.qty).toFixed(3)}`],['Total kg',`${fmt(Math.round(o.costing.al*o.qty*1000))}`]].map(([l,v]) => (
              <div key={l} style={{ background: '#f5f3ee', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PrTab({ o, user, upd, al, setAl, alEv, setAlEv }) {
  const [bk, setBk]   = useState('')
  const [sp, setSp]   = useState('')
  const [sup, setSup] = useState('')
  const [ps, setPs]   = useState('')
  const [pe, setPe]   = useState('')
  const canP = ['production','admin'].includes(user.role)
  const req  = o.costing?.al ? Math.round(o.costing.al * o.qty * 1000) : null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <ICard title="AL Arrangement" role="production">
        {req && <div style={{ background: '#fff0eb', borderRadius: 7, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#c8401a' }}>Required: <strong>{fmt(req)} kg</strong></div>}
        {o.alA
          ? <><RRow label="Booking" value={`${fmt(o.alA.bk)} kg`} /><RRow label="Spot" value={`${fmt(o.alA.sp)} kg`} /><RRow label="Supplier" value={o.alA.sup} /></>
          : canP
            ? <>
                <Fg label="Book from Supplier (kg)"><input style={S.inp} type="number" value={bk} onChange={e => setBk(e.target.value)} /></Fg>
                <Fg label="Spot Purchase (kg)"><input style={S.inp} type="number" value={sp} onChange={e => setSp(e.target.value)} /></Fg>
                <Fg label="Supplier"><input style={S.inp} value={sup} onChange={e => setSup(e.target.value)} /></Fg>
                <Btn primary sm onClick={() => {
                  const bkg = Number(bk)||0, spg = Number(sp)||0; if (!bkg&&!spg) return
                  upd(o.id, { alA: { bk: bkg, sp: spg, sup, date: tod() }, status: 'al_arranging' }, 'AL Arranged')
                  setAl(s => ({ ...s, bk: s.bk+bkg, phy: s.phy+spg }))
                  setAlEv(a => [{ id:uid(), date:tod(), type: bkg?'AL Booking':'AL Purchase', kg: bkg||spg, note: o.customer }, ...a])
                }}>Arrange AL</Btn>
              </>
            : <div style={{ color: '#aaa', fontSize: 13 }}>Awaiting.</div>
        }
      </ICard>
      <ICard title="Production Log" role="production">
        {o.prod
          ? <><RRow label="Start" value={fmtD(o.prod.start)} /><RRow label="End" value={fmtD(o.prod.end)} /><RRow label="Status" value={o.prod.done ? 'Complete' : 'Ongoing'} /></>
          : canP && o.alA
            ? <>
                <Fg label="Start Date"><input style={S.inp} type="date" value={ps} onChange={e => setPs(e.target.value)} /></Fg>
                <Fg label="End Date (blank = ongoing)"><input style={S.inp} type="date" value={pe} onChange={e => setPe(e.target.value)} /></Fg>
                <Btn primary sm onClick={() => {
                  if (!ps) return; const done = !!pe
                  upd(o.id, { prod: { start: ps, end: pe||null, done }, status: done ? 'ready_dispatch' : 'production' }, done ? 'Production complete' : 'Started')
                  if (done && o.alA) { const tot = (o.alA.bk||0)+(o.alA.sp||0); setAl(s => ({ ...s, phy: Math.max(0,s.phy-tot), bk: Math.max(0,s.bk-(o.alA.bk||0)) })) }
                }}>Log Production</Btn>
              </>
            : <div style={{ color: '#aaa', fontSize: 13 }}>Arrange AL first.</div>
        }
      </ICard>
    </div>
  )
}

function DiTab({ o, user, upd }) {
  const [show, setShow] = useState(false)
  const [f, setF]       = useState({ date:'', drums:'', km:'', inv:'' })
  const canD = ['dispatch','admin'].includes(user.role)
  const td   = (o.dispatches||[]).reduce((s,d) => s+(d.km||0), 0)
  const rem  = o.qty - td
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>Dispatch Records</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{td} / {o.qty} km{rem > 0 && <span style={{ color: '#c8401a' }}> · {rem} km left</span>}</div>
        </div>
        {canD && o.prod?.done && rem > 0 && <Btn primary sm onClick={() => setShow(s=>!s)}>+ Add Dispatch</Btn>}
      </div>
      {show && (
        <div style={{ ...S.card, marginBottom: 12, background: '#f5f3ee' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Fg label="Date"><input style={S.inp} type="date" value={f.date} onChange={e=>setF(x=>({...x,date:e.target.value}))} /></Fg>
            <Fg label="Qty (km)"><input style={S.inp} type="number" value={f.km} onChange={e=>setF(x=>({...x,km:e.target.value}))} /></Fg>
            <Fg label="Drum Numbers"><input style={S.inp} value={f.drums} onChange={e=>setF(x=>({...x,drums:e.target.value}))} placeholder="D-101, D-102" /></Fg>
            <Fg label="Invoice No."><input style={S.inp} value={f.inv} onChange={e=>setF(x=>({...x,inv:e.target.value}))} /></Fg>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn sm onClick={() => setShow(false)}>Cancel</Btn>
            <Btn primary sm onClick={() => {
              if (!f.date||!f.drums||!f.km) return
              const d = { id: uid(), ...f, km: Number(f.km) }
              const nd = [...(o.dispatches||[]), d]
              const ntd = nd.reduce((s,x)=>s+(x.km||0),0)
              upd(o.id, { dispatches: nd, status: ntd>=o.qty?'dispatched':'ready_dispatch' }, `Dispatch: ${f.drums}`)
              setF({ date:'',drums:'',km:'',inv:'' }); setShow(false)
            }}>Save</Btn>
          </div>
        </div>
      )}
      {(o.dispatches||[]).length === 0
        ? <div style={{ color: '#aaa', fontSize: 13, padding: '16px 0' }}>No dispatches yet.</div>
        : (
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date','Drums','Qty','Invoice'].map(h=><th key={h} style={{ fontSize:11,fontWeight:500,textTransform:'uppercase',color:'#888',padding:'8px 12px',textAlign:'left',borderBottom:'0.5px solid #e2ddd4' }}>{h}</th>)}</tr></thead>
              <tbody>{(o.dispatches||[]).map(d=>(
                <tr key={d.id}>
                  <td style={{padding:'8px 12px',fontSize:12,fontFamily:'DM Mono,monospace'}}>{fmtD(d.date)}</td>
                  <td style={{padding:'8px 12px',fontSize:13}}>{d.drums}</td>
                  <td style={{padding:'8px 12px',fontSize:13,fontWeight:500}}>{d.km} km</td>
                  <td style={{padding:'8px 12px',fontSize:12,fontFamily:'DM Mono,monospace'}}>{d.inv||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

function InTab({ o, user, upd }) {
  const [f, setF] = useState({ no:'', amt:'', date: tod() })
  const canA = ['accounts','admin'].includes(user.role)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <ICard title="Invoice" role="accounts">
        {o.invoice
          ? <><RRow label="Invoice No." value={<span style={{ fontFamily: 'DM Mono,monospace' }}>{o.invoice.no}</span>} /><RRow label="Amount" value={`₹ ${fmt(o.invoice.amt)}`} /><RRow label="Date" value={fmtD(o.invoice.date)} /><RRow label="Status" value={<span style={{fontSize:12,background:'#d1fae5',color:'#065f46',padding:'2px 8px',borderRadius:4,fontWeight:500}}>Raised</span>} /></>
          : canA && (o.dispatches||[]).length > 0
            ? <>
                <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>No invoice yet.</div>
                <Fg label="Invoice No."><input style={S.inp} value={f.no} onChange={e=>setF(x=>({...x,no:e.target.value}))} /></Fg>
                <Fg label="Amount (₹)"><input style={S.inp} type="number" value={f.amt} onChange={e=>setF(x=>({...x,amt:e.target.value}))} /></Fg>
                <Fg label="Date"><input style={S.inp} type="date" value={f.date} onChange={e=>setF(x=>({...x,date:e.target.value}))} /></Fg>
                <Btn primary sm onClick={() => { if (!f.no||!f.amt) return; upd(o.id, { invoice: { no:f.no, amt:Number(f.amt), date:f.date }, status:'invoiced' }, `Invoice: ${f.no}`) }}>Raise Invoice</Btn>
              </>
            : <div style={{ color: '#aaa', fontSize: 13 }}>Dispatch first.</div>
        }
      </ICard>
      <ICard title="Order Value">
        <RRow label="Qty"         value={`${o.qty} km`} />
        <RRow label="Rate"        value={o.costing?.mr ? `₹ ${fmt(o.costing.mr)} / km` : '—'} />
        <RRow label="Order Value" value={o.costing?.mr ? `₹ ${fmt(o.costing.mr * o.qty)}` : '—'} />
        {o.invoice && <RRow label="Invoiced" value={`₹ ${fmt(o.invoice.amt)}`} />}
      </ICard>
    </div>
  )
}

function AuTab({ o }) {
  return (
    <div>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Audit Log</div>
      {(o.log||[]).length === 0
        ? <div style={{ color: '#aaa', fontSize: 13 }}>No entries.</div>
        : (o.log||[]).map(ev => (
          <div key={ev.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0ede8' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: RC[ev.role]||'#888', flexShrink: 0, marginTop: 5 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.action}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>by <strong>{ev.user}</strong> · {fmtD(ev.ts?.split('T')[0])}</div>
            </div>
          </div>
        ))
      }
    </div>
  )
}

// ── AL PAGE ────────────────────────────────────────────────────────────────────
function ALPage({ al, setAl, alEv, setAlEv, user, addLog }) {
  const [show, setShow] = useState(false)
  const [f, setF]       = useState({ type: 'AL Booking', kg: '', sup: '', note: '' })
  const canE = ['production','admin'].includes(user.role)
  const low  = al.phy < al.min
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div><div style={{ fontSize: 24, fontWeight: 500 }}>AL Stock</div><div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Central aluminium tracker</div></div>
        {canE && <Btn primary onClick={() => setShow(s=>!s)}>{show ? '✕ Cancel' : '+ Add Event'}</Btn>}
      </div>
      {show && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid #c8401a', background: '#fff8f6' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>New AL Event</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Fg label="Type"><select style={S.inp} value={f.type} onChange={e=>setF(x=>({...x,type:e.target.value}))}>{['AL Booking','AL Received','AL Purchase','Dispatch'].map(t=><option key={t}>{t}</option>)}</select></Fg>
            <Fg label="Qty (kg)"><input style={S.inp} type="number" value={f.kg} onChange={e=>setF(x=>({...x,kg:e.target.value}))} /></Fg>
            <Fg label="Supplier/Ref"><input style={S.inp} value={f.sup} onChange={e=>setF(x=>({...x,sup:e.target.value}))} /></Fg>
            <Fg label="Notes"><input style={S.inp} value={f.note} onChange={e=>setF(x=>({...x,note:e.target.value}))} /></Fg>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn sm onClick={() => setShow(false)}>Cancel</Btn>
            <Btn primary sm onClick={() => {
              const kg = Number(f.kg); if (!kg) return
              let p = {}
              if (f.type==='AL Booking')  p = { bk: al.bk+kg }
              if (f.type==='AL Received') p = { bk: Math.max(0,al.bk-kg), phy: al.phy+kg }
              if (f.type==='AL Purchase') p = { phy: al.phy+kg }
              if (f.type==='Dispatch')    p = { phy: Math.max(0,al.phy-kg) }
              setAl(s => ({...s,...p}))
              setAlEv(a => [{ id:uid(), date:tod(), type:f.type, kg, sup:f.sup, note:f.note }, ...a])
              addLog(null, `AL: ${f.type} ${kg}kg`)
              setF({ type:'AL Booking', kg:'', sup:'', note:'' }); setShow(false)
            }}>Save Event</Btn>
          </div>
        </div>
      )}
      {low && <div style={{ background: '#fff3cd', border: '0.5px solid #ffc107', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#856404', marginBottom: 14 }}>⚠ Physical stock below minimum threshold.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[['Physical Stock',al.phy,low?'#856404':null],['Booking Balance',al.bk,null],['Total Available',al.phy+al.bk,'#c8401a']].map(([l,v,c]) => (
          <div key={l} style={{ background: '#fff', border: '0.5px solid #e2ddd4', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', color: '#888' }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 500, margin: '5px 0 2px', color: c||'#1a1a1a' }}>{fmt(v)} kg</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{(v/1000).toFixed(3)} MT</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #e2ddd4', fontWeight: 500, fontSize: 14 }}>Event Log</div>
        {alEv.length === 0
          ? <div style={{ padding: '20px 14px', color: '#aaa', fontSize: 13 }}>No events yet.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date','Type','Qty (kg)','MT','Ref'].map(h=><th key={h} style={{fontSize:11,fontWeight:500,textTransform:'uppercase',color:'#888',padding:'8px 12px',textAlign:'left',borderBottom:'0.5px solid #e2ddd4'}}>{h}</th>)}</tr></thead>
              <tbody>{alEv.map(ev=>(
                <tr key={ev.id}>
                  <td style={{padding:'8px 12px',fontSize:12,fontFamily:'DM Mono,monospace'}}>{fmtD(ev.date)}</td>
                  <td style={{padding:'8px 12px',fontSize:13}}>{ev.type}</td>
                  <td style={{padding:'8px 12px',fontSize:13,fontWeight:500}}>{fmt(ev.kg)}</td>
                  <td style={{padding:'8px 12px',fontSize:13,color:'#888'}}>{(ev.kg/1000).toFixed(3)}</td>
                  <td style={{padding:'8px 12px',fontSize:13,color:'#888'}}>{ev.sup||ev.note||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
        }
      </div>
    </div>
  )
}

// ── AUDIT PAGE ─────────────────────────────────────────────────────────────────
function AuditPage({ audit }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 500, marginBottom: 18 }}>Audit Trail</div>
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Date','Action','Order','By','Role'].map(h=><th key={h} style={{fontSize:11,fontWeight:500,textTransform:'uppercase',color:'#888',padding:'8px 12px',textAlign:'left',borderBottom:'0.5px solid #e2ddd4'}}>{h}</th>)}</tr></thead>
          <tbody>
            {audit.length === 0
              ? <tr><td colSpan={5} style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>No entries yet.</td></tr>
              : audit.map(ev=>(
                <tr key={ev.id}>
                  <td style={{padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{fmtD(ev.ts?.split('T')[0])}</td>
                  <td style={{padding:'8px 12px',fontSize:13,fontWeight:500}}>{ev.action}</td>
                  <td style={{padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{ev.orderId||'—'}</td>
                  <td style={{padding:'8px 12px',fontSize:13}}>{ev.user}</td>
                  <td style={{padding:'8px 12px'}}><Tag role={ev.role} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ADMIN PAGE ─────────────────────────────────────────────────────────────────
function AdminPage({ orders, setOrders, al, setAl, user, addLog }) {
  const resetAll = () => {
    if (!confirm('Reset ALL data to defaults? This will clear all orders and AL events.')) return
    localStorage.removeItem('tf_orders')
    localStorage.removeItem('tf_al')
    localStorage.removeItem('tf_alev')
    localStorage.removeItem('tf_audit')
    window.location.reload()
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 500 }}>Admin Panel</div>
        <Btn danger sm onClick={resetAll}>⚠ Reset All Data</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>AL Stock Override</div>
          {[['Physical (kg)','phy'],['Booking (kg)','bk'],['Min Alert (kg)','min']].map(([l,k]) => (
            <Fg key={k} label={l}><input style={S.inp} type="number" value={al[k]} onChange={e => setAl(s=>({...s,[k]:Number(e.target.value)}))} /></Fg>
          ))}
          <Btn primary sm onClick={() => addLog(null,'AL stock overridden')}>Save</Btn>
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Stats</div>
          <RRow label="Total Orders" value={orders.length} />
          <RRow label="Active"       value={orders.filter(o=>!['closed','invoiced'].includes(o.status)).length} />
          <RRow label="AL Physical"  value={`${fmt(al.phy)} kg`} />
          <RRow label="AL Booking"   value={`${fmt(al.bk)} kg`} />
        </div>
      </div>
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #e2ddd4', fontWeight: 500, fontSize: 14 }}>All Orders</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['ID','Customer','Status',''].map(h=><th key={h} style={{fontSize:11,fontWeight:500,textTransform:'uppercase',color:'#888',padding:'8px 12px',textAlign:'left',borderBottom:'0.5px solid #e2ddd4'}}>{h}</th>)}</tr></thead>
          <tbody>{orders.map(o=>(
            <tr key={o.id}>
              <td style={{padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{o.id}</td>
              <td style={{padding:'8px 12px',fontSize:13,fontWeight:500}}>{o.customer}</td>
              <td style={{padding:'8px 12px'}}><Chip label={ST[o.status]?.lbl||o.status} color={ST[o.status]?.c||'#666'} /></td>
              <td style={{padding:'8px 12px'}}><Btn danger sm onClick={()=>{if(!confirm('Delete?'))return;addLog(o.id,'Deleted');setOrders(os=>os.filter(x=>x.id!==o.id));}}>Delete</Btn></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
