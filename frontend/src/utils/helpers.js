// src/utils/helpers.js

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${import.meta.env.VITE_API_URL.replace('/api', '')}${imagePath}`
}

export const formatOrderId = (id) => {
    /*
    WHY padStart(5, '0')?
    padStart fills the left side with '0' until
    the string reaches 5 characters.
    3    → '00003'
    10   → '00010'
    999  → '00999'
    This gives a consistent fixed-width order code
    that looks professional like real delivery apps.
    */
    return `#FD${String(id).padStart(5, '0')}`
}

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}