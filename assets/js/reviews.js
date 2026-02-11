// Reviews functionality - submit and display customer reviews
(function() {
  if (!window.firebaseConfig || !window.firebaseConfig.projectId) {
    console.warn('Firebase not configured - reviews disabled');
    return;
  }

  const db = firebase.firestore();
  const reviewsGrid = document.getElementById('reviews-grid');
  const reviewForm = document.getElementById('review-form');

  // Load and display approved reviews
  async function loadReviews() {
    try {
      const snapshot = await db.collection('reviews')
        .where('approved', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();

      if (snapshot.empty) {
        reviewsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px; grid-column: 1/-1;">No reviews yet. Be the first to share your experience!</p>';
        return;
      }

      reviewsGrid.innerHTML = '';
      snapshot.forEach(doc => {
        const review = doc.data();
        const card = createReviewCard(review);
        reviewsGrid.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading reviews:', err);
      reviewsGrid.innerHTML = '<p class="muted" style="text-align: center; grid-column: 1/-1;">Unable to load reviews</p>';
    }
  }

  // Create review card HTML
  function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const firstLetter = review.name.charAt(0).toUpperCase();
    const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : '';
    
    card.innerHTML = `
      <div class="testimonial-stars">${stars}</div>
      <p class="testimonial-text">${escapeHtml(review.text)}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${firstLetter}</div>
        <div>
          <div class="testimonial-name">${escapeHtml(review.name)}</div>
          <div class="testimonial-detail">${date}</div>
        </div>
      </div>
    `;
    return card;
  }

  // Handle review submission
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      const reviewData = {
        name: document.getElementById('review-name').value.trim(),
        rating: parseInt(document.getElementById('review-rating').value),
        text: document.getElementById('review-text').value.trim(),
        approved: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        await db.collection('reviews').add(reviewData);
        showToast('Thank you for your review!');
        reviewForm.reset();
        // Reload reviews to show the new one
        setTimeout(loadReviews, 1000);
      } catch (err) {
        console.error('Error submitting review:', err);
        showToast('Error submitting review. Please try again.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load reviews on page load
  loadReviews();
})();
