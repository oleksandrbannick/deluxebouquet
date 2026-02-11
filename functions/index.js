const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Scheduled function: runs daily and permanently deletes archived products older than 7 days
exports.purgeArchivedProducts = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff);
  const snapshot = await db.collection('products').where('deletedAt', '<=', cutoffTs).get();
  console.log(`Found ${snapshot.size} archived products to purge.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const id = doc.id;
    // Delete storage files referenced in images array
    try {
      if (data.images && Array.isArray(data.images)) {
        for (const url of data.images) {
          try {
            // Parse object path from download URL
            // URL pattern: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?...
            const u = new URL(url);
            const parts = u.pathname.split('/o/');
            if (parts.length > 1) {
              const objectPath = decodeURIComponent(parts[1]);
              await bucket.file(objectPath).delete().catch((e) => {
                console.warn('Failed to delete object', objectPath, e.message);
              });
            }
          } catch (e) {
            console.warn('Failed to parse/delete url', url, e.message);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting storage files for product', id, err.message);
    }

    // Delete the Firestore document
    try {
      await db.collection('products').doc(id).delete();
      console.log('Purged product', id);
    } catch (err) {
      console.error('Failed to delete product doc', id, err.message);
    }
  }

  return null;
});