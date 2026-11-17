// 1. Dark / Light Mode Toggle
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    if (btn) btn.textContent = '🌙 Dark';
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    if (btn) btn.textContent = '☀️ Light';
  }
}

// Apply saved theme immediately
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  window.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️ Light';
  });
}

// 2. Dynamic ATO Due-Date Countdown Banner
function updateATOBanner() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlines = [
    { name: 'Q1 BAS Lodgment & Payment (Electronic/Agent)', date: new Date('2026-11-25') },
    { name: 'Q2 Super Guarantee Contributions Due', date: new Date('2027-01-28') },
    { name: 'Q2 BAS Lodgment & Payment Due', date: new Date('2027-02-28') },
    { name: 'Q3 BAS Lodgment & Payment Due', date: new Date('2027-04-28') },
    { name: 'Tax Agent Individual & Company Tax Return Cutoff', date: new Date('2027-05-15') },
    { name: 'End of Financial Year (2026–27) Tax Planning', date: new Date('2027-06-30') }
  ];

  const upcoming = deadlines
    .map(function(d) {
      return { name: d.name, date: d.date, diffDays: Math.ceil((d.date - today) / (1000 * 60 * 60 * 24)) };
    })
    .filter(function(d) { return d.diffDays >= 0; })
    .sort(function(a, b) { return a.diffDays - b.diffDays; });

  const bannerText = document.getElementById('ato-banner-text');
  if (!bannerText) return;

  if (upcoming.length > 0) {
    const next = upcoming[0];
    const dayStr = next.diffDays === 0 ? 'today!' : 'in ' + next.diffDays + ' day' + (next.diffDays === 1 ? '' : 's');
    const dateFormatted = next.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    bannerText.innerHTML = '<strong>ATO Deadline Alert:</strong> ' + next.name + ' is due <strong>' + dayStr + '</strong> (' + dateFormatted + '). <a href="#" onclick="Calendly.initPopupWidget({url: \'https://calendly.com\'});return false;">Book your lodgment now</a>';
  } else {
    bannerText.innerHTML = 'Need help with your Australian tax return or BAS? <a href="#" onclick="Calendly.initPopupWidget({url: \'https://calendly.com\'});return false;">Book an appointment today</a>';
  }
}
updateATOBanner();

// 3. Australian Tax Refund Calculator Logic
function calculateAustralianTax() {
  const year = document.getElementById('taxYear').value;
  const gross = Math.max(0, parseFloat(document.getElementById('grossIncome').value) || 0);
  const deductions = Math.max(0, parseFloat(document.getElementById('deductions').value) || 0);
  const withheld = Math.max(0, parseFloat(document.getElementById('taxWithheld').value) || 0);

  const taxableIncome = Math.max(0, gross - deductions);

  const rate2 = (year === '2026-27') ? 0.15 : 0.16;
  const maxTax2 = (45000 - 18200) * rate2;

  let baseTax = 0;
  if (taxableIncome > 190000) {
    baseTax = maxTax2 + (135000 - 45000) * 0.30 + (190000 - 135000) * 0.37 + (taxableIncome - 190000) * 0.45;
  } else if (taxableIncome > 135000) {
    baseTax = maxTax2 + (135000 - 45000) * 0.30 + (taxableIncome - 135000) * 0.37;
  } else if (taxableIncome > 45000) {
    baseTax = maxTax2 + (taxableIncome - 45000) * 0.30;
  } else if (taxableIncome > 18200) {
    baseTax = (taxableIncome - 18200) * rate2;
  }

  let lito = 0;
  if (taxableIncome <= 37500) lito = 700;
  else if (taxableIncome <= 45000) lito = 700 - (taxableIncome - 37500) * 0.05;
  else if (taxableIncome < 66667) lito = 325 - (taxableIncome - 45000) * 0.015;
  const netIncomeTax = Math.max(0, baseTax - Math.max(0, lito));

  let medicareLevy = 0;
  if (taxableIncome > 35013) medicareLevy = taxableIncome * 0.02;
  else if (taxableIncome > 28011) medicareLevy = (taxableIncome - 28011) * 0.10;

  const totalTax = netIncomeTax + medicareLevy;
  const diff = withheld - totalTax;
  const fmt = function(n) { return '$' + Math.round(n).toLocaleString('en-AU'); };

  document.getElementById('resTaxable').textContent = fmt(taxableIncome);
  document.getElementById('resIncomeTax').textContent = fmt(netIncomeTax);
  document.getElementById('resMedicare').textContent = fmt(medicareLevy);
  document.getElementById('resTotalTax').textContent = fmt(totalTax);
  document.getElementById('resWithheld').textContent = fmt(withheld);

  const headline = document.getElementById('resultHeadline');
  if (diff >= 0) {
    headline.style.color = '#0f766e';
    headline.textContent = 'Estimated Refund: ' + fmt(diff);
  } else {
    headline.style.color = '#b91c1c';
    headline.textContent = 'Estimated Tax Payable: ' + fmt(Math.abs(diff));
  }
  document.getElementById('taxResultBox').style.display = 'block';
}

// 4. SMS Lead Form Submission
async function handleLeadSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('leadName').value;
  const phone = document.getElementById('leadPhone').value;
  const service = document.getElementById('leadService').value;
  const time = document.getElementById('leadTime').value;

  const WEBHOOK_URL = "";

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, service: service, time: time, source: 'ebad.com.au' })
      });
    } catch (err) {
      console.error('Webhook error:', err);
    }
  }

  const status = document.getElementById('formStatus');
  status.style.display = 'block';
  status.textContent = 'Thank you, ' + name + '! We have registered your request for ' + service + ' and will SMS ' + phone + ' shortly to confirm your appointment.';
  document.getElementById('leadForm').reset();
}
