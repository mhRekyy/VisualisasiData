// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const htmlEl = document.documentElement;

// Check for saved theme preference or use default
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);

// Update icon display based on current theme
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    } else {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    }
}

// Shrinking navbar on scroll
const navbar = document.getElementById('navbar');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
});

// Project preview functionality
const briefcaseIcon = document.getElementById('briefcase-icon');
const projectPreview = document.getElementById('project-preview');
const closePreview = document.getElementById('close-preview');

briefcaseIcon.addEventListener('click', () => {
    projectPreview.classList.add('show');
});

closePreview.addEventListener('click', () => {
    projectPreview.classList.remove('show');
});

// CTA button functionality
const ctaButton = document.getElementById('cta-button');

ctaButton.addEventListener('click', () => {
    window.location.href = '#about';
    alert('This would navigate to the About page!');
});

// Add animation to social links
const socialLinks = document.querySelectorAll('.social-link');

socialLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        alert(`Navigating to ${link.textContent.trim()}...`);
    });
});

// JavaScript for hover effects
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        const action = this.querySelector('.card-action');
        if (action) {
          action.style.transform = 'translateX(4px)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        const action = this.querySelector('.card-action');
        if (action) {
          action.style.transform = 'translateX(0)';
        }
      });
    });

    // Apply the current theme on page load
    applyTheme(savedTheme);
});