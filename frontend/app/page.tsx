'use client'

import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3000'

interface User {
  id: string
  username: string
  email: string
  role: string
  points_balance: string
}

interface Token {
  id: string
  name: string
  model_name: string
  protocol: string
  price_per_1k_tokens: string
  is_active: boolean
  provider_username: string
}

export default function Home() {
  const [page, setPage] = useState<'home' | 'login' | 'register' | 'dashboard' | 'marketplace' | 'admin'>('home')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 登录表单
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  // 注册表单
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', role: 'user' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data.user)
        setToken(data.data.tokens.accessToken)
        setPage('dashboard')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data.user)
        setToken(data.data.tokens.accessToken)
        setPage('dashboard')
      } else {
        setError(data.error || '注册失败')
      }
    } catch (err) {
      setError('网络错误')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setPage('home')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 导航栏 */}
      <nav style={{ background: '#1a1a2e', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>Token Marketplace</div>
        <div>
          {user ? (
            <>
              <span style={{ color: '#aaa', marginRight: '1rem' }}>欢迎, {user.username}</span>
              <span style={{ color: '#4ade80', marginRight: '1rem' }}>积分: {user.points_balance}</span>
              <button onClick={() => setPage('dashboard')} style={navBtn}>仪表板</button>
              <button onClick={() => setPage('marketplace')} style={navBtn}>市场</button>
              <button onClick={handleLogout} style={navBtn}>退出</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} style={navBtn}>登录</button>
              <button onClick={() => setPage('register')} style={navBtn}>注册</button>
            </>
          )}
        </div>
      </nav>

      {/* 主内容区 */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'login' && <LoginPage form={loginForm} setForm={setLoginForm} onSubmit={handleLogin} error={error} loading={loading} setPage={setPage} />}
        {page === 'register' && <RegisterPage form={registerForm} setForm={setRegisterForm} onSubmit={handleRegister} error={error} loading={loading} setPage={setPage} />}
        {page === 'dashboard' && <DashboardPage user={user} token={token} />}
        {page === 'marketplace' && <MarketplacePage token={token} />}
      </main>
    </div>
  )
}

const navBtn = {
  background: 'transparent',
  border: '1px solid #4ade80',
  color: '#4ade80',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '0.5rem'
}

// 首页组件
function HomePage({ setPage }: { setPage: (p: any) => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Token二级市场平台</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>AI模型token交易平台</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Card
          title="Token市场"
          desc="浏览和购买各种AI模型的token服务"
          onClick={() => setPage('marketplace')}
        />
        <Card
          title="提供服务"
          desc="上传您的AI模型token，赚取积分"
          onClick={() => setPage('register')}
        />
        <Card
          title="API代理"
          desc="兼容OpenAI API，无缝集成"
          onClick={() => setPage('dashboard')}
        />
      </div>
    </div>
  )
}

function Card({ title, desc, onClick }: { title: string, desc: string, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        textAlign: 'left'
      }}
    >
      <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#666' }}>{desc}</p>
    </div>
  )
}

// 登录页面
function LoginPage({ form, setForm, onSubmit, error, loading, setPage }: any) {
  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>登录</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>密码</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            style={inputStyle}
            required
          />
        </div>
        <button type="submit" style={btnPrimary} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        还没有账号？<a href="#" onClick={(e) => { e.preventDefault(); setPage('register') }}>立即注册</a>
      </p>
    </div>
  )
}

// 注册页面
function RegisterPage({ form, setForm, onSubmit, error, loading, setPage }: any) {
  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>注册</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>邮箱</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>密码</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>角色</label>
          <select
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}
            style={inputStyle}
          >
            <option value="user">用户</option>
            <option value="provider">提供者</option>
          </select>
        </div>
        <button type="submit" style={btnPrimary} disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        已有账号？<a href="#" onClick={(e) => { e.preventDefault(); setPage('login') }}>立即登录</a>
      </p>
    </div>
  )
}

