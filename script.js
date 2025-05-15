console.log('تهيئة الصفحة');

// عداد الطلبات لتتبع عدد الـ fetch
let requestCount = 0;

// دالة مساعدة لـ Debounce
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// التحقق من صلاحية البيانات المخزنة
function isCacheValid(timestamp, maxAge = 5 * 60 * 1000) { // 5 دقايق
    return Date.now() - timestamp < maxAge;
}

// جلب الأقسام
async function displayCategories() {
    console.log('جلب الأقسام');
    try {
        // التحقق من الكاش
        const cachedCategories = JSON.parse(localStorage.getItem('categoriesCache'));
        if (cachedCategories && isCacheValid(cachedCategories.timestamp)) {
            console.log('استخدام الأقسام من الكاش');
            const categories = cachedCategories.data;
            const categoryGrid = document.querySelector('.category-grid');
            categoryGrid.innerHTML = categories.map(category => `
                <div class="col">
                    <div class="category-card" data-id="${category._id}" onclick="displayProductsByCategory('${category._id}')">
                        <img src="${category.image}" alt="${category.name}" class="img-fluid">
                        <h3>${category.name}</h3>
                    </div>
                </div>
            `).join('');
            return;
        }

        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/categories`);
        const response = await fetch('/api/categories');
        if (!response.ok) {
            const errorData = await response.json();
            console.error('خطأ استجابة /api/categories:', errorData);
            throw new Error(errorData.message || `فشل جلب الأقسام (حالة: ${response.status})`);
        }
        const categories = await response.json();
        console.log('الأقسام:', categories);

        // تخزين في الكاش
        localStorage.setItem('categoriesCache', JSON.stringify({
            timestamp: Date.now(),
            data: categories
        }));

        const categoryGrid = document.querySelector('.category-grid');
        categoryGrid.innerHTML = categories.map(category => `
            <div class="col">
                <div class="category-card" data-id="${category._id}" onclick="displayProductsByCategory('${category._id}')">
                    <img src="${category.image}" alt="${category.name}" class="img-fluid">
                    <h3>${category.name}</h3>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ جلب الأقسام:', error.message);
        Toastify({
            text: `خطأ جلب الأقسام: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// جلب المنتجات
async function displayProducts(searchQuery = '') {
    console.log('جلب المنتجات', searchQuery ? `بحث: ${searchQuery}` : '');
    try {
        // التحقق من الكاش (للمنتجات بدون بحث)
        if (!searchQuery) {
            const cachedProducts = JSON.parse(localStorage.getItem('productsCache'));
            if (cachedProducts && isCacheValid(cachedProducts.timestamp)) {
                console.log('استخدام المنتجات من الكاش');
                const products = cachedProducts.data;
                renderProducts(products);
                return;
            }
        }

        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/products${searchQuery ? `?search=${searchQuery}` : ''}`);
        const url = searchQuery ? `/api/products?search=${encodeURIComponent(searchQuery)}` : '/api/products';
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('خطأ استجابة /api/products:', errorData);
            throw new Error(errorData.message || `فشل جلب المنتجات (حالة: ${response.status})`);
        }
        const products = await response.json();
        console.log('المنتجات:', products);

        // تخزين في الكاش (للمنتجات بدون بحث)
        if (!searchQuery) {
            localStorage.setItem('productsCache', JSON.stringify({
                timestamp: Date.now(),
                data: products
            }));
        }

        renderProducts(products);
    } catch (error) {
        console.error('خطأ جلب المنتجات:', error.message);
        Toastify({
            text: `خطأ جلب المنتجات: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// جلب منتجات قسم معين
async function displayProductsByCategory(categoryId) {
    console.log(`جلب منتجات قسم: ${categoryId}`);
    try {
        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/products/category/${categoryId}`);
        const response = await fetch(`/api/products/category/${categoryId}`);
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`خطأ استجابة /api/products/category/${categoryId}:`, errorData);
            throw new Error(errorData.message || `فشل جلب منتجات القسم (حالة: ${response.status})`);
        }
        const products = await response.json();
        console.log('منتجات القسم:', products);
        renderProducts(products);
    } catch (error) {
        console.error('خطأ جلب منتجات القسم:', error.message);
        Toastify({
            text: `خطأ جلب منتجات القسم: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// دالة لعرض المنتجات
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = products.length > 0 ? products.map(product => `
        <div class="col">
            <div class="product" data-id="${product._id}">
                <img src="${product.image}" alt="${product.name}" class="img-fluid">
                <h5>${product.name}</h5>
                <p class="product-price">السعر: ${product.price} جنيه</p>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button onclick="updateQuantity('${product._id}', -1)">-</button>
                        <input type="number" class="product-quantity" data-id="${product._id}" value="1" min="1">
                        <button onclick="updateQuantity('${product._id}', 1)">+</button>
                    </div>
                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">إضافة إلى السلة</button>
                    <div class="product-total" data-id="${product._id}">الإجمالي: ${product.price} جنيه</div>
                </div>
            </div>
        </div>
    `).join('') : '<p class="empty-message w-100 text-center">لا توجد منتجات متاحة</p>';

    // إضافة event listeners لتحديث الكمية يدويًا
    document.querySelectorAll('.product-quantity').forEach(input => {
        input.addEventListener('change', () => {
            let quantity = parseInt(input.value);
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
                input.value = 1;
            }
            updateProductTotal(input.dataset.id, quantity);
        });
    });
}

// تحديث الكمية والإجمالي
function updateQuantity(productId, change) {
    const input = document.querySelector(`.product-quantity[data-id="${productId}"]`);
    let quantity = parseInt(input.value) + change;
    if (quantity < 1) quantity = 1;
    input.value = quantity;
    updateProductTotal(productId, quantity);
}

// تحديث الإجمالي التلقائي
async function updateProductTotal(productId, quantity) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('فشل جلب بيانات المنتج');
        }
        const product = await response.json();
        const total = product.price * quantity;
        const totalElement = document.querySelector(`.product-total[data-id="${productId}"]`);
        totalElement.textContent = `الإجمالي: ${total} جنيه`;
    } catch (error) {
        console.error('خطأ تحديث الإجمالي:', error.message);
        Toastify({
            text: `خطأ: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// إدارة السلة
let cart = JSON.parse(localStorage.getItem('cart')) || [];
async function addToCart(productId) {
    try {
        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/products/${productId}`);
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`خطأ استجابة /api/products/${productId}:`, errorData);
            throw new Error(errorData.message || `فشل جلب المنتج (حالة: ${response.status})`);
        }
        const product = await response.json();
        const quantityInput = document.querySelector(`.product-quantity[data-id="${productId}"]`);
        const quantity = parseInt(quantityInput.value) || 1;

        const cartItem = cart.find(item => item.product === productId);
        if (cartItem) {
            cartItem.quantity += quantity;
        } else {
            cart.push({
                product: productId,
                name: product.name,
                price: product.price,
                quantity: quantity
            });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        Toastify({
            text: 'تمت الإضافة إلى السلة',
            duration: 3000,
            className: 'toast-success'
        }).showToast();
    } catch (error) {
        console.error('خطأ إضافة إلى السلة:', error.message);
        Toastify({
            text: `خطأ: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    if (cart.length === 0) {
        console.log('السلة فارغة');
        cartItems.innerHTML = '<p class="empty-message text-center">السلة فارغة</p>';
        cartTotal.textContent = '0';
        cartCount.textContent = '0';
        return;
    }
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item mb-2 p-2 border rounded">
            ${item.name} - ${item.quantity} × ${item.price} = ${item.quantity * item.price} جنيه
            <button class="btn btn-danger btn-sm ms-2 delete" onclick="removeFromCart('${item.product}')">إزالة</button>
        </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    cartTotal.textContent = total;
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// عرض نموذج الطلب
function showCheckout() {
    if (cart.length === 0) {
        Toastify({
            text: 'السلة فارغة، أضف منتجات أولاً',
            duration: 3000,
            className: 'toast-error'
        }).showToast();
        return;
    }
    const cartSummary = document.getElementById('cart-summary');
    const cartTotalSummary = document.getElementById('cart-total-summary');
    cartSummary.innerHTML = cart.map(item => `
        <div>${item.name} - ${item.quantity} × ${item.price} = ${item.quantity * item.price} جنيه</div>
    `).join('');
    cartTotalSummary.textContent = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('electronic-payment-form').style.display = 'none';
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkout'));
    checkoutModal.show();
}

// عرض نموذج الدفع عند الاستلام
function showCashForm() {
    document.getElementById('checkout-form').style.display = 'block';
    document.getElementById('electronic-payment-form').style.display = 'none';
}

// عرض نموذج الدفع الإلكتروني
function showElectronicPaymentForm() {
    document.getElementById('electronic-payment-form').style.display = 'block';
    document.getElementById('checkout-form').style.display = 'none';
}

// جلب الموقع
function getLocation(fieldId = 'location') {
    const locationInput = document.getElementById(fieldId);
    const statusElement = document.getElementById(fieldId === 'location' ? 'location-status' : 'e-location-status');
    statusElement.textContent = 'جاري جلب الموقع...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                locationInput.value = mapsUrl;
                statusElement.textContent = 'تم مشاركة الموقع بنجاح';
                statusElement.classList.replace('text-muted', 'text-success');
            },
            error => {
                console.error('خطأ جلب الموقع:', error.message);
                statusElement.textContent = 'فشل مشاركة الموقع، أدخل رابط Google Maps يدويًا';
                statusElement.classList.replace('text-muted', 'text-danger');
            }
        );
    } else {
        statusElement.textContent = 'المتصفح لا يدعم مشاركة الموقع';
        statusElement.classList.replace('text-muted', 'text-danger');
    }
}

// إرسال طلب الدفع عند الاستلام
async function sendOrder(event) {
    event.preventDefault();
    try {
        const customerName = document.getElementById('name').value;
        const customerPhone = document.getElementById('phone').value;
        const customerAddress = document.getElementById('address').value;
        const customerLocation = document.getElementById('location').value;

        if (!customerName || !customerPhone || !customerAddress || cart.length === 0) {
            throw new Error('جميع الحقول مطلوبة والسلة يجب أن تكون غير فارغة');
        }

        const order = {
            customerName,
            customerPhone,
            customerAddress,
            customerLocation,
            products: cart.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            })),
            total: cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
            paymentMethod: 'cash'
        };

        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/orders (دفع عند الاستلام)`);
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('خطأ استجابة /api/orders:', errorData);
            throw new Error(errorData.message || `فشل إنشاء الطلب (حالة: ${response.status})`);
        }

        const result = await response.json();
        console.log('تم إنشاء الطلب:', result.orderId);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        bootstrap.Modal.getInstance(document.getElementById('checkout')).hide();
        Toastify({
            text: 'تم إرسال الطلب بنجاح',
            duration: 3000,
            className: 'toast-success'
        }).showToast();
    } catch (error) {
        console.error('خطأ إرسال الطلب:', error.message);
        Toastify({
            text: `خطأ: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// إرسال طلب الدفع الإلكتروني
async function sendElectronicOrder(event) {
    event.preventDefault();
    try {
        const customerName = document.getElementById('e-name').value;
        const customerPhone = document.getElementById('e-phone').value;
        const customerAddress = document.getElementById('e-address').value;
        const customerLocation = document.getElementById('e-location').value;
        const paymentProof = document.getElementById('payment-proof').files[0];

        if (!customerName || !customerPhone || !customerAddress || !paymentProof || cart.length === 0) {
            throw new Error('جميع الحقول وإثبات الدفع مطلوبة والسلة يجب أن تكون غير فارغة');
        }

        // التحقق من نوع الصورة
        const validImageTypes = ['image/jpeg', 'image/png'];
        if (!validImageTypes.includes(paymentProof.type)) {
            throw new Error('يرجى رفع صورة بصيغة JPG أو PNG');
        }

        // ضغط الصورة
        const maxSize = 5 * 1024 * 1024; // 5MB
        let compressedFile = paymentProof;
        console.log(`حجم الصورة الأصلي: ${(paymentProof.size / 1024 / 1024).toFixed(2)} MB`);
        if (paymentProof.size > maxSize) {
            console.log('بدء ضغط الصورة...');
            compressedFile = await new Promise((resolve, reject) => {
                new Compressor(paymentProof, {
                    quality: 0.6, // جودة الضغط (0.6 = جودة متوسطة)
                    maxWidth: 1920, // الحد الأقصى للعرض
                    maxHeight: 1920, // الحد الأقصى للارتفاع
                    mimeType: 'image/jpeg', // تحويل إلى JPEG
                    success(result) {
                        console.log(`حجم الصورة بعد الضغط: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
                        resolve(result);
                    },
                    error(err) {
                        console.error('خطأ ضغط الصورة:', err.message);
                        reject(new Error('فشل ضغط الصورة'));
                    }
                });
            });

            if (compressedFile.size > maxSize) {
                throw new Error('حجم الصورة بعد الضغط لا يزال كبيرًا، يرجى اختيار صورة أصغر');
            }
        }

        const formData = new FormData();
        formData.append('customerName', customerName);
        formData.append('customerPhone', customerPhone);
        formData.append('customerAddress', customerAddress);
        formData.append('customerLocation', customerLocation);
        formData.append('products', JSON.stringify(cart.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price
        }))));
        formData.append('total', cart.reduce((sum, item) => sum + item.quantity * item.price, 0));
        formData.append('paymentMethod', 'electronic');
        formData.append('paymentProof', compressedFile, compressedFile.name);

        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/orders (دفع إلكتروني)`);
        const response = await fetch('/api/orders', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('خطأ استجابة /api/orders:', errorData);
            throw new Error(errorData.message || `فشل إنشاء الطلب (حالة: ${response.status})`);
        }

        const result = await response.json();
        console.log('تم إنشاء الطلب:', result.orderId);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        bootstrap.Modal.getInstance(document.getElementById('checkout')).hide();
        Toastify({
            text: 'تم إرسال الطلب بنجاح',
            duration: 3000,
            className: 'toast-success'
        }).showToast();
    } catch (error) {
        console.error('خطأ إرسال الطلب:', error.message);
        Toastify({
            text: `خطأ: ${error.message}`,
            duration: 3000,
            className: 'toast-error'
        }).showToast();
    }
}

// البحث عن منتجات
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const debouncedSearch = debounce(query => {
        requestCount++;
        console.log(`طلب fetch رقم: ${requestCount} إلى /api/products?search=${query}`);
        displayProducts(query);
    }, 500);
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        debouncedSearch(query);
    });
}

// إغلاق القائمة المنسدلة
function closeNavbar() {
    const navbar = document.getElementById('navbarNav');
    if (navbar.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navbar).hide();
    }
}

// تهيئة
document.addEventListener('DOMContentLoaded', () => {
    displayCategories();
    displayProducts();
    updateCartDisplay();
    setupSearch();
    document.getElementById('show-categories-btn').addEventListener('click', () => {
        document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
    });
});
