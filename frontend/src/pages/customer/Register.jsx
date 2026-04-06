import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
    Utensils, Mail, Lock, User, Phone,
    ArrowRight, UserPlus, Store, MapPin, Eye, EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Register = () => {
    const [searchParams] = useSearchParams()
    const mode = searchParams.get('mode')
    const isRestaurantMode = mode === 'restaurant'
    const isDeliveryMode = mode === 'delivery'

    const [formData, setFormData] = useState({
        email: '', username: '', phone: '',
        password: '', password2: '',
        restaurant_name: '', restaurant_address: '',
    })
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showPass2, setShowPass2] = useState(false)

    const { register, registerRestaurant } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.password2) {
            toast.error('Passwords do not match!')
            return
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters.')
            return
        }
        setLoading(true)
        try {
            if (isRestaurantMode) {
                await registerRestaurant(formData)
                toast.success('Restaurant registered! Sign in to continue.')
            } else {
                const payload = { ...formData }
                if (isDeliveryMode) payload.role = 'delivery'
                await register(payload)
                toast.success('Account created! Sign in to continue.')
            }
            navigate('/login')
        } catch (error) {
            const errors = error.response?.data
            if (errors) {
                const first = Object.values(errors)[0]
                toast.error(Array.isArray(first) ? first[0] : first)
            } else {
                toast.error('Registration failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* ── Left panel — desktop only ─────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[42%] bg-slate-900 relative overflow-hidden flex-col justify-between p-12 shrink-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/30 blur-[120px] rounded-full" />
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/20 blur-[130px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-25 filter blur-[4px] scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2.5 bg-primary-600 rounded-xl shadow-lg shadow-primary-600/30">
                            <Utensils size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-black italic tracking-tighter">Savor</span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <h1 className="text-5xl font-black text-white leading-tight mb-5 tracking-tight">
                            {isRestaurantMode ? (
                                <>Join Kerala&apos;s largest <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">food network.</span></>
                            ) : isDeliveryMode ? (
                                <>Join our fleet and <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">earn on demand.</span></>
                            ) : (
                                <>Taste the best of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">Kerala.</span></>
                            )}
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-sm">
                            {isRestaurantMode
                                ? 'Register your restaurant and start reaching thousands of hungry customers across Kerala.'
                                : isDeliveryMode
                                    ? 'Become a delivery partner and enjoy freedom, competitive pay, and flexible hours.'
                                    : 'Create your account to unlock premium restaurants, lightning-fast delivery, and live order tracking.'}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Right panel — the form ────────────────────────────────── */}
            <div className="flex-1 bg-white flex flex-col min-h-screen lg:min-h-0">

                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <Link to="/" className="flex items-center gap-2 text-primary-600">
                        <Utensils size={22} strokeWidth={3} />
                        <span className="text-xl font-black italic tracking-tighter">Savor</span>
                    </Link>
                    <Link to="/login" className="text-sm font-bold text-primary-600 hover:text-primary-700">
                        Sign In →
                    </Link>
                </div>

                {/* Scrollable form area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-full flex items-start justify-center p-5 sm:p-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-lg"
                        >
                            {/* Heading */}
                            <div className="mb-6 text-center sm:text-left">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                                    {isRestaurantMode ? 'Partner With Us' : isDeliveryMode ? 'Join Our Fleet' : 'Create Account'}
                                </h1>
                                <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
                                    {isRestaurantMode
                                        ? 'Set up your restaurant and start reaching customers.'
                                        : isDeliveryMode
                                            ? 'Register as a delivery agent and start earning today.'
                                            : 'Join Savor and start ordering from Kerala\'s best restaurants.'}
                                </p>
                                {(isRestaurantMode || isDeliveryMode) && (
                                    <Link
                                        to="/register"
                                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                                    >
                                        ← Register as a customer instead
                                    </Link>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">

                                {/* Restaurant-only fields */}
                                <AnimatePresence>
                                    {isRestaurantMode && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden pb-2"
                                        >
                                            {/* Restaurant name */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Restaurant Name</label>
                                                <div className="relative">
                                                    <Store size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        name="restaurant_name"
                                                        value={formData.restaurant_name}
                                                        onChange={handleChange}
                                                        placeholder="The Gourmet Kitchen"
                                                        className="input-premium pl-10 pr-4 py-2.5"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Restaurant address */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Restaurant Address</label>
                                                <div className="relative">
                                                    <MapPin size={17} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                                                    <textarea
                                                        name="restaurant_address"
                                                        value={formData.restaurant_address}
                                                        onChange={handleChange}
                                                        placeholder="123 Food Street, Kochi, Kerala..."
                                                        className="input-premium pl-10 pr-4 py-2.5 resize-none min-h-[60px]"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Username + Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Username</label>
                                        <div className="relative">
                                            <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="johndoe"
                                                autoComplete="username"
                                                className="input-premium pl-10 pr-4 py-2.5"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Phone <span className="text-slate-400 normal-case font-medium">(optional)</span></label>
                                        <div className="relative">
                                            <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 9876543210"
                                                autoComplete="tel"
                                                className="input-premium pl-10 pr-4 py-2.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
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

                                {/* Password + Confirm */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                                        <div className="relative">
                                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Min 8 chars"
                                                autoComplete="new-password"
                                                className="input-premium pl-10 pr-10 py-2.5"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm</label>
                                        <div className="relative">
                                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type={showPass2 ? 'text' : 'password'}
                                                name="password2"
                                                value={formData.password2}
                                                onChange={handleChange}
                                                placeholder="Repeat password"
                                                autoComplete="new-password"
                                                className="input-premium pl-10 pr-10 py-2.5"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPass2(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 mt-4 ${loading
                                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                                            : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-premium'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus size={18} strokeWidth={2.5} />
                                            {isRestaurantMode ? 'Create Restaurant Account' : isDeliveryMode ? 'Register as Agent' : 'Create Account'}
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
                                <p className="text-slate-500 text-sm font-medium">Already have an account?</p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors group text-sm"
                                >
                                    Sign in to your account
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                {!isRestaurantMode && (
                                    <div className="pt-1">
                                        <Link to="/register?mode=restaurant" className="text-xs text-slate-400 hover:text-primary-600 font-semibold transition-colors flex items-center justify-center gap-1.5 mt-2">
                                            Register your restaurant
                                            <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register