let invoiceTableBody = document.querySelector('#invoiceTable tbody');
let subtotalEl = document.getElementById('subtotal');
let totalTaxEl = document.getElementById('totalTax');
let grandTotalEl = document.getElementById('grandTotal');

document.getElementById('addItemBtn').addEventListener('click', addItem);
document.getElementById('exportPDF').addEventListener('click', exportPDF);
document.getElementById('exportCSV').addEventListener('click', exportCSV);
document.getElementById('resetInvoice').addEventListener('click', resetInvoice);

function addItem() {
    let row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="Item Description"></td>
        <td><input type="number" min="1" value="1" class="qty"></td>
        <td><input type="number" min="0" value="0" class="price"></td>
        <td><input type="number" min="0" value="0" class="tax"></td>
        <td class="total">$0.00</td>
        <td><button class="delete-btn">Delete</button></td>
    `;
    invoiceTableBody.appendChild(row);

    // Add event listeners
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateTotals);
    });
    row.querySelector('.delete-btn').addEventListener('click', () => {
        row.remove();
        calculateTotals();
    });
}

function calculateTotals() {
    let subtotal = 0;
    let totalTax = 0;
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        let qty = parseFloat(row.querySelector('.qty').value) || 0;
        let price = parseFloat(row.querySelector('.price').value) || 0;
        let tax = parseFloat(row.querySelector('.tax').value) || 0;

        let total = qty * price;
        let taxAmount = total * (tax / 100);
        row.querySelector('.total').textContent = `$${(total + taxAmount).toFixed(2)}`;

        subtotal += total;
        totalTax += taxAmount;
    });
    subtotalEl.textContent = subtotal.toFixed(2);
    totalTaxEl.textContent = totalTax.toFixed(2);
    grandTotalEl.textContent = (subtotal + totalTax).toFixed(2);
}

// Export CSV
function exportCSV() {
    let csvContent = "Item Description,Quantity,Price,Tax %,Total\n";
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        let desc = row.querySelector('td:nth-child(1) input').value;
        let qty = row.querySelector('.qty').value;
        let price = row.querySelector('.price').value;
        let tax = row.querySelector('.tax').value;
        let total = row.querySelector('.total').textContent.replace('$', '');
        csvContent += `${desc},${qty},${price},${tax},${total}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Export PDF using jsPDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice", 14, 22);
    let y = 30;
    doc.setFontSize(12);
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        let desc = row.querySelector('td:nth-child(1) input').value;
        let qty = row.querySelector('.qty').value;
        let price = row.querySelector('.price').value;
        let tax = row.querySelector('.tax').value;
        let total = row.querySelector('.total').textContent;
        doc.text(`${desc} | Qty: ${qty} | Price: $${price} | Tax: ${tax}% | Total: ${total}`, 14, y);
        y += 8;
    });
    doc.text(`Subtotal: $${subtotalEl.textContent}`, 14, y + 4);
    doc.text(`Total Tax: $${totalTaxEl.textContent}`, 14, y + 12);
    doc.text(`Grand Total: $${grandTotalEl.textContent}`, 14, y + 20);
    doc.save('invoice.pdf');
}

// Reset Invoice
function resetInvoice() {
    if (confirm("Are you sure you want to reset the invoice?")) {
        invoiceTableBody.innerHTML = '';
        calculateTotals();
    }
}

document.getElementById('printInvoice').addEventListener('click', printInvoice);
document.getElementById('importCSV').addEventListener('change', importCSV);

function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); // skip header

        rows.forEach(row => {
            if (row.trim() === '') return; // skip empty lines
            const cols = row.split(',');

            let desc = cols[0]?.trim() || '';
            let qty = parseFloat(cols[1]) || 0;
            let price = parseFloat(cols[2]) || 0;
            let tax = parseFloat(cols[3]) || 0;

            // Add row to table
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${desc}"></td>
                <td><input type="number" min="1" value="${qty}" class="qty"></td>
                <td><input type="number" min="0" value="${price}" class="price"></td>
                <td><input type="number" min="0" value="${tax}" class="tax"></td>
                <td class="total">$0.00</td>
                <td><button class="delete-btn">Delete</button></td>
            `;
            invoiceTableBody.appendChild(tr);

            // Add event listeners
            tr.querySelectorAll('input').forEach(input => input.addEventListener('input', calculateTotals));
            tr.querySelector('.delete-btn').addEventListener('click', () => {
                tr.remove();
                calculateTotals();
            });
        });

        calculateTotals();
    };
    reader.readAsText(file);
}


function printInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 40;

    // Header
    doc.setFontSize(18);
    doc.text("INVOICE", 220, y);
    y += 30;

    doc.setFontSize(12);
    doc.text(`Invoice Number: ${document.getElementById('invoiceNumber').value}`, 40, y);
    doc.text(`Date: ${document.getElementById('invoiceDate').value}`, 400, y);
    y += 20;

    doc.text(`Bill To: ${document.getElementById('billTo').value}`, 40, y);
    doc.text(`Bill From: ${document.getElementById('billFrom').value}`, 400, y);
    y += 30;

    // Table header
    doc.setFontSize(12);
    doc.text("Item Description", 40, y);
    doc.text("Qty", 240, y);
    doc.text("Price", 300, y);
    doc.text("Tax %", 380, y);
    doc.text("Total", 450, y);
    y += 10;
    doc.line(40, y, 550, y); // horizontal line
    y += 10;

    // Table rows
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        let desc = row.querySelector('td:nth-child(1) input').value;
        let qty = row.querySelector('.qty').value;
        let price = row.querySelector('.price').value;
        let tax = row.querySelector('.tax').value;
        let total = row.querySelector('.total').textContent.replace('$', '');

        doc.text(desc, 40, y);
        doc.text(qty.toString(), 240, y);
        doc.text(`$${price}`, 300, y);
        doc.text(`${tax}%`, 380, y);
        doc.text(`$${total}`, 450, y);
        y += 20;

        // Add page if necessary
        if (y > 750) {
            doc.addPage();
            y = 40;
        }
    });

    y += 10;
    doc.line(40, y, 550, y);
    y += 20;

    // Summary
    doc.text(`Subtotal: $${subtotalEl.textContent}`, 400, y);
    y += 20;
    doc.text(`Total Tax: $${totalTaxEl.textContent}`, 400, y);
    y += 20;
    doc.text(`Grand Total: $${grandTotalEl.textContent}`, 400, y);
    y += 40;

    doc.text("Thank you for your business!", 180, y);

    // Save PDF
    doc.save(`Invoice_${document.getElementById('invoiceNumber').value || '000'}.pdf`);
}
