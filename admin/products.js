// Admin product CRUD and image upload (vanilla JS using Firebase compat SDK)
if (!window.firebaseConfig || !window.firebaseConfig.projectId) {
  alert('Firebase configuration missing. Please add your config to /admin/firebase-config.js');
  throw new Error('Missing Firebase config (admin/firebase-config.js)');
}
const app = firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Emulator connections are disabled so this site uses the live Firebase project by default.
// To test locally with emulators, start the emulators and uncomment the lines below.
/*
if (location.hostname === 'localhost') {
  try {
    // Default emulator ports: auth 9099, firestore 8080, storage 9199
    auth.useEmulator && auth.useEmulator('http://localhost:9099');
    db.useEmulator && db.useEmulator('localhost', 8080);
    storage.useEmulator && storage.useEmulator('localhost', 9199);
    console.info('Firebase emulators: auth/firestore/storage set to localhost');
  } catch (e) {
    console.warn('Could not connect to Firebase emulators:', e);
  }
}
*/

// Redirect to login if not signed in
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
  }

  // You must add the user's UID to the 'admins' collection in Firestore manually (one-time).
  const adminDoc = await db.collection('admins').doc(user.uid).get();
  if (!adminDoc.exists) {
    alert('Your account is not an admin. Ask the developer to add your UID to the admins collection.');
    auth.signOut();
    return;
  }

  attachProductsListener();
});

let productsUnsubscribe = null;

function attachProductsListener() {
  if (productsUnsubscribe) productsUnsubscribe();
  // Only listen to active products
  productsUnsubscribe = db.collection('products')
    .where('isActive','==', true)
    .orderBy('createdAt','desc')
    .onSnapshot(snapshot => {
      renderProductsList(snapshot.docs || []);
    }, err => {
      console.error('Failed to listen to products:', err);
      loadProductsFallback();
    });
}

let archivedUnsubscribe = null;
function attachArchivedListener() {
  if (archivedUnsubscribe) archivedUnsubscribe();
  archivedUnsubscribe = db.collection('products')
    .where('isActive','==', false)
    .orderBy('deletedAt','desc')
    .onSnapshot(snapshot => {
      renderArchivedList(snapshot.docs || []);
    }, err => {
      console.error('Failed to listen to archived products:', err);
      document.getElementById('archived-list').innerHTML = '<p class="muted">No archived products.</p>';
    });
}

function renderArchivedList(docs) {
  const list = document.getElementById('archived-list');
  list.innerHTML = '';
  docs.forEach(doc => {
    const p = doc.data();
    const id = doc.id;
    const div = document.createElement('div');
    div.className = 'product-row';
    const thumb = (p.images && p.images[0]) ? `<img class="product-thumb" src="${p.images[0]}" alt="${p.title}">` : `<div class="product-thumb placeholder"></div>`;
    const deletedAt = p.deletedAt ? p.deletedAt.toDate() : null;
    const daysLeft = deletedAt ? Math.max(0, 7 - Math.floor((Date.now() - deletedAt.getTime()) / (1000*60*60*24))) : 'N/A';
    div.innerHTML = `
      <div class="product-row-inner">
        ${thumb}
        <div class="product-info">
          <strong>${p.title}</strong>
          <div class="small muted">Will be permanently removed in ${daysLeft} day(s)</div>
        </div>
        <div class="product-actions">
          <button data-id="${id}" class="restore btn">Restore</button>
          <button data-id="${id}" class="purge btn delete">Delete Permanently</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderProductsList(docs) {
  const list = document.getElementById('products-list');
  list.innerHTML = '';
  docs.forEach(doc => {
    const p = doc.data();
    const id = doc.id;
    const div = document.createElement('div');
    div.className = 'product-row';
    const thumb = (p.images && p.images[0]) ? `<img class="product-thumb" src="${p.images[0]}" alt="${p.title}">` : `<div class="product-thumb placeholder"></div>`;
    div.innerHTML = `
      <div class="product-row-inner">
        ${thumb}
        <div class="product-info">
          <strong>${p.title}</strong>
          <div class="small muted">${(p.price_cents/100).toFixed(2)} USD • ${p.inventory || 0} in stock</div>
        </div>
        <div class="product-actions">
          <button data-id="${id}" class="edit btn">Edit</button>
          <button data-id="${id}" class="delete btn delete">Delete</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function loadProductsFallback() {
  const list = document.getElementById('products-list');
  list.innerHTML = '<p class="muted">No products available yet.</p>';
} 

// Create / Update product form
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById('save-btn');
  const saveMsg = document.getElementById('save-message');
  try { if (saveMsg) saveMsg.textContent = ''; } catch (e) {}

  const id = document.getElementById('product-id').value || null;
  const title = document.getElementById('title').value;
  const price = parseFloat(document.getElementById('price').value);
  const description = document.getElementById('description').value;
  const inventory = parseInt(document.getElementById('inventory').value || '0', 10);
  const imageFile = document.getElementById('image').files[0];

  console.log('Submitting product', { id, title, price, inventory, imageFile });

  // Client-side validation
  if (!title || isNaN(price) || price < 0) {
    if (saveMsg) saveMsg.textContent = 'Please enter a valid title and price.';
    return;
  }
  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    if (saveMsg) saveMsg.textContent = 'Image too large (max 2 MB). Please choose a smaller file.';
    return;
  }

  const data = {
    title,
    description,
    price_cents: Math.round(price * 100),
    inventory,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  // UI feedback
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
  if (saveMsg) saveMsg.textContent = 'Saving product...';

  try {
    if (imageFile) {
      // Resize / convert client-side to WebP to save upload size while keeping high quality.
      const optimizedBlob = await resizeAndConvertImage(imageFile, { maxDim: 2400, quality: 0.90, mimeType: 'image/webp' });
      // If optimization didn't reduce size, use original file
      const uploadBlob = (optimizedBlob && optimizedBlob.size && optimizedBlob.size < imageFile.size) ? optimizedBlob : imageFile;

      // show helpful message about sizes
      if (saveMsg) saveMsg.textContent = `Uploading image (${Math.round(uploadBlob.size/1024)} KB)...`;

      const bucket = (firebase.app && firebase.app().options && firebase.app().options.storageBucket) ? firebase.app().options.storageBucket : window.firebaseConfig.storageBucket;
      const ref = storage.refFromURL(`gs://${bucket}`).child(`product_images/${Date.now()}_${imageFile.name.replace(/\s+/g,'_')}`);
      // DEBUG: log where the SDK will upload so we can confirm the REST endpoint / bucket
      try { console.log('DEBUG upload target', { bucket, refFullPath: ref.fullPath, refToString: ref.toString() }); } catch (e) { console.log('DEBUG failed to log ref', e); }
      // Ensure ID token is fresh so custom claims (like `admin`) are present in the Authorization header
      if (firebase.auth().currentUser) {
        try { await firebase.auth().currentUser.getIdToken(true); } catch (e) { console.warn('Failed to refresh token before upload', e); }
      }
      const snap = await ref.put(uploadBlob);
      const url = await snap.ref.getDownloadURL();
      data.images = [url];
    }

    if (id) {
      // Keep product active when editing
      data.isActive = data.isActive !== false; // preserve explicit false, otherwise keep active
      await db.collection('products').doc(id).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      data.isActive = true; // new products are active by default
      await db.collection('products').add(data);
    }

    document.getElementById('product-form').reset();
    document.getElementById('image-preview').hidden = true; // real-time listener will refresh the list automatically

    if (saveMsg) saveMsg.textContent = 'Product saved.';
    setTimeout(() => { if (saveMsg) saveMsg.textContent = ''; }, 3000);
  } catch (err) {
    console.error('Failed to save product:', err);
    if (saveMsg) saveMsg.textContent = 'Failed to save product: ' + (err.message || err);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Product'; }
  }
});

// image preview
const imageInput = document.getElementById('image');
if (imageInput) {
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
      // show file size hint
      const sizeKb = Math.round(file.size / 1024);
      const sizeHint = document.getElementById('image-size-hint');
      if (sizeHint) sizeHint.textContent = `${sizeKb} KB (will be optimized before upload)`;
    } else {
      preview.hidden = true;
    }
  });
}

