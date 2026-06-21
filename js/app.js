const { createApp, nextTick } = Vue;

createApp({
  data() {
    return {
      // --- STATE PENCARIAN ---
      searchQuery: "",

      // --- DATA PRODUK (DETAIL TAMBAHAN MASUK JSON) ---
      produkItems: [
        {
          id: 1,
          name: "Extrait De Parfum - Crush",
          description:
            "Parfum dengan konsentrasi tertinggi, memberikan aroma citrus segar yang intens digabungkan dengan sentuhan lembut vanilla dan kayu manis yang tahan lama.",
          originalPrice: 200000,
          price: 140000,
          image: "crush.jpg",
          // Detail Tambahan Khusus Produk 1
          specs: {
            category: "Extrait De Parfum",
            duration: "8 - 12 Jam",
          },
        },
        {
          id: 2,
          name: "Extrait De Parfum - Sugar Cane",
          description:
            "Parfum dengan konsentrasi tertinggi, memberikan aroma manis gourmand yang mewah dan hangat, meninggalkan impresi elegan di setiap langkah Anda.",
          originalPrice: 200000,
          price: 140000,
          image: "sugarcane.jpg",
          // Detail Tambahan Khusus Produk 2
          specs: {
            category: "Extrait De Parfum",
            duration: "8 - 12 Jam",
          },
        },
        {
          id: 3,
          name: "Drip Bag Coffee - Arabica",
          description:
            "Kopi Arabica artisanal pilihan berkualitas tinggi yang diproses secara presisi, memberikan keseimbangan rasa rasa buah (fruity) yang kaya dan kompleks.",
          originalPrice: 70000,
          price: 50000,
          image: "dripbagcoffee.jpg",
          // Detail Tambahan Khusus Produk 3 (Menyesuaikan Karakter Kopi)
          specs: {
            category: "Drip Bag Coffee",
            duration: "Netto: 5 x 10gr", // Mengubah info ketahanan menjadi berat bersih otomatis
          },
        },
      ],

      // --- STATE NAVIGASI & MENU TRIGGER ---
      isScrolled: false,
      isActiveNavbar: false,
      isActiveSearch: false,
      isActiveCart: false,

      // --- STATE MODAL DETAIL ---
      isOpenModal: false,
      selectedItem: null,

      // --- STATE KERANJANG (CART STORE) ---
      cart: {
        items: [],
      },

      // --- STATE FORM CHECKOUT ---
      customer: {
        name: "",
        email: "",
        phone: "",
      },

      // --- STATE FORM KONTAK KAMI ---
      contactForm: {
        name: "",
        email: "",
        phone: "",
        message: "",
      },
    };
  },

  mounted() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#hamburger") && !e.target.closest(".navbar-nav")) {
        this.isActiveNavbar = false;
      }
      if (
        !e.target.closest("#search-button") &&
        !e.target.closest(".search-form")
      ) {
        this.isActiveSearch = false;
      }
      if (
        !e.target.closest("#cart-button") &&
        !e.target.closest(".shopping-cart")
      ) {
        this.isActiveCart = false;
      }
    });

    window.addEventListener("scroll", () => {
      this.isScrolled = window.scrollY > 50;
    });
  },

  computed: {
    filteredProdukItems() {
      if (!this.searchQuery.trim()) {
        return this.produkItems;
      }
      const query = this.searchQuery.toLowerCase();
      return this.produkItems.filter((item) =>
        item.name.toLowerCase().includes(query),
      );
    },

    cartTotal() {
      return this.cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },

    cartQuantity() {
      return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    isFormValid() {
      return (
        this.customer.name.trim().length > 0 &&
        this.customer.email.trim().length > 0 &&
        String(this.customer.phone).length > 0
      );
    },
  },

  methods: {
    bukaDetail(item) {
      this.selectedItem = item;
      this.isOpenModal = true;
    },

    toggleSearch() {
      this.isActiveSearch = !this.isActiveSearch;
      if (this.isActiveSearch) {
        this.$nextTick(() => {
          const searchBox = document.getElementById("search-box");
          if (searchBox) searchBox.focus();
        });
      }
    },

    addToCart(newItem) {
      const cartItem = this.cart.items.find((item) => item.id === newItem.id);

      if (!cartItem) {
        this.cart.items.push({
          ...newItem,
          quantity: 1,
          total: newItem.price,
        });
      } else {
        cartItem.quantity++;
        cartItem.total = cartItem.price * cartItem.quantity;
      }
    },

    removeFromCart(itemId) {
      const cartItem = this.cart.items.find((item) => item.id === itemId);
      if (!cartItem) return;

      if (cartItem.quantity > 1) {
        cartItem.quantity--;
        cartItem.total = cartItem.price * cartItem.quantity;
      } else if (cartItem.quantity === 1) {
        this.cart.items = this.cart.items.filter((item) => item.id !== itemId);
      }
    },

    async checkout() {
      if (!this.isFormValid) return;

      const formData = new URLSearchParams();
      formData.append("name", this.customer.name);
      formData.append("email", this.customer.email);
      formData.append("phone", this.customer.phone);
      formData.append("total", this.cartTotal);
      formData.append("items", JSON.stringify(this.cart.items));

      try {
        const response = await fetch("php/placeorder.php", {
          method: "POST",
          body: formData,
        });

        const token = await response.text();

        window.snap.pay(token, {
          onSuccess: (result) => {
            alert("Pembayaran Berhasil!");
            this.cart.items = [];
          },
          onPending: (result) => {
            alert("Menunggu Pembayaran Anda...");
          },
          onError: (result) => {
            alert("Pembayaran Gagal!");
          },
          onClose: () => {
            alert("Anda menutup halaman pembayaran sebelum selesai.");
          },
        });
      } catch (error) {
        console.error("Terjadi kesalahan sistem:", error.message);
        alert("Gagal memproses pesanan, silakan coba lagi.");
      }
    },

    checkoutWa() {
      if (!this.isFormValid) return;
      const message = this.formatMsg();
      window.open(
        "https://wa.me/6285171723607?text=" + encodeURIComponent(message),
      );
    },

    formatMsg() {
      const itemDetails = this.cart.items
        .map(
          (item) =>
            `${item.name} (${item.quantity} x ${this.rupiah(item.price)})\n`,
        )
        .join("");

      return `Data Customer\nNama   : ${this.customer.name}\nEmail  : ${this.customer.email}\nNo Hp  : ${this.customer.phone}\n\nData Pesanan\n${itemDetails}\nTOTAL : ${this.rupiah(this.cartTotal)}\n\nTerima Kasih.`;
    },

    kirimPesanKontak() {
      const teksPesan = `Halo Admin Xar Project!\nAda pesan baru dari halaman Kontak Web.\n\nNama : ${this.contactForm.name}\nEmail : ${this.contactForm.email}\nNo HP : ${this.contactForm.phone}\n\nIsi Pesan :\n"${this.contactForm.message}"\n\nMohon segera direspon ya, terima kasih!`;
      const urlWhatsApp =
        "https://wa.me/6285171723607?text=" + encodeURIComponent(teksPesan);
      window.open(urlWhatsApp, "_blank");

      this.contactForm.name = "";
      this.contactForm.email = "";
      this.contactForm.phone = "";
      this.contactForm.message = "";
    },

    rupiah(number) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(number);
    },
  },
}).mount("#app");
