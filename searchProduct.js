async function displayAllProducts(products) {
    try {
        const productList = document.getElementById('productList');
        productList.innerHTML = ''; // Clear previous content

        if (!products || products.length === 0) {
            productList.textContent = 'No products found.';
            return;
        }

        products.forEach((item) => {
            const row = document.createElement('tr');

            // Use a loop for common attributes
            ['codigo_de_barras', 'codigo_de_barras_sec', 'codigo', 'produto', 'atual'].forEach((attribute) => {
                const cell = document.createElement('td');
                cell.textContent = item[attribute] || '';
                row.appendChild(cell);
            });

            row.addEventListener('click', () => {
                // Check if codigo_de_barras is null
                const selectedProduct = {
                    codigo: item.codigo,
                };
            
                // Include codigo_de_barras if it is not null
                if (item.codigo_de_barras !== null) {
                    selectedProduct.codigo_de_barras = item.codigo_de_barras;
                }
            
                // Close the search page
                window.close();
            
                // Access the opener window (contagem page) and pass the selected product
                if (window.opener) {
                    window.opener.handleSelectedProduct(selectedProduct);
                }
            })
            productList.appendChild(row);
        }); 
    } catch (error) {
        console.error('Error displaying products:', error);
    }
}

async function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();

    console.log('Search query:', query);

    try {
        const response = await fetch('https://192.168.242.246:3000/api/products');
        const data = await response.json();

        console.log('Fetched data for search:', data);

        if (!data || data.length === 0) {
            // If there are no results or an empty array is returned, display all products
            displayAllProducts([]);
            return;
        }

        let filteredProducts;

        if (query === '') {
            // If the search query is empty, display all products
            filteredProducts = data;
        } else {
            // Otherwise, filter the products based on the search query
            filteredProducts = data.filter((product) =>
                Object.values(product).some(
                    (value) => typeof value === 'string' && value.toLowerCase().includes(query)
                )
            );
        }

        console.log('Filtered products:', filteredProducts);

        // Update the HTML table with the filtered products
        displayAllProducts(filteredProducts);
    } catch (error) {
        console.error('Error searching for products:', error);
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        // Prevent the default behavior (form submission, page reload, etc.)
        event.preventDefault();

        // Call the searchProduct function when Enter key is pressed
        searchProducts();
    }
}

const btnCancel = document.querySelector(".cancelBtn");

btnCancel.addEventListener("click", () =>{
    window.close();
});

document.addEventListener('DOMContentLoaded', function () {
    displayAllProducts();
    searchProducts();
    searchInput.focus();

    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', searchProducts);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        window.close();
    }
});