'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Diamond, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-navy relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 translate-y-32 -translate-x-32" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-lg">
              <Diamond size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide">DAFA</h1>
              <p className="text-xs text-white/50 tracking-[0.3em]">KÍNH XÂY DỰNG</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Hệ thống quản lý
            <br />
            <span className="text-[#f59e0b]">kinh doanh</span> thông minh
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Quản lý toàn diện từ khách hàng, báo giá, đơn hàng đến công nợ.
            Tối ưu hiệu suất đội ngũ kinh doanh với công cụ hiện đại.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { value: '360°', label: 'Quản lý khách hàng' },
              { value: 'Pipeline', label: 'Theo dõi cơ hội' },
              { value: 'KPI', label: 'Đánh giá hiệu suất' },
              { value: 'Real-time', label: 'Báo cáo trực quan' },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-lg p-3">
                <p className="text-[#f59e0b] font-bold text-sm">{item.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-sm">© 2024 Dafa Glass Construction. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
              <Diamond size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f]">DAFA</h1>
              <p className="text-[9px] text-gray-400 tracking-[0.3em]">KÍNH XÂY DỰNG</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1e293b]">Đăng nhập</h2>
              <p className="text-gray-500 mt-1">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-scale-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dafa.vn"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 hover:border-gray-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a73] text-white rounded-lg font-medium text-sm hover:from-[#152d4a] hover:to-[#1e3a5f] transition-all duration-200 shadow-lg shadow-[#1e3a5f]/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Liên hệ quản trị viên nếu bạn quên mật khẩu
          </p>
        </div>
      </div>
    </div>
  )
}
