let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategoryId = null;

// حفظ السلة في localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// عرض الأقسام
async function displayCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('فشل جلب الأقسام');
        const categories = await response.json();
        const categoryGrid = document.querySelector('.category-grid');
        categoryGrid.innerHTML = categories.map(category => `
            <div class="col">
                <div class="category" style="background-image: url(${category.image});" onclick="filterProducts('${category._id}')">
                    <h5>${category.name}</h5>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في جلب الأقسام:', error);
        Toastify({
            text: 'خطأ في تحميل الأقسام!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    }
}

// عرض المنتجات
async function displayProducts(categoryId = null) {
    currentCategoryId = categoryId;
    const productList = document.getElementById('product-list');

    try {
        const url = categoryId ? `/api/products/category/${categoryId}` : '/api/products';
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل جلب المنتجات');
        const products = await response.json();

        if (products.length === 0) {
            productList.innerHTML = `
                <p class="empty-message w-100 text-center">اختار قسم لعرض المنتجات</p>
            `;
            return;
        }

        productList.innerHTML = products.map(product => {
            const cartItem = cart.find(item => item.id === product._id);
            const quantity = cartItem ? cartItem.quantity : 0;
            const total = product.price * quantity;
            return `
                <div class="col">
                    <div class="product">
                        <img src="${product.image}" alt="${product.name}">
                        <h5>${product.name}</h5>
                        <p>${product.price} جنيه</p>
                        <div class="product-actions">
                            <div class="quantity-controls">
                                <button onclick="updateQuantity('${product._id}', -1)">-</button>
                                <span>${quantity}</span>
                                <button onclick="updateQuantity('${product._id}', 1)">+</button>
                            </div>
                            <button class="btn" onclick="addToCart('${product._id}')">إضافة إلى السلة</button>
                            ${quantity > 0 ? `<p class="product-total">الإجمالي: ${total} جنيه</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('خطأ في جلب المنتجات:', error);
        Toastify({
            text: 'خطأ في تحميل المنتجات!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    }
}

// البحث عن منتجات
async function searchProducts() {
    const query = document.getElementById('search-input').value.trim();
    const productList = document.getElementById('product-list');

    if (!query) {
        displayProducts(currentCategoryId);
        return;
    }

    try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('فشل البحث عن المنتجات');
        const products = await response.json();

        if (products.length === 0) {
            productList.innerHTML = `
                <p class="empty-message w-100 text-center">لا توجد منتجات مطابقة</p>
            `;
            return;
        }

        productList.innerHTML = products.map(product => {
            const cartItem = cart.find(item => item.id === product._id);
            const quantity = cartItem ? cartItem.quantity : 0;
            const total = product.price * quantity;
            return `
                <div class="col">
                    <div class="product">
                        <img src="${product.image}" alt="${product.name}">
                        <h5>${product.name}</h5>
                        <p>${product.price} جنيه</p>
                        <div class="product-actions">
                            <div class="quantity-controls">
                                <button onclick="updateQuantity('${product._id}', -1)">-</button>
                                <span>${quantity}</span>
                                <button onclick="updateQuantity('${product._id}', 1)">+</button>
                            </div>
                            <button class="btn" onclick="addToCart('${product._id}')">إضافة إلى السلة</button>
                            ${quantity > 0 ? `<p class="product-total">الإجمالي: ${total} جنيه</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('خطأ في البحث:', error);
        Toastify({
            text: 'خطأ في البحث عن المنتجات!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    }
}

// تصفية المنتجات حسب القسم
function filterProducts(categoryId) {
    displayProducts(categoryId);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// إظهار الأقسام (للزر العائم)
function showCategories() {
    currentCategoryId = null;
    displayProducts();
    document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
}

// إغلاق قائمة الهامبرغر
function closeNavbar() {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navbarCollapse).hide();
    }
}

// تحديث الكمية
async function updateQuantity(productId, change) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('فشل جلب المنتج');
        const product = await response.json();

        let cartItem = cart.find(item => item.id === productId);
        if (!cartItem && change > 0) {
            cartItem = { id: productId, name: product.name, price: product.price, quantity: 0 };
            cart.push(cartItem);
        }

        if (cartItem) {
            cartItem.quantity = Math.max(0, cartItem.quantity + change);
            if (cartItem.quantity === 0) {
                cart = cart.filter(item => item.id !== productId);
            }
        }

        saveCart();
        updateCart();
        await displayProducts(currentCategoryId);
    } catch (error) {
        console.error('خطأ في تحديث الكمية:', error);
        Toastify({
            text: 'خطأ في تحديث الكمية!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    }
}

// إضافة إلى السلة
async function addToCart(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('فشل جلب المنتج');
        const product = await response.json();

        let cartItem = cart.find(item => item.id === productId);
        if (!cartItem) {
            cartItem = { id: productId, name: product.name, price: product.price, quantity: 0 };
            cart.push(cartItem);
        }

        cartItem.quantity += 1;
        saveCart();
        updateCart();
        await displayProducts(currentCategoryId);

        Toastify({
            text: `تمت إضافة ${product.name} إلى السلة!`,
            className: 'toast-success',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        Toastify({
            text: 'خطأ في إضافة المنتج إلى السلة!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    }
}

// تحديث السلة
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>السلة فارغة</p>
                <a href="#categories" class="btn btn-shop-now">تسوق الآن</a>
            </div>
        `;
        cartCount.textContent = '0';
        cartTotal.textContent = '0';
        return;
    }

    cartItems.innerHTML = cart.map(item => {
        const total = item.price * item.quantity;
        return `
            <div class="cart-item">
                <p>${item.name} - ${item.quantity} × ${item.price} = ${total} جنيه</p>
                <div class="quantity-controls">
                    <button onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button class="delete" onclick="removeFromCart('${item.id}')">حذف</button>
                </div>
            </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = total;
    saveCart();
}

// إزالة من السلة
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
    displayProducts(currentCategoryId);

    Toastify({
        text: 'تم حذف المنتج من السلة!',
        className: 'toast-success',
        duration: 3000,
        gravity: 'top',
        position: 'center'
    }).showToast();
}

// إظهار نموذج إتمام الطلب
function showCheckout() {
    if (cart.length === 0) {
        Toastify({
            text: 'السلة فارغة، أضف منتجات أولاً!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
        return;
    }

    const cartSummary = document.getElementById('cart-summary');
    const cartTotalSummary = document.getElementById('cart-total-summary');
    cartSummary.innerHTML = cart.map(item => `
        <p>${item.name} - ${item.quantity} × ${item.price} = ${item.price * item.quantity} جنيه</p>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotalSummary.textContent = total;

    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('electronic-payment-form').style.display = 'none';
    new bootstrap.Modal(document.getElementById('checkout')).show();
}

// إظهار نموذج الدفع عند الاستلام
function showCashForm() {
    document.getElementById('checkout-form').style.display = 'block';
    document.getElementById('electronic-payment-form').style.display = 'none';
}

// إظهار نموذج الدفع الإلكتروني
function showElectronicPaymentForm() {
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('electronic-payment-form').style.display = 'block';
}

// الحصول على الموقع
function getLocation(inputId = 'location') {
    const statusElement = document.getElementById(`${inputId}-status`);

    if (!navigator.geolocation) {
        statusElement.textContent = 'المتصفح لا يدعم مشاركة الموقع، أدخل الرابط يدويًا';
        Toastify({
            text: 'المتصفح لا يدعم مشاركة الموقع!',
            className: 'toast-error',
            duration: 5000,
            gravity: 'top',
            position: 'center'
        }).showToast();
        return;
    }

    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            if (permissionStatus.state === 'denied') {
                statusElement.textContent = 'تم رفض إذن الموقع، يرجى تفعيله من إعدادات الجهاز';
                Toastify({
                    text: 'يرجى تفعيل الموقع من إعدادات iPhone: الإعدادات > الخصوصية > خدمات الموقع > Safari',
                    className: 'toast-error',
                    duration: 7000,
                    gravity: 'top',
                    position: 'center'
                }).showToast();
                return;
            }

            statusElement.textContent = 'جاري جلب الموقع...';
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    document.getElementById(inputId).value = mapsUrl;
                    statusElement.textContent = 'تم مشاركة الموقع بنجاح!';
                    Toastify({
                        text: 'تم مشاركة الموقع بنجاح!',
                        className: 'toast-success',
                        duration: 3000,
                        gravity: 'top',
                        position: 'center'
                    }).showToast();
                },
                error => {
                    let errorMessage = 'فشل مشاركة الموقع، أدخل الرابط يدويًا';
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'تم رفض إذن الموقع، يرجى تفعيله من إعدادات iPhone';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'معلومات الموقع غير متوفرة، حاول مرة أخرى';
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = 'انتهت مهلة جلب الموقع، حاول مرة أخرى';
                    }
                    statusElement.textContent = errorMessage;
                    Toastify({
                        text: errorMessage,
                        className: 'toast-error',
                        duration: 7000,
                        gravity: 'top',
                        position: 'center'
                    }).showToast();
                    console.error('Geolocation error:', error);
                },
                {
                    timeout: 10000,
                    maximumAge: 60000,
                    enableHighAccuracy: true
                }
            );
        }).catch(err => {
            statusElement.textContent = 'فشل التحقق من إذن الموقع، أدخل الرابط يدويًا';
            console.error('Permission check error:', err);
        });
    } else {
        statusElement.textContent = 'جاري جلب الموقع...';
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                document.getElementById(inputId).value = mapsUrl;
                statusElement.textContent = 'تم مشاركة الموقع بنجاح!';
                Toastify({
                    text: 'تم مشاركة الموقع بنجاح!',
                    className: 'toast-success',
                    duration: 3000,
                    gravity: 'top',
                    position: 'center'
                }).showToast();
            },
            error => {
                let errorMessage = 'فشل مشاركة الموقع، أدخل الرابط يدويًا';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'تم رفض إذن الموقع، يرجى تفعيله من إعدادات iPhone';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'معلومات الموقع غير متوفرة، حاول مرة أخرى';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'انتهت مهلة جلب الموقع، حاول مرة أخرى';
                }
                statusElement.textContent = errorMessage;
                Toastify({
                    text: errorMessage,
                    className: 'toast-error',
                    duration: 7000,
                    gravity: 'top',
                    position: 'center'
                }).showToast();
                console.error('Geolocation error:', error);
            },
            {
                timeout: 10000,
                maximumAge: 60000,
                enableHighAccuracy: true
            }
        );
    }
}

