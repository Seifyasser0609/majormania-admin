// admin.js - Firebase Admin Panel
let allOrders = [];
let currentFilter = 'all';

// DOM Elements
const ordersList = document.getElementById('ordersList');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchOrders');

// Initialize Admin Panel
function initAdminPanel() {
    loadOrdersFromFirebase();
    setupAdminEventListeners();
}

// Load orders from Firebase
function loadOrdersFromFirebase() {
    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            allOrders = [];
            snapshot.forEach((doc) => {
                const order = {
                    firebaseId: doc.id,   // <<< المهم جداً
                    ...doc.data()
                };
                allOrders.push(order);
            });
            renderOrders();
        }, (error) => {
            console.error('Error loading orders:', error);
            showAdminNotification('Error loading orders', 'error');
        });
}

// Setup Admin Event Listeners
function setupAdminEventListeners() {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderOrders();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderOrders(e.target.value.toLowerCase());
        });
    }
}

// Render Orders
function renderOrders(searchTerm = '') {
    let filteredOrders = allOrders;

    if (currentFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === currentFilter);
    }

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
            order.name.toLowerCase().includes(searchTerm) ||
            order.phone.includes(searchTerm) ||
            order.id.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">No orders found</div>';
        return;
    }

    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card ${order.status}">
            <div class="order-header">
                <div class="order-meta">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${formatDate(order.orderDate)}</span>
                </div>
                <div class="order-total">${order.total} EGP</div>
            </div>
            
            <div class="customer-info">
                <h4>${order.name}</h4>
                <p>📞 ${order.phone}</p>
                <p>📧 ${order.email}</p>
                <p>📍 ${order.address}, ${order.city}</p>
                ${order.notes ? `<p class="order-notes">📝 ${order.notes}</p>` : ''}
            </div>

            <div class="order-items">
                ${order.cart.map(item => `
                    <div class="order-item">
                        <span class="item-name">${item.name} x${item.quantity}</span>
                        <span class="item-price">${(item.price * item.quantity).toFixed(2)} EGP</span>
                    </div>
                `).join('')}
            </div>

            <div class="order-footer">
                <div class="status-controls">
                    <select class="status-select"
                        onchange="updateOrderStatus('${order.firebaseId}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>🎉 Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-call" onclick="callCustomer('${order.phone}')">
                        📞 Call
                    </button>
                    <button class="btn btn-delete" onclick="deleteOrder('${order.firebaseId}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update Order Status
async function updateOrderStatus(firebaseId, newStatus) {
    try {
        await db.collection('orders').doc(firebaseId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAdminNotification(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
        console.error('Error updating order status:', error);
        showAdminNotification('Error updating order status', 'error');
    }
}

// Delete Order
async function deleteOrder(firebaseId) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await db.collection('orders').doc(firebaseId).delete();
            showAdminNotification('Order deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting order:', error);
            showAdminNotification('Error deleting order', 'error');
        }
    }
}

// Call customer
function callCustomer(phoneNumber) {
    window.open(`tel:${phoneNumber}`, '_blank');
}

// CSV Export
function exportOrdersToCSV() {
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Address', 'City', 'Total', 'Status', 'Order Date'];
    const csvData = allOrders.map(order => [
        order.id,
        order.name,
        order.phone,
        order.email,
        order.address,
        order.city,
        order.total,
        order.status,
        formatDate(order.orderDate)
    ]);

    const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majormania-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAdminNotification('Orders exported to CSV', 'success');
}

// Utils
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAdminNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Start panel
document.addEventListener('DOMContentLoaded', initAdminPanel);
