function processExcelFile() {
    const input = document.getElementById('file');
    const file = input.files[0];

    // Check if there is existing data in local storage
    const existingData = localStorage.getItem('extractedData');
    if (existingData && !confirm('Importing a new file will overwrite existing data. Continue?')) {
        // User chose not to overwrite, so return
        return;
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const excelData = e.target.result;
            saveToLocalStorage(excelData);
        };
        reader.readAsBinaryString(file);
    }

    // Close the current window
   // window.close();
}

function saveToLocalStorage(excelData) {
    try {
        const workbook = XLSX.read(excelData, { type: 'binary' });

        // Assuming the data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get all rows starting from row 10
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        range.s.r = 9; // Starting row (zero-based index)
        const newRange = XLSX.utils.encode_range(range);
        worksheet['!ref'] = newRange;

        const importedData = XLSX.utils.sheet_to_json(worksheet, {
            range: 0, // Use 0-based column indices
            header: ['codigo', 'produto', 'atual', 'codigo_de_barras', 'codigo_de_barras_sec'],
        });

        console.log('Imported Data:', importedData);

        // Clear existing data in local storage
        localStorage.removeItem('extractedData');

        // Save imported data to local storage
        localStorage.setItem('extractedData', JSON.stringify(importedData));

        // Open a new window/tab with 'displayData.html'
        window.open('displayData.html', '_blank');
    } catch (error) {
        console.error('Error processing Excel file:', error);
    }
}

const planCancel = document.querySelector(".plan-cancel");

planCancel.addEventListener("click", () =>{
    window.close();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        window.close();
    }
});