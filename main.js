const importPlan = document.querySelector(".uil-file-import");
const inicCont = document.querySelector(".uil-qrcode-scan");
const inventory = document.querySelector(".uil-folder-upload");

function openWindow() {
    console.log("Opening window");
    window.open('importar.html', '_blank');
}

function iniCont() {
    window.open('contagem.html', '_blank');
}

function openInvent() {
    window.open('exportar.html', '_blank');
}

document.addEventListener("keydown", (event) => {
    if (event.key === "F8") {
        openWindow();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "F2") {
        iniCont();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "F9") {
        openInvent();
    }
});

inicCont.addEventListener("click", iniCont);
importPlan.addEventListener("click", openWindow);
inventory.addEventListener("click", openInvent);

// Modify deleteAllData function to include a confirmation dialog
async function deleteAllData() {
    // Show a confirmation dialog to the user
    const userConfirmed = window.confirm('Are you sure you want to delete all data? This action cannot be undone.');

    if (userConfirmed) {
        try {
            const response = await fetch('https://192.168.242.246:3000/api/deleteAllData', {
                method: 'DELETE',
            });

            const result = await response.json();
            if (result.success) {
                console.log('All data deleted successfully');
                // Optionally, you can update the UI or perform other actions after deletion
                window.alert('All data deleted successfully!');
            } else {
                console.error('Error deleting all data:', result.message);
                window.alert('Error deleting data. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting all data:', error);
            window.alert('Error deleting data. Please try again.');
        }
    } else {
        // User clicked "Cancel" in the confirmation dialog
        console.log('Deletion canceled by user.');
    }
}

// Modify main.js to add an event listener for the delete button
document.addEventListener('DOMContentLoaded', () => {
    const deleteButton = document.querySelector('.uil-trash-alt');
    deleteButton.addEventListener('click', deleteAllData);
});