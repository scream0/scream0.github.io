<?php   
// Memastikan file Midtrans ter-load dengan benar
require_once dirname(__FILE__) . '/midtrans-php-master/Midtrans.php';

// Set Server Key dan Konfigurasi Midtrans
\Midtrans\Config::$serverKey = 'Mid-server-AOuaL3PDsLg5kP733EdvCtgMZ';
\Midtrans\Config::$isProduction = false;
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

// 1. Validasi apakah ada data yang dikirim dari Vue
if (!isset($_POST['total']) || !isset($_POST['items'])) {
    http_response_code(400);
    echo "Bad Request: Data tidak lengkap.";
    exit;
}

// 2. Ambil data items dari Vue dan bersihkan untuk Midtrans
$raw_items = json_decode($_POST['items'], true);
$item_details = array();

if (is_array($raw_items)) {
    foreach ($raw_items as $item) {
        $item_details[] = array(
            'id'       => $item['id'],
            'price'    => $item['price'], // Midtrans butuh harga SATUAN
            'quantity' => $item['quantity'], // Midtrans butuh JUMLAH
            'name'     => $item['name']
        );
    }
}

// 3. Susun parameter transaksi untuk Midtrans
$params = array(
    'transaction_details' => array(
        'order_id'     => 'XAR-' . rand() . '-' . time(), // Format order ID unik
        'gross_amount' => (int)$_POST['total'],
    ),
    'item_details' => $item_details, // Menggunakan data item yang sudah disaring
    'customer_details' => array(
        'first_name' => $_POST['name'],
        'email'      => $_POST['email'],
        'phone'      => $_POST['phone'],
    ),
);

try {
    // 4. Minta token dari Midtrans
    $snapToken = \Midtrans\Snap::getSnapToken($params);
    echo $snapToken; // Token ini yang akan ditangkap oleh window.snap.pay() di Vue
} catch (Exception $e) {
    http_response_code(500);
    echo "Midtrans Error: " . $e->getMessage();
}
?>