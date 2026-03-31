import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../api/axios'
import { getImageUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AdminMenu = () => {
    const [menuItems, setMenuItems] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const [filterRestaurant, setFilterRestaurant] = useState('all')
    const [formData, setFormData] = useState({
        restaurant: '',
        category: '',
        name: '',
        description: '',
        price: '',
        is_available: true,
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [menuRes, restRes, catRes] = await Promise.all([
                api.get('/menu/items/'),
                api.get('/restaurant/restaurants/'),
                api.get('/menu/categories/'),
            ])
            setMenuItems(menuRes.data.results)
            setRestaurants(restRes.data.results)
            setCategories(catRes.data.results)
        } catch {
            toast.error('Failed to load data.')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingItem(null)
        setFormData({
            restaurant: '',
            category: '',
            name: '',
            description: '',
            price: '',
            is_available: true,
        })
        setImageFile(null)
        setShowModal(true)
    }

    const openEditModal = (item) => {
        setEditingItem(item)
        setFormData({
            restaurant: item.restaurant,
            category: item.category,
            name: item.name,
            description: item.description,
            price: item.price,
            is_available: item.is_available,
        })
        setImageFile(null)
        setShowModal(true)
    }

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox'
            ? e.target.checked
            : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const data = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value)
            })
            if (imageFile) data.append('image', imageFile)

            if (editingItem) {
                await api.patch(
                    `/menu/items/${editingItem.id}/`,
                    data,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success('Menu item updated! ✅')
            } else {
                await api.post(
                    '/menu/items/',
                    data,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success('Menu item created! 🎉')
            }

            setShowModal(false)
            fetchData()
        } catch (error) {
            toast.error('Failed to save menu item.')
            console.error('Failed to save menu item:', error)
           
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this menu item?')) return
        try {
            await api.delete(`/menu/items/${id}/`)
            setMenuItems(menuItems.filter(i => i.id !== id))
            toast.success('Item deleted.')
        } catch {
            toast.error('Failed to delete item.')
        }
    }

    const filteredItems = filterRestaurant === 'all'
        ? menuItems
        : menuItems.filter(i =>
            String(i.restaurant) === String(filterRestaurant)
        )

    return (
        <div style={styles.layout}>
            <AdminSidebar />
            <div style={styles.main}>

                <div style={styles.pageHeader}>
                    <h1 style={styles.title}>Menu Items 🍕</h1>
                    <button onClick={openCreateModal} style={styles.addBtn}>
                        + Add Menu Item
                    </button>
                </div>

                {/* Filter by Restaurant */}
                <select
                    value={filterRestaurant}
                    onChange={(e) => setFilterRestaurant(e.target.value)}
                    style={styles.filterSelect}
                >
                    <option value="all">All Restaurants</option>
                    {restaurants.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>

                {loading ? <p>Loading...</p> : (
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHead}>
                                    <th style={styles.th}>Image</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Restaurant</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Price</th>
                                    <th style={styles.th}>Available</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            {item.image ? (
                                                <img
                                                    src={getImageUrl(item.image)}
                                                    alt={item.name}
                                                    style={styles.itemImg}
                                                />
                                            ) : (
                                                <div style={styles.imgPlaceholder}>
                                                    🍽️
                                                </div>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <strong>{item.name}</strong>
                                            <p style={styles.description}>
                                                {item.description?.slice(0, 40)}
                                                {item.description?.length > 40
                                                    ? '...'
                                                    : ''
                                                }
                                            </p>
                                        </td>
                                        <td style={styles.td}>
                                            {item.restaurant_name}
                                        </td>
                                        <td style={styles.td}>
                                            {item.category_name}
                                        </td>
                                        <td style={styles.td}>
                                            <strong>₹{item.price}</strong>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={item.is_available
                                                ? styles.availableBadge
                                                : styles.unavailableBadge
                                            }>
                                                {item.is_available
                                                    ? '✅ Yes'
                                                    : '❌ No'
                                                }
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actions}>
                                                <button
                                                    onClick={() =>
                                                        openEditModal(item)
                                                    }
                                                    style={styles.editBtn}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    style={styles.deleteBtn}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredItems.length === 0 && (
                            <p style={styles.empty}>No menu items found.</p>
                        )}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div style={styles.overlay}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>
                                    {editingItem
                                        ? 'Edit Menu Item'
                                        : 'Add Menu Item'
                                    }
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={styles.closeBtn}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Restaurant
                                    </label>
                                    <select
                                        name="restaurant"
                                        value={formData.restaurant}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">
                                            Select Restaurant
                                        </option>
                                        {restaurants.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">
                                            Select Category
                                        </option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {[
                                    {
                                        label: 'Item Name',
                                        name: 'name',
                                        type: 'text',
                                        placeholder: 'e.g. Margherita Pizza'
                                    },
                                    {
                                        label: 'Price (₹)',
                                        name: 'price',
                                        type: 'number',
                                        placeholder: 'e.g. 199'
                                    },
                                ].map(field => (
                                    <div key={field.name} style={styles.field}>
                                        <label style={styles.label}>
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            placeholder={field.placeholder}
                                            style={styles.input}
                                            required
                                        />
                                    </div>
                                ))}

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the item..."
                                        style={styles.textarea}
                                        rows={3}
                                    />
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Item Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setImageFile(e.target.files[0])
                                        }
                                        style={styles.fileInput}
                                    />
                                </div>

                                <div style={styles.checkboxField}>
                                    <input
                                        type="checkbox"
                                        name="is_available"
                                        id="is_available"
                                        checked={formData.is_available}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="is_available">
                                        Available to order
                                    </label>
                                </div>

                                <div style={styles.modalFooter}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={submitting
                                            ? styles.btnDisabled
                                            : styles.saveBtn
                                        }
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : editingItem
                                                ? 'Update'
                                                : 'Create'
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh' },
    main: { flex: 1, padding: '30px', backgroundColor: '#f5f5f5' },
    pageHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
    },
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#333' },
    addBtn: {
        padding: '10px 20px', backgroundColor: '#ff4500',
        color: 'white', border: 'none', borderRadius: '8px',
        fontWeight: 'bold', cursor: 'pointer',
    },
    filterSelect: {
        padding: '10px 14px', border: '1px solid #ddd',
        borderRadius: '8px', fontSize: '0.95rem',
        marginBottom: '20px', outline: 'none',
    },
    tableCard: {
        backgroundColor: 'white', borderRadius: '12px',
        padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: '#f9f9f9' },
    th: {
        padding: '12px 16px', textAlign: 'left', color: '#666',
        fontSize: '0.85rem', fontWeight: '600',
        borderBottom: '1px solid #f0f0f0',
    },
    tableRow: { borderBottom: '1px solid #f9f9f9' },
    td: { padding: '12px 16px', color: '#333', fontSize: '0.9rem' },
    itemImg: {
        width: '50px', height: '50px',
        borderRadius: '8px', objectFit: 'cover',
    },
    imgPlaceholder: {
        width: '50px', height: '50px', borderRadius: '8px',
        backgroundColor: '#fff3f0', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
    },
    description: { color: '#999', fontSize: '0.8rem', marginTop: '2px' },
    availableBadge: {
        backgroundColor: '#e8f5e9', color: '#2e7d32',
        padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem',
    },
    unavailableBadge: {
        backgroundColor: '#fce4ec', color: '#c62828',
        padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem',
    },
    actions: { display: 'flex', gap: '8px' },
    editBtn: {
        padding: '6px 12px', backgroundColor: '#e3f2fd',
        color: '#1565c0', border: 'none', borderRadius: '6px',
        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
    },
    deleteBtn: {
        padding: '6px 10px', backgroundColor: '#fce4ec',
        color: '#c62828', border: 'none', borderRadius: '6px',
        cursor: 'pointer', fontWeight: '600',
    },
    empty: { textAlign: 'center', padding: '40px', color: '#999' },
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white', borderRadius: '16px',
        padding: '30px', width: '90%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto',
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px',
    },
    modalTitle: { fontSize: '1.3rem', fontWeight: 'bold', color: '#333' },
    closeBtn: {
        backgroundColor: 'transparent', border: 'none',
        fontSize: '1.2rem', cursor: 'pointer', color: '#666',
    },
    field: { marginBottom: '14px' },
    label: {
        display: 'block', marginBottom: '6px',
        fontWeight: '500', color: '#444',
    },
    input: {
        width: '100%', padding: '10px 12px',
        border: '1px solid #ddd', borderRadius: '8px',
        fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    },
    textarea: {
        width: '100%', padding: '10px 12px',
        border: '1px solid #ddd', borderRadius: '8px',
        fontSize: '0.95rem', outline: 'none',
        boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
    },
    fileInput: { width: '100%', fontSize: '0.9rem' },
    checkboxField: {
        display: 'flex', alignItems: 'center',
        gap: '10px', marginBottom: '20px', color: '#444',
    },
    modalFooter: {
        display: 'flex', gap: '12px', justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '10px 20px', backgroundColor: 'transparent',
        color: '#666', border: '2px solid #ddd',
        borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
    },
    saveBtn: {
        padding: '10px 24px', backgroundColor: '#ff4500',
        color: 'white', border: 'none', borderRadius: '8px',
        fontWeight: 'bold', cursor: 'pointer',
    },
    btnDisabled: {
        padding: '10px 24px', backgroundColor: '#ccc',
        color: 'white', border: 'none', borderRadius: '8px',
        fontWeight: 'bold', cursor: 'not-allowed',
    },
}

export default AdminMenu