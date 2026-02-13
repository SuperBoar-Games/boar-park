// Boar Park Order Management System

const ORDERS_KEY = 'boarpark_orders';

// Generate unique order ID
function generateOrderId() {
    const prefix = 'BP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Get all orders
function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

// Save orders
function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// Place new order
function placeOrder(orderData) {
    const order = {
        id: generateOrderId(),
        ...orderData,
        status: 'placed',
        statusHistory: [
            { status: 'placed', timestamp: new Date().toISOString(), message: 'Order placed successfully' }
        ],
        createdAt: new Date().toISOString()
    };
    
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    
    return order;
}

// Update order status
function updateOrderStatus(orderId, newStatus, message = '') {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            message: message || `Order ${newStatus}`
        });
        saveOrders(orders);
    }
    
    return order;
}

// Get order by ID
function getOrder(orderId) {
    return getOrders().find(o => o.id === orderId);
}

// Get order status display info
function getStatusInfo(status) {
    const statusMap = {
        'placed': { label: 'Order Placed', icon: '📝', color: '#3498db', description: 'We have received your order' },
        'processing': { label: 'Processing', icon: '⚙️', color: '#9b59b6', description: 'Preparing your items' },
        'packed': { label: 'Packed', icon: '📦', color: '#f39c12', description: 'Ready for shipment' },
        'shipped': { label: 'Shipped', icon: '🚚', color: '#e67e22', description: 'On the way to you' },
        'delivered': { label: 'Delivered', icon: '✅', color: '#2ecc71', description: 'Package delivered' },
        'cancelled': { label: 'Cancelled', icon: '❌', color: '#e74c3c', description: 'Order cancelled' }
    };
    
    return statusMap[status] || { label: status, icon: '❓', color: '#95a5a6', description: '' };
}

// Get next status in workflow
function getNextStatus(currentStatus) {
    const workflow = ['placed', 'processing', 'packed', 'shipped', 'delivered'];
    const index = workflow.indexOf(currentStatus);
    return index >= 0 && index < workflow.length - 1 ? workflow[index + 1] : null;
}

// Render order summary on checkout page
function renderCheckoutSummary() {
    const summaryContainer = document.getElementById('checkout-summary');
    if (!summaryContainer) return;
    
    const cart = JSON.parse(localStorage.getItem('boarpark_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cart.length === 0) {
        summaryContainer.innerHTML = '<p>Your cart is empty. <a href="index.html">Continue shopping</a></p>';
        return;
    }
    
    summaryContainer.innerHTML = `
        <div class="checkout-items">
            ${cart.map(item => `
                <div class="checkout-item">
                    <span>${item.image} ${item.name} x${item.quantity}</span>
                    <span>₹${item.price * item.quantity}</span>
                </div>
            `).join('')}
        </div>
        <div class="checkout-total">
            <strong>Total: ₹${total}</strong>
        </div>
    `;
}

// Handle checkout form submission
function handleCheckout(event) {
    event.preventDefault();
    
    const cart = JSON.parse(localStorage.getItem('boarpark_cart') || '[]');
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const formData = new FormData(event.target);
    const orderData = {
        customer: {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            pincode: formData.get('pincode')
        },
        paymentMethod: formData.get('payment'),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    const order = placeOrder(orderData);
    
    // Clear cart
    localStorage.removeItem('boarpark_cart');
    
    // Show success and redirect
    alert(`🎉 Order placed successfully!\n\nOrder ID: ${order.id}\n\nSave this ID to track your order.`);
    window.location.href = `track-order.html?order=${order.id}`;
}

// Render tracking page
function renderTrackingPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    const container = document.getElementById('track-container');
    if (!container) return;
    
    if (orderId) {
        const order = getOrder(orderId);
        if (order) {
            renderOrderTracking(container, order);
        } else {
            container.innerHTML = `
                <div class="track-not-found">
                    <span class="not-found-icon">🔍</span>
                    <h3>Order Not Found</h3>
                    <p>We couldn't find order <strong>${orderId}</strong></p>
                    <a href="my-orders.html" class="btn-primary">View All Orders</a>
                </div>
            `;
        }
    } else {
        // Show search form
        container.innerHTML = `
            <div class="track-search">
                <h2>🔍 Track Your Order</h2>
                <p>Enter your order ID to check the status</p>
                <form onsubmit="searchOrder(event)">
                    <input type="text" id="search-order-id" placeholder="e.g., BP-ABC123-XYZ" required>
                    <button type="submit" class="btn-cta">Track Order</button>
                </form>
                <p class="track-hint">You can find your order ID in the confirmation email or <a href="my-orders.html">My Orders</a></p>
            </div>
        `;
    }
}

function searchOrder(event) {
    event.preventDefault();
    const orderId = document.getElementById('search-order-id').value.trim();
    if (orderId) {
        window.location.href = `track-order.html?order=${orderId}`;
    }
}

function renderOrderTracking(container, order) {
    const statusInfo = getStatusInfo(order.status);
    const allStatuses = ['placed', 'processing', 'packed', 'shipped', 'delivered'];
    const currentIndex = allStatuses.indexOf(order.status);
    
    container.innerHTML = `
        <div class="track-header">
            <h2>📦 Order Status</h2>
            <div class="order-id-display">
                <span>Order ID: <strong>${order.id}</strong></status>
                <button onclick="copyOrderId('${order.id}')" class="btn-copy">📋 Copy</button>
            </div>
        </div>
        
        <div class="status-banner" style="background: ${statusInfo.color}20; border-color: ${statusInfo.color}">
            <span class="status-icon">${statusInfo.icon}</span>
            <div>
                <h3 style="color: ${statusInfo.color}">${statusInfo.label}</h3>
                <p>${statusInfo.description}</p>
            </div>
        </div>
        
        <div class="status-timeline">
            ${allStatuses.map((status, index) => {
                const info = getStatusInfo(status);
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                
                return `
                    <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                        <div class="step-icon" style="background: ${isCompleted ? info.color : '#444'}">${info.icon}</div>
                        <div class="step-label">${info.label}</div>
                        ${isCurrent ? '<div class="step-now">NOW</div>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="order-details">
            <h3>📋 Order Details</h3>
            <div class="details-grid">
                <div>
                    <strong>Items:</strong>
                    <ul>${order.items.map(i => `<li>${i.image} ${i.name} x${i.quantity}</li>`).join('')}</ul>
                </div>
                <div>
                    <strong>Total:</strong> ₹${order.total}<br>
                    <strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}<br>
                    <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}
                </div>
            </div>
        </div>
        
        <div class="status-history">
            <h3>📜 Status History</h3>
            ${order.statusHistory.map(h => {
                const info = getStatusInfo(h.status);
                return `
                    <div class="history-item">
                        <span class="history-icon" style="color: ${info.color}">${info.icon}</span>
                        <div>
                            <strong>${info.label}</strong>
                            <p>${h.message}</p>
                            <small>${new Date(h.timestamp).toLocaleString('en-IN')}</small>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function copyOrderId(id) {
    navigator.clipboard.writeText(id).then(() => {
        alert('Order ID copied to clipboard!');
    });
}

// Render my orders page
function renderMyOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    const orders = getOrders();
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="orders-empty">
                <span class="empty-icon">📭</span>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="index.html#products" class="btn-cta">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="orders-list">
            ${orders.map(order => {
                const statusInfo = getStatusInfo(order.status);
                return `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <strong>${order.id}</strong>
                                <span class="order-date">${new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            <span class="order-status" style="background: ${statusInfo.color}20; color: ${statusInfo.color}">
                                ${statusInfo.icon} ${statusInfo.label}
                            </span>
                        </div>
                        <div class="order-items-preview">
                            ${order.items.slice(0, 3).map(i => `<span>${i.image}</span>`).join('')}
                            ${order.items.length > 3 ? `<span>+${order.items.length - 3}</span>` : ''}
                        </div>
                        <div class="order-footer">
                            <strong>₹${order.total}</strong>
                            <a href="track-order.html?order=${order.id}" class="btn-track">Track Order →</a>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Demo: Simulate order progress (for testing)
function simulateOrderProgress(orderId) {
    const order = getOrder(orderId);
    if (!order) return;
    
    const nextStatus = getNextStatus(order.status);
    if (nextStatus) {
        updateOrderStatus(orderId, nextStatus);
        return true;
    }
    return false;
}

// Demo: Create sample orders
function createSampleOrders() {
    const sampleOrders = [
        {
            customer: { name: 'Demo User', email: 'demo@example.com', phone: '9876543210', address: '123 Main St', city: 'Hyderabad', pincode: '500001' },
            paymentMethod: 'cod',
            items: [{ id: 'starter-pack', name: 'Starter Pack', price: 99, image: '🎁', quantity: 1 }],
            total: 99
        },
        {
            customer: { name: 'Demo User', email: 'demo@example.com', phone: '9876543210', address: '123 Main St', city: 'Hyderabad', pincode: '500001' },
            paymentMethod: 'upi',
            items: [
                { id: 'mega-pack', name: 'Mega Pack', price: 299, image: '🎉', quantity: 1 },
                { id: 'telugu-heroes', name: 'Telugu Heroes Pack', price: 149, image: '🌟', quantity: 1 }
            ],
            total: 448
        }
    ];
    
    sampleOrders.forEach(orderData => placeOrder(orderData));
}

// Initialize order pages
document.addEventListener('DOMContentLoaded', function() {
    // Checkout page
    if (document.getElementById('checkout-form')) {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    }
    
    // Track order page
    if (document.getElementById('track-container')) {
        renderTrackingPage();
    }
    
    // My orders page
    if (document.getElementById('orders-container')) {
        // Uncomment to create sample orders for testing:
        // if (getOrders().length === 0) createSampleOrders();
        renderMyOrders();
    }
});