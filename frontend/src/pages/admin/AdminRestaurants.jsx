import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../api/axios'
import { getImageUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AdminRestaurants = () => {
    const [restaurants, setRestaurants] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingRestaurant, setEditingRestaurant] = useState(null)
    const [formData, setFormData] = useState({
        name: '', address: '', phone: '', is_active: true
    })
    const [logoFile, setLogoFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const fetchRestaurants = async () => {
        try {
            const response = await api.get('/restaurant/restaurants/')
            setRestaurants(response.data.results)
        } catch {
            toast.error('Failed to load restaurants.')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingRestaurant(null)
        setFormData({ name: '', address: '', phone: '', is_active: true })
        setLogoFile(null)
        setShowModal(true)
    }

    const openEditModal = (restaurant) => {
        setEditingRestaurant(restaurant)
        setFormData({
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone || '',
            is_active: restaurant.is_active,
        })
        setLogoFile(null)
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
            /*
            WHY FormData instead of JSON?
            When uploading files (images), you MUST use
            FormData — JSON cannot carry binary file data.
            FormData sends data as multipart/form-data
            which Django's ImageField understands.
            BEGINNER MISTAKE: sending image as JSON and
            wondering why Django says no file was uploaded.
            */
            const data = new FormData()
            data.append('name', formData.name)
            data.append('address', formData.address)
            data.append('phone', formData.phone)
            data.append('is_active', formData.is_active)
            if (logoFile) {
                data.append('logo', logoFile)
            }

            if (editingRestaurant) {
                await api.patch(
                    `/restaurant/restaurants/${editingRestaurant.id}/`,
                    data,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success('Restaurant updated! ✅')
            } else {
                await api.post(
                    '/restaurant/restaurants/',
                    data,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success('Restaurant created! 🎉')
            }

            setShowModal(false)
            fetchRestaurants()
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error('Failed to save restaurant.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this restaurant?')) return
        /*
        WHY window.confirm?
        Simple confirmation before destructive actions.
        In production use a custom modal.
        For a student project this is perfectly acceptable.
        Always confirm before delete — never delete silently.
        */
        try {
            await api.delete(`/restaurant/restaurants/${id}/`)
            setRestaurants(restaurants.filter(r => r.id !== id))
            toast.success('Restaurant deleted.')
        } catch {
            toast.error('Failed to delete restaurant.')
        }
    }

    const handleToggleActive = async (restaurant) => {
        try {
            await api.patch(
                `/restaurant/restaurants/${restaurant.id}/`,
                { is_active: !restaurant.is_active },
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            setRestaurants(restaurants.map(r =>
                r.id === restaurant.id
                    ? { ...r, is_active: !r.is_active }
                    : r
            ))
            toast.success('Status updated!')
        } catch {
            toast.error('Failed to update status.')
        }
    }

    return (
        <div style={styles.layout}>
            <AdminSidebar />
            <div style={styles.main}>

                {/* Header */}
                <div style={styles.pageHeader}>
                    <h1 style={styles.title}>Restaurants 🍽️</h1>
                    <button onClick={openCreateModal} style={styles.addBtn}>
                        + Add Restaurant
                    </button>
                </div>

                {loading ? <p>Loading...</p> : (
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHead}>
                                    <th style={styles.th}>Logo</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Address</th>
                                    <th style={styles.th}>Phone</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(r => (
                                    <tr key={r.id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            {r.logo ? (
                                                <img
                                                    src={getImageUrl(r.logo)}
                                                    alt={r.name}
                                                    style={styles.logoImg}
                                                />
                                            ) : (
                                                <div style={styles.logoPlaceholder}>
                                                    🍽️
                                                </div>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <strong>{r.name}</strong>
                                        </td>
                                        <td style={styles.td}>{r.address}</td>
                                        <td style={styles.td}>{r.phone || '—'}</td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => handleToggleActive(r)}
                                                style={r.is_active
                                                    ? styles.activeBadge
                                                    : styles.inactiveBadge
                                                }
                                            >
                                                {r.is_active ? '🟢 Active' : '🔴 Inactive'}
                                            </button>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actions}>
                                                <button
                                                    onClick={() => openEditModal(r)}
                                                    style={styles.editBtn}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r.id)}
                                                    style={styles.deleteBtn}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {restaurants.length === 0 && (
                            <p style={styles.empty}>
                                No restaurants yet. Add one!
                            </p>
                        )}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div style={styles.overlay}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>
                                    {editingRestaurant
                                        ? 'Edit Restaurant'
                                        : 'Add Restaurant'
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
                                {[
                                    {
                                        label: 'Restaurant Name',
                                        name: 'name',
                                        type: 'text',
                                        placeholder: 'e.g. Pizza Palace'
                                    },
                                    {
                                        label: 'Phone',
                                        name: 'phone',
                                        type: 'tel',
                                        placeholder: 'e.g. 9876543210'
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
                                            required={field.name === 'name'}
                                        />
                                    </div>
                                ))}

                                <div style={styles.field}>
                                    <label style={styles.label}>Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Full address..."
                                        style={styles.textarea}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Logo Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setLogoFile(e.target.files[0])
                                        }
                                        style={styles.fileInput}
                                    />
                                </div>

                                <div style={styles.checkboxField}>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        id="is_active"
                                    />
                                    <label htmlFor="is_active">
                                        Active (visible to customers)
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
                                            : editingRestaurant
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
        alignItems: 'center', marginBottom: '24px',
    },
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#333' },
    addBtn: {
        padding: '10px 20px', backgroundColor: '#ff4500',
        color: 'white', border: 'none', borderRadius: '8px',
        fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem',
    },
    tableCard: {
        backgroundColor: 'white', borderRadius: '12px',
        padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: '#f9f9f9' },
    th: {
        padding: '12px 16px', textAlign: 'left',
        color: '#666', fontSize: '0.85rem',
        fontWeight: '600', borderBottom: '1px solid #f0f0f0',
    },
    tableRow: { borderBottom: '1px solid #f9f9f9' },
    td: { padding: '12px 16px', color: '#333', fontSize: '0.9rem' },
    logoImg: {
        width: '48px', height: '48px',
        borderRadius: '8px', objectFit: 'cover',
    },
    logoPlaceholder: {
        width: '48px', height: '48px', borderRadius: '8px',
        backgroundColor: '#fff3f0', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
    },
    activeBadge: {
        backgroundColor: '#e8f5e9', color: '#2e7d32',
        border: 'none', padding: '4px 12px', borderRadius: '20px',
        fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
    },
    inactiveBadge: {
        backgroundColor: '#fce4ec', color: '#c62828',
        border: 'none', padding: '4px 12px', borderRadius: '20px',
        fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
    },
    actions: { display: 'flex', gap: '8px' },
    editBtn: {
        padding: '6px 12px', backgroundColor: '#e3f2fd',
        color: '#1565c0', border: 'none', borderRadius: '6px',
        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
    },
    deleteBtn: {
        padding: '6px 12px', backgroundColor: '#fce4ec',
        color: '#c62828', border: 'none', borderRadius: '6px',
        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
    },
    empty: { textAlign: 'center', padding: '40px', color: '#999' },
    overlay: {
        position: 'fixed', top: 0, left: 0,
        right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white', borderRadius: '16px',
        padding: '30px', width: '90%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px',
    },
    modalTitle: { fontSize: '1.3rem', fontWeight: 'bold', color: '#333' },
    closeBtn: {
        backgroundColor: 'transparent', border: 'none',
        fontSize: '1.2rem', cursor: 'pointer', color: '#666',
    },
    field: { marginBottom: '16px' },
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

export default AdminRestaurants