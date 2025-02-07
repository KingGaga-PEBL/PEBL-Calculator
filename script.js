// Format a number with comma separators and 2 decimal places.
function formatNumber(num) {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Calculate loan details on form submission.
document.getElementById('loanForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Sum up the principal from each product row.
  const productRows = document.querySelectorAll('.product-row');
  let principal = 0;
  productRows.forEach(row => {
    const cost = parseFloat(row.querySelector('.costPrice').value) || 0;
    const quantity = parseInt(row.querySelector('.quantity').value) || 0;
    principal += cost * quantity;
  });

  const loanType = document.getElementById('loanType').value;

  // Define interest rates per month based on loan type.
  const interestRates = {
    short: [1.5, 1.5, 1.5],
    medium: [1.5, 1.5, 1.5, 2.0, 2.0, 2.0],
    long: [1.5, 1.5, 1.5, ...Array(9).fill(2.0)]
  };

  let rates = interestRates[loanType];
  let total = principal;

  // Create a breakdown of the loan with compounded interest each month.
  let breakdown = rates.map((rate, index) => {
    total += total * (rate / 100);
    return { month: index + 1, total };
  });

  // Update the Results Section with formatted values.
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('totalCost').textContent = `Total Cost: ${formatNumber(principal)}`;
  document.getElementById('totalInterest').textContent = `Total Interest: ${formatNumber(total - principal)}`;
  document.getElementById('totalAmount').textContent = `Total Amount: ${formatNumber(total)}`;

  // Check and perform currency conversion if requested.
  const baseCurrency = document.getElementById('currency').value;
  const targetCurrency = document.getElementById('targetCurrency').value;
  const conversionResultsDiv = document.getElementById('conversionResults');

  // Static conversion rates: conversionRates[from][to]
  const conversionRates = {
    ZAR: { USD: 0.066, GBP: 0.055 },
    USD: { ZAR: 15.0, GBP: 0.83 },
    GBP: { ZAR: 18.0, USD: 1.21 }
  };

  if (targetCurrency !== "none" && targetCurrency !== baseCurrency) {
    const rate = conversionRates[baseCurrency][targetCurrency];
    if (rate) {
      const convertedPrincipal = principal * rate;
      const convertedTotal = total * rate;
      const convertedInterest = convertedTotal - convertedPrincipal;
      document.getElementById('convertedTotalCost').textContent = `Total Cost (${targetCurrency}): ${formatNumber(convertedPrincipal)}`;
      document.getElementById('convertedTotalInterest').textContent = `Total Interest (${targetCurrency}): ${formatNumber(convertedInterest)}`;
      document.getElementById('convertedTotalAmount').textContent = `Total Amount (${targetCurrency}): ${formatNumber(convertedTotal)}`;
      conversionResultsDiv.classList.remove('hidden');
    } else {
      conversionResultsDiv.classList.add('hidden');
    }
  } else {
    conversionResultsDiv.classList.add('hidden');
  }

  // Draw/update the repayment chart.
  drawChart(breakdown);
});

// Function to draw/update the chart using Chart.js.
function drawChart(data) {
  new Chart(document.getElementById('repaymentChart'), {
    type: 'line',
    data: {
      labels: data.map(d => `Month ${d.month}`),
      datasets: [{
        label: "Total Loan",
        data: data.map(d => d.total),
        borderColor: "blue"
      }]
    }
  });
}

// "Add Product" button functionality.
document.getElementById('addProduct').addEventListener('click', function() {
  const productsContainer = document.getElementById('products');
  const newRow = document.createElement('div');
  newRow.classList.add('product-row');
  newRow.innerHTML = `
    <div class="input-group">
      <label>Cost per Unit</label>
      <input type="number" class="costPrice" value="100">
    </div>
    <div class="input-group">
      <label>Quantity</label>
      <input type="number" class="quantity" value="10">
    </div>
    <button type="button" class="removeProduct ios-button secondary">Remove</button>
  `;
  productsContainer.appendChild(newRow);

  // Event listener for the "Remove" button in the new product row.
  newRow.querySelector('.removeProduct').addEventListener('click', function() {
    newRow.remove();
  });
});

// Export PDF functionality.
document.getElementById('exportPDF').addEventListener('click', function() {
  // Ensure jsPDF is available.
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Loan Calculator Results", 10, 20);
  doc.setFontSize(12);
  doc.text(document.getElementById('totalCost').textContent, 10, 40);
  doc.text(document.getElementById('totalInterest').textContent, 10, 50);
  doc.text(document.getElementById('totalAmount').textContent, 10, 60);

  // If conversion results are visible, add them.
  const conversionDiv = document.getElementById('conversionResults');
  if(!conversionDiv.classList.contains('hidden')) {
    doc.text("Converted Results:", 10, 80);
    doc.text(document.getElementById('convertedTotalCost').textContent, 10, 90);
    doc.text(document.getElementById('convertedTotalInterest').textContent, 10, 100);
    doc.text(document.getElementById('convertedTotalAmount').textContent, 10, 110);
  }
  doc.save("loan_calculator_results.pdf");
});

// Export CSV functionality.
document.getElementById('exportExcel').addEventListener('click', function() {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Header for product rows.
  csvContent += "Product #,Cost per Unit,Quantity,Product Total\n";
  const productRows = document.querySelectorAll('.product-row');
  let productIndex = 1;
  productRows.forEach(row => {
    const cost = parseFloat(row.querySelector('.costPrice').value) || 0;
    const quantity = parseInt(row.querySelector('.quantity').value) || 0;
    const productTotal = cost * quantity;
    csvContent += `${productIndex},${formatNumber(cost)},${quantity},${formatNumber(productTotal)}\n`;
    productIndex++;
  });
  
  csvContent += "\nDescription,Value\n";
  csvContent += `${document.getElementById('totalCost').textContent}\n`;
  csvContent += `${document.getElementById('totalInterest').textContent}\n`;
  csvContent += `${document.getElementById('totalAmount').textContent}\n`;
  
  const conversionDiv = document.getElementById('conversionResults');
  if(!conversionDiv.classList.contains('hidden')) {
    csvContent += "\nConverted Results,\n";
    csvContent += `${document.getElementById('convertedTotalCost').textContent}\n`;
    csvContent += `${document.getElementById('convertedTotalInterest').textContent}\n`;
    csvContent += `${document.getElementById('convertedTotalAmount').textContent}\n`;
  }
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "loan_calculator_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
