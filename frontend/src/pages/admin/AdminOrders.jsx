import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDate, formatOrderId } from '../../utils/helpers'

const STATUS_OPTIONS = [
    'pending', 'preparing',
    'out_for_delivery', 'delivered', 'cancelled'
]

const STATUS_COLORS = {
    pending: '#ff9800',
    preparing: '#2196f3',
    out_for_delivery: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336',
}

const AdminOrders = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')
    const [updatingOrder, setUpdatingOrder] = useState(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/orders/')
            setOrders(response.data.results)
        } catch (error) {
            console.error('Failed to load admin orders:', error)
            toast.error('Failed to load orders.')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingOrder(orderId)
        try {
            await api.post(`/orders/orders/${orderId}/update_status/`, {
                status: newStatus,
            })
            setOrders(orders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            ))
            /*
            WHY update state locally?
            After a successful API call, we update the local
            state directly instead of refetching all orders.
            This is called "optimistic update" — faster UX,
            no unnecessary API calls.
            */
            toast.success('Order status updated!')
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error('Failed to update status.')
        } finally {
            setUpdatingOrder(null)
        }
    }

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus)

    return (
        <div style={styles.layout}>
            <AdminSidebar />

            <div style={styles.main}>
                <h1 style={styles.title}>Orders 📦</h1>

                {/* Filter Tabs */}
                <div style={styles.filterTabs}>
                    {['all', ...STATUS_OPTIONS].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={filterStatus === status
                                ? styles.tabActive
                                : styles.tab
                            }
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p>Loading orders...</p>
                ) : (
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHead}>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Customer</th>
                                    <th style={styles.th}>Restaurant</th>
                                    <th style={styles.th}>Amount</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id} style={styles.tableRow}>
                                        <td style={styles.td}>#{formatOrderId(order.id)}</td>
                                        <td style={styles.td}>{order.user_email}</td>
                                        <td style={styles.td}>{order.restaurant_name}</td>
                                        <td style={styles.td}>₹{order.total_amount}</td>
                                        <td style={styles.td}>
                                             {formatDate(order.created_at)}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                backgroundColor:
                                                    STATUS_COLORS[order.status] + '20',
                                                color: STATUS_COLORS[order.status],
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <select
                                                value={order.status}
                                                onChange={(e) =>
                                                    handleStatusUpdate(
                                                        order.id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={updatingOrder === order.id}
                                                style={styles.select}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>
                                                        {s.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredOrders.length === 0 && (
                            <p style={styles.empty}>No orders found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh' },
    main: { flex: 1, padding: '30px', backgroundColor: '#f5f5f5' },
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '20px' },
    filterTabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
    tab: {
        padding: '8px 16px', border: '2px solid #ddd',
        borderRadius: '20px', backgroundColor: 'white',
        cursor: 'pointer', fontWeight: '500', color: '#666',
        textTransform: 'capitalize',
    },
    tabActive: {
        padding: '8px 16px', border: '2px solid #ff4500',
        borderRadius: '20px', backgroundColor: '#ff4500',
        cursor: 'pointer', fontWeight: '500', color: 'white',
        textTransform: 'capitalize',
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
    select: {
        padding: '6px 10px', borderRadius: '6px',
        border: '1px solid #ddd', cursor: 'pointer',
        fontSize: '0.85rem',
    },
    empty: { textAlign: 'center', padding: '40px', color: '#999' },
}

export default AdminOrders