document.addEventListener("alpine:init", () => {
  //1. DAFTARKAN STORE CART DI SINI (Agar $store.cart tidak undefined)
  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,
    // 1. Otonatis menghitung total harga dari semua item di cart
    get total() {
      return this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },

    // 2. Otomatis menghitung total jumlah barang di cart
    get quantity() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    // fungsi untuk menambahkan item ke cart
    add(newItem) {
      //cek apakah item sudah ada di cart
      const cartItem = this.items.find((item) => item.id === newItem.id);
      // jika belum ada, tambahkan item baru ke cart
      if (!cartItem) {
        this.items.push({
          ...newItem,
          quantity: 1,
          total: newItem.price,
        });

        this.quantity++;
        this.total += item.price;

        // jika sudah ada, update jumlah dan total harga item di cart
      } else {
        this.items = this.items.map((item) => {
          // jika barang berbeda
          if (item.id !== newItem.id) {
            return item;
          } else {
            // jika item sudah ada, update jumlah dan total harga item di cart
            item.quantity++;
            item.total = item.price * item.quantity;
            this.quantity++;

            this.total += item.price;
            return item;
          }
        });
      }
    },

    // fungsi untuk menghapus item dari cart
    remove(itemId) {
      // cari item yang akan dihapus dari cart
      const cartItem = this.items.find((item) => item.id === itemId);
      // jika item lebih dari 1, kurangi jumlah dan total harga item di cart
      if (cartItem.quantity > 1) {
        //telusuri 1 1
        this.items = this.items.map((item) => {
          // jika bukan barang yg diklik
          if (item.id !== itemId) {
            return item;
          } else {
            item.quantity--;
            item.total = item.price * item.quantity;
            this.quantity--;
            this.total -= item.price;
            return item;
          }
        });
      } else if (cartItem.quantity === 1) {
        //jika barang sisa 1
        this.items = this.items.filter((item) => item.id !== itemId);
        this.quantity--;
        this.total -= cartItem.price;
      }
    },
  });
  // 2. DATA KOMPONEN PRODUK ANDA
  Alpine.data("listProduk", () => ({
    items: [
      {
        id: 1,
        name: "Extrait De Parfum - Crush",
        description:
          "Parfum dengan konsentrasi tertinggi, memberikan aroma yang intens dan tahan lama.",
        originalPrice: 200000,
        price: 140000,
        image: "crush.jpg",
      },
      {
        id: 2,
        name: "Extrait De Parfum - Sugar Cane",
        description:
          "Parfum dengan konsentrasi tertinggi, memberikan aroma yang intens dan tahan lama.",
        originalPrice: 200000,
        price: 140000,
        image: "sugarcane.jpg",
      },
      {
        id: 3,
        name: "Drip Bag Coffee - Arabica",
        description:
          "Kopi Arabica berkualitas tinggi, memberikan rasa yang kaya dan kompleks.",
        originalPrice: 70000,
        price: 50000,
        image: "dripbagcoffee.jpg",
      },
    ],

    // menyimpan data
    selectedId: null,

    pilihData(itemId) {
      this.selectedId = itemId;
    },

    get selectedItem() {
      // Jika belum ada ID yang dipilih, kembalikan null
      if (!this.selectedId) return null;

      // Mencari data yang cocok dengan selectedId
      return this.items.find((item) => item.id === this.selectedId);
    },
  }));
});

//form validasi
const checkoutBtn = document.querySelector(".checkout-btn");
checkoutBtn.disabled = true;
// ambil form
const formCheckout = document.querySelector("#checkoutForm");
formCheckout.addEventListener("keyup", function () {
  for (let i = 0; i < formCheckout.elements.length; i++)
    if (formCheckout.elements[i].value.length !== 0) {
      checkoutBtn.classList.remove("disabled");
      checkoutBtn.classList.add("disabled");
    } else {
      return false;
    }
  checkoutBtn.disabled = false;
  checkoutBtn.classList.remove("disabled");
});

// kirim data ketika tombol checkout di klik
checkoutBtn.addEventListener("click", async function (e) {
  e.preventDefault();
  const formData = new FormData(formCheckout);
  const data = new URLSearchParams(formData);
  const objData = Object.fromEntries(data);
  const message = formatMsg(objData);
  window.open(
    "https://wa.me/6285171723607?text=" + encodeURIComponent(message),
  );

  /* minta transaksi token menggunakan ajax
  try {
    const respon = await fetch("php/placeorder.php", {
      method: "POST",
      body: data,
    });

    const token = await respon.text();
    window.snap.embed(token);
  } catch (error) {
    console.log(err.message);
  }
*/
});

//format pesan whatsapp
const formatMsg = (obj) => {
  return `Data Customer
  Nama  : ${obj.name}
  Email  : ${obj.email}
  No Hp  : ${obj.phone}
Data Pesanan
  ${JSON.parse(obj.items).map(
    (item) => `${item.name} (${item.quantity} x ${Rupiah(item.total)})\n`,
  )}
    
 TOTAL : ${Rupiah(obj.total)} 
 Terima Kasih. `;
};

//konversi ke rupiah
function Rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}
