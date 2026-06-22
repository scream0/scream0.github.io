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

      isOpenModal: false,
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
        spaceBetween: 20,
        slidesPerView: 1,
        centeredSlides: true, // INI KUNCI UTAMA: Memaksa slide selalu di tengah
        speed: 500,
        breakpoints: {
          640: { slidesPerView: 2, centeredSlides: false }, // Kalau sudah banyak produk, bisa false agar scrolling alami
          1024: { slidesPerView: 3, centeredSlides: false },
          1400: { slidesPerView: 4, centeredSlides: false },
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      });
    },
    // Tambahkan di dalam methods: { ... }
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
    // --- FITUR PRESTASI: COPY TO CLIPBOARD DARI DATA JSON ---
    salinRekening(rekening) {
      // Mengambil nomor rekening secara dinamis dari object JSON yang diklik
      navigator.clipboard
        .writeText(rekening.accountNumber)
        .then(() => {
          // Ubah teks tombol bank yang bersangkutan sesaat
          rekening.teksTombolSalin = "Tersalin! ✔";

          // Kembalikan ke teks "Salin" setelah 2 detik
          setTimeout(() => {
            rekening.teksTombolSalin = "Salin";
          }, 2000);
        })
        .catch(() => {
          alert("Gagal menyalin otomatis, Bro. Silakan salin manual.");
        });
    },
    // --- TOMBOL CETAK MANUAL MANDIRI ---
    cetakPdfInvoice() {
      if (this.cart.items.length === 0) {
        alert("Keranjang belanja kamu masih kosong, Bro!");
        return;
      }
      // Panggil jendela print sistem bawaan OS
      window.print();
    },
    // --- MEMBUKA MODAL & OTOMATIS SET VARIAN PERTAMA ---
    bukaDetail(item) {
      this.selectedItem = item;
      this.selectedVariant = item.variants[0]; // Default: pilih varian pertama (misal 10ml)
      this.isOpenModal = true;
    },

    // --- MENGGANTI HARGA SAAT VARIAN DIKLIK DI MODAL ---
    pilihVarian(variant) {
      this.selectedVariant = variant;
    },

    // --- MANIPULASI KERANJANG (MENDUKUNG MULTI-VARIAN) ---
    addToCart(product, customVariant = null) {
      // Jika dimasukkan dari card utama (bukan dari modal), otomatis pakai varian termurah (index 0)
      const variantYangDipilih = customVariant || product.variants[0];

      // Kunci ID unik gabungan antara ID produk + Ukuran Varian (agar 10ml dan 50ml terpisah di keranjang)
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
      // ====================================================
      // Pemicu Animasi Bounce pada Ikon Keranjang di Navbar
      // ====================================================
      this.isCartBouncing = true;
      setTimeout(() => {
        this.isCartBouncing = false;
      }, 500); // Matikan efek setelah 500ms (0.5 detik) agar bisa dipakai lagi
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

    rupiah(number) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(number);
    },
    toggleSearch() {
      this.isActiveSearch = !this.isActiveSearch;
      if (this.isActiveSearch) {
        nextTick(() => {
          const sb = document.getElementById("search-box");
          if (sb) sb.focus();
        });
      }
    },
  },
}).mount("#app");
