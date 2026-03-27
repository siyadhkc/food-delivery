import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Profile = () => {
    const { user, } = useAuth()
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: user?.username || '',
        phone: user?.phone || '',
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.patch('/users/profile/', formData)
            /*
            WHY PATCH not PUT?
            PUT requires ALL fields to be sent.
            PATCH updates only the fields you send.
            For profile editing, user might only change
            their phone — PATCH is correct here.
            BEGINNER MISTAKE: using PUT and accidentally
            clearing fields you didn't include.
            */
            toast.success('Profile updated! ✅')
            setEditing(false)
        } catch (error) {
            toast.error('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.title}>My Profile 👤</h1>

                <div style={styles.card}>
                    {/* Avatar */}
                    <div style={styles.avatarSection}>
                        <div style={styles.avatar}>
                            {user?.username?.[0]?.toUpperCase()}
                            {/*
                            WHY first letter as avatar?
                            Simple, clean, no image upload needed.
                            Shows the user's initial in a colored circle.
                            Common pattern in Gmail, Slack, etc.
                            */}
                        </div>
                        <div>
                            <h2 style={styles.userName}>{user?.username}</h2>
                            <span style={styles.roleBadge}>
                                {user?.role === 'admin' ? '👑 Admin' : '🛒 Customer'}
                            </span>
                        </div>
                    </div>

                    <div style={styles.divider} />

                    {/* Profile Info */}
                    {!editing ? (
                        <div style={styles.infoSection}>
                            {[
                                { label: 'Email', value: user?.email, icon: '📧' },
                                { label: 'Username', value: user?.username, icon: '👤' },
                                { label: 'Phone', value: user?.phone || 'Not set', icon: '📞' },
                                { label: 'Role', value: user?.role, icon: '🎭' },
                            ].map(field => (
                                <div key={field.label} style={styles.infoRow}>
                                    <span style={styles.infoIcon}>{field.icon}</span>
                                    <div>
                                        <p style={styles.infoLabel}>{field.label}</p>
                                        <p style={styles.infoValue}>{field.value}</p>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setEditing(true)}
                                style={styles.editBtn}
                            >
                                ✏️ Edit Profile
                            </button>
                        </div>
                    ) : (
                        /* Edit Form */
                        <form onSubmit={handleUpdate} style={styles.form}>
                            <div style={styles.field}>
                                <label style={styles.label}>Username</label>
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Phone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div style={styles.formButtons}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={loading
                                        ? styles.btnDisabled
                                        : styles.saveBtn
                                    }
                                >
                                    {loading ? 'Saving...' : '✅ Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    style={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingBottom: '40px',
    },
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '30px 20px',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#333',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    avatarSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
    },
    avatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#ff4500',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 'bold',
        flexShrink: 0,
    },
    userName: {
        fontSize: '1.4rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '6px',
    },
    roleBadge: {
        backgroundColor: '#fff3f0',
        color: '#ff4500',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f0f0f0',
        marginBottom: '24px',
    },
    infoSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
    },
    infoIcon: {
        fontSize: '1.4rem',
    },
    infoLabel: {
        color: '#999',
        fontSize: '0.8rem',
        marginBottom: '2px',
    },
    infoValue: {
        color: '#333',
        fontWeight: '500',
    },
    editBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#ff4500',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '8px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontWeight: '500',
        color: '#444',
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1rem',
        outline: 'none',
    },
    formButtons: {
        display: 'flex',
        gap: '12px',
    },
    saveBtn: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#ff4500',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    btnDisabled: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'not-allowed',
    },
    cancelBtn: {
        flex: 1,
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#666',
        border: '2px solid #ddd',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
}

export default Profile