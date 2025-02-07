document.getElementById('loanForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const cost = parseFloat(document.getElementById('costPrice').value);
  const quantity = parseInt(document.getElementById('quantity').value);
  const loanType = document.getElementById('loanType').value;
  const principal = cost * quantity;

  const interestRates = {
    short: [1.5, 1.5, 1.5],
    medium: [1.5, 1.5, 1.5, 2.0, 2.0, 2.0],
    long: [1.5, 1.5, 1.5, ...Array(9).fill(2.0)]
  };

  let rates = interestRates[loanType];
  let total = principal;

  let breakdown = rates.map((rate, index) => {
    total += total * (rate / 100);
    return { month: index + 1, total };
  });

  document.getElementById('results').classList.remove('hidden');
  document.getElementById('totalCost').textContent = `Total Cost: ${principal.toFixed(2)}`;
  document.getElementById('totalInterest').textContent = `Total Interest: ${(total - principal).toFixed(2)}`;
  document.getElementById('totalAmount').textContent = `Total Amount: ${total.toFixed(2)}`;

  drawChart(breakdown);
});

function drawChart(data) {
  new Chart(document.getElementById('repaymentChart'), {
    type: 'line',
    data: {
      labels: data.map(d => `Month ${d.month}`),
      datasets: [{ label: "Total Loan", data: data.map(d => d.total), borderColor: "blue" }]
    }
  });
}
