  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });

    AOS.init({
    duration: 800,
    once: true
  });


    // Generate random pastel color
  function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`; // soft, readable colors
  }

  // Apply random color to all elements with the class "random-bg"
  document.querySelectorAll('.random-bg').forEach(el => {
    el.style.backgroundColor = getRandomColor();
  });


  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('takeaways-container');
    const addBtn = document.getElementById('add-takeaway');

    let count = container.querySelectorAll('input').length;

    addBtn.addEventListener('click', function () {
      count++;
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'takeaways';
      input.className = 'form-control mb-1';
      input.placeholder = 'Enter takeaway ' + count;
      input.required = true;
      container.appendChild(input);
    });
  });


  document.addEventListener("DOMContentLoaded", () => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    });

    document.querySelectorAll('.money-format').forEach(el => {
      const amount = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(amount)) {
        el.textContent = formatter.format(amount);
      }
    });
  });
