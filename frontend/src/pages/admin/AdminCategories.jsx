import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { getImageUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
    Plus, Image as ImageIcon, Pencil, Trash2, X,
    AlertCircle, Search, Loader2, CheckCircle2, ChevronDown, ChevronUp, FolderOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AdminCategories = () => {
    const { user } = useAuth()
    const isRestaurantMode = user?.role === 'restaurant' && !!user?.restaurant_id
    const restaurantId = user?.restaurant_id ? String(user.restaurant_id) : ''
    const [restaurants, setRestaurants]       = useState([])
    const [categoriesByRest, setCategoriesByRest] = useState({})  // { restaurantId: [cats] }
    const [loading, setLoading]               = useState(true)
    const [expandedRest, setExpandedRest]     = useState(null)    // which restaurant is open
    const [showModal, setShowModal]           = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [modalRestaurant, setModalRestaurant] = useState('')
    const [name, setName]                     = useState('')
    const [imageFile, setImageFile]           = useState(null)
    const [submitting, setSubmitting]         = useState(false)
    const [searchQuery, setSearchQuery]       = useState('')

    // ── Fetch all restaurants ─────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                if (isRestaurantMode && restaurantId) {
                    const [restaurantRes, categoriesRes] = await Promise.all([
                        api.get(`/restaurant/restaurants/${restaurantId}/`),
                        api.get(`/menu/categories/?restaurant=${restaurantId}&page_size=100`),
                    ])
                    setRestaurants([restaurantRes.data])
                    setCategoriesByRest({
                        [restaurantId]: categoriesRes.data.results || [],
                    })
                    setExpandedRest(restaurantId)
                    return
                }

                const res = await api.get('/restaurant/restaurants/?page_size=200')
                setRestaurants(res.data.results || [])
            } catch {
                toast.error('Failed to load restaurants.')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [isRestaurantMode, restaurantId])

    // ── When a restaurant accordion opens, fetch its categories ──────────────
    const toggleRestaurant = async (restId) => {
        if (isRestaurantMode) {
            return
        }
        if (expandedRest === restId) {
            setExpandedRest(null)
            return
        }
        setExpandedRest(restId)
        if (!categoriesByRest[restId]) {
            try {
                const res = await api.get(`/menu/categories/?restaurant=${restId}&page_size=50`)
                setCategoriesByRest(prev => ({ ...prev, [restId]: res.data.results || [] }))
            } catch {
                toast.error('Failed to load sections.')
            }
        }
    }

    // ── Reload categories for a specific restaurant ───────────────────────────
    const reloadCategories = async (restId) => {
        try {
            const res = await api.get(`/menu/categories/?restaurant=${restId}&page_size=50`)
            setCategoriesByRest(prev => ({ ...prev, [restId]: res.data.results || [] }))
        } catch {
            toast.error('Failed to reload sections.')
        }
    }

    const openCreateModal = (restId = '') => {
        setEditingCategory(null)
        setModalRestaurant(restId || restaurantId)
        setName('')
        setImageFile(null)
        setShowModal(true)
    }

    const openEditModal = (cat, restId) => {
        setEditingCategory(cat)
        setModalRestaurant(String(restId))
        setName(cat.name)
        setImageFile(null)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!modalRestaurant) { toast.error('Please select a restaurant.'); return }
        setSubmitting(true)
        try {
            const data = new FormData()
            data.append('name', name)
            data.append('restaurant', modalRestaurant)
            if (imageFile) data.append('image', imageFile)
            const headers = { 'Content-Type': 'multipart/form-data' }

            if (editingCategory) {
                await api.patch(`/menu/categories/${editingCategory.id}/`, data, { headers })
                toast.success('Section updated.')
            } else {
                await api.post('/menu/categories/', data, { headers })
                toast.success('Section created.')
            }
            setShowModal(false)
            reloadCategories(modalRestaurant)
        } catch {
            toast.error('Failed to save section.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (catId, restId) => {
        if (!window.confirm('Delete this menu section? All items in it will lose their section tag.')) return
        try {
            await api.delete(`/menu/categories/${catId}/`)
            toast.success('Section deleted.')
            reloadCategories(restId)
        } catch {
            toast.error('Failed to delete section.')
        }
    }

    const filteredRestaurants = isRestaurantMode
        ? restaurants
        : restaurants.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <Loader2 className="animate-spin text-primary-400 mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading restaurants…</p>
            </div>
        )
    }

    return (
        <div className="flex-1 px-5 md:px-10 py-10 bg-slate-50/50 min-h-screen relative overflow-y-auto">
            <div className="relative z-10">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isRestaurantMode ? 'Partner Portal' : 'Admin Panel'}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                            Menu <span className="text-primary-600 font-light italic">Sections</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">
                            {isRestaurantMode
                                ? 'Manage sections for your restaurant only.'
                                : 'Restaurant-specific sections like "Must Try", "Specials", "Beverages"'
                            }
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {!isRestaurantMode && (
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Filter restaurants…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[20px] text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-full sm:w-[240px] shadow-sm"
                                />
                            </div>
                        )}
                        <button
                            onClick={() => openCreateModal(isRestaurantMode ? restaurantId : '')}
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Add Section
                        </button>
                    </div>
                </div>

                {/* ── Restaurant Accordion List ─────────────────────────────── */}
                <div className="space-y-4">
                    {filteredRestaurants.map((rest) => {
                        const cats = categoriesByRest[rest.id] || []
                        const isOpen = expandedRest === rest.id

                        return (
                            <div key={rest.id} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                                {/* Restaurant row (clickable toggle) */}
                                <button
                                    onClick={() => toggleRestaurant(rest.id)}
                                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {rest.logo ? (
                                            <img
                                                src={getImageUrl(rest.logo)}
                                                alt={rest.name}
                                                className="w-11 h-11 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <FolderOpen size={18} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="text-left">
                                            <p className="font-black text-slate-900 text-base">{rest.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rest.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isOpen && cats.length > 0 && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                                                {cats.length} sections
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openCreateModal(String(rest.id)) }}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-100 transition-colors border border-primary-100"
                                        >
                                            <Plus size={13} strokeWidth={3} />
                                            Add
                                        </button>
                                        {!isRestaurantMode && (
                                            isOpen
                                                ? <ChevronUp size={18} className="text-slate-400" />
                                                : <ChevronDown size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Sections list (expanded) */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-slate-50 px-8 py-4">
                                                {cats.length === 0 ? (
                                                    <div className="flex flex-col items-center py-8 text-center">
                                                        <AlertCircle size={28} className="text-slate-200 mb-3" />
                                                        <p className="text-slate-400 font-bold text-sm">No sections yet.</p>
                                                        <button
                                                            onClick={() => openCreateModal(String(rest.id))}
                                                            className="mt-3 text-primary-600 font-black text-xs uppercase tracking-widest hover:underline"
                                                        >
                                                            + Create first section
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-2">
                                                        {cats.map(cat => (
                                                            <div
                                                                key={cat.id}
                                                                className="group flex items-center justify-between gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    {cat.image ? (
                                                                        <img
                                                                            src={getImageUrl(cat.image)}
                                                                            alt=""
                                                                            className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                                            <FolderOpen size={13} className="text-primary-500" />
                                                                        </div>
                                                                    )}
                                                                    <span className="text-sm font-black text-slate-800 truncate">{cat.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                                    <button
                                                                        onClick={() => openEditModal(cat, rest.id)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(cat.id, rest.id)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}

                    {filteredRestaurants.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 border-dashed">
                            <AlertCircle size={40} className="text-slate-200 mb-4" strokeWidth={1} />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">No restaurants found</h3>
                            <p className="text-slate-400 font-bold text-sm">Try a different search term.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal ────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden border border-white/20">
                                {/* Header */}
                                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {editingCategory ? 'Edit Section' : 'New Section'}
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                            Menu sections are restaurant-specific
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-10 space-y-7">
                                    {!isRestaurantMode ? (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</label>
                                            <select
                                                value={modalRestaurant}
                                                onChange={(e) => setModalRestaurant(e.target.value)}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                                required
                                            >
                                                <option value="" disabled>Select restaurant…</option>
                                                {restaurants.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</label>
                                            <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800">
                                                {restaurants[0]?.name || 'Your restaurant'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Section name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Must Try, Beverages, Chef Specials…"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Image */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Image (optional)</label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-[28px] cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-all group">
                                            <ImageIcon size={24} className="text-slate-300 mb-2 group-hover:text-primary-400 transition-colors" strokeWidth={1.5} />
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                {imageFile ? imageFile.name : 'Upload image'}
                                            </p>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-8 py-3.5 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary-600 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={3} />}
                                            {submitting ? 'Saving…' : (editingCategory ? 'Update Section' : 'Create Section')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AdminCategories
