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
  const [success, setSuccess] = useState('')

  // 登录表单
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  // 注册表单
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', role: 'user' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
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
        setSuccess('登录成功！')
        setTimeout(() => setPage('dashboard'), 500)
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请检查服务器是否运行')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
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
        setSuccess('注册成功！')
        setTimeout(() => setPage('dashboard'), 500)
      } else {
        setError(data.error || '注册失败')
      }
    } catch (err) {
      setError('网络错误，请检查服务器是否运行')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setPage('home')
    setSuccess('已退出登录')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* 导航栏 */}
      <nav style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div
          style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setPage('home')}
        >
          <span style={{ color: '#4ade80' }}>⬡</span>
          Token Marketplace
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <div style={{
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: '#4ade80',
                fontSize: '0.875rem'
              }}>
                💰 {user.points_balance} 积分
              </div>
              <button onClick={() => setPage('dashboard')} style={navBtn}>仪表板</button>
              <button onClick={() => setPage('marketplace')} style={navBtn}>市场</button>
              <button onClick={handleLogout} style={{ ...navBtn, borderColor: '#f87171', color: '#f87171' }}>退出</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} style={navBtn}>登录</button>
              <button onClick={() => setPage('register')} style={navBtnPrimary}>注册</button>
            </>
          )}
        </div>
      </nav>

      {/* 提示信息 */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'rgba(74, 222, 128, 0.9)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(74, 222, 128, 0.3)',
          zIndex: 100,
          animation: 'slideIn 0.3s ease'
        }}>
          ✅ {success}
        </div>
      )}

      {/* 主内容区 */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'login' && <LoginPage form={loginForm} setForm={setLoginForm} onSubmit={handleLogin} error={error} loading={loading} setPage={setPage} />}
        {page === 'register' && <RegisterPage form={registerForm} setForm={setRegisterForm} onSubmit={handleRegister} error={error} loading={loading} setPage={setPage} />}
        {page === 'dashboard' && <DashboardPage user={user} token={token} />}
        {page === 'marketplace' && <MarketplacePage token={token} />}
      </main>

      {/* 页脚 */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#64748b',
        borderTop: '1px solid rgba(100, 116, 139, 0.2)',
        marginTop: '4rem'
      }}>
        <p>Token Marketplace © 2026 | 基于 AI 模型 Token 的二级市场交易平台</p>
      </footer>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// 导航按钮样式
const navBtn = {
  background: 'transparent',
  border: '1px solid rgba(74, 222, 128, 0.5)',
  color: '#4ade80',
  padding: '0.5rem 1.25rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'all 0.2s',
  fontWeight: 500
}

const navBtnPrimary = {
  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  border: 'none',
  color: 'white',
  padding: '0.5rem 1.25rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'all 0.2s',
  fontWeight: 600
}

