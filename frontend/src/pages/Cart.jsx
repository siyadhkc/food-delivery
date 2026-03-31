import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const Cart = () => {
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updatingItem, setUpdatingItem] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchCart()
    }, [])

    const fetchCart = async () => {
        setLoading(true)
        try {
            const response = await api.get('/orders/cart/my_cart/')
            setCart(response.data)
        } catch (error) {
            console.error('Failed to load cart:', error)
            toast.error('Failed to load cart.')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateQuantity = async (cartItemId, newQuantity) => {
        setUpdatingItem(cartItemId)
        try {
            const response = await api.post('/orders/cart/update_quantity/', {
                cart_item_id: cartItemId,
                quantity: newQuantity,
            })
            /*
            WHY update state from API response instead of locally?
            The backend recalculates totals accurately.
            If we update locally, total_amount might be wrong
            due to floating point math.
            Always trust backend calculations for money values.
            */
            setCart(response.data)
            toast.success('Cart updated!')
        } catch (error) {
            console.error('Failed to update quantity:', error)
            toast.error('Failed to update quantity.')
        } finally {
            setUpdatingItem(null)
        }
    }

    const handleRemoveItem = async (cartItemId) => {
        setUpdatingItem(cartItemId)
        try {
            const response = await api.post('/orders/cart/remove_item/', {
                cart_item_id: cartItemId,
            })
            setCart(response.data)
            toast.success('Item removed from cart.')
        } catch (error) {
            console.error('Failed to remove item from cart:', error)
            toast.error('Failed to remove item.')
        } finally {
            setUpdatingItem(null)
        }
    }

    const handleClearCart = async () => {
        try {
            await api.post('/orders/cart/clear/')
            setCart(prev => ({ ...prev, items: [] }))
            /*
            WHY spread operator here?
            We keep the cart object but empty its items array.
            { ...prev } copies all existing cart properties,
            then we override just items with empty array.
            This avoids a full API refetch just to show empty cart.
            */
            toast.success('Cart cleared!')
        } catch (error) {
            console.error('Failed to clear cart:', error)
            toast.error('Failed to clear cart.')
        }
    }

    if (loading) {
        return (
            <div style={styles.center}>
                <p>Loading your cart... 🛒</p>
            </div>
        )
    }

    const isEmpty = !cart || cart.items.length === 0

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.title}>Your Cart 🛒</h1>

                {isEmpty ? (
                    /* Empty Cart State */
                    <div style={styles.emptyState}>
                        <p style={styles.emptyIcon}>🛒</p>
                        <h2 style={styles.emptyTitle}>Your cart is empty!</h2>
                        <p style={styles.emptySubtitle}>
                            Add some delicious food to get started
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={styles.browseBtn}
                        >
                            Browse Restaurants
                        </button>
                    </div>
                ) : (
                    <div style={styles.layout}>

                        {/* Cart Items — Left Side */}
                        <div style={styles.itemsSection}>
                            <div style={styles.itemsHeader}>
                                <h2 style={styles.sectionTitle}>
                                    Items ({cart.total_items})
                                </h2>
                                <button
                                    onClick={handleClearCart}
                                    style={styles.clearBtn}
                                >
                                    Clear All
                                </button>
                            </div>

                            {cart.items.map(item => (
                                <div key={item.id} style={styles.cartItem}>

                                    {/* Item Image */}
                                    <div style={styles.itemImage}>
                                        {item.menu_item_image ? (
                                            <img
                                                src={getImageUrl(item.menu_item_image)}
                                                alt={item.menu_item_name}
                                                style={styles.image}
                                            />
                                        ) : (
                                            <div style={styles.imagePlaceholder}>
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div style={styles.itemDetails}>
                                        <h3 style={styles.itemName}>
                                            {item.menu_item_name}
                                        </h3>
                                        <p style={styles.itemPrice}>
                                            ₹{item.menu_item_price} each
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={styles.quantityControls}>
                                        <button
                                            onClick={() => handleUpdateQuantity(
                                                item.id,
                                                item.quantity - 1
                                            )}
                                            disabled={updatingItem === item.id}
                                            style={styles.qtyBtn}
                                        >
                                            −
                                        </button>
                                        <span style={styles.quantity}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => handleUpdateQuantity(
                                                item.id,
                                                item.quantity + 1
                                            )}
                                            disabled={updatingItem === item.id}
                                            style={styles.qtyBtn}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Item Total */}
                                    <div style={styles.itemTotal}>
                                        <p style={styles.totalPrice}>
                                            ₹{item.total_price}
                                        </p>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={updatingItem === item.id}
                                            style={styles.removeBtn}
                                        >
                                            {updatingItem === item.id
                                                ? '...'
                                                : '🗑️'
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary — Right Side */}
                        <div style={styles.summary}>
                            <h2 style={styles.sectionTitle}>Order Summary</h2>

                            <div style={styles.summaryRow}>
                                <span>Items ({cart.total_items})</span>
                                <span>₹{cart.total_amount}</span>
                            </div>
                            <div style={styles.summaryRow}>
                                <span>Delivery Fee</span>
                                <span style={{ color: 'green' }}>FREE</span>
                            </div>

                            <div style={styles.divider} />

                            <div style={styles.summaryTotal}>
                                <span>Total</span>
                                <span style={styles.totalAmount}>
                                    ₹{cart.total_amount}
                                </span>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                style={styles.checkoutBtn}
                            >
                                Proceed to Checkout →
                            </button>

                            <button
                                onClick={() => navigate('/')}
                                style={styles.continueBtn}
                            >
                                + Add More Items
                            </button>
                        </div>
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
        gridTemplateColumns: '1fr 340px',
        gap: '24px',
        alignItems: 'start',
        /*
        WHY alignItems: start?
        Without this, the summary card stretches to match
        the full height of the items section.
        start keeps the summary card its natural height
        and sticks it to the top — correct behavior.
        */
    },
    itemsSection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    itemsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: '#333',
    },
    clearBtn: {
        backgroundColor: 'transparent',
        color: '#ff4500',
        border: '1px solid #ff4500',
        padding: '6px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
    },
    cartItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    itemImage: {
        width: '70px',
        height: '70px',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        /*
        WHY flexShrink: 0?
        Without this, the image shrinks when item name is long.
        flexShrink: 0 keeps it fixed at exactly 70x70.
        Always set this on fixed-size flex children.
        */
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff3f0',
        fontSize: '1.8rem',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '4px',
    },
    itemPrice: {
        color: '#666',
        fontSize: '0.9rem',
    },
    quantityControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '4px 8px',
    },
    qtyBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: '#ff4500',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantity: {
        fontWeight: 'bold',
        fontSize: '1rem',
        minWidth: '20px',
        textAlign: 'center',
    },
    itemTotal: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
    },
    totalPrice: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: '1rem',
    },
    removeBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.1rem',
    },
    summary: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: '80px',
        /*
        WHY position sticky + top 80px?
        As user scrolls through many cart items,
        the summary stays visible on screen.
        top: 80px accounts for the navbar height (64px + gap).
        This is a classic e-commerce UX pattern.
        */
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
        color: '#555',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f0f0f0',
        margin: '16px 0',
    },
    summaryTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
    },
    totalAmount: {
        color: '#ff4500',
        fontSize: '1.3rem',
    },
    checkoutBtn: {
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
    continueBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#ff4500',
        border: '2px solid #ff4500',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        cursor: 'pointer',
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '16px',
    },
    emptyTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '8px',
    },
    emptySubtitle: {
        color: '#666',
        marginBottom: '24px',
    },
    browseBtn: {
        padding: '12px 28px',
        backgroundColor: '#ff4500',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer',
    },
    center: {
        textAlign: 'center',
        padding: '80px',
        color: '#666',
    },
}

export default Cart