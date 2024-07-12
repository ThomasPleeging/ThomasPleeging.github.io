

window.addEventListener("DOMContentLoaded", (event) => {

  document.querySelectorAll('.topmenu').forEach(function(a) {
    a.addEventListener('click', function() {

      const topmenu_elements = document.querySelectorAll('.topmenu');
      
      // Loop through each element and remove the class
      topmenu_elements.forEach(function(element) {
          element.classList.remove('menu_active', 'parent_active');
      });

      this.classList.toggle('menu_active');
    });
  });

  document.querySelectorAll('.submenu li').forEach(function(li) {
    li.addEventListener('click', function() {
      

      const topmenu_elements = document.querySelectorAll('.topmenu');
      
      // Loop through each element and remove the class
      topmenu_elements.forEach(function(element) {
          element.classList.remove('menu_active', 'parent_active');
      });


      const submenu_elements = document.querySelectorAll('.submenu li');
      
      // Loop through each element and remove the class
      submenu_elements.forEach(function(element) {
          element.classList.remove('submenu_active');
      });


      this.classList.toggle('submenu_active');

      // Get the parent element of the button
        const parentElement = this.parentElement;
        
        // Get the sibling of the parent element
        const siblingElement = parentElement.previousElementSibling;
        
        // Check if the sibling element exists and toggle the class
        if (siblingElement) {
            siblingElement.classList.add('menu_active', 'parent_active');
        }
    });
  });

});