// 首页组件
function HomePage({ setPage }: { setPage: (p: any) => void }) {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Hero区域 */}
      <div style={{ textAlign: 'center', padding: '6rem 2rem 4rem' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          color: '#4ade80',
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          🚀 AI 模型 Token 交易新方式
        </div>
        <h1 style={{
          fontSize: '4rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Token 二级市场平台
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          安全、高效、透明的 AI 模型 Token 交易平台
          <br />
          支持 OpenAI 兼容协议，无缝集成现有系统
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <button
            onClick={() => setPage('marketplace')}
            style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(74, 222, 128, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(74, 222, 128, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(74, 222, 128, 0.3)'
            }}
          >
            浏览市场 →
          </button>
          <button
            onClick={() => setPage('register')}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            开始使用
          </button>
        </div>
      </div>

      {/* 特性卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto 4rem'
      }}>
        <FeatureCard
          icon="🎯"
          title="Token 市场"
          desc="浏览和购买各种 AI 模型的 Token 服务，支持多种协议"
          onClick={() => setPage('marketplace')}
        />
        <FeatureCard
          icon="💰"
          title="提供服务"
          desc="上传您的 AI 模型 Token，赚取积分收益"
          onClick={() => setPage('register')}
        />
        <FeatureCard
          icon="🔗"
          title="API 代理"
          desc="兼容 OpenAI API 协议，无缝集成现有系统"
          onClick={() => setPage('dashboard')}
        />
      </div>

      {/* 数据统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 0'
      }}>
        <StatCard number="47" label="API 接口" />
        <StatCard number="141" label="测试用例" />
        <StatCard number="<15ms" label="平均延迟" />
        <StatCard number="99.9%" label="可用性" />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.3s',
        textAlign: 'left'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.5)'
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'white' }}>{title}</h3>
      <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#4ade80',
        marginBottom: '0.5rem'
      }}>
        {number}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{label}</div>
    </div>
  )
}

// 登录页面
function LoginPage({ form, setForm, onSubmit, error, loading, setPage }: any) {
  return (
    <div style={{
      maxWidth: '420px',
      margin: '4rem auto',
      animation: 'fadeIn 0.5s ease'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
          <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>欢迎回来</h2>
          <p style={{ color: '#94a3b8' }}>登录您的 Token Marketplace 账号</p>
        </div>

        {error && (
          <div style={{
            color: '#fca5a5',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.875rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              style={inputStyle}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              style={inputStyle}
              placeholder="请输入密码"
              required
            />
          </div>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? '⏳ 登录中...' : '🚀 登录'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#94a3b8' }}>
          还没有账号？
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setPage('register') }}
            style={{ color: '#4ade80', textDecoration: 'none', marginLeft: '0.5rem' }}
          >
            立即注册 →
          </a>
        </p>
      </div>
    </div>
  )
}

// 注册页面
function RegisterPage({ form, setForm, onSubmit, error, loading, setPage }: any) {
  return (
    <div style={{
      maxWidth: '420px',
      margin: '4rem auto',
      animation: 'fadeIn 0.5s ease'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>创建账号</h2>
          <p style={{ color: '#94a3b8' }}>加入 Token Marketplace 开始交易</p>
        </div>

        {error && (
          <div style={{
            color: '#fca5a5',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.875rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              style={inputStyle}
              placeholder="3-50个字符"
              required
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              邮箱
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              style={inputStyle}
              placeholder="your@email.com"
              required
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              style={inputStyle}
              placeholder="至少6个字符"
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              角色
            </label>
            <select
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              style={inputStyle}
            >
              <option value="user">👤 用户 - 购买和使用 Token</option>
              <option value="provider">💼 提供者 - 出售 Token 服务</option>
            </select>
          </div>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? '⏳ 注册中...' : '✨ 创建账号'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#94a3b8' }}>
          已有账号？
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setPage('login') }}
            style={{ color: '#4ade80', textDecoration: 'none', marginLeft: '0.5rem' }}
          >
            立即登录 →
          </a>
        </p>
      </div>
    </div>
  )
}

// 仪表板页面
function DashboardPage({ user, token }: { user: User | null, token: string | null }) {
  const [balance, setBalance] = useState(0)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState(100)
  const [copied, setCopied] = useState(false)

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
      fetch(`${API_BASE}/api/auth/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => d.success && setApiKeys(d.data))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '2rem' }}>
        👋 欢迎回来，{user?.username}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* 用户信息卡片 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {user?.role === 'provider' ? '💼' : '👤'}
            </div>
            <div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user?.username}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{user?.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>角色</div>
              <div style={{ color: 'white', fontWeight: 600 }}>{user?.role === 'provider' ? '提供者' : '用户'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>积分余额</div>
              <div style={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 'bold' }}>{balance}</div>
            </div>
          </div>
        </div>

        {/* 积分充值 */}
        <div style={cardStyle}>
          <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem' }}>💰 积分充值</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[100, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => setRechargeAmount(amount)}
                style={{
                  padding: '0.75rem',
                  background: rechargeAmount === amount ? 'rgba(74, 222, 128, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  border: `1px solid ${rechargeAmount === amount ? 'rgba(74, 222, 128, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '8px',
                  color: rechargeAmount === amount ? '#4ade80' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {amount} 积分
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="number"
              value={rechargeAmount}
              onChange={e => setRechargeAmount(Number(e.target.value))}
              style={{ ...inputStyle, flex: 1 }}
              min="1"
            />
            <button onClick={handleRecharge} style={{ ...btnPrimary, padding: '0.75rem 2rem' }}>
              充值
            </button>
          </div>
        </div>
      </div>

      {/* API Key管理 */}
      <div style={cardStyle}>
        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem' }}>🔑 API Key 管理</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="输入 Key 名称"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleGenerateKey} style={{ ...btnPrimary, padding: '0.75rem 2rem' }}>
            生成 Key
          </button>
        </div>
        {apiKeys.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
                  <th style={thStyle}>名称</th>
                  <th style={thStyle}>前缀</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k: any) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.1)' }}>
                    <td style={tdStyle}>{k.name}</td>
                    <td style={tdStyle}>
                      <code style={{ background: 'rgba(100, 116, 139, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {k.key_prefix}...
                      </code>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        background: k.is_active ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: k.is_active ? '#4ade80' : '#f87171'
                      }}>
                        {k.is_active ? '活跃' : '停用'}
                      </span>
                    </td>
                    <td style={tdStyle}>{new Date(k.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>暂无 API Key</p>
        )}
      </div>

      {/* API使用说明 */}
      <div style={cardStyle}>
        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem' }}>📖 API 使用说明</h3>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>使用生成的 API Key 访问 OpenAI 兼容接口:</p>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '1.5rem',
            borderRadius: '8px',
            position: 'relative'
          }}>
            <pre style={{ color: '#4ade80', margin: 0, overflow: 'auto', fontSize: '0.875rem' }}>
{`curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
            </pre>
            <button
              onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_API_KEY" -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello!"}]}'`)}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'rgba(74, 222, 128, 0.2)',
                border: 'none',
                color: '#4ade80',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              {copied ? '✅ 已复制' : '📋 复制'}
            </button>
          </div>
        </div>
        <div>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>THC 协议接口:</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['/thc/v1/version', '/thc/v1/health'].map(endpoint => (
              <code key={endpoint} style={{
                background: 'rgba(100, 116, 139, 0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '0.875rem'
              }}>
                GET {endpoint}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 市场页面
function MarketplacePage({ token }: { token: string | null }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/marketplace/browse`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setTokens(d.data.tokens)
        setLoading(false)
      })
  }, [])

  const filteredTokens = tokens.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.model_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '2rem' }}>🏪 Token 市场</h2>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜索 Token 名称或模型..."
            style={{
              ...inputStyle,
              width: '300px',
              paddingLeft: '2.5rem'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b'
          }}>
            🔍
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>⏳</div>
          <p>加载中...</p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '6rem 2rem',
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '16px',
          border: '1px dashed rgba(100, 116, 139, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>暂无可用 Token</h3>
          <p style={{ color: '#94a3b8' }}>成为提供者，上传您的 Token 服务！</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredTokens.map(t => (
            <div key={t.id} style={tokenCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>{t.name}</h3>
                <span style={{
                  background: t.protocol === 'openai'
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : t.protocol === 'thc'
                    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {t.protocol.toUpperCase()}
                </span>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>模型</span>
                  <span style={{ color: 'white', fontWeight: 500 }}>{t.model_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>提供者</span>
                  <span style={{ color: 'white' }}>{t.provider_username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>价格</span>
                  <span style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {t.price_per_1k_tokens} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>积分/1k tokens</span>
                  </span>
                </div>
              </div>
              <button
                style={{
                  ...btnPrimary,
                  width: '100%',
                  padding: '0.875rem'
                }}
                onClick={() => alert('请使用 API Key 通过 /v1 接口调用此 Token')}
              >
                🚀 使用此 Token
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
  padding: '0.875rem 1rem',
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(100, 116, 139, 0.3)',
  borderRadius: '8px',
  fontSize: '0.9rem',
  color: 'white',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s, box-shadow 0.2s',
  outline: 'none'
}

const btnPrimary = {
  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  color: 'white',
  border: 'none',
  padding: '0.875rem 2rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)'
}

const cardStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(10px)',
  padding: '1.75rem',
  borderRadius: '12px',
  border: '1px solid rgba(100, 116, 139, 0.2)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
}

const tokenCardStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(10px)',
  padding: '1.75rem',
  borderRadius: '12px',
  border: '1px solid rgba(100, 116, 139, 0.2)',
  transition: 'all 0.3s'
}

const thStyle = {
  textAlign: 'left' as const,
  padding: '1rem',
  color: '#94a3b8',
  fontSize: '0.875rem',
  fontWeight: 500
}

const tdStyle = {
  padding: '1rem',
  color: '#e2e8f0'
}
