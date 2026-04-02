import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Users, Search, ShieldOff, ShieldCheck, Loader2, Trash2, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

const ROLE_STYLE = {
    admin: 'bg-amber-50 text-amber-700 border-amber-100',
    restaurant: 'bg-primary-50 text-primary-700 border-primary-100',
    customer: 'bg-slate-100 text-slate-600 border-slate-200',
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
            const response = await api.get('/users/all/')
            setUsers(response.data.results)
        } catch {
            toast.error('Failed to load users.')
        } finally {
            setLoading(false)
        }
    }

    const handleBlockToggle = async (userId) => {
        if (currentAdmin && userId === currentAdmin.id) {
            toast.error("Safety Alert: You cannot block your own account.")
            return
        }

        setTogglingId(userId)
        try {
            const response = await api.post(`/users/${userId}/block/`)
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_active: !u.is_active } : u
            ))
            toast.success(response.data.message)
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update user.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (currentAdmin && userId === currentAdmin.id) {
            toast.error("Safety Alert: You cannot delete your own account.")
            return
        }

        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return
        }

        setDeletingId(userId)
        try {
            await api.delete(`/users/${userId}/delete/`)
            setUsers(users.filter(u => u.id !== userId))
            toast.success("User deleted successfully.")
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

    return (
        <div className="flex-1 min-h-screen bg-[#FCFCFD]">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-primary-600 text-xs font-bold uppercase tracking-[0.2em] mb-1">Administration</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Users size={28} className="text-slate-300" strokeWidth={1.5} />
                            Users
                        </h1>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full sm:w-80 shadow-sm focus-within:border-primary-400 transition-colors">
                        <Search size={16} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by email or username…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 text-sm font-medium outline-none min-w-0"
                            style={{ fontSize: '16px' }}
                        />
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Users', value: users.length, color: 'text-slate-800' },
                        { label: 'Active', value: users.filter(u => u.is_active).length, color: 'text-emerald-600' },
                        { label: 'Blocked', value: users.filter(u => !u.is_active).length, color: 'text-rose-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 size={36} className="animate-spin text-primary-400" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Phone</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium text-sm">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-400">#{user.id}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    {user.email}
                                                    {currentAdmin && user.id === currentAdmin.id && (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-black uppercase rounded-md border border-primary-200">
                                                            <User size={8} /> You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{user.username}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{user.phone || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROLE_STYLE[user.role] || ROLE_STYLE.customer}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                                    <span className={`text-xs font-bold ${user.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {user.is_active ? 'Active' : 'Blocked'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {/* Block Button */}
                                                    <button
                                                        onClick={() => handleBlockToggle(user.id)}
                                                        disabled={togglingId === user.id || (currentAdmin && user.id === currentAdmin.id)}
                                                        title={currentAdmin && user.id === currentAdmin.id ? "You cannot block yourself" : ""}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            user.is_active
                                                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                                                        }`}
                                                    >
                                                        {togglingId === user.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : user.is_active ? (
                                                            <ShieldOff size={12} />
                                                        ) : (
                                                            <ShieldCheck size={12} />
                                                        )}
                                                        {user.is_active ? 'Block' : 'Unblock'}
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={deletingId === user.id || (currentAdmin && user.id === currentAdmin.id)}
                                                        title={currentAdmin && user.id === currentAdmin.id ? "You cannot delete yourself" : ""}
                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                                    >
                                                        {deletingId === user.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default AdminUsers