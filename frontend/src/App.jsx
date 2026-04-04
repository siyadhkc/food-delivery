import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import RestaurantLayout from './layouts/RestaurantLayout'

// Customer Pages
import Home from './pages/customer/Home'
import Restaurants from './pages/customer/Restaurants'
import Login from './pages/customer/Login'
import Register from './pages/customer/Register'
import RestaurantDetail from './pages/customer/RestaurantDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import OrderHistory from './pages/customer/OrderHistory'
import Profile from './pages/customer/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRestaurants from './pages/admin/AdminRestaurants'
import AdminMenu from './pages/admin/AdminMenu'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard'
import RestaurantMenu from './pages/restaurant/RestaurantMenu'
import RestaurantCategories from './pages/restaurant/RestaurantCategories'
import RestaurantOrders from './pages/restaurant/RestaurantOrders'
import RestaurantProfile from './pages/restaurant/RestaurantProfile'

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import DeliveryProfile from './pages/delivery/DeliveryProfile'
import DeliveryHistory from './pages/delivery/DeliveryHistory'

// Route Guards
import CustomerRoute from './components/CustomerRoute'
import AdminRoute from './components/AdminRoute'
import RestaurantRoute from './components/RestaurantRoute'
import DeliveryRoute from './components/DeliveryRoute'
import RoleRedirect from './components/RoleRedirect'

/*
WHY separate layout components?
CustomerLayout   → renders the top Navbar + page content
AdminLayout      → renders only the sidebar + page content (Admin)
RestaurantLayout → renders only the sidebar + page content (Restaurant Owner)
Each role lives in a completely isolated UI shell.
*/

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster 
                    position="top-center" 
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#FFFFFF',
                            color: '#020617',
                            padding: '12px 24px',
                            borderRadius: '20px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 15px 45px -5px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.01)',
                            fontSize: '14px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '-0.01em'
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#FFFFFF',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#FFFFFF',
                            },
                        },
                    }}
                />
                <Routes>

                    {/* ================================
                        PUBLIC ROUTES
                        No auth required
                    ================================ */}
                    <Route element={<CustomerLayout />}>
                        <Route path="/login" element={
                            <RoleRedirect>
                                <Login />
                            </RoleRedirect>
                        } />
                        <Route path="/register" element={
                            <RoleRedirect>
                                <Register />
                            </RoleRedirect>
                        } />
                        <Route path="/" element={
                            <RoleRedirect>
                                <Home />
                            </RoleRedirect>
                        } />
                        <Route path="/restaurants" element={<Restaurants />} />
                        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                    </Route>

                    {/* ================================
                        CUSTOMER PROTECTED ROUTES
                        Must be logged in + not admin
                    ================================ */}
                    <Route element={<CustomerLayout />}>
                        <Route path="/cart" element={
                            <CustomerRoute><Cart /></CustomerRoute>
                        } />
                        <Route path="/checkout" element={
                            <CustomerRoute><Checkout /></CustomerRoute>
                        } />
                        <Route path="/orders" element={
                            <CustomerRoute><OrderHistory /></CustomerRoute>
                        } />
                        <Route path="/profile" element={
                            <CustomerRoute><Profile /></CustomerRoute>
                        } />
                    </Route>

                    {/* ================================
                        ADMIN PROTECTED ROUTES
                        Must be logged in + is admin
                    ================================ */}
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={
                            <AdminRoute><AdminDashboard /></AdminRoute>
                        } />
                        <Route path="/admin/restaurants" element={
                            <AdminRoute><AdminRestaurants /></AdminRoute>
                        } />
                        <Route path="/admin/menu" element={
                            <AdminRoute><AdminMenu /></AdminRoute>
                        } />
                        <Route path="/admin/categories" element={
                            <AdminRoute><AdminCategories /></AdminRoute>
                        } />
                        <Route path="/admin/orders" element={
                            <AdminRoute><AdminOrders /></AdminRoute>
                        } />
                        <Route path="/admin/users" element={
                            <AdminRoute><AdminUsers /></AdminRoute>
                        } />
                        <Route path="/admin/payments" element={
                            <AdminRoute><AdminPayments /></AdminRoute>
                        } />
                    </Route>

                    {/* ================================
                        RESTAURANT PROTECTED ROUTES
                        Must be logged in + is restaurant
                    ================================ */}
                    <Route element={<RestaurantLayout />}>
                        <Route path="/restaurant-admin" element={
                            <RestaurantRoute><RestaurantDashboard /></RestaurantRoute>
                        } />
                        <Route path="/restaurant-admin/menu" element={
                            <RestaurantRoute><RestaurantMenu /></RestaurantRoute>
                        } />
                        <Route path="/restaurant-admin/categories" element={
                            <RestaurantRoute><RestaurantCategories /></RestaurantRoute>
                        } />
                        <Route path="/restaurant-admin/orders" element={
                            <RestaurantRoute><RestaurantOrders /></RestaurantRoute>
                        } />
                        <Route path="/restaurant-admin/profile" element={
                            <RestaurantRoute><RestaurantProfile /></RestaurantRoute>
                        } />
                    </Route>

                    {/* ================================
                        DELIVERY PROTECTED ROUTES
                        Must be logged in + is delivery
                    ================================ */}
                    <Route path="/delivery/dashboard" element={
                        <DeliveryRoute><DeliveryDashboard /></DeliveryRoute>
                    } />
                    <Route path="/delivery/profile" element={
                        <DeliveryRoute><DeliveryProfile /></DeliveryRoute>
                    } />
                    <Route path="/delivery/history" element={
                        <DeliveryRoute><DeliveryHistory /></DeliveryRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
