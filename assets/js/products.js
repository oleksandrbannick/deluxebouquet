// Public product listing script (reads 'products' collection and renders cards)
const app_public = (firebase.apps && firebase.apps.length) ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
const db_public = firebase.firestore();
const storage_public = firebase.storage();
const container = document.getElementById('product-grid');
const featuredContainer = document.getElementById('featured-grid');
let publicUnsubscribe = null;

// Emulator connections are disabled so public site uses the live Firebase project by default.
// To test locally with emulators, start them and uncomment the block below.
/*
if (location.hostname === 'localhost') {
  try {
    db_public.useEmulator && db_public.useEmulator('localhost', 8080);
    storage_public.useEmulator && storage_public.useEmulator('localhost', 9199);
    console.info('Public site using Firestore/Storage emulators');
  } catch (e) {
    console.warn('Could not connect to emulators:', e);
  }
}
*/

// Toggle catalog view
document.getElementById('view-all-btn')?.addEventListener('click', () => {
  document.querySelector('.featured-section').style.display = 'none';
  document.getElementById('catalog').style.display = 'block';
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('show-less-btn')?.addEventListener('click', () => {
  document.getElementById('catalog').style.display = 'none';
  document.querySelector('.featured-section').style.display = 'block';
  document.querySelector('.featured-section').scrollIntoView({ behavior: 'smooth' });
});

// Handle navigation catalog link click
document.querySelector('a[href="#catalog"]')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('.featured-section').style.display = 'none';
  document.getElementById('catalog').style.display = 'block';
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
});

function attachPublicListener() {
  if (!db_public || !db_public.collection) { loadFallback(); return; }
  if (publicUnsubscribe) publicUnsubscribe();
  // Only show active products (not archived) - simplified query to avoid composite index
  publicUnsubscribe = db_public.collection('products')
    .orderBy('createdAt','desc')
    .onSnapshot(snapshot => {
      // Filter active products with inventory in JavaScript instead of query
      const allDocs = snapshot && snapshot.docs ? snapshot.docs : [];
      const products = allDocs.filter(doc => {
        const data = doc.data();
        return data.isActive !== false && (data.inventory || 0) > 0;
      });
      
      console.log(`Loaded ${products.length} active products from Firebase`);
      
      // Render featured (first 4)
      if (featuredContainer) {
        featuredContainer.innerHTML = '';
        products.slice(0, 4).forEach((doc, i) => {
          featuredContainer.appendChild(createProductCard(doc, i));
        });
      }
      
      // Render full catalog
      if (container) {
        container.innerHTML = '';
        if (!products.length) {
          loadFallback();
          return;
        }
        products.forEach((doc, i) => {
          container.appendChild(createProductCard(doc, i));
        });
      }
  }, err => {
    console.warn('Firestore public listener error', err);
    loadFallback();
  });
}

function createProductCard(doc, i) {
  const p = doc.data();
  const id = doc.id;
  const defaultImg = (p.images && p.images[0]) || `/assets/images/bouquet${(i % 3) + 1}.svg`;
  const card = document.createElement('article');
  card.className = 'product-card';
  card.style.animationDelay = `${i * 90}ms`;
  card.innerHTML = `
    <img src="${defaultImg}" alt="${p.title}">
    <h3>${p.title}</h3>
    <p>${p.description || ''}</p>
    <div class="meta"><span class="price"><strong>$${(p.price_cents/100).toFixed(2)}</strong></span></div>
    <div class="actions"><button data-id="${id}" class="order">Request Order</button></div>
  `;
  return card;
}

function loadFallback() {
  try { const banner = document.getElementById('preview-banner'); if (banner) banner.hidden = false; } catch (e) {}
  fetch('data/products.json').then(resp => resp.json()).then(data => {
    container.innerHTML = '';
    data.forEach((p, i) => {
      const id = `local-${i}`;
      const defaultImg = (p.images && p.images[0]) || `assets/images/bouquet${(i % 3) + 1}.svg`;
      const card = document.createElement('article');
      card.className = 'product-card';
      card.style.animationDelay = `${i * 90}ms`;
      card.innerHTML = `
        <img src="${defaultImg}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>${p.description || ''}</p>
        <div class="meta"><span class="price"><strong>$${(p.price_cents/100).toFixed(2)}</strong></span></div>
        <div class="actions"><button data-id="${id}" class="order">Request Order</button></div>
      `;
      container.appendChild(card);
    });
  }).catch(err => { container.innerHTML = '<p class="muted">No products available. Configure Firebase or add sample products to <code>data/products.json</code>.</p>'; console.error('Failed to load local sample products:', err); });
}

// Orders
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('order')) {
    const id = e.target.dataset.id;
    const email = prompt('Enter your email to request this product:');
    if (!email) return;

    try {
      if (db_public && db_public.collection) {
        await db_public.collection('orders').add({ productId: id, email, status: 'new', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        alert('Order request sent! The shop will contact you.');
      } else {
        throw new Error('Firestore unavailable');
      }
    } catch (err) {
      console.warn('Order submission failed or unavailable — simulating local preview', err);
      alert('Order request simulated (local preview). Configure Firebase to enable live orders.');
    }
  }
});

// Start listening for products
attachPublicListener();

window.addEventListener('load', attachPublicListener);