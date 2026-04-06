import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Utensils, Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(formData.email, formData.password)
            const userRes = await api.get('/users/profile/')
            const loggedInUser = userRes.data
            toast.success('Welcome back.')
            if (loggedInUser.role === 'admin' || loggedInUser.is_staff) {
                navigate('/admin')
            } else if (loggedInUser.role === 'restaurant') {
                navigate('/restaurant-admin')
            } else if (loggedInUser.role === 'delivery') {
                navigate('/delivery/dashboard')
            } else {
                navigate('/')
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* ── Left panel — visible on desktop only ──────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
                {/* Background glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/20 blur-[130px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-25 filter blur-[4px] scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white mb-16">
                        <div className="p-2.5 bg-primary-600 rounded-xl shadow-lg shadow-primary-600/30">
                            <Utensils size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-black italic tracking-tighter">Savor</span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                            Your favourite<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">
                                flavours await.
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-md">
                            Sign in to manage orders, explore premium menus, and track deliveries in real-time.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Right panel — the form (full width on mobile) ─────────── */}
            <div className="flex-1 bg-white flex flex-col">

                {/* Mobile-only top bar */}
                <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <Link to="/" className="flex items-center gap-2 text-primary-600">
                        <Utensils size={22} strokeWidth={3} />
                        <span className="text-xl font-black italic tracking-tighter">Savor</span>
                    </Link>
                    <Link to="/register" className="text-sm font-bold text-primary-600 hover:text-primary-700">
                        Sign Up →
                    </Link>
                </div>

                {/* Form container — scrollable on mobile */}
                <div className="flex-1 flex items-start sm:items-center justify-center p-5 sm:p-8 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md"
                    >
                        {/* Heading */}
                        <div className="mb-6 text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                                Welcome back.
                            </h1>
                            <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                                Enter your credentials to securely access your account.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        className="input-premium pl-10 pr-4 py-2.5"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="input-premium pl-10 pr-12 py-2.5"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 ${loading
                                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-premium'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={18} strokeWidth={2.5} />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer links */}
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
                            <p className="text-slate-500 text-sm font-medium">
                                Don&apos;t have an account?
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors group"
                            >
                                Create a free account
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <div className="pt-2 flex flex-col gap-1.5">
                                <Link
                                    to="/register?mode=restaurant"
                                    className="text-[10px] text-slate-400 hover:text-primary-600 font-semibold transition-colors flex items-center justify-center gap-1.5"
                                >
                                    Register your restaurant
                                    <ArrowRight size={10} />
                                </Link>
                                <Link
                                    to="/register?mode=delivery"
                                    className="text-[10px] text-slate-400 hover:text-emerald-600 font-semibold transition-colors flex items-center justify-center gap-1.5"
                                >
                                    Become a Delivery Partner
                                    <ArrowRight size={10} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Login