// إرسال الطلب (الدفع عند الاستلام)
async function sendOrder(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const location = document.getElementById('location').value;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerLocation: location,
        products: cart.map(item => ({
            product: item.id,
            quantity: item.quantity,
            price: item.price
        })),
        total,
        paymentMethod: 'cash',
        status: 'pending'
    };

    // إرسال إلى الـ API
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) throw new Error('فشل تسجيل الطلب');
        const result = await response.json();
        Toastify({
            text: result.message || 'تم تسجيل الطلب بنجاح!',
            className: 'toast-success',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
    } catch (error) {
        console.error('خطأ في إرسال الطلب للوحة الإدارة:', error);
        Toastify({
            text: 'خطأ في إرسال الطلب للوحة الإدارة!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
        return;
    }

    // إرسال إلى واتساب
    const orderDetails = cart.map(item => `${item.name} - ${item.quantity} × ${item.price} = ${item.price * item.quantity} جنيه`).join('\n');
    const message = `طلب جديد\nالاسم: ${name}\nالهاتف: ${phone}\nالعنوان: ${address}\n${location ? `الموقع: ${location}\n` : ''}تفاصيل الطلب:\n${orderDetails}\nالإجمالي: ${total} جنيه\nطريقة الدفع: عند الاستلام`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+201129864940&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    Toastify({
        text: 'جاري فتح واتساب لإرسال الطلب!',
        className: 'toast-success',
        duration: 3000,
        gravity: 'top',
        position: 'center'
    }).showToast();

    cart = [];
    saveCart();
    updateCart();
    displayProducts(currentCategoryId);
    bootstrap.Modal.getInstance(document.getElementById('checkout')).hide();
}

// إرسال الطلب (الدفع الإلكتروني)
async function sendElectronicOrder(event) {
    event.preventDefault();
    const name = document.getElementById('e-name').value;
    const phone = document.getElementById('e-phone').value;
    const address = document.getElementById('e-address').value;
    const location = document.getElementById('e-location').value;
    const paymentProof = document.getElementById('payment-proof').files[0];

    if (!paymentProof) {
        Toastify({
            text: 'يرجى رفع إثبات الدفع!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
        return;
    }

    const formData = new FormData();
    formData.append('image', paymentProof);
    const apiKey = 'bde613bd4475de5e00274a795091ba04';
    document.getElementById('upload-status').textContent = 'جاري رفع الصورة...';

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error('فشل رفع الصورة');
        }

        const imageUrl = data.data.url;
        document.getElementById('upload-status').textContent = 'تم رفع الصورة بنجاح';

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order = {
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            customerLocation: location,
            products: cart.map(item => ({
                product: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            total,
            paymentMethod: 'electronic',
            paymentProof: imageUrl,
            status: 'pending'
        };

        // إرسال إلى الـ API
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!orderResponse.ok) throw new Error('فشل تسجيل الطلب');
        const result = await orderResponse.json();
        Toastify({
            text: result.message || 'تم تسجيل الطلب بنجاح!',
            className: 'toast-success',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();

        // إرسال إلى واتساب
        const orderDetails = cart.map(item => `${item.name} - ${item.quantity} × ${item.price} = ${item.price * item.quantity} جنيه`).join('\n');
        const message = `طلب جديد\nالاسم: ${name}\nالهاتف: ${phone}\nالعنوان: ${address}\n${location ? `الموقع: ${location}\n` : ''}تفاصيل الطلب:\n${orderDetails}\nالإجمالي: ${total} جنيه\nطريقة الدفع: إلكتروني\nإثبات الدفع: ${imageUrl}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=+201129864940&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        Toastify({
            text: 'جاري فتح واتساب لإرسال الطلب!',
            className: 'toast-success',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();

        cart = [];
        saveCart();
        updateCart();
        displayProducts(currentCategoryId);
        bootstrap.Modal.getInstance(document.getElementById('checkout')).hide();
    } catch (error) {
        document.getElementById('upload-status').textContent = 'فشل رفع الصورة، حاول مرة أخرى';
        Toastify({
            text: 'خطأ في إرسال الطلب!',
            className: 'toast-error',
            duration: 3000,
            gravity: 'top',
            position: 'center'
        }).showToast();
        console.error('Error:', error);
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    displayCategories();
    displayProducts();
    updateCart();

    document.querySelector('.cart-icon').addEventListener('click', () => {
        document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
        closeNavbar();
    });

    // إضافة حدث للبحث
    document.getElementById('search-input')?.addEventListener('input', searchProducts);

    // إضافة حدث لزر عرض الأقسام
    document.getElementById('show-categories-btn')?.addEventListener('click', showCategories);
});