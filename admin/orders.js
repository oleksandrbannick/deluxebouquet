const app_orders = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
const db_orders = app_orders.firestore();
const auth_orders = app_orders.auth();

auth_orders.onAuthStateChanged(async (user) => {
  if (!user) return window.location.href = 'login.html';
  const adminDoc = await db_orders.collection('admins').doc(user.uid).get();
  if (!adminDoc.exists) { auth_orders.signOut(); return; }
  loadOrders();
});

async function loadOrders() {
  const list = document.getElementById('orders-list');
  const snapshot = await db_orders.collection('orders').orderBy('createdAt','desc').get();
  list.innerHTML = '';
  snapshot.forEach(doc => {
    const o = doc.data();
    const div = document.createElement('div');
    div.className = 'product-row';
    div.innerHTML = `
      <strong>${o.email || '—'}</strong> for product: ${o.productId}<br>
      Status: <em>${o.status || 'new'}</em>
      <button data-id="${doc.id}" class="mark-processed">Mark Processed</button>
    `;
    list.appendChild(div);
  });
}

document.getElementById('orders-list').addEventListener('click', async (e) => {
  if (e.target.classList.contains('mark-processed')) {
    const id = e.target.dataset.id;
    await db_orders.collection('orders').doc(id).update({ status: 'processed', processedAt: firebase.firestore.FieldValue.serverTimestamp() });
    loadOrders();
  }
});