// 仪表板页面
function DashboardPage({ user, token }: { user: User | null, token: string | null }) {
  const [balance, setBalance] = useState(0)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState(100)

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/marketplace/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => d.success && setBalance(d.data.points_balance))

      fetch(`${API_BASE}/api/auth/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => d.success && setApiKeys(d.data))
    }
  }, [token])

  const handleRecharge = async () => {
    if (!token) return
    const res = await fetch(`${API_BASE}/api/marketplace/recharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: rechargeAmount })
    })
    const data = await res.json()
    if (data.success) setBalance(data.data.new_balance)
  }

  const handleGenerateKey = async () => {
    if (!token) return
    const res = await fetch(`${API_BASE}/api/auth/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newKeyName })
    })
    const data = await res.json()
    if (data.success) {
      alert(`API Key已生成: ${data.data.apiKey}\n\n请妥善保存，此Key仅显示一次！`)
      setNewKeyName('')
      // 刷新列表
      fetch(`${API_BASE}/api/auth/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => d.success && setApiKeys(d.data))
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>仪表板</h2>

      {/* 用户信息卡片 */}
      <div style={cardStyle}>
        <h3>用户信息</h3>
        <p><strong>用户名:</strong> {user?.username}</p>
        <p><strong>邮箱:</strong> {user?.email}</p>
        <p><strong>角色:</strong> {user?.role}</p>
        <p><strong>积分余额:</strong> <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{balance}</span></p>
      </div>

      {/* 积分充值 */}
      <div style={cardStyle}>
        <h3>积分充值</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="number"
            value={rechargeAmount}
            onChange={e => setRechargeAmount(Number(e.target.value))}
            style={{ ...inputStyle, width: '150px' }}
          />
          <button onClick={handleRecharge} style={btnPrimary}>充值</button>
        </div>
      </div>

      {/* API Key管理 */}
      <div style={cardStyle}>
        <h3>API Key管理</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key名称"
            style={inputStyle}
          />
          <button onClick={handleGenerateKey} style={btnPrimary}>生成Key</button>
        </div>
        {apiKeys.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={thStyle}>名称</th>
                <th style={thStyle}>前缀</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k: any) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{k.name}</td>
                  <td style={tdStyle}><code>{k.key_prefix}...</code></td>
                  <td style={tdStyle}>{k.is_active ? '✅ 活跃' : '❌ 停用'}</td>
                  <td style={tdStyle}>{new Date(k.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666' }}>暂无API Key</p>
        )}
      </div>

      {/* API使用说明 */}
      <div style={cardStyle}>
        <h3>API使用说明</h3>
        <p style={{ marginBottom: '1rem' }}>使用生成的API Key访问OpenAI兼容接口:</p>
        <pre style={{ background: '#1a1a2e', color: '#4ade80', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
        </pre>
        <p style={{ marginTop: '1rem' }}>THC协议接口:</p>
        <pre style={{ background: '#1a1a2e', color: '#4ade80', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`curl http://localhost:3000/thc/v1/version
curl http://localhost:3000/thc/v1/health`}
        </pre>
      </div>
    </div>
  )
}

// 市场页面
function MarketplacePage({ token }: { token: string | null }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/marketplace/browse`)
      .then(r => r.json())
      .then(d => d.success && setTokens(d.data.tokens))
  }, [])

  const filteredTokens = tokens.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.model_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Token市场</h2>

      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索Token名称或模型..."
          style={{ ...inputStyle, width: '400px' }}
        />
      </div>

      {filteredTokens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
          <p>暂无可用Token</p>
          <p>成为提供者，上传您的Token服务！</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredTokens.map(t => (
            <div key={t.id} style={tokenCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <span style={{
                  background: t.protocol === 'openai' ? '#4ade80' : t.protocol === 'thc' ? '#60a5fa' : '#f59e0b',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {t.protocol.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}><strong>模型:</strong> {t.model_name}</p>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}><strong>提供者:</strong> {t.provider_username}</p>
              <p style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {t.price_per_1k_tokens} 积分/1k tokens
              </p>
              <button
                style={{ ...btnPrimary, width: '100%', marginTop: '1rem' }}
                onClick={() => alert('请使用API Key通过/v1接口调用此Token')}
              >
                使用此Token
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 样式
const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box' as const
}

const btnPrimary = {
  background: '#4ade80',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer'
}

const cardStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '1.5rem'
}

const tokenCardStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}

const thStyle = {
  textAlign: 'left' as const,
  padding: '0.75rem',
  fontWeight: 'bold'
}

const tdStyle = {
  padding: '0.75rem'
}