// Utility: resize and convert image using OffscreenCanvas / canvas
async function resizeAndConvertImage(file, { maxDim = 2400, quality = 0.9, mimeType = 'image/webp' } = {}) {
  try {
    // create bitmap for efficient resize
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);

    let canvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(w, h);
    } else {
      canvas = document.createElement('canvas');
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);

    // convert to blob (WebP recommended for good compression)
    if (canvas.convertToBlob) {
      return await canvas.convertToBlob({ type: mimeType, quality });
    }
    return await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  } catch (err) {
    console.warn('Image optimization failed, will use original file', err);
    return file; // fallback to original file
  }
}

// Delegate edit/delete buttons
document.getElementById('products-list').addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit')) {
    const id = e.target.dataset.id;
    const doc = await db.collection('products').doc(id).get();
    const p = doc.data();
    document.getElementById('product-id').value = id;
    document.getElementById('title').value = p.title || '';
    document.getElementById('price').value = (p.price_cents/100).toFixed(2) || '0.00';
    document.getElementById('description').value = p.description || '';
    document.getElementById('inventory').value = p.inventory || 0;
    window.scrollTo(0,0);
  }
  if (e.target.classList.contains('delete')) {
    const id = e.target.dataset.id;
    if (confirm('Archive this product?')) {
      await db.collection('products').doc(id).update({
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: false
      });
    }
  }

  // Restore archived product
  if (e.target.classList.contains('restore')) {
    const id = e.target.dataset.id;
    if (confirm('Restore this product?')) {
      await db.collection('products').doc(id).update({
        deletedAt: firebase.firestore.FieldValue.delete(),
        isActive: true
      });
    }
  }

  // Permanently delete archived product (remove storage objects then doc)
  if (e.target.classList.contains('purge')) {
    const id = e.target.dataset.id;
    if (confirm('Permanently delete this product and its images? This cannot be undone.')) {
      const doc = await db.collection('products').doc(id).get();
      const p = doc.data();
      try {
        if (p.images && Array.isArray(p.images)) {
          for (const url of p.images) {
            try {
              const ref = storage.refFromURL(url);
              await ref.delete();
            } catch (err) {
              console.warn('Failed to delete storage file for url', url, err);
            }
          }
        }
      } catch (err) {
        console.error('Error deleting product images:', err);
      }
      await db.collection('products').doc(id).delete();
    }
  }
});

// Sign out button
const signoutBtn = document.getElementById('signout-btn');
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
  });
}