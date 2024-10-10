let currentProduct = null; // Initialize currentProduct to null

function resetValues() {
    const productDescriptionDiv = document.getElementById('productDescription');
    const productConfElement = document.getElementById('productConf');
    const productDifElement = document.getElementById('productDif');

    productDescriptionDiv.textContent = '';
    productConfElement.textContent = 'Conferido: 0.00';
    productDifElement.textContent = 'Diferença: 0.00';

    currentProduct = null;
}

async function searchProduct() {
    const productCodeInput = document.getElementById('productCode');
    const productCode = productCodeInput.value;

    // Reset values to their initial state
    resetValues();

    // Check if the response is empty or not valid JSON
    if (!productCode.trim()) {
        console.error('Empty or invalid JSON response');
        return;
    }

    try {
        const response = await fetch(`https://192.168.242.246:3000/api/searchProduct?code=${productCode}`);
        const responseBody = await response.text();

        const product = JSON.parse(responseBody);

        // Display the product description
        const productDescriptionDiv = document.getElementById('productDescription');
        const productQuantitySistem = document.getElementById('productQuantity');

        if (product) {
            productDescriptionDiv.textContent = `${product.produto}`;
            productQuantitySistem.textContent = `Sistema: ${product.atual}`;
            currentProduct = product;

            // Fetch and display the total quantity counted
            await fetchTotalQuantityCounted(currentProduct.codigo);
        } else {
            productDescriptionDiv.textContent = 'Product not found.';
            productQuantitySistem.textContent = '0';
        }
    } catch (error) {
        console.error('Error searching for product:', error);
    }
}

async function registerInventory() {
    try {
        const quantidadeInput = document.getElementById('inventarioQtd');
        const quantidadeContada = parseInt(quantidadeInput.value);
        const productDescriptionDiv = document.getElementById('productDescription');
        const productConfElement = document.getElementById('productConf');
        const productDifElement = document.getElementById('productDif');
        const productQuantitySistem = document.getElementById('productQuantity');
        const productCodeInput = document.getElementById('productCode');

        // Check if currentProduct has the required information
        if (!currentProduct || !currentProduct.codigo || !currentProduct.produto) {
            displayError('Invalid product information for inventory registration.');
            return;
        }

        // Check if quantidadeContada is a valid positive number
        if (!isNaN(quantidadeContada) && quantidadeContada > 0) {
            const response = await fetch('https://192.168.242.246:3000/api/registerInventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    codigo: currentProduct.codigo,
                    codigo_de_barras: currentProduct.codigo_de_barras || null,
                    produto: currentProduct.produto,
                    quantidade_contada: quantidadeContada,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(result);

                updateInventoryDisplay(
                    quantidadeContada,
                    currentProduct.codigo_de_barras,
                    currentProduct.produto,
                    currentProduct.codigo
                );

                // Clear the input field after registering
                quantidadeInput.value = '';
                productDescriptionDiv.textContent = '';
                productQuantitySistem.textContent = 'Sistema: 0';
                productConfElement.textContent = 'Conferido: 0';
                productDifElement.textContent = 'Diferença: 0';
                productCodeInput.value = '';
        
                // Focus on the "productCode" input after registering inventory
                productCodeInput.focus();

                // Clear any previous error messages
                clearError();
            } else {
                const errorMessage = `Error registering inventory: ${response.statusText}`;
                console.error(errorMessage);
            }
        } else {
            const errorMessage = 'Invalid quantity entered.';
            console.error(errorMessage);
        }
    } catch (error) {
        const errorMessage = `Error registering inventory: ${error.message}`;
        console.error(errorMessage);
    }
}

