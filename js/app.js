const { createApp, nextTick } = Vue;

createApp({
  data() {
    return {
      // STATE BARU UNTUK TEKS TOMBOL REKENING
      teksTombolSalin: "Salin",

      // LOGIKA KERANJANG: Ambil data lama dari LocalStorage jika ada, jika tidak ada buat array kosong
      cart: JSON.parse(localStorage.getItem("xar_cart")) || { items: [] },

      customer: { name: "", email: "", phone: "" },
      contactForm: { name: "", email: "", phone: "", message: "" },
      searchQuery: "",
      currentCategory: "Semua",
      isCartBouncing: false,
      isActiveNavbar: false,
      isActiveSearch: false,
      isActiveCart: false,

      // Standby penampung data dari JSON
      kategoriItems: [],
      daftarRekening: [],
      produkItems: [],

      isScrolled: false,
      isActiveNavbar: false,
      isActiveSearch: false,
      isActiveCart: false,

      isActiveModal: false, // Mengontrol buka/tutup modal
      activeItem: null, // Menyimpan data produk yang sedang diklik
      currentSize: "", // Menyimpan varian ukuran yang dipilih
      selectedPrice: 0, // Menyimpan harga dari varian yang aktif
      modalQty: 1, // Jumlah item yang mau dibeli di dalam modal
      selectedItem: null,
      selectedVariant: null, // MENGUNCI VARIAN YANG SEDANG DIPILIH DI MODAL
    };
  },

  mounted() {
    // Memanggil file JSON
    fetch("data/data.json")
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat data JSON");
        return response.json();
      })
      .then((data) => {
        this.kategoriItems = data.kategoriItems;
        this.daftarRekening = data.daftarRekening;
        this.produkItems = data.produkItems;
      })
      .catch((error) => {
        console.error("Error fetching JSON:", error);
      });

    document.addEventListener("click", (e) => {
      if (!document.body.contains(e.target)) return;
      if (!e.target.closest("#hamburger") && !e.target.closest(".navbar-nav"))
        this.isActiveNavbar = false;
      if (
        !e.target.closest("#search-button") &&
        !e.target.closest(".search-form")
      )
        this.isActiveSearch = false;
      if (
        !e.target.closest("#cart-button") &&
        !e.target.closest(".shopping-cart")
      )
        this.isActiveCart = false;
    });
    window.addEventListener("scroll", () => {
      this.isScrolled = window.scrollY > 50;
    });
  },

  // WATCHER: Otomatis memantau setiap ada perubahan di keranjang untuk disimpan ke LocalStorage
  watch: {
    filteredProdukItems() {
      this.$nextTick(() => {
        this.initProductSlider();
      });
    },
    cart: {
      handler(newCart) {
        localStorage.setItem("xar_cart", JSON.stringify(newCart));
      },
      deep: true, // Memastikan perubahan kuantitas/varian di dalam array ikut terpantau
    },
  },

  computed: {
    // --- PENYEMPURNAAN LIVE SEARCH + FILTER TAB KATEGORI ---
    filteredProdukItems() {
      // PENGAMAN: Jika data produk dari JSON belum selesai dimuat, kembalikan array kosong
      if (!this.produkItems || this.produkItems.length === 0) {
        return [];
      }

      // 1. Jika kategori yang dipilih adalah "Semua", tampilkan semua produk tanpa filter
      if (this.currentCategory === "Semua") {
        return this.produkItems.filter((item) =>
          item.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );
      }

      // 2. Jika memilih kategori spesifik (Parfum / Kopi), filter berdasarkan category yang cocok
      return this.produkItems.filter((item) => {
        // Samakan huruf besar/kecil (toLowerCase) agar aman dari typo di JSON
        const matchCategory =
          item.category &&
          item.category.toLowerCase() === this.currentCategory.toLowerCase();
        const matchSearch = item.name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

        return matchCategory && matchSearch;
      });
    },
    cartTotal() {
      if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
        return 0;
      }
      return this.cart.items.reduce((sum, item) => {
        // Ambil harga dan kuantitas, paksa konversi ke angka murni
        const harga = Number(item.price) || 0;
        const jumlah = Number(item.quantity) || 0;
        return sum + harga * jumlah;
      }, 0);
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
    initProductSlider() {
      if (this.swiperInstance) this.swiperInstance.destroy(true, true);

      this.swiperInstance = new Swiper(".spotify-swiper", {
        loop: true,
        grabCursor: true,
        spaceBetween: 10,
        slidesPerView: 1.2,
        speed: 500,
        centerInsufficientSlides: true,

        breakpoints: {
          640: { slidesPerView: 1.5, centerInsufficientSlides: true },
          1024: { slidesPerView: 2, centerInsufficientSlides: true },
          1400: { slidesPerView: 4, centerInsufficientSlides: true },
        },
        // Aktifkan kedua fitur terlebih dahulu
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
      });
    },

    getAvailableVariants(productId) {
      const product = this.produkItems.find((p) => p.id === productId);
      return product ? product.variants : [];
    },

    updateCartItemVariant(currentCartId, newSize) {
      const cartItem = this.cart.items.find(
        (item) => item.cartId === currentCartId,
      );
      if (!cartItem) return;

      const allVariants = this.getAvailableVariants(cartItem.id);
      const newVariantData = allVariants.find((v) => v.size === newSize);
      if (!newVariantData) return;

      const newCartId = `${cartItem.id}-${newSize}`;
      const existingItem = this.cart.items.find(
        (item) => item.cartId === newCartId,
      );

      if (existingItem && newCartId !== currentCartId) {
        existingItem.quantity += cartItem.quantity;
        existingItem.total = existingItem.quantity * existingItem.price;
        this.cart.items = this.cart.items.filter(
          (item) => item.cartId !== currentCartId,
        );
      } else {
        cartItem.cartId = newCartId;
        cartItem.size = newSize;
        cartItem.price = newVariantData.price;
        cartItem.total = cartItem.quantity * newVariantData.price;
      }
    },

    salinRekening(rekening) {
      navigator.clipboard
        .writeText(rekening.accountNumber)
        .then(() => {
          rekening.teksTombolSalin = "Tersalin! ✔";
          setTimeout(() => {
            rekening.teksTombolSalin = "Salin";
          }, 2000);
        })
        .catch(() => {
          alert("Gagal menyalin otomatis, Bro. Silakan salin manual.");
        });
    },

    cetakPdfInvoice() {
      if (this.cart.items.length === 0) {
        alert("Keranjang belanja kamu masih kosong, Bro!");
        return;
      }
      window.print();
    },

    // --- LOGIKA MODAL (TULISAN 'METHODS' YANG NYELIP DI SINI SUDAH DIBUANG) ---
    bukaDetail(item) {
      this.activeItem = item;
      this.modalQty = 1;

      if (item.variants && item.variants.length > 0) {
        this.currentSize = item.variants[0].size;
        this.selectedPrice = item.variants[0].price;
      } else {
        this.currentSize = "";
        this.selectedPrice = item.price || 0;
      }

      this.isActiveModal = true;
      document.body.style.overflow = "hidden";
    },

    tutupDetail() {
      this.isActiveModal = false;
      document.body.style.overflow = "auto";
      setTimeout(() => {
        this.activeItem = null;
      }, 400);
    },

    tambahQtyModal() {
      this.modalQty++;
    },
    kurangiQtyModal() {
      if (this.modalQty > 1) this.modalQty--;
    },

    pilihUkuran(price, size) {
      this.selectedPrice = price;
      this.currentSize = size;
    },

    tambahKeKeranjangDariModal() {
      if (!this.activeItem) return;

      // Membuat format payload objek agar pas dengan data yang dibutuhkan addToCart
      const payloadProduk = {
        id: this.activeItem.id,
        name: this.activeItem.name,
        image: this.activeItem.image,
      };

      const payloadVarian = {
        size: this.currentSize,
        price: this.selectedPrice,
      };

      // Kita panggil fungsi utama addToCart kamu dengan menyuntikkan varian dan quantity-nya
      for (let i = 0; i < this.modalQty; i++) {
        this.addToCart(payloadProduk, payloadVarian);
      }

      this.tutupDetail();
    },

    pilihVarian(variant) {
      this.selectedVariant = variant;
    },

    addToCart(product, customVariant = null) {
      const variantYangDipilih = customVariant || product.variants[0];
      const uniqueCartId = `${product.id}-${variantYangDipilih.size}`;
      const cartItem = this.cart.items.find(
        (item) => item.cartId === uniqueCartId,
      );

      if (!cartItem) {
        this.cart.items.push({
          cartId: uniqueCartId,
          id: product.id,
          name: product.name,
          size: variantYangDipilih.size,
          price: variantYangDipilih.price,
          image: product.image,
          quantity: 1,
          total: variantYangDipilih.price,
        });
      } else {
        cartItem.quantity++;
        cartItem.total = cartItem.price * cartItem.quantity;
      }

      this.isCartBouncing = true;
      setTimeout(() => {
        this.isCartBouncing = false;
      }, 500);
    },

    removeFromCart(cartId) {
      const cartItem = this.cart.items.find((item) => item.cartId === cartId);
      if (!cartItem) return;

      if (cartItem.quantity > 1) {
        cartItem.quantity--;
        cartItem.total = cartItem.price * cartItem.quantity;
      } else if (cartItem.quantity === 1) {
        this.cart.items = this.cart.items.filter(
          (item) => item.cartId !== cartId,
        );
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
            // CETAK PDF SAAT PEMBAYARAN DI MIDTRANS SUKSES
            this.cetakPdfInvoice();

            alert("Pembayaran Berhasil!");
            this.cart.items = [];
          },
          // ... sisa handler midtrans tetap sama ...
          onPending: () => {
            alert("Menunggu Pembayaran...");
          },
          onError: () => {
            alert("Pembayaran Gagal!");
          },
        });
      } catch (error) {
        alert("Gagal memproses pesanan.");
      }
    },

    // --- PENGIRIMAN WA MURNI ---
    checkoutWa() {
      if (!this.isFormValid) return;

      // Kirim rincian pesan langsung ke WhatsApp Admin Xar Project
      const message = this.formatMsg();
      window.open(
        "https://wa.me/6285171723607?text=" + encodeURIComponent(message),
      );
    },

    formatMsg() {
      // 1. Susun daftar produk yang dibeli menjadi terstruktur rapi
      const itemDetails = this.cart.items
        .map((item, index) => {
          return (
            `${index + 1}. *${item.name}*\n` +
            `   • Ukuran/Varian : ${item.size}\n` +
            `   • Jumlah        : ${item.quantity} x ${this.rupiah(item.price)}\n` +
            `   • Subtotal      : ${this.rupiah(item.total)}\n`
          );
        })
        .join("\n");

      // 2. Bungkus ke dalam template teks struk e-commerce premium
      return `*🛍️ PESANAN BARU - XAR PROJECT*
--------------------------------------------

*📋 DATA CUSTOMER:*
• *Nama*   : ${this.customer.name}
• *Email*  : ${this.customer.email}
• *No HP*  : ${this.customer.phone}

--------------------------------------------

*📦 RINCIAN PESANAN:*
${itemDetails}
--------------------------------------------
*💰 TOTAL PEMBAYARAN : ${this.rupiah(this.cartTotal)}*
--------------------------------------------

_Mohon tunggu sebentar ya Kak, Admin kami akan segera memverifikasi ketersediaan stok produk dan metode pengirimannya. Terima Kasih!_ 🙏✨`;
    },

    kirimPesanKontak() {
      // Menyusun format teks pesan agar mencakup semua data form
      const teksPesan = `*📩 PESAN BARU - KONTAK KAMI*
--------------------------------------------
• *Nama* : ${this.contactForm.name}
• *Email* : ${this.contactForm.email}
• *No HP* : ${this.contactForm.phone}
--------------------------------------------
*💬 ISI PESAN:*
"${this.contactForm.message}"`;

      // Membuka WhatsApp dengan teks yang sudah di-encode
      window.open(
        "https://wa.me/6285171723607?text=" + encodeURIComponent(teksPesan),
        "_blank",
      );

      // Reset semua kolom input form kembali kosong setelah dikirim
      this.contactForm.name = "";
      this.contactForm.email = "";
      this.contactForm.phone = "";
      this.contactForm.message = "";
    },
    // covert rupiah
    rupiah(number) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(number);
    },
    // toggle search
    toggleSearch() {
      this.isActiveSearch = !this.isActiveSearch;
      if (this.isActiveSearch) {
        // Otomatis fokus ke input text box saat form search terbuka
        this.$nextTick(() => {
          document.getElementById("search-box").focus();
        });
      } else {
        this.searchQuery = ""; // Reset keyword pencarian saat ditutup
      }
    },
  },
}).mount("#app");
