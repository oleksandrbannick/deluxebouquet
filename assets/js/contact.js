// Contact form handler — writes inquiries to Firestore
// Use existing Firebase app if already initialized
const app_contact = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
const db_contact = app_contact.firestore();

document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'contact-form') {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const msg = document.getElementById('contact-message').value.trim();
    
    // Validate inputs
    if (!email || !msg) {
      alert('Please enter your email and message.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    try {
      await db_contact.collection('inquiries').add({
        name,
        email,
        message: msg,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      e.target.reset();
      alert('Message sent — we will contact you soon!');
    } catch (err) {
      console.error('Contact form error:', err);
      alert('Could not send message: ' + err.message);
    }
  }
});