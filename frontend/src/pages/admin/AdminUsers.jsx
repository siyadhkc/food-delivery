import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Users, Search, ShieldOff, ShieldCheck, Loader2, Trash2, User, Activity, AlertCircle, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

const ROLE_STYLE = {
    admin: 'bg-amber-50 text-amber-600 border-amber-100/50',
    restaurant: 'bg-primary-50 text-primary-600 border-primary-100/50',
    delivery: 'bg-violet-50 text-violet-600 border-violet-100/50',
    customer: 'bg-slate-50 text-slate-500 border-slate-100',
}

const AdminUsers = () => {
    const { user: currentAdmin } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [togglingId, setTogglingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        try {
            let nextUrl = '/users/all/'
            let allUsers = []

            while (nextUrl) {
                const response = await api.get(nextUrl, {
                    params: nextUrl === '/users/all/' ? { page_size: 200 } : undefined,
                })

                if (Array.isArray(response.data)) {
                    allUsers = response.data
                    nextUrl = null
                    continue
                }

                allUsers = allUsers.concat(response.data.results || [])
                nextUrl = response.data.next
            }

            setUsers(allUsers)
        } catch {
            toast.error('Failed to load user manifest.')
        } finally {
            setLoading(false)
        }
    }

    const handleBlockToggle = async (userId) => {
        if (currentAdmin && userId === currentAdmin.id) {
            toast.error("Safety Violation: Self-modification prohibited.")
            return
        }

        setTogglingId(userId)
        try {
            const response = await api.post(`/users/${userId}/block/`)
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_active: !u.is_active } : u
            ))
            toast.success('Protocol updated.')
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update user.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (currentAdmin && userId === currentAdmin.id) {
            toast.error("Safety Violation: Self-deletion prohibited.")
            return
        }

        if (!window.confirm("CAUTION: This will permanently expunge the user entity. Proceed?")) {
            return
        }

        setDeletingId(userId)
        try {
            await api.delete(`/users/${userId}/delete/`)
            setUsers(users.filter(u => u.id !== userId))
            toast.success("User expunged successfully.")
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete user.')
        } finally {
            setDeletingId(null)
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing user directory...</p>
            </div>
        )
    }

    return (
        <div className="flex-1 px-5 md:px-10 py-10 bg-slate-50/50 min-h-screen relative overflow-y-auto">
            {/* Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            </div>

            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Global Identity Management</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">User <span className="text-primary-600 font-light italic">Manifest</span></h1>
                        <p className="text-slate-500 font-medium mt-2">Manage and monitor all platform participants with administrative oversight.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by email or username…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[20px] text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-full sm:w-[320px] shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: 'Platform Population', value: users.length, color: 'text-slate-900', icon: Users, bg: 'bg-slate-50' },
                        { label: 'Authenticated / Active', value: users.filter(u => u.is_active).length, color: 'text-emerald-600', icon: Activity, bg: 'bg-emerald-50/50' },
                        { label: 'Restricted Protocols', value: users.filter(u => !u.is_active).length, color: 'text-rose-600', icon: AlertCircle, bg: 'bg-rose-50/50' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                             <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.color} tracking-tighter leading-none`}>{stat.value}</p>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Users Directory */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-12">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">Tag</th>
                                    <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">Identity / Status</th>
                                    <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">Communication</th>
                                    <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">Privilege Level</th>
                                    <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 text-right pr-12">Authorization Controls</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                             <div className="flex flex-col items-center">
                                                <Users size={48} className="text-slate-100 mb-4" />
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Null Population</h3>
                                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No matching user entities found.</p>
                                             </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group tracking-tight">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">#{user.id}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                    {user.username?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 leading-none mb-1">{user.username}</span>
                                                        {currentAdmin && user.id === currentAdmin.id && (
                                                            <span className="px-1.5 py-0.5 bg-primary-50 text-primary-600 text-[8px] font-black uppercase tracking-widest rounded border border-primary-100/50">Admin Core</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {user.is_active ? 'Authorized' : 'Restricted'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 leading-none mb-1">{user.email}</span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user.phone || 'No Mobile Link'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${ROLE_STYLE[user.role] || ROLE_STYLE.customer}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 pr-12 text-right">
                                            <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                {/* Block Toggle */}
                                                <button
                                                    onClick={() => handleBlockToggle(user.id)}
                                                    disabled={togglingId === user.id || (currentAdmin && user.id === currentAdmin.id)}
                                                    className={`h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-20 border ${
                                                        user.is_active
                                                            ? 'bg-rose-50 text-rose-600 border-rose-100/50 hover:bg-rose-600 hover:text-white'
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                                >
                                                    {togglingId === user.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : user.is_active ? (
                                                        <ShieldOff size={14} />
                                                    ) : (
                                                        <ShieldCheck size={14} />
                                                    )}
                                                    {user.is_active ? 'Restrict' : 'Authorize'}
                                                </button>

                                                {/* Expunge Button */}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={deletingId === user.id || (currentAdmin && user.id === currentAdmin.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 border border-slate-100 transition-all disabled:opacity-20 shadow-sm"
                                                >
                                                    {deletingId === user.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminUsers
