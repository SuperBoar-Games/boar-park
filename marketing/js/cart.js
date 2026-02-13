// Boar Park Shopping Cart System

const CART_KEY = 'boarpark_cart';
const ORDERS_KEY = 'boarpark_orders';

// Product Catalog
const PRODUCTS = [
    { id: 'starter-pack', name: 'Starter Pack', price: 99, image: '🎁', category: 'pack', description: '10 random cards to get you started!' },
    { id: 'mega-pack', name: 'Mega Pack', price: 299, image: '🎉', category: 'pack', description: '30 cards + 1 guaranteed Rare!' },
    { id: 'ultimate-pack', name: 'Ultimate Pack', price: 999, image: '👑', category: 'pack', description: '100 cards + 5 guaranteed SR cards!' },
    { id: 'telugu-heroes', name: 'Telugu Heroes Pack', price: 149, image: '🌟', category: 'category', description: '5 Telugu superstar hero cards' },
    { id: 'hindi-villains', name: 'Hindi Villains Pack', price: 149, image: '😈', category: 'category', description: '5 Bollywood villain cards' },
    { id: 'tamil-legends', name: 'Tamil Legends Pack', price: 149, image: '🎬', category: 'category', description: '5 Kollywood legend cards' },
    { id: 'kannada-stars', name: 'Kannada Stars Pack', price: 149, image: '⭐', category: 'category', description: '5 Sandalwood star cards' },
    { id: 'malayalam-masters', name: 'Malayalam Masters Pack', price: 149, image: '🏆', category: 'category', description: '5 Mollywood master cards' }
];

// Cart Functions
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const product = PRODUCTS.find(p => p.id === productId);
        cart.push({ ...product, quantity });
    }
    
    saveCart(cart);
    showToast('Added to cart! 🛒');
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
}

function updateQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
        renderCart();
    }
}

function getCartTotal() {
    return getCart().reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    return getCart().reduce((count, item) => count + item.quantity, 0);
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}

// UI Functions
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const count = getCartCount();
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (cartSidebar && overlay) {
        cartSidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        renderCart();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <span class="empty-icon">🛒</span>
                <p>Your cart is empty</p>
                <a href="#products" class="btn-shop" onclick="toggleCart()">Start Shopping</a>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${item.image}</div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} each</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
                <div class="cart-item-total">₹${item.price * item.quantity}</div>
            </div>
        `).join('');
    }
    
    if (cartTotal) {
        const total = getCartTotal();
        cartTotal.innerHTML = `<strong>Total: ₹${total}</strong>`;
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const packs = PRODUCTS.filter(p => p.category === 'pack');
    const categories = PRODUCTS.filter(p => p.category === 'category');
    
    productsGrid.innerHTML = `
        <div class="products-section">
            <h3>🎁 Card Packs</h3>
            <div class="product-grid">
                ${packs.map(product => `
                    <div class="product-card">
                        <div class="product-badge">${product.category === 'pack' && product.id === 'ultimate-pack' ? '🔥 Best Value' : ''}</div>
                        <div class="product-image">${product.image}</div>
                        <h4>${product.name}</h4>
                        <p class="product-desc">${product.description}</p>
                        <div class="product-price">₹${product.price}</div>
                        <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="products-section">
            <h3>🎬 Category Packs</h3>
            <div class="product-grid">
                ${categories.map(product => `
                    <div class="product-card">
                        <div class="product-image">${product.image}</div>
                        <h4>${product.name}</h4>
                        <p class="product-desc">${product.description}</p>
                        <div class="product-price">₹${product.price}</div>
                        <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    renderProducts();
    
    // Close cart when clicking overlay
    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleCart);
    }
});