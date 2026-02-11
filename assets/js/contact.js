// Contact form handler — writes inquiries to Firestore
const app_contact = (firebase.apps && firebase.apps.length) ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
const db_contact = firebase.firestore();

document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'contact-form') {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const msg = document.getElementById('contact-message').value.trim();
    if (!email || !msg) return alert('Please enter your email and message.');
    try {
      await db_contact.collection('inquiries').add({ name, email, message: msg, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      e.target.reset();
      alert('Message sent — we will contact you soon!');
    } catch (err) {
      alert('Could not send message: ' + err.message);
    }
  }
});