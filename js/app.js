const { createApp, nextTick } = Vue;

createApp({
  data() {
    return {
      // STATE BARU UNTUK TEKS TOMBOL REKENING
      teksTombolSalin: "Salin",

      cart: { items: [] },
      customer: { name: "", email: "", phone: "" },
      contactForm: { name: "", email: "", phone: "", message: "" },

      searchQuery: "",
      // --- FITUR BARU: STATE FILTER KATEGORI ---
      currentCategory: "Semua", // Default menampilkan semua produk
      // --- FITUR BARU: STATE ANIMASI KERANJANG ---
      isCartBouncing: false,
      // --- DATA JSON INFO REKENING (Bisa Ditambah Sesukamu) ---
      daftarRekening: [
        {
          id: 1,
          bankName: "BLU by BCA",
          accountNumber: "090151606623",
          accountHolder: "Xar Project Admin",
          teksTombolSalin: "Salin", // Menyimpan status teks tombol masing-masing bank
        },
      ],
      // --- DATA PRODUK DENGAN VARIAN PREMIUM ---
      produkItems: [
        {
          id: 1,
          name: "Extrait De Parfum - Crush",
          description:
            "Parfum dengan konsentrasi tertinggi, memberikan aroma citrus segar yang intens digabungkan dengan sentuhan lembut vanilla dan kayu manis yang tahan lama.",
          image: "crush.jpg",
          specs: { category: "Extrait De Parfum", duration: "8 - 12 Jam" },
          // PILIHAN VARIAN
          variants: [
            { size: "10ml", price: 50000, originalPrice: 75000 },
            { size: "50ml", price: 140000, originalPrice: 200000 },
          ],
        },
        {
          id: 2,
          name: "Extrait De Parfum - Sugar Cane",
          description:
            "Parfum dengan konsentrasi tertinggi, memberikan aroma manis gourmand yang mewah dan hangat, meninggalkan impresi elegan di setiap langkah Anda.",
          image: "sugarcane.jpg",
          specs: { category: "Extrait De Parfum", duration: "8 - 12 Jam" },
          variants: [
            { size: "10ml", price: 50000, originalPrice: 75000 },
            { size: "50ml", price: 140000, originalPrice: 200000 },
          ],
        },
        {
          id: 3,
          name: "Drip Bag Coffee - Arabica",
          description:
            "Kopi Arabica artisanal pilihan berkualitas tinggi yang diproses secara presisi, memberikan keseimbangan rasa rasa buah (fruity) yang kaya dan kompleks.",
          image: "dripbagcoffee.jpg",
          specs: { category: "Drip Bag Coffee", duration: "Netto: 5 x 10gr" },
          variants: [
            { size: "1 Pack", price: 50000, originalPrice: 70000 },
            { size: "3 Pack (Bundling)", price: 135000, originalPrice: 210000 },
          ],
        },
      ],

      isScrolled: false,
      isActiveNavbar: false,
      isActiveSearch: false,
      isActiveCart: false,

      isOpenModal: false,
      selectedItem: null,
      selectedVariant: null, // MENGUNCI VARIAN YANG SEDANG DIPILIH DI MODAL

      cart: { items: [] },
      customer: { name: "", email: "", phone: "" },
      contactForm: { name: "", email: "", phone: "", message: "" },
    };
  },

  mounted() {
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

  computed: {
    // --- PENYEMPURNAAN LIVE SEARCH + FILTER TAB KATEGORI ---
    filteredProdukItems() {
      let produkSaringan = this.produkItems;

      // 1. Saring berdasarkan Tab Kategori yang aktif
      // Kita pakai .toLowerCase() dan .trim() agar pencocokan stringnya anti-gagal
      if (this.currentCategory !== "Semua") {
        produkSaringan = produkSaringan.filter((item) => {
          return (
            item.specs &&
            item.specs.category.toLowerCase().trim() ===
              this.currentCategory.toLowerCase().trim()
          );
        });
      }

      // 2. Saring berdasarkan Input Pencarian (jika ada teks di kolom search)
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        produkSaringan = produkSaringan.filter((item) =>
          item.name.toLowerCase().includes(query),
        );
      }

      return produkSaringan;
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
      const teksPesan = `Halo Admin Xar Project!\nNama : ${this.contactForm.name}\nPesan : "${this.contactForm.message}"`;
      window.open(
        "https://wa.me/6285171723607?text=" + encodeURIComponent(teksPesan),
        "_blank",
      );
      this.contactForm.name =
        this.contactForm.email =
        this.contactForm.phone =
        this.contactForm.message =
          "";
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
