Deluxe Bouquet — Admin Guide

Also available as an in-site guide at `/admin/onboarding.html`.

1) Setup Firebase config:
   - Open Firebase Console → Project Settings → copy the config and paste into `/admin/firebase-config.js` as `window.firebaseConfig`.
2) Add admin UID (one-time, developer step):
   - Have your admin create an account via `/admin/login.html` (email/password).
   - In Firebase Console → Firestore → create a document in `admins` with the document ID = the user's UID. This authorizes admin actions.
3) Deploy Rules:
   - Paste the contents of `firestore.rules` and `storage.rules` into Firebase Console rules panels (replace defaults).
4) Add sample products:
   - Use the `data/products.json` as a guide or add via the admin dashboard.
5) Orders:
   - When a customer requests an order, an `orders` document is created. You can view orders in the Firebase Console or the admin Orders page at `/admin/orders.html`.
6) Deployment tips:
   - Host with Firebase Hosting or Netlify free tier. For Firebase Hosting, run `firebase init` and `firebase deploy`.
   - Verify auth, product create/edit/delete, image uploads, and that non-admins cannot write.

If you'd like, I can add on-screen admin instructions and an orders export CSV next.