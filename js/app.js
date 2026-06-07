document.addEventListener("alpine:init", () => {
  Alpine.data("listProducts", () => ({
    items: [
      {
        id: 1,
        name: "Extrait De Parfum - Crush",
        description:
          "Parfum dengan konsentrasi tertinggi, memberikan aroma yang intens dan tahan lama.",
        originalPrice: "200000",
        price: "140000",
        image: "crush.jpg",
      },
      {
        id: 2,
        name: "Extrait De Parfum - Sugar Cane",
        description:
          "Parfum dengan konsentrasi tertinggi, memberikan aroma yang intens dan tahan lama.",
        originalPrice: "200000",
        price: "140000",
        image: "sugarcane.jpg",
      },
      {
        id: 3,
        name: "Drip Bag Coffee - Arabica",
        description:
          "Kopi Arabica berkualitas tinggi, memberikan rasa yang kaya dan kompleks.",
        originalPrice: "70000",
        price: "50000",
        image: "dripbagcoffee.jpg",
      },
    ],
  }));

  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,
    add(newItem) {
      this.items.push(newItem);
      this.quantity++;
      this.total += newItem.price;
      console.log(this.items);
    },
  });
});

//konversi ke rupiah

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};
