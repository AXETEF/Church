// Основные переменные
const productList = document.getElementById("product-list");
const orderList = document.getElementById("order-list");
const shiftButton = document.getElementById("shift-button");
const menuScreen = document.getElementById("menu-screen");
const checksScreen = document.getElementById("checks-screen");
const mainScreen = document.getElementById("main-screen");

let products = [];
let orders = [];
let isShiftOpen = false;
let checks = [];
let removedOrders = []; // Хранение проданных товаров

// Загрузка данных из localStorage при загрузке страницы
window.addEventListener('load', () => {
  loadDataFromLocalStorage();
  updateProductList();
  updateChecksTable();
});

// Добавление нового товара
document.getElementById("add-product").addEventListener("click", () => {
  const name = prompt("Введите название товара:");
  const price = parseFloat(prompt("Введите цену товара:"));
  if (name && !isNaN(price)) {
    products.push({ name, price, count: 0 });
    updateProductList();
    saveDataToLocalStorage(); // Сохраняем данные в localStorage
  } else {
    alert("Неверно введены данные.");
  }
});

// Обновление списка товаров
function updateProductList() {
  productList.innerHTML = "";
  products.forEach((product, index) => {
    const productItem = document.createElement("div");
    productItem.classList.add("product-item");

    // Название и цена товара
    const productInfo = document.createElement("span");
    productInfo.textContent = `${product.name} - ${product.price} руб.`;
    productItem.appendChild(productInfo);

    // Кнопка "Изменить"
    const editButton = document.createElement("button");
    editButton.textContent = "Изменить";
    editButton.addEventListener("click", () => {
      editProduct(index);
    });
    productItem.appendChild(editButton);

    // Добавляем обработчик нажатия на товар
    productItem.addEventListener("click", () => {
      addProductToOrder(product); // Добавление товара в заказ
      updateOrderList(); // Обновляем список заказов
      saveDataToLocalStorage(); // Сохраняем данные в localStorage
    });

    productList.appendChild(productItem);
  });
}

// Редактирование товара
function editProduct(index) {
  const product = products[index];

  const newName = prompt("Введите новое название товара:", product.name);
  const newPrice = parseFloat(prompt("Введите новую цену товара:", product.price));

  if (newName && !isNaN(newPrice)) {
    products[index] = { name: newName, price: newPrice, count: 0 };
    updateProductList();
    saveDataToLocalStorage(); // Сохраняем данные в localStorage
  } else {
    alert("Неверно введены данные.");
  }
}

// Добавление товара в заказ
function addProductToOrder(product) {
  orders.push({
    name: product.name,
    price: product.price
  });
}

// Обновление списка заказов
function updateOrderList() {
  orderList.innerHTML = "";
  orders.forEach((order, index) => {
    const item = document.createElement("div");
    item.textContent = order.name; // Только название товара
    item.className = "order-item";
    item.addEventListener("click", () => {
      // Добавляем товар в чек при клике на товар в правом столбце
      addOrderToCheck(order); // Добавление товара в чек
      removedOrders.push(order); // Сохраняем проданный товар в массив
      orders.splice(index, 1); // Удаляем товар из текущего списка заказов
      updateOrderList(); // Обновляем список заказов
      saveDataToLocalStorage(); // Сохраняем данные в localStorage
    });
    orderList.appendChild(item);
  });
  updateTotalPrice();
}

// Обновление итоговой суммы
function updateTotalPrice() {
  const totalPriceElement = document.getElementById("totalPrice");
  const total = orders.reduce((sum, order) => sum + order.price, 0);
  totalPriceElement.textContent = `Итоговая сумма: ${total} руб.`;
}

// Открытие/закрытие смены
shiftButton.addEventListener("click", () => {
  isShiftOpen = !isShiftOpen;
  if (isShiftOpen) {
    shiftButton.textContent = "Закрыть смену";
    shiftButton.className = "shift-close";
    startShift();
  } else {
    shiftButton.textContent = "Открыть смену";
    shiftButton.className = "shift-open";
    endShift();
  }
});

// Начало смены
function startShift() {
  console.log("Смена открыта!");
}

// Завершение смены
function endShift() {
  console.log("Смена закрыта!");
  const totalSoldSum = removedOrders.reduce((sum, order) => sum + order.price, 0); // Сумма проданных товаров
  checks.push({
    date: new Date().toLocaleDateString(),
    orders: orders.slice(),
    total: totalSoldSum, // Сумма только проданных товаров
    removedOrders: removedOrders.slice() // Сохраняем проданные товары в чеке
  });
  saveCheckToFile(checks[checks.length - 1]); // Сохранение чека в файл
  updateChecksTable();
  orders = [];
  removedOrders = []; // Очищаем список проданных товаров
  updateOrderList();
  saveDataToLocalStorage(); // Сохраняем данные в localStorage
}

// Добавление заказа в чек
function addOrderToCheck(order) {
  const existingCheck = checks.find(check => check.date === new Date().toLocaleDateString());
  if (existingCheck) {
    existingCheck.orders.push(order);
  } else {
    checks.push({
      date: new Date().toLocaleDateString(),
      orders: [order],
      total: order.price,
      removedOrders: [] // Изначально нет проданных товаров
    });
  }
  updateChecksTable();
}

// Обновление таблицы чеков
function updateChecksTable() {
  const table = document.getElementById("checks-table").querySelector("tbody");
  table.innerHTML = "";
  checks.forEach((check) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${check.date}</td>
      <td>${check.orders.map((o) => `${o.name}`).join(", ")}</td>
      <td>${check.total} руб.</td>
    `;
    table.appendChild(row);
  });
}

// Функция для сохранения чека в файл
function saveCheckToFile(check) {
  const date = new Date().toISOString().slice(0, 10); // Получаем текущую дату в формате YYYY-MM-DD
  const fileName = `Смена_${date}.txt`; // Формируем имя файла
  const productMap = {}; // Используем объект для группировки товаров по имени

  // Группируем товары и считаем их количество
  check.orders.forEach(order => {
    if (productMap[order.name]) {
      productMap[order.name].count += 1;
    } else {
      productMap[order.name] = {
        count: 1,
      };
    }
  });

  // Создаем строку с деталями о товарах
  const productDetails = Object.keys(productMap)
    .map(name => `${name} - ${productMap[name].count} шт.`)
    .join("\n"); // Объединяем строки

  // Добавляем информацию о проданных товарах (удаленные товары)
  const removedDetails = check.removedOrders
    .map(order => `${order.name} - 1 шт.`)
    .join("\n");

  // Формируем содержимое файла
  const fileContent = `Дата: ${check.date}\nТовары:\n${productDetails}\nПроданные товары:\n${removedDetails}\nИтоговая сумма: ${check.total} руб.`;

  // Создаем и скачиваем файл
  const blob = new Blob([fileContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}

// Сохранение данных в localStorage
function saveDataToLocalStorage() {
  const data = {
    products: products,
    checks: checks,
  };
  localStorage.setItem("storeData", JSON.stringify(data));
}

// Загрузка данных из localStorage
function loadDataFromLocalStorage() {
  const data = localStorage.getItem("storeData");
  if (data) {
    const parsedData = JSON.parse(data);
    products = parsedData.products || [];
    checks = parsedData.checks || [];
  }
}
