import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { getImageUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
    Plus, Image as ImageIcon, Pencil, Trash2, X,
    AlertCircle, Loader2, CheckCircle2, FolderOpen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const RestaurantCategories = () => {
    const { user } = useAuth()
    const restaurantId = user?.restaurant_id ? String(user.restaurant_id) : ''

    const [restaurant, setRestaurant] = useState(null)
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [name, setName] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const init = async () => {
            if (!restaurantId) {
                setLoading(false)
                return
            }

            try {
                const [restaurantRes, categoriesRes] = await Promise.all([
                    api.get(`/restaurant/restaurants/${restaurantId}/`),
                    api.get(`/menu/categories/?restaurant=${restaurantId}&page_size=100`),
                ])
                setRestaurant(restaurantRes.data)
                setCategories(categoriesRes.data.results || [])
            } catch {
                toast.error('Failed to load your menu sections.')
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [restaurantId])

    const reloadCategories = async () => {
        try {
            const res = await api.get(`/menu/categories/?restaurant=${restaurantId}&page_size=100`)
            setCategories(res.data.results || [])
        } catch {
            toast.error('Failed to reload sections.')
        }
    }

    const openCreateModal = () => {
        setEditingCategory(null)
        setName('')
        setImageFile(null)
        setShowModal(true)
    }

    const openEditModal = (category) => {
        setEditingCategory(category)
        setName(category.name)
        setImageFile(null)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!restaurantId) return

        setSubmitting(true)
        try {
            const data = new FormData()
            data.append('name', name)
            data.append('restaurant', restaurantId)
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
            reloadCategories()
        } catch {
            toast.error('Failed to save section.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (categoryId) => {
        if (!window.confirm('Delete this section? Menu items will remain but lose this section.')) return

        try {
            await api.delete(`/menu/categories/${categoryId}/`)
            toast.success('Section deleted.')
            reloadCategories()
        } catch {
            toast.error('Failed to delete section.')
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <Loader2 className="animate-spin text-primary-400 mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading your sections...</p>
            </div>
        )
    }

    return (
        <div className="flex-1 px-5 md:px-10 py-10 bg-slate-50/50 min-h-screen relative overflow-y-auto">
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Partner Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                            Menu <span className="text-primary-600 font-light italic">Sections</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">
                            Create and manage sections only for your restaurant.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Add Section
                    </button>
                </div>

                <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            {restaurant?.logo ? (
                                <img
                                    src={getImageUrl(restaurant.logo)}
                                    alt={restaurant.name}
                                    className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                    <FolderOpen size={20} className="text-slate-400" />
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-black text-slate-900">{restaurant?.name || 'Your restaurant'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {restaurant?.address}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                            {categories.length} sections
                        </span>
                    </div>

                    <div className="px-8 py-6">
                        {categories.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <AlertCircle size={30} className="text-slate-200 mb-3" />
                                <p className="text-slate-400 font-bold text-sm">No sections created yet.</p>
                                <button
                                    onClick={openCreateModal}
                                    className="mt-3 text-primary-600 font-black text-xs uppercase tracking-widest hover:underline"
                                >
                                    + Create first section
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="group flex items-center justify-between gap-3 bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {category.image ? (
                                                <img
                                                    src={getImageUrl(category.image)}
                                                    alt=""
                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                    <FolderOpen size={16} className="text-primary-500" />
                                                </div>
                                            )}
                                            <span className="text-sm font-black text-slate-800 truncate">{category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {editingCategory ? 'Edit Section' : 'New Section'}
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                            {restaurant?.name || 'Your restaurant'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-10 space-y-7">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</label>
                                        <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800">
                                            {restaurant?.name || 'Your restaurant'}
                                        </div>
                                    </div>

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

export default RestaurantCategories
