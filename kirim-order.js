   // pemakaian: node kirim-order.js 6
   const n = Number(process.argv[2] || 1);
   (async () => {
     for (let i = 0; i < n; i++) {
       const r = await fetch('http://localhost:8080/order-service/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productId: 2, qty: 1 }),  // Mouse, stok 25
       });
       const d = await r.json();
       console.log(r.status, 'order id:', d.id);
     }
   })();