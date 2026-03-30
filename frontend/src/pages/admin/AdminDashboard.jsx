import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, Legend
} from 'recharts'
import { formatOrderId } from '../../utils/helpers'
/*
WHY Recharts?
The PDF specifically requires:
"Dashboard with charts (Recharts / Chart.js via API data)"
Recharts is the most beginner-friendly React chart library.
It uses React components for charts — no extra learning needed.
*/

const STATUS_COLORS = {
    pending: '#ff9800',
    preparing: '#2196f3',
    out_for_delivery: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336',
}

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalUsers: 0,
        totalRestaurants: 0,
        totalRevenue: 0,
        recentOrders: [],
        ordersByStatus: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const [ordersRes, usersRes, restaurantsRes] = await Promise.all([
                api.get('/orders/orders/'),
                api.get('/users/all/'),
                api.get('/restaurant/restaurants/'),
            ])

            const orders = ordersRes.data.results

            /*
            WHY calculate stats on frontend?
            We don't have a dedicated stats API endpoint.
            For a student project, calculating from existing
            API data is perfectly acceptable.
            In production, you'd build a dedicated /api/stats/
            endpoint that runs optimized DB queries.
            */
            const totalRevenue = orders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

            // Count orders by status for pie chart
            const statusCounts = orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1
                return acc
            }, {})

            const ordersByStatus = Object.entries(statusCounts).map(
                ([status, count]) => ({ status, count })
            )

            setStats({
                totalOrders: ordersRes.data.count,
                totalUsers: usersRes.data.count,
                totalRestaurants: restaurantsRes.data.count,
                totalRevenue: totalRevenue.toFixed(2),
                recentOrders: orders.slice(0, 5),
                ordersByStatus,
            })
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: '📦',
            color: '#ff4500'
        },
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: '👥',
            color: '#2196f3'
        },
        {
            label: 'Restaurants',
            value: stats.totalRestaurants,
            icon: '🍽️',
            color: '#4caf50'
        },
        {
            label: 'Revenue',
            value: `₹${stats.totalRevenue}`,
            icon: '💰',
            color: '#ff9800'
        },
    ]

    return (
        <div style={styles.layout}>
            <AdminSidebar />

            <div style={styles.main}>
                <h1 style={styles.title}>Dashboard 📊</h1>

                {loading ? (
                    <p>Loading stats...</p>
                ) : (
                    <>
                        {/* Stat Cards */}
                        <div style={styles.statsGrid}>
                            {statCards.map(card => (
                                <div key={card.label} style={styles.statCard}>
                                    <div style={{
                                        ...styles.statIcon,
                                        backgroundColor: card.color + '20',
                                    }}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <p style={styles.statLabel}>
                                            {card.label}
                                        </p>
                                        <p style={{
                                            ...styles.statValue,
                                            color: card.color
                                        }}>
                                            {card.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div style={styles.chartsRow}>

                            {/* Bar Chart — Orders by Status */}
                            <div style={styles.chartCard}>
                                <h2 style={styles.chartTitle}>
                                    Orders by Status
                                </h2>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stats.ordersByStatus}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="status" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#ff4500"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Pie Chart — Status Distribution */}
                            <div style={styles.chartCard}>
                                <h2 style={styles.chartTitle}>
                                    Order Distribution
                                </h2>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={stats.ordersByStatus}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {stats.ordersByStatus.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={
                                                            STATUS_COLORS[entry.status]
                                                            || '#8884d8'
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Orders Table */}
                        <div style={styles.tableCard}>
                            <h2 style={styles.chartTitle}>Recent Orders</h2>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHead}>
                                        <th style={styles.th}>Order ID</th>
                                        <th style={styles.th}>Customer</th>
                                        <th style={styles.th}>Restaurant</th>
                                        <th style={styles.th}>Amount</th>
                                        <th style={styles.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentOrders.map(order => (
                                        <tr key={order.id} style={styles.tableRow}>
                                            <td style={styles.td}>{formatOrderId(order.id)}</td>
                                            <td style={styles.td}>{order.user_email}</td>
                                            <td style={styles.td}>{order.restaurant_name}</td>
                                            <td style={styles.td}>₹{order.total_amount}</td>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const styles = {
    layout: {
        display: 'flex',
        minHeight: '100vh',
    },
    main: {
        flex: 1,
        padding: '30px',
        backgroundColor: '#f5f5f5',
        overflowY: 'auto',
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '24px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    statIcon: {
        width: '52px',
        height: '52px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        flexShrink: 0,
    },
    statLabel: {
        color: '#666',
        fontSize: '0.85rem',
        marginBottom: '4px',
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
    },
    chartsRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
    },
    chartCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    chartTitle: {
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '16px',
    },
    tableCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHead: {
        backgroundColor: '#f9f9f9',
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left',
        color: '#666',
        fontSize: '0.85rem',
        fontWeight: '600',
        borderBottom: '1px solid #f0f0f0',
    },
    tableRow: {
        borderBottom: '1px solid #f9f9f9',
    },
    td: {
        padding: '12px 16px',
        color: '#333',
        fontSize: '0.9rem',
    },
}

export default AdminDashboard