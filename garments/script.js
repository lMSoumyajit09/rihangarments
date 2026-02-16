const { jsPDF } = window.jspdf;

const GST_RATE = 0.18;

const products = [
  {name:"Red Nightwear", category:"Nightwear", price:800, image:"images/night1.jpg"},
  {name:"Blue Nightwear", category:"Nightwear", price:900, image:"images/night2.jpg"},
  {name:"Silk Saree", category:"Sarees", price:2000, image:"images/saree1.jpg"},
  {name:"Cotton Saree", category:"Sarees", price:1500, image:"images/saree2.jpg"},
  {name:"Bed Cover Floral", category:"Bed Covers", price:1200, image:"images/bed1.jpg"},
  {name:"Gamcha Classic", category:"Gamcha", price:300, image:"images/gamcha1.jpg"},
  {name:"Dhoti White", category:"Dhoti", price:500, image:"images/dhoti1.jpg"},
  {name:"Vest Cotton", category:"Vests", price:350, image:"images/vest1.jpg"},
  {name:"Designer Blouse", category:"Blouse", price:700, image:"images/blouse1.jpg"},
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productList = document.getElementById("product-list");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const totalSpan = document.getElementById("total");

function generateInvoiceNumber() {
  const now = new Date();
  return "INV-" + now.getFullYear() +
         (now.getMonth()+1) +
         now.getDate() + "-" +
         Math.floor(Math.random()*1000);
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

function displayProducts(category=null){

  document.querySelectorAll(".category-buttons button").forEach(btn=>{
    btn.classList.remove("active");
    if(btn.dataset.category===category){
      btn.classList.add("active");
    }
  });

  productList.innerHTML="";
  products.forEach(p=>{
    if(category && category!=="All" && p.category!==category) return;

    const discount = Math.floor(Math.random()*11)+10;
    const finalPrice = Math.round(p.price*(1-discount/100));

    const div=document.createElement("div");
    div.classList.add("product");
    div.innerHTML=`
      <div class="discount">${discount}% OFF</div>
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>₹${finalPrice}</p>

      <select class="size">
        <option value="1">S</option>
        <option value="1.1">M (+10%)</option>
        <option value="1.2">L (+20%)</option>
      </select>

      <select class="quantity">
        <option value="1">Qty: 1</option>
        <option value="2">Qty: 2</option>
        <option value="3">Qty: 3</option>
        <option value="4">Qty: 4</option>
        <option value="5">Qty: 5</option>
      </select>

      <button class="add-btn">Add to Cart</button>
    `;
    productList.appendChild(div);
  });
}

document.addEventListener("click",function(e){

  if(e.target.classList.contains("add-btn")){
    const product=e.target.parentElement;
    const name=product.querySelector("h3").innerText;
    const basePrice=parseInt(product.querySelector("p").innerText.replace("₹",""));
    const sizeMultiplier=parseFloat(product.querySelector(".size").value);
    const quantity=parseInt(product.querySelector(".quantity").value);

    const finalPrice=Math.round(basePrice*sizeMultiplier)*quantity;

    cart.push({name,price:finalPrice,qty:quantity});
    updateCart();
  }

  if(e.target.classList.contains("remove-btn")){
    const index=e.target.dataset.index;
    cart.splice(index,1);
    updateCart();
  }
});

function updateCart(){
  cartCount.innerText=cart.length;
  cartItems.innerHTML="";
  let subtotal=0;

  cart.forEach((item,index)=>{
    subtotal+=item.price;
    const div=document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML=`
      <span>${item.name} (x${item.qty}) - ₹${item.price}</span>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;
    cartItems.appendChild(div);
  });

  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  totalSpan.innerText=total;
  saveCart();
}

/* ================= EMAILJS FIX ================= */

document.getElementById("order-form").addEventListener("submit", function(e){
  e.preventDefault();

  if(cart.length === 0){
    alert("Cart is empty!");
    return;
  }

  const name = document.getElementById("customer-name").value;
  const phone = document.getElementById("customer-phone").value;
  const address = document.getElementById("customer-address").value;

  let orderDetails = "";
  let subtotal = 0;

  cart.forEach(item=>{
    orderDetails += `${item.name} (x${item.qty}) - ₹${item.price}\n`;
    subtotal += item.price;
  });

  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  const templateParams = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    order_details: orderDetails,
    subtotal: subtotal,
    gst: gst,
    total: total
  };

  emailjs.send("service_4615578", "template_983606", templateParams)
  .then(function(){
      alert("Order submitted successfully!");
      cart = [];
      updateCart();
      document.getElementById("order-form").reset();
  }, function(error){
      alert("Failed to send order. Check EmailJS settings.");
      console.log(error);
  });
});

/* ================= PDF FIX ================= */

document.getElementById("download-bill").onclick=function(){
  if(cart.length===0) return alert("Cart empty!");

  const invoiceNo = generateInvoiceNumber();
  const doc=new jsPDF();

  doc.setFont("helvetica","bold");   // FIXED FONT ISSUE
  doc.setFontSize(22);
  doc.text("Bina Rani Shil!", 60, 20);  // FIXED SMALL !

  doc.setFont("helvetica","normal");
  doc.setFontSize(12);
  doc.text("Invoice No: " + invoiceNo, 20, 35);
  doc.text("Date: " + new Date().toLocaleDateString(), 150, 35);

  let y=50;
  doc.line(20,45,190,45);

  let subtotal=0;

  cart.forEach(i=>{
    doc.text(`${i.name} x${i.qty}`,20,y);
    doc.text("₹"+i.price,160,y);
    subtotal+=i.price;
    y+=10;
  });

  doc.line(20,y,190,y);
  y+=10;

  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  doc.text("Subtotal: ₹"+subtotal,130,y);
  y+=10;
  doc.text("GST (18%): ₹"+gst,130,y);
  y+=10;
  doc.setFontSize(14);
  doc.text("Total: ₹"+total,130,y);

  doc.save("Bina_Rani_Shil_Invoice.pdf");
};

updateCart();
displayProducts("All");

document.querySelectorAll(".category-buttons button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    displayProducts(btn.dataset.category);
  });
});
