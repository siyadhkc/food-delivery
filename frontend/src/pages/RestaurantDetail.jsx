import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const RestaurantDetail = () => {
    const { id } = useParams()
    /*
    WHY useParams()?
    When user clicks a restaurant card, they go to /restaurant/3
    useParams() extracts the "3" from the URL as { id: "3" }
    This is how React Router passes URL data to components.
    We use this id to fetch the specific restaurant's data.
    */

    const { user } = useAuth()
    const navigate = useNavigate()

    const [restaurant, setRestaurant] = useState(null)
    const [menuItems, setMenuItems] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [addingItem, setAddingItem] = useState(null)
    /*
    WHY addingItem state instead of a boolean?
    We store the ID of the item being added, not just true/false.
    This lets us show a loading spinner on THAT specific button
    while others stay normal.
    If we used a boolean, ALL buttons would show loading at once.
    */

    useEffect(() => {
        fetchRestaurantData()
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchRestaurantData = async () => {
        setLoading(true)
        try {
            /*
            WHY Promise.all()?
            We need 3 API calls: restaurant info, menu items, categories.
            Without Promise.all(), they run one after another (slow):
            wait 200ms + wait 200ms + wait 200ms = 600ms total
            With Promise.all(), they run simultaneously (fast):
            max(200ms, 200ms, 200ms) = 200ms total
            Always use Promise.all() for independent parallel requests.
            BEGINNER MISTAKE: chaining awaits for independent calls.
            */
            const [restaurantRes, menuRes, categoriesRes] = await Promise.all([
                api.get(`/restaurant/restaurants/${id}/`),
                api.get('/menu/items/', {
                    params: { restaurant: id }
                }),
                api.get('/menu/categories/'),
            ])

            setRestaurant(restaurantRes.data)
            setMenuItems(menuRes.data.results)
            setCategories(categoriesRes.data.results)
        } catch (error) {
            console.error('Failed to load restaurant:', error)
            toast.error('Failed to load restaurant.')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = async (menuItem) => {
        if (!user) {
            toast.error('Please login to add items to cart!')
            navigate('/login')
            return
        }

        setAddingItem(menuItem.id)
        try {
            await api.post('/orders/cart/add_item/', {
                menu_item_id: menuItem.id,
                quantity: 1,
            })
            toast.success(`${menuItem.name} added to cart! 🛒`)
        } catch (error) {
            console.error('Failed to add item to cart:', error)
            toast.error('Failed to add item to cart.')
        } finally {
            setAddingItem(null)
        }
    }

    /*
    WHY filter on the frontend here?
    Category filter changes happen instantly — no API call needed.
    We already have ALL items for this restaurant in state.
    Filtering in JS is instant vs waiting for an API response.
    Use frontend filtering when you already have all the data.
    Use backend filtering (API params) when data is too large.
    */
    const filteredItems = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' ||
            item.category === parseInt(selectedCategory)
        const matchesSearch = item.name.toLowerCase()
            .includes(search.toLowerCase())
        return matchesCategory && matchesSearch
    })

    if (loading) {
        return (
            <div style={styles.center}>
                <p>Loading menu... 🍕</p>
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div style={styles.center}>
                <p>Restaurant not found.</p>
            </div>
        )
    }

    return (
        <div style={styles.page}>

            {/* Restaurant Header */}
            <div style={styles.header}>
                <div style={styles.headerContent}>
                    {restaurant.logo && (
                        <img
                            src={getImageUrl(restaurant.logo)}
                            alt={restaurant.name}
                            style={styles.logo}
                        />
                    )}
                    <div>
                        <h1 style={styles.restaurantName}>{restaurant.name}</h1>
                        <p style={styles.restaurantInfo}>📍 {restaurant.address}</p>
                        <p style={styles.restaurantInfo}>📞 {restaurant.phone}</p>
                        <span style={restaurant.is_active
                            ? styles.badgeActive
                            : styles.badgeInactive
                        }>
                            {restaurant.is_active ? '🟢 Open' : '🔴 Closed'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={styles.container}>

                {/* Search + Filter Bar — PDF requirement */}
                <div style={styles.filterBar}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search menu items..."
                        style={styles.searchInput}
                    />

                    <div style={styles.categories}>
                        <button
                            onClick={() => setSelectedCategory('all')}
                            style={selectedCategory === 'all'
                                ? styles.categoryBtnActive
                                : styles.categoryBtn
                            }
                        >
                            All
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(
                                    String(category.id)
                                )}
                                style={
                                    selectedCategory === String(category.id)
                                        ? styles.categoryBtnActive
                                        : styles.categoryBtn
                                }
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Items */}
                <h2 style={styles.sectionTitle}>
                    Menu {filteredItems.length > 0
                        ? `(${filteredItems.length} items)`
                        : ''}
                </h2>

                {filteredItems.length === 0 ? (
                    <div style={styles.center}>
                        <p>No items found. Try a different category!</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredItems.map(item => (
                            <div key={item.id} style={styles.card}>

                                {/* Item Image */}
                                <div style={styles.imageContainer}>
                                    {item.image ? (
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            style={styles.image}
                                        />
                                    ) : (
                                        <div style={styles.imagePlaceholder}>
                                            🍽️
                                        </div>
                                    )}
                                    {!item.is_available && (
                                        <div style={styles.unavailableOverlay}>
                                            Unavailable
                                        </div>
                                    )}
                                </div>

                                {/* Item Info */}
                                <div style={styles.cardBody}>
                                    <h3 style={styles.itemName}>{item.name}</h3>
                                    <p style={styles.itemDescription}>
                                        {item.description}
                                    </p>
                                    <div style={styles.cardFooter}>
                                        <span style={styles.price}>
                                            ₹{item.price}
                                        </span>
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={
                                                !item.is_available ||
                                                addingItem === item.id
                                            }
                                            style={
                                                !item.is_available
                                                    ? styles.btnDisabled
                                                    : addingItem === item.id
                                                        ? styles.btnLoading
                                                        : styles.btn
                                            }
                                        >
                                            {addingItem === item.id
                                                ? 'Adding...'
                                                : '+ Add to Cart'
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
    },
    header: {
        backgroundColor: '#ff4500',
        padding: '30px 20px',
        color: 'white',
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    logo: {
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        objectFit: 'cover',
        border: '3px solid white',
    },
    restaurantName: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '6px',
    },
    restaurantInfo: {
        opacity: 0.9,
        marginBottom: '4px',
    },
    badgeActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        display: 'inline-block',
        marginTop: '6px',
    },
    badgeInactive: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        display: 'inline-block',
        marginTop: '6px',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '30px 20px',
    },
    filterBar: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '30px',
    },
    searchInput: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1rem',
        marginBottom: '16px',
        boxSizing: 'border-box',
        outline: 'none',
    },
    categories: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
    },
    categoryBtn: {
        padding: '8px 16px',
        border: '2px solid #ddd',
        borderRadius: '20px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontWeight: '500',
        color: '#666',
    },
    categoryBtnActive: {
        padding: '8px 16px',
        border: '2px solid #ff4500',
        borderRadius: '20px',
        backgroundColor: '#ff4500',
        cursor: 'pointer',
        fontWeight: '500',
        color: 'white',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        height: '160px',
        backgroundColor: '#f0f0f0',
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
        fontSize: '3rem',
        backgroundColor: '#fff3f0',
    },
    unavailableOverlay: {
        position: 'absolute',
        top: 0, left: 0,
        right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
    },
    cardBody: {
        padding: '16px',
    },
    itemName: {
        fontSize: '1.1rem',
        fontWeight: 'bold',
        marginBottom: '6px',
        color: '#333',
    },
    itemDescription: {
        color: '#666',
        fontSize: '0.9rem',
        marginBottom: '12px',
        lineHeight: '1.4',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#ff4500',
    },
    btn: {
        padding: '8px 14px',
        backgroundColor: '#ff4500',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    btnLoading: {
        padding: '8px 14px',
        backgroundColor: '#ff8c69',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'not-allowed',
        fontSize: '0.9rem',
    },
    btnDisabled: {
        padding: '8px 14px',
        backgroundColor: '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'not-allowed',
        fontSize: '0.9rem',
    },
    center: {
        textAlign: 'center',
        padding: '60px',
        color: '#666',
        fontSize: '1.1rem',
    },
}

export default RestaurantDetail