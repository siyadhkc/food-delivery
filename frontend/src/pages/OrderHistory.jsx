import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

/*
WHY status colors as a config object?
Instead of writing if/else for every status,
we map status strings to colors.
Clean, scalable — adding a new status means
adding one line to this object, nothing else.
*/
const STATUS_COLORS = {
    pending: { bg: '#fff3e0', color: '#e65100', label: '⏳ Pending' },
    preparing: { bg: '#e3f2fd', color: '#1565c0', label: '👨‍🍳 Preparing' },
    out_for_delivery: { bg: '#f3e5f5', color: '#6a1b9a', label: '🚗 Out for Delivery' },
    delivered: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Delivered' },
    cancelled: { bg: '#fce4ec', color: '#c62828', label: '❌ Cancelled' },
}

const OrderHistory = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState(null)
    const location = useLocation()
    /*
    WHY useLocation()?
    After placing an order, we navigate to this page
    with state: { newOrderId: 5 }
    useLocation() lets us read that state to highlight
    the newly placed order — great UX detail.
    */

    useEffect(() => {
        fetchOrders()
        /*
        WHY auto-expand new order?
        If user just placed an order, automatically
        expand it so they can see the details immediately.
        Small UX detail that makes the app feel polished.
        */
        if (location.state?.newOrderId) {
            setExpandedOrder(location.state.newOrderId)
        }
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/orders/')
            setOrders(response.data.results)
        } catch (error) {
            toast.error('Failed to load orders.')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (orderId) => {
        setExpandedOrder(
            expandedOrder === orderId ? null : orderId
        )
        /*
        WHY toggle logic?
        If same order clicked again → collapse it (null)
        If different order clicked → expand that one
        This is accordion pattern — common in order history UIs.
        */
    }

    if (loading) {
        return (
            <div style={styles.center}>
                <p>Loading your orders... 📦</p>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.title}>My Orders 📦</h1>

                {orders.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyIcon}>📦</p>
                        <h2>No orders yet!</h2>
                        <p>Place your first order to see it here.</p>
                    </div>
                ) : (
                    <div style={styles.ordersList}>
                        {orders.map(order => {
                            const statusInfo = STATUS_COLORS[order.status] || {}
                            const isExpanded = expandedOrder === order.id

                            return (
                                <div
                                    key={order.id}
                                    style={{
                                        ...styles.orderCard,
                                        border: location.state?.newOrderId === order.id
                                            ? '2px solid #ff4500'
                                            : '2px solid transparent',
                                        /*
                                        WHY dynamic border?
                                        Highlights the newly placed order
                                        with an orange border — visual confirmation.
                                        */
                                    }}
                                >
                                    {/* Order Header */}
                                    <div
                                        style={styles.orderHeader}
                                        onClick={() => toggleExpand(order.id)}
                                    >
                                        <div style={styles.orderMeta}>
                                            <h3 style={styles.orderId}>
                                                Order #{order.id}
                                            </h3>
                                            <p style={styles.orderRestaurant}>
                                                🍽️ {order.restaurant_name}
                                            </p>
                                            <p style={styles.orderDate}>
                                                {new Date(order.created_at)
                                                    .toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                            </p>
                                        </div>

                                        <div style={styles.orderRight}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: statusInfo.bg,
                                                color: statusInfo.color,
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                            <p style={styles.orderTotal}>
                                                ₹{order.total_amount}
                                            </p>
                                            <span style={styles.expandIcon}>
                                                {isExpanded ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items — Expandable */}
                                    {isExpanded && (
                                        <div style={styles.orderItems}>
                                            <div style={styles.divider} />
                                            <h4 style={styles.itemsTitle}>
                                                Items Ordered
                                            </h4>
                                            {order.items.map(item => (
                                                <div
                                                    key={item.id}
                                                    style={styles.orderItem}
                                                >
                                                    <span>
                                                        {item.menu_item_name}
                                                        <span style={styles.itemQty}>
                                                            x{item.quantity}
                                                        </span>
                                                    </span>
                                                    <span style={styles.itemPrice}>
                                                        ₹{item.total_price}
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={styles.divider} />
                                            <div style={styles.orderAddress}>
                                                <strong>📍 Delivered to:</strong>
                                                <p>{order.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '30px 20px',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#333',
    },
    ordersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        transition: 'border 0.2s',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    orderMeta: {
        flex: 1,
    },
    orderId: {
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: '#333',
        marginBottom: '4px',
    },
    orderRestaurant: {
        color: '#555',
        marginBottom: '4px',
    },
    orderDate: {
        color: '#999',
        fontSize: '0.85rem',
    },
    orderRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
    },
    statusBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600',
    },
    orderTotal: {
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: '#ff4500',
    },
    expandIcon: {
        color: '#999',
        fontSize: '0.8rem',
    },
    orderItems: {
        marginTop: '16px',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f0f0f0',
        margin: '12px 0',
    },
    itemsTitle: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '12px',
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        color: '#555',
    },
    itemQty: {
        color: '#999',
        marginLeft: '6px',
        fontSize: '0.85rem',
    },
    itemPrice: {
        fontWeight: '600',
    },
    orderAddress: {
        color: '#555',
        fontSize: '0.9rem',
        lineHeight: '1.5',
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        color: '#666',
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '16px',
    },
    center: {
        textAlign: 'center',
        padding: '80px',
        color: '#666',
    },
}

export default OrderHistory