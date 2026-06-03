// toggle class active hamburger menu
const navbarNav = document.querySelector(".navbar-nav");
// ketika hamburger menu di klik
document.querySelector("#hamburger").onclick = (e) => {
  e.preventDefault();
  navbarNav.classList.toggle("active");
};

//klik diluar element untuk menghilangkan navbar
const hamburger = document.querySelector("#hamburger");
const sb = document.querySelector("#search-button");
const cart = document.querySelector("#cart-button");
document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navbarNav.contains(e.target)) {
    navbarNav.classList.remove("active");
  }
  if (!sb.contains(e.target) && !searchForm.contains(e.target)) {
    searchForm.classList.remove("active");
  }
  if (!cart.contains(e.target) && !shoppingCart.contains(e.target)) {
    shoppingCart.classList.remove("active");
  }
});

//toggle search form
const searchForm = document.querySelector(".search-form");
const searchButton = document.querySelector("#search-button");
const searchBox = document.querySelector("#search-box");
document.querySelector("#search-button").onclick = (e) => {
  e.preventDefault();
  searchForm.classList.toggle("active");
  searchBox.focus();
};

//toggle shopping cart
const shoppingCart = document.querySelector(".shopping-cart");
const cartBtn = document.querySelector("#cart-button");
cartBtn.onclick = (e) => {
  e.preventDefault();
  shoppingCart.classList.toggle("active");
};

// toggle modal
const modal = document.querySelector(".modal");
const viewDetailsButtons = document.querySelectorAll(".view-details");
const modalCloseButton = document.querySelector(".modal-close");
viewDetailsButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });
});

// close modal
modalCloseButton.addEventListener("click", (e) => {
  e.preventDefault();
  modal.style.display = "none";
});

// close modal when clicking outside of it
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
