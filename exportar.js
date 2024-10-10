// Fetch data from the server
async function fetchData() {
    try {
        // Fetch product and inventory data concurrently
        const [productsResponse, inventoryResponse] = await Promise.all([
            fetch('https://192.168.242.246:3000/api/products'),
            fetch('https://192.168.242.246:3000/api/inventory') // Update the endpoint
        ]);

        const products = await productsResponse.json();
        const inventoryItems = await inventoryResponse.json();

        // Process data and create HTML table
        const mergedData = mergeData(products, inventoryItems);
        createHtmlTable(mergedData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function mergeData(products, inventoryItems) {
    const mergedData = [];

    products.forEach(product => {
        const inventoryItem = inventoryItems.find(item => item.codigo === product.codigo);
        const totalQuantityCounted = inventoryItem ? inventoryItem.totalQuantityCounted : 0;
        const dataHora = inventoryItem ? inventoryItem.data_hora : currentDate;

        const existingItemIndex = mergedData.findIndex(item => item.codigo === product.codigo);

        if (existingItemIndex !== -1) {
            // If an item with the same codigo already exists, update it
            mergedData[existingItemIndex] = {
                ...mergedData[existingItemIndex],
                atual: product.atual,
                quantidade_contada: mergedData[existingItemIndex].quantidade_contada,
                data_hora: dataHora,
            };
        } else {
            // If no item with the same codigo exists, add a new entry
            mergedData.push({
                ...product,
                quantidade_contada: totalQuantityCounted,
                difference: totalQuantityCounted - product.atual,
                data_hora: dataHora,
            });
        }
    });

    return mergedData;
}

// Function to add a checkbox to the header with the specified text content
function addCheckboxToHeader(headerText, checkboxLabel) {
    const headers = document.querySelectorAll('th');
    for (const header of headers) {
        if (header.textContent.trim() === headerText) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'selectAllCheckbox';
            const label = document.createElement('label');
            label.textContent = checkboxLabel;
            label.htmlFor = 'selectAllCheckbox';
            header.innerHTML = ''; // Clear existing content
            header.appendChild(checkbox);
            header.appendChild(label);

            // Add event listener to handle checkbox state
            checkbox.addEventListener('change', function () {
                const allCheckboxes = document.querySelectorAll('td input[type="checkbox"]');
                allCheckboxes.forEach(cb => {
                    cb.checked = this.checked;
                });
            });

            break;
        }
    }
}

// Create HTML table
function createHtmlTable(data) {
    const tableContainer = document.getElementById('table-container');

    const table = document.createElement('table');
    table.classList.add('data-table');

    // Create table header
    const headerRow = document.createElement('tr');
    ['Select', 'Codigo', 'Codigo de Barras', 'Produto', 'Sistema', 'Quantidade Contada', 'Diferença'].forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    table.appendChild(headerRow);

    // Filtered data excluding items where both "Atual" and "Quantidade Contada" are 0
    const filteredData = data.filter(item => item.atual !== 0 || (item.atual === 0 && item.quantidade_contada === 0));
    // Filtered data excluding items where "Diferença" is 0
    const filteredDataWithDifference = filteredData.filter(item => item.difference !== 0);

    // Create table rows
    filteredDataWithDifference.forEach(item => {
        const row = document.createElement('tr');

        // Create a checkbox cell
        const checkboxCell = document.createElement('td');
        checkboxCell.classList.add('checkBoxCell');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // Add event listener to handle checkbox state
        checkbox.addEventListener('change', function () {
            // You can add your logic here to handle the checkbox state
            if (this.checked) {
                console.log(`Item with Codigo ${item.codigo} selected.`);
                console.log(`Item with Codigo ${item.data_hora} selected.`);
            } else {
                console.log(`Item with Codigo ${item.codigo} deselected.`);
            }
        });

        ['codigo', 'codigo_de_barras', 'produto', 'atual', 'quantidade_contada', 'difference'].forEach(key => {
            const cell = document.createElement('td');

            if (key === 'difference') {
                // Check if "Quantidade Contada" is 0 and display a negative number
                const differenceValue = item.quantidade_contada === 0 ? (item.atual * -1) : item[key];
                cell.textContent = differenceValue;

                // Add a class based on whether the difference is negative or non-negative
                cell.classList.add(differenceValue < 0 ? 'negative-difference' : 'non-negative-difference');
            } else {
                cell.textContent = item[key];
            }

            row.appendChild(cell);
        });
        table.appendChild(row);
    });

    // Append the table to the container
    tableContainer.appendChild(table);
    addCheckboxToHeader('Select', '   ');
}

// Call fetchData when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// Get the current date and time in the format expected by datetime-local input
const currentDate = new Date();

// Function to export data to a text file for selected rows
async function exportDataToTextFile() {
    // Get all rows in the table (excluding the header row)
    const rows = document.querySelectorAll('.data-table tr:not(:first-child)');

    // Create arrays to store the exported data and excluded data
    const exportedData = [];
    const excludedData = [];

    // Iterate over each row and gather the relevant data
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        const checkbox = cells[0].querySelector('input[type="checkbox"]');
        const codigo = cells[1].textContent.trim();
        const codigoDeBarras = cells[2].textContent.trim();
        let quantidadeContada = cells[5].textContent.trim(); // Assuming quantidade_contada is in the 5th column
        const dateTimeInputValue = document.getElementById('dateTimeInput').value;
        const timeInputValue = document.getElementById('timeInput').value;

        // Pad quantidadeContada to 6 digits and insert 6 zeros after the value
        quantidadeContada = quantidadeContada.padStart(6, '0') + '000000';

        // Extract day, month, year, and time components
        const [year, month, day] = dateTimeInputValue.split('-');
        const [hour, minute] = timeInputValue.split(':');

        // Format the date and time values
        const formattedDateTime = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.slice(-2)}${hour}:${minute}:00`;

        // Check if the checkbox is checked for the current row
        if (checkbox.checked) {
            // Check if codigoDeBarras is empty (no codigo_de_barras)
            if (codigoDeBarras) {
                // Create a string in the desired format and add it to the exported data array
                const exportString = `${codigoDeBarras} ${quantidadeContada} ${formattedDateTime}`;
                exportedData.push(exportString);
            } else {
                // Add the codigo, codigoDeBarras, and quantidadeContada to the excluded data array
                const exportExclud = `${codigo} ${quantidadeContada}`;
                excludedData.push(exportExclud);
            }
        }
    }

    // Convert the arrays to strings with line breaks
    const exportedFileContent = exportedData.join('\n');
    const excludedFileContent = excludedData.join('\n');

    // Create Blobs (Binary Large Objects) from the content
    const exportedBlob = new Blob([exportedFileContent], { type: 'text/plain' });
    const excludedBlob = new Blob([excludedFileContent], { type: 'text/plain' });

    // Create link elements for both exported and excluded files
    const exportedLink = document.createElement('a');
    const excludedLink = document.createElement('a');

    // Set the links' href attributes to the Blob URLs
    exportedLink.href = URL.createObjectURL(exportedBlob);
    excludedLink.href = URL.createObjectURL(excludedBlob);

    // Set the links' download attributes with the desired file names
    exportedLink.download = 'inventario.txt';
    excludedLink.download = 'produtosSemCodBarras.txt';

    // Append the links to the document
    document.body.appendChild(exportedLink);
    document.body.appendChild(excludedLink);

    // Programmatically trigger click events on the links to start the downloads
    exportedLink.click();
    excludedLink.click();

    // Remove the links from the document
    document.body.removeChild(exportedLink);
    document.body.removeChild(excludedLink);
}