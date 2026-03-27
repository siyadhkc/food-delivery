import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Checkout = () => {
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [placing, setPlacing] = useState(false)
    const [formData, setFormData] = useState({
        address: '',
        payment_method: 'cod',
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchCart()
    }, [])

    const fetchCart = async () => {
        try {
            const response = await api.get('/orders/cart/my_cart/')
            /*
            WHY redirect if cart is empty?
            User might navigate directly to /checkout via URL.
            If cart is empty, checkout makes no sense.
            Always guard against invalid states — senior dev habit.
            */
            if (!response.data.items?.length) {
                toast.error('Your cart is empty!')
                navigate('/cart')
                return
            }
            setCart(response.data)
        } catch (error) {
            toast.error('Failed to load cart.')
            navigate('/cart')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault()

        if (!formData.address.trim()) {
            toast.error('Please enter a delivery address!')
            return
        }

        setPlacing(true)
        try {
            const response = await api.post('/orders/orders/', formData)
            /*
            WHY navigate to orders page after placing?
            User should see their new order immediately.
            This confirms the order was placed successfully.
            Passing state lets OrderHistory highlight the new order.
            */
            toast.success('Order placed successfully! 🎉')
            navigate('/orders', {
                state: { newOrderId: response.data.id }
            })
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to place order.'
            toast.error(message)
        } finally {
            setPlacing(false)
        }
    }

    if (loading) {
        return (
            <div style={styles.center}>
                <p>Loading checkout... 🛒</p>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.title}>Checkout 🎯</h1>

                <div style={styles.layout}>

                    {/* Left — Delivery + Payment Form */}
                    <div style={styles.formSection}>

                        {/* Delivery Address */}
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>
                                📍 Delivery Address
                            </h2>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter your full delivery address..."
                                style={styles.textarea}
                                rows={4}
                                required
                            />
                        </div>

                        {/* Payment Method */}
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>
                                💳 Payment Method
                            </h2>
                            <div style={styles.paymentOptions}>
                                {[
                                    {
                                        value: 'cod',
                                        label: '💵 Cash on Delivery',
                                        desc: 'Pay when your order arrives'
                                    },
                                    {
                                        value: 'razorpay',
                                        label: '💳 Pay Online (Razorpay)',
                                        desc: 'UPI, Cards, Net Banking'
                                    },
                                ].map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => setFormData({
                                            ...formData,
                                            payment_method: option.value
                                        })}
                                        style={
                                            formData.payment_method === option.value
                                                ? styles.paymentOptionActive
                                                : styles.paymentOption
                                        }
                                    >
                                        <div style={styles.paymentLabel}>
                                            {option.label}
                                        </div>
                                        <div style={styles.paymentDesc}>
                                            {option.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — Order Summary */}
                    <div style={styles.summary}>
                        <h2 style={styles.cardTitle}>🧾 Order Summary</h2>

                        {/* Cart Items */}
                        <div style={styles.itemsList}>
                            {cart?.items.map(item => (
                                <div key={item.id} style={styles.summaryItem}>
                                    <span style={styles.summaryItemName}>
                                        {item.menu_item_name}
                                        <span style={styles.summaryItemQty}>
                                            x{item.quantity}
                                        </span>
                                    </span>
                                    <span style={styles.summaryItemPrice}>
                                        ₹{item.total_price}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>₹{cart?.total_amount}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>Delivery</span>
                            <span style={{ color: 'green' }}>FREE</span>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.summaryTotal}>
                            <span>Total</span>
                            <span style={styles.totalAmount}>
                                ₹{cart?.total_amount}
                            </span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placing}
                            style={placing
                                ? styles.btnDisabled
                                : styles.placeOrderBtn
                            }
                        >
                            {placing
                                ? 'Placing Order...'
                                : `Place Order ₹${cart?.total_amount}`
                            }
                        </button>

                        <button
                            onClick={() => navigate('/cart')}
                            style={styles.backBtn}
                        >
                            ← Back to Cart
                        </button>
                    </div>
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
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '30px 20px',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#333',
    },
    layout: {
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '24px',
        alignItems: 'start',
    },
    formSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    cardTitle: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#333',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1rem',
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
    },
    paymentOptions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    paymentOption: {
        padding: '16px',
        border: '2px solid #ddd',
        borderRadius: '10px',
        cursor: 'pointer',
    },
    paymentOptionActive: {
        padding: '16px',
        border: '2px solid #ff4500',
        borderRadius: '10px',
        cursor: 'pointer',
        backgroundColor: '#fff3f0',
    },
    paymentLabel: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '4px',
    },
    paymentDesc: {
        color: '#666',
        fontSize: '0.9rem',
    },
    summary: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: '80px',
    },
    itemsList: {
        marginBottom: '16px',
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '0.95rem',
    },
    summaryItemName: {
        color: '#333',
        flex: 1,
    },
    summaryItemQty: {
        color: '#999',
        marginLeft: '6px',
        fontSize: '0.85rem',
    },
    summaryItemPrice: {
        fontWeight: '600',
        color: '#333',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f0f0f0',
        margin: '14px 0',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        color: '#555',
    },
    summaryTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        marginBottom: '20px',
    },
    totalAmount: {
        color: '#ff4500',
        fontSize: '1.3rem',
    },
    placeOrderBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#ff4500',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer',
        marginBottom: '10px',
    },
    btnDisabled: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'not-allowed',
        marginBottom: '10px',
    },
    backBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#ff4500',
        border: '2px solid #ff4500',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    center: {
        textAlign: 'center',
        padding: '80px',
        color: '#666',
    },
}

export default Checkout