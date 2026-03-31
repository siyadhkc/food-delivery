import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/helpers'

/*
WHY a separate RestaurantCard component?
The Home page will show a LIST of restaurants.
Each card is the same structure repeated.
Extracting it into its own component means:
- Home page stays clean and readable
- If you change the card design, you change it once
- Reusable anywhere in the app
This is the core principle of React — break UI into
small reusable pieces called components.
BEGINNER MISTAKE: writing all card HTML directly
inside the Home page — becomes a massive messy file.
*/

const RestaurantCard = ({ restaurant }) => {
    const navigate = useNavigate()

    return (
        <div
            style={styles.card}
            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            /*
            WHY navigate on card click?
            Whole card is clickable — better UX than
            a small "View" button. User clicks anywhere
            on the card to see the restaurant menu.
            */
        >
            {/* Restaurant Logo */}
            <div style={styles.imageContainer}>
                {restaurant.logo ? (
                    <img
                        src={getImageUrl(restaurant.logo)}
                        alt={restaurant.name}
                        style={styles.image}
                        /*
                        WHY prefix with backend URL?
                        Django stores only the relative path in DB:
                        "restaurants/logos/pizza.jpg"
                        We need the full URL to display it:
                        "http://127.0.0.1:8000/media/restaurants/logos/pizza.jpg"
                        In production this becomes your deployed backend URL.
                        */
                    />
                ) : (
                    <div style={styles.imagePlaceholder}>🍽️</div>
                )}
            </div>

            {/* Restaurant Info */}
            <div style={styles.info}>
                <h3 style={styles.name}>{restaurant.name}</h3>
                <p style={styles.address}>📍 {restaurant.address}</p>
                <p style={styles.phone}>📞 {restaurant.phone}</p>

                <div style={styles.footer}>
                    <span style={
                        restaurant.is_active
                            ? styles.badgeActive
                            : styles.badgeInactive
                    }>
                        {restaurant.is_active ? '🟢 Open' : '🔴 Closed'}
                    </span>
                    <span style={styles.viewBtn}>View Menu →</span>
                </div>
            </div>
        </div>
    )
}

const styles = {
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        /*
        WHY transition?
        Smooth hover animation — we add the hover effect
        via onMouseEnter/onMouseLeave below.
        Small details like this make apps feel polished.
        */
    },
    imageContainer: {
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        /*
        WHY objectFit: cover?
        Images come in different sizes and aspect ratios.
        cover fills the container without stretching —
        crops if needed to maintain aspect ratio.
        Always use this for restaurant/product images.
        */
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '4rem',
        backgroundColor: '#fff3f0',
    },
    info: {
        padding: '16px',
    },
    name: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    },
    address: {
        color: '#666',
        fontSize: '0.9rem',
        marginBottom: '4px',
    },
    phone: {
        color: '#666',
        fontSize: '0.9rem',
        marginBottom: '12px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badgeActive: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
    },
    badgeInactive: {
        backgroundColor: '#fce4ec',
        color: '#c62828',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
    },
    viewBtn: {
        color: '#ff4500',
        fontWeight: 'bold',
        fontSize: '0.9rem',
    },
}

export default RestaurantCard