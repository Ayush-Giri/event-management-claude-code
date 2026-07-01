/* ============================================================
   Community Event Management System — Client-Side JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------------
  // 1. Mobile Navigation Toggle
  // ----------------------------------------------------------
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    // Close menu when clicking a link (mobile UX)
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // ----------------------------------------------------------
  // 2. Auto-dismiss Alerts after 5 seconds
  // ----------------------------------------------------------
  document.querySelectorAll('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // ----------------------------------------------------------
  // 3. Delete Confirmation via data-confirm Attribute
  // ----------------------------------------------------------
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!confirm(el.dataset.confirm || 'Are you sure you want to delete this?')) {
        e.preventDefault();
      }
    });
  });

  // ----------------------------------------------------------
  // 4. Toggle Inline Edit Rows in Admin Tables
  // ----------------------------------------------------------
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const editRow = document.getElementById(targetId);
      if (editRow) {
        editRow.classList.toggle('active');
        btn.textContent = editRow.classList.contains('active') ? 'Cancel' : 'Edit';
      }
    });
  });

  // ----------------------------------------------------------
  // 5. Smooth Scroll for Anchor Links
  // ----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ----------------------------------------------------------
  // 6. Scroll-based Card Reveal Animations (Intersection Observer)
  // ----------------------------------------------------------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.event-card, .stat-card, .card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });

});