function updateInventoryDisplay(quantidade_contada, codigo_de_barras, produto, data_hora, codigo) {
    const inventoryQtdeBody = document.querySelector('.inventory-qtde-body');

    const inventoryQtde = document.createElement('li');
    inventoryQtde.classList.add('inventory-qtde');
    inventoryQtde.textContent = quantidade_contada;

    inventoryQtde.addEventListener('click', () => handleQuantityEdit(inventoryQtde, quantidade_contada, data_hora, codigo));

    inventoryQtdeBody.insertBefore(inventoryQtde, inventoryQtdeBody.firstChild);

    const inventoryBarrasBody = document.querySelector('.inventory-barras-body');
    const inventoryBarras = document.createElement('li');
    inventoryBarras.classList.add('inventory-barras');
    inventoryBarras.textContent = codigo_de_barras;

    inventoryBarrasBody.insertBefore(inventoryBarras, inventoryBarrasBody.firstChild);

    const inventoryDescBody = document.querySelector('.inventory-desc-body');
    const inventoryDesc = document.createElement('li');
    inventoryDesc.classList.add('inventory-desc');
    inventoryDesc.textContent = produto;

    inventoryDescBody.insertBefore(inventoryDesc, inventoryDescBody.firstChild);

    const inventoryConfBody = document.querySelector('.inventory-conf-body');
    const inventoryConf = document.createElement('li');
    inventoryConf.classList.add('inventory-conf');
    inventoryConf.textContent = data_hora;

    inventoryConfBody.insertBefore(inventoryConf, inventoryConfBody.firstChild);

    const inventoryRemovBody = document.querySelector('.inventory-remov-body');
    const inventoryRemov = document.createElement('li');
    inventoryRemov.classList.add('inventory-remov');

        // Create a button for removing the item
        const removeButton = document.createElement('i');
        removeButton.classList.add("uil", "uil-trash-alt")
        // Update the removeButton event listener in updateInventoryDisplay function
        removeButton.addEventListener('click', async () => {
            try {
                const response = await fetch(`https://192.168.242.246:3000/api/removeInventoryItem/${codigo}/${data_hora}`, {
                    method: 'DELETE',
                });
        
                if (response.ok) {
                    // Remove the item from the UI
                    inventoryQtde.remove();
                    inventoryBarras.remove();
                    inventoryDesc.remove();
                    inventoryConf.remove();
                    inventoryRemov.remove();
        
                    // Optionally, you can also update the currentProduct or fetch new data if needed
                    currentProduct = null;
                    // fetchNewData();
                } else {
                    console.error('Error removing inventory item:', response.statusText);
                }
            } catch (error) {
                console.error('Error removing inventory item:', error);
            }
        });

    
        inventoryRemov.appendChild(removeButton);

        inventoryRemovBody.insertBefore(inventoryRemov, inventoryRemovBody.firstChild);

    // Update currentProduct after registering
    currentProduct = {
        quantidade_contada,
        codigo_de_barras: codigo_de_barras || '',
        produto: produto || '',
        codigo: codigo || '',
    };

    const inventoryBdy = document.querySelector('.inventoryContainer');
    inventoryBdy.appendChild(inventoryQtdeBody);
    inventoryBdy.appendChild(inventoryBarrasBody);
    inventoryBdy.appendChild(inventoryDescBody);
    inventoryBdy.appendChild(inventoryConfBody);
    inventoryBdy.appendChild(inventoryRemovBody);

    // Fetch and display the total quantity counted
    fetchTotalQuantityCounted(codigo);
    currentProduct = null;
}

