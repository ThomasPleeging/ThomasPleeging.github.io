

window.addEventListener("DOMContentLoaded", (event) => {

  document.querySelectorAll('.topmenu:not(.hassubmenu)').forEach(function(a) {
    a.addEventListener('click', function() {

      const topmenu_elements = document.querySelectorAll('.topmenu');
      
      // Loop through each element and remove the class
      topmenu_elements.forEach(function(element) {
        element.classList.remove('menu_active');
      });

      const submenu_elements = document.querySelectorAll('.submenu li');
      
      // Loop through each element and remove the class
      submenu_elements.forEach(function(element) {
        element.classList.remove('submenu_active');
      });

      this.classList.add('menu_active');
    });
  });

  document.querySelectorAll('.topmenu.hassubmenu').forEach(function(a) {
    a.addEventListener('click', function() {

      // Check if the element has class 'a'
      if (this.classList.contains('submenu_closed')) {
            // Remove class 'closed' and add class 'open'
            this.classList.remove('submenu_closed');
            this.classList.add('submenu_open');
      } else if (this.classList.contains('submenu_open')) {
            // Remove class 'b' and add class 'a'
            this.classList.remove('submenu_open');
            this.classList.add('submenu_closed');
      }
    });
  });


  document.querySelectorAll('.submenu li').forEach(function(li) {
    li.addEventListener('click', function() {

      const topmenu_elements = document.querySelectorAll('.topmenu');
      
      // Loop through each element and remove the class
      topmenu_elements.forEach(function(element) {
        element.classList.remove('menu_active');
      });

      const submenu_elements = document.querySelectorAll('.submenu li');
      
      // Loop through each element and remove the class
      submenu_elements.forEach(function(element) {
        element.classList.remove('submenu_active');
      });


      this.classList.add('submenu_active');

      // Get the parent element of the button
      const parentElement = this.parentElement;

        // Get the sibling of the parent element
      const siblingElement = parentElement.previousElementSibling;

        // Check if the sibling element exists and toggle the class
      if (siblingElement) {
        siblingElement.classList.add('menu_active');
      }
    });
  });

});