function handleQuantityEdit(inventoryQtdeElement, currentQuantity, data_hora, codigo) {
    // Save the original content of inventoryQtdeElement
    const originalContent = inventoryQtdeElement.textContent;

    // Create an input field for editing
    const inputField = document.createElement('input');
    inputField.classList.add('quantEdit');
    inputField.type = 'text';
    inputField.value = currentQuantity;

    const updateQuantity = async () => {
        const newQuantity = parseInt(inputField.value);

        // Check if the new quantity is a valid positive number
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            try {
                // Send a request to update the quantity in the database
                const response = await fetch(`https://192.168.242.246:3000/api/updateInventoryQuantity/${codigo}/${data_hora}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ quantidade_contada: newQuantity }),
                });

                if (response.ok) {
                    // Update the quantity in the UI
                    inventoryQtdeElement.textContent = newQuantity;

                } else {
                    console.error('Error updating inventory quantity:', response.statusText);
                }
            } catch (error) {
                console.error('Error updating inventory quantity:', error);
            }

            // Remove the input field and button
            inputField.remove();
        } else {
            console.error('Invalid quantity entered.');
        }
    };

    // Handle "Enter" key press
    inputField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            updateQuantity();
        } else if (event.key === 'Escape') {
            // Remove the input field without updating the quantity
            inventoryQtdeElement.textContent = originalContent;
            inputField.remove();
        }
    });

    // Replace the quantity element with the input field and button
    inventoryQtdeElement.innerHTML = '';
    inventoryQtdeElement.appendChild(inputField);

    // Focus on the input field for better user experience
    inputField.focus();
}

function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString(); // Adjust the format as needed
}

// Add this function to fetch inventory compaction data
async function fetchInventoryCompactionData() {
    try {
        const response = await fetch('https://192.168.242.246:3000/api/inventoryCompaction');
        const inventoryCompactionData = await response.json();

        // Update your inventory display with the fetched data
        inventoryCompactionData.forEach(item => {
            updateInventoryDisplay(item.quantidade_contada, item.codigo_de_barras, item.produto, item.data_hora, item.codigo);
        });
    } catch (error) {
        console.error('Error fetching inventory compaction data:', error);
    }
}

// Call this function when your page loads or whenever you need to update the inventory display
fetchInventoryCompactionData();

// Add this function to fetch the total quantity counted for a specific product
async function fetchTotalQuantityCounted(codigo) {
    try {
        console.log('Sending request with codigo:', codigo);

        const response = await fetch(`https://192.168.242.246:3000/api/totalQuantityCounted/${codigo}`);
        const result = await response.json();

        console.log('Server Response:', result);

        if (result && result.totalQuantityCounted !== null && !isNaN(result.totalQuantityCounted) && typeof result.totalQuantityCounted === 'number') {
            // Calculate the difference
            const currentProductAtual = parseFloat(currentProduct.atual || 0);
            const totalQuantityCounted = parseFloat(result.totalQuantityCounted || 0);

            const difference = totalQuantityCounted - currentProductAtual;

            // Update the currentProduct with the fetched total quantity counted and the difference
            currentProduct.totalQuantityCounted = totalQuantityCounted;
            currentProduct.difference = difference;

            // Update the productConf element
            const productConfElement = document.getElementById('productConf');
            productConfElement.textContent = `Conferido: ${totalQuantityCounted || 0}`;

            // Update the productDifElement
            const productDifElement = document.getElementById('productDif');
            productDifElement.textContent = `Diferença: ${difference}`;
            productDifElement.style.color = difference < 0 ? 'red' : 'blue'; // Set the text color
        } else if (result.totalQuantityCounted === null) {
            // Handle the case where totalQuantityCounted is null
            const currentProductAtual = parseFloat(currentProduct.atual || 0);
            const difference = -currentProductAtual;

            // Update the currentProduct with the difference
            currentProduct.totalQuantityCounted = null;
            currentProduct.difference = difference;

            // Update the productConf element
            const productConfElement = document.getElementById('productConf');
            productConfElement.textContent = 'Conferido: 0'; // You may customize the display as needed

            // Update the productDifElement
            const productDifElement = document.getElementById('productDif');
            productDifElement.textContent = `Diferença: ${difference}`;
            productDifElement.style.color = 'red'; // Set the text color
        } else {
            console.error('Invalid total quantity counted:', result);
        }
    } catch (error) {
        console.error('Error fetching total quantity counted:', error);
    }
}

function openSearchPage() {
    window.open('searchProduct.html', '_blank');
}

function openScanPage() {
    window.open('scan.html', '_blank');
}

document.addEventListener("keydown", (event) => {
    if (event.key === "F2") {
        openSearchPage();
    }
});

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        // Prevent the default behavior (form submission, page reload, etc.)
        event.preventDefault();

        // Call the searchProduct function when Enter key is pressed
        searchProduct();

        // Focus on the "inventarioQtd" input after searching for the product
        const quantidadeInput = document.getElementById('inventarioQtd');
        quantidadeInput.focus();
    }
}

function quantEnterKey(event) {
    if (event.key === 'Enter') {
        // Prevent the default behavior (form submission, page reload, etc.)
        event.preventDefault();

        // Call the searchProduct function when Enter key is pressed
        registerInventory();
        
        // Reset both inputs
        const productCodeInput = document.getElementById('productCode');
        const quantidadeInput = document.getElementById('inventarioQtd');
        
        productCodeInput.value = '';
        quantidadeInput.value = '';

        // Focus on the "productCode" input after registering inventory
        productCodeInput.focus();
    }
}

// Function to simulate "Enter" key press
function simulateEnterKeyPress(element) {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    element.dispatchEvent(event);
}

function handleSelectedProduct(selectedProduct) {
    // Update the contagem page with the selected product information
    const productCodeInput = document.getElementById('productCode');

    // Set the selected product information in the contagem page
    productCodeInput.value = selectedProduct.codigo_de_barras || selectedProduct.codigo || '';

    // Fetch and display information related to the selected product (if needed)
    searchProduct();

    // Focus on input
    const quantidadeInput = document.getElementById('inventarioQtd');
    quantidadeInput.focus();
}

// Previous page logic
function handleSelectedBarcode(barcode) {
    // Update the product code input field with the scanned barcode
    const productCodeInput = document.getElementById('productCode');
    productCodeInput.value = barcode;

    // Trigger the search for the product based on the scanned barcode
    searchProduct();
}

document.addEventListener('DOMContentLoaded', function () {
    const productCodeInput = document.getElementById('productCode');
    productCodeInput.focus();
});

const searchIcon = document.querySelector(".searchIcon");

searchIcon.addEventListener("click", function(){
    event.preventDefault();

    // Call the searchProduct function when Enter key is pressed
    event.preventDefault();

    // Call the searchProduct function when Enter key is pressed
    searchProduct();

    // Focus on the "inventarioQtd" input after searching for the product
    const quantidadeInput = document.getElementById('inventarioQtd');
    quantidadeInput.focus();
})