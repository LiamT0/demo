const STORAGE_KEY = 'cleaning-crew-operations-v1';
const pages = {
  dashboard: ['Dashboard', 'Your schedule, pipeline and outstanding work.'],
  schedule: ['Schedule', 'See assignments for the week.'],
  jobs: ['Jobs', 'Plan work, assign a crew and track completion.'],
  clients: ['Clients', 'Manage property contacts and service addresses.'],
  quotes: ['Quotes', 'Draft estimates and turn approved quotes into jobs.'],
  invoices: ['Invoices', 'Track invoices and record payments.'],
  services: ['Services', 'Manage the service catalog and default prices.']
};
const labels = { clients: 'client', jobs: 'job', quotes: 'quote', invoices: 'invoice', services: 'service' };
const statuses = {
  jobs: ['Scheduled', 'In progress', 'Completed'],
  quotes: ['Draft', 'Sent', 'Approved', 'Converted'],
  invoices: ['Draft', 'Sent', 'Paid']
};
const main = document.querySelector('#main');
const editor = document.querySelector('#editor');
const form = document.querySelector('#record-form');
const fields = document.querySelector('#fields');
const formError = document.querySelector('#form-error');
const toast = document.querySelector('#status');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekDayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
let view = 'dashboard';
let weekOffset = 0;
let filters = {};
let editing = null;
let returnFocus = null;
let toastTimer;

function dateAt(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDate(date);
}
function localDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function displayDate(date, format = dayFormat) {
  return date ? format.format(new Date(date + 'T12:00:00')) : '—';
}
function displayTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}
function seed() {
  return {
    clients: [
      { id: 'cl-1', name: 'Fairview Property Group', contact: 'Morgan Lee', email: 'morgan@example.com', phone: '', address: 'North office suite' },
      { id: 'cl-2', name: 'Westbrook Office Park', contact: 'Jordan Hayes', email: 'jordan@example.com', phone: '', address: 'Building B, shared areas' },
      { id: 'cl-3', name: 'Cedar Row Management', contact: 'Alex Rivera', email: 'alex@example.com', phone: '', address: 'Cedar Row, Suite 104' }
    ],
    services: [
      { id: 'sv-1', name: 'Office cleaning', amount: 18500, notes: 'Work areas, meeting rooms and restrooms.' },
      { id: 'sv-2', name: 'Common-area cleaning', amount: 22000, notes: 'Entrances, corridors and shared facilities.' },
      { id: 'sv-3', name: 'Tenant turnover', amount: 48000, notes: 'Prepare vacant suites for handover.' }
    ],
    jobs: [
      { id: 'jb-1', title: 'Evening office cleaning', clientId: 'cl-1', serviceId: 'sv-1', date: dateAt(), time: '17:30', crew: 'Crew A', status: 'Scheduled', notes: '', amount: 18500 },
      { id: 'jb-2', title: 'Common areas — Building B', clientId: 'cl-2', serviceId: 'sv-2', date: dateAt(1), time: '08:00', crew: 'Crew B', status: 'Scheduled', notes: '', amount: 22000 },
      { id: 'jb-3', title: 'Suite 104 turnover', clientId: 'cl-3', serviceId: 'sv-3', date: dateAt(-1), time: '10:00', crew: 'Crew A', status: 'Completed', notes: '', amount: 48000 }
    ],
    quotes: [
      { id: 'qt-1', title: 'Weekly common-area service', clientId: 'cl-2', serviceId: 'sv-2', amount: 88000, date: dateAt(7), status: 'Sent', notes: '' },
      { id: 'qt-2', title: 'Suite 210 turnover', clientId: 'cl-3', serviceId: 'sv-3', amount: 48000, date: dateAt(5), status: 'Approved', notes: '' }
    ],
    invoices: [
      { id: 'iv-1', title: 'Suite 104 turnover', clientId: 'cl-3', serviceId: 'sv-3', amount: 48000, date: dateAt(14), status: 'Sent', notes: '', jobId: 'jb-3' }
    ]
  };
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && ['clients', 'jobs', 'quotes', 'invoices', 'services'].every(key => Array.isArray(saved[key]))) return saved;
  } catch {
    // Use demo data when browser storage is unavailable or invalid.
  }
  return seed();
}
let state = load();

function commit(update) {
  const next = load();
  update(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  state = next;
}
function digest(text) {
  const symbols = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text ?? '').replace(/[&<>"']/g, character => symbols[character]);
}
function clientName(id) {
  return state.clients.find(client => client.id === id)?.name ?? 'Client unavailable';
}
function formatMoney(cents) { return money.format((cents ?? 0) / 100); }
function findRecord(data, collection, id) { return data[collection].find(record => record.id === id); }
function newId() { return crypto.randomUUID(); }
function control(label, action, options = {}) {
  const { collection = '', id = '', kind = 'quiet' } = options;
  return `<button class="${kind}" type="button" data-action="${action}" data-collection="${collection}" data-id="${digest(id)}">${digest(label)}</button>`;
}
function headingActions(collection) {
  return control(`New ${labels[collection]}`, 'new', { collection, kind: 'button primary' });
}
function badge(status) {
  const tone = ['Approved', 'Completed', 'Paid'].includes(status) ? 'good'
    : ['Sent', 'Scheduled', 'In progress'].includes(status) ? 'active' : '';
  return `<span class="badge ${tone}">${digest(status)}</span>`;
}
function rowTitle(title, detail = '') {
  return `<span class="row-title">${digest(title)}</span>${detail ? `<span class="row-detail">${digest(detail)}</span>` : ''}`;
}
function table(headers, rows, empty = 'No matching records.') {
  if (!rows.length) return `<p class="empty">${digest(empty)}</p>`;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Record list"><table><thead><tr>
    ${headers.map(h => `<th scope="col">${digest(h)}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(cells => `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function card(title, content, action = '') {
  return `<section class="card"><div class="card-heading"><h2>${digest(title)}</h2>${action}</div>${content}</section>`;
}
function linkTo(viewName, text) {
  return `<a class="button secondary" href="#${viewName}">${digest(text)}</a>`;
}
function nextAction(collection, record) {
  if (collection === 'quotes' && record.status === 'Approved') return ['Schedule job', 'convert'];
  if (collection === 'quotes' && record.status === 'Draft') return ['Mark sent', 'advance'];
  if (collection === 'quotes' && record.status === 'Sent') return ['Approve', 'advance'];
  if (collection === 'jobs' && record.status === 'Scheduled') return ['Start job', 'advance'];
  if (collection === 'jobs' && record.status === 'In progress') return ['Complete job', 'advance'];
  if (collection === 'jobs' && record.status === 'Completed' && !state.invoices.some(invoice => invoice.jobId === record.id)) {
    return ['Create invoice', 'bill'];
  }
  if (collection === 'invoices' && record.status === 'Draft') return ['Mark sent', 'advance'];
  if (collection === 'invoices' && record.status === 'Sent') return ['Record payment', 'advance'];
  return null;
}
function recordActions(collection, record) {
  const next = nextAction(collection, record);
  const opts = { collection, id: record.id };
  return `<div class="actions">${next ? control(next[0], next[1], opts) : ''}${control('Edit', 'edit', opts)}</div>`;
}
function jobRows(jobs) {
  return jobs.map(job => [
    rowTitle(job.title, clientName(job.clientId)),
    digest([displayDate(job.date), displayTime(job.time)].filter(Boolean).join(' · ')),
    digest(job.crew || 'Unassigned'),
    badge(job.status),
    recordActions('jobs', job)
  ]);
}
function upcomingJobs() {
  return state.jobs.filter(job => job.status !== 'Completed' && job.date >= dateAt())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function dashboard() {
  const outstanding = state.invoices.filter(invoice => invoice.status === 'Sent').reduce((sum, invoice) => sum + invoice.amount, 0);
  const metrics = [
    ['Jobs today', state.jobs.filter(job => job.date === dateAt()).length],
    ['Open quotes', state.quotes.filter(quote => quote.status !== 'Converted').length],
    ['Outstanding', formatMoney(outstanding)],
    ['Active clients', state.clients.length]
  ];
  const metricMarkup = metrics.map(([name, value]) => `<div class="metric"><p class="metric-name">${name}</p><strong>${digest(value)}</strong></div>`).join('');
  return `<section class="metrics" aria-label="Overview">${metricMarkup}</section>
  ${card('Upcoming jobs', table(['Job', 'Scheduled', 'Crew', 'Status', 'Actions'], jobRows(upcomingJobs().slice(0, 6)), 'No upcoming jobs.'), linkTo('schedule', 'Open schedule'))}`;
}
function filtersMarkup(collection) {
  const current = filters[collection] ?? {};
  return `<div class="filters">
    <label>Search ${collection}<input id="filter-search" type="search" value="${digest(current.search)}" placeholder="Search records"></label>
    ${statuses[collection] ? `<label>Status<select id="filter-status"><option value="">All statuses</option>
      ${statuses[collection].map(s => `<option${s === current.status ? ' selected' : ''}>${s}</option>`).join('')}</select></label>` : ''}
  </div>`;
}
function filtered(collection) {
  const { search = '', status = '' } = filters[collection] ?? {};
  const term = search.trim().toLowerCase();
  return state[collection].filter(record => {
    if (status && record.status !== status) return false;
    const searchable = [record.title, record.name, record.contact, record.email, record.address, record.crew, record.status,
      record.clientId ? clientName(record.clientId) : ''];
    return !term || searchable.some(value => String(value ?? '').toLowerCase().includes(term));
  });
}
function listMarkup(collection) {
  const records = filtered(collection);
  if (collection === 'jobs') {
    const sorted = [...records].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return table(['Job', 'Scheduled', 'Crew', 'Status', 'Actions'], jobRows(sorted));
  }
  if (collection === 'clients') return table(['Client', 'Contact', 'Service address', 'Actions'], records.map(record => [
    rowTitle(record.name, record.contact), rowTitle(record.email || '—', record.phone),
    digest(record.address || '—'), recordActions(collection, record)
  ]));
  if (collection === 'services') return table(['Service', 'Default price', 'Actions'], records.map(record => [
    rowTitle(record.name, record.notes), formatMoney(record.amount), recordActions(collection, record)
  ]));
  return table([collection === 'quotes' ? 'Quote' : 'Invoice', 'Total', 'Due date', 'Status', 'Actions'], records.map(record => [
    rowTitle(record.title, clientName(record.clientId)), formatMoney(record.amount), digest(displayDate(record.date)),
    badge(record.status), recordActions(collection, record)
  ]));
}
function schedule() {
  const base = new Date();
  const fromMonday = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - fromMonday + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return localDate(date);
  });
  const calendar = days.map(day => {
    const jobs = state.jobs.filter(job => job.date === day).sort((a, b) => a.time.localeCompare(b.time));
    return `<section class="calendar-day${day === dateAt() ? ' today' : ''}"><h3 class="day-heading">${displayDate(day, weekDayFormat)}</h3>
      ${jobs.map(job => `<button class="cal-job" data-action="edit" data-collection="jobs" data-id="${digest(job.id)}"
        type="button"><span>${digest(displayTime(job.time))}</span>${digest(job.title)}<span>${digest(job.crew || 'Unassigned')}</span></button>`).join('')}</section>`;
  }).join('');
  const controls = `<div class="actions">${control('Previous week', 'previous')}${control('Today', 'today')}${control('Next week', 'next')}</div>`;
  return card(`${displayDate(days[0])} – ${displayDate(days[6])}`, `<div class="table-wrap" tabindex="0" role="region" aria-label="Week schedule"><div class="calendar">${calendar}</div></div>`, controls);
}
function render(focusHeading = false) {
  const [title, description] = pages[view];
  const actions = view === 'dashboard' ? `${headingActions('jobs')}${linkTo('quotes', 'View quotes')}`
    : headingActions(view === 'schedule' ? 'jobs' : view);
  main.innerHTML = `<header class="page-head"><div><p class="eyebrow">Cleaning Crew</p>
  <h1 tabindex="-1">${title}</h1><p class="muted">${description}</p></div><div class="actions">${actions}</div></header>
  ${view === 'dashboard' ? dashboard() : view === 'schedule' ? schedule()
    : `${filtersMarkup(view)}<div id="records">${listMarkup(view)}</div>`}`;
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    if (link.hash === '#' + view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (focusHeading) main.querySelector('h1').focus();
}
function navigate(focusHeading = false) {
  const hash = location.hash.slice(1);
  if (hash !== 'main') view = Object.hasOwn(pages, hash) ? hash : 'dashboard';
  render(focusHeading && hash !== 'main');
}
function input(key, label, value = '', options = {}) {
  const { type = 'text', required = false, extra = '' } = options;
  return `<label class="field">${label}<input name="${key}" type="${type}" value="${digest(value)}" ${required ? 'required' : ''} ${extra}></label>`;
}
function select(key, label, value, choices, required = true) {
  return `<label class="field">${label}<select name="${key}" ${required ? 'required' : ''}>
    ${choices.map(([id, name]) => `<option value="${digest(id)}"${id === value ? ' selected' : ''}>${digest(name)}</option>`).join('')}</select></label>`;
}
function note(value = '') {
  return `<label class="field">Notes<textarea name="notes" maxlength="500">${digest(value)}</textarea></label>`;
}
function amount(value) {
  return input('amount', 'Amount (USD)', value == null ? '' : (value / 100).toFixed(2),
    { type: 'number', required: true, extra: 'min="0" max="1000000" step=".01"' });
}
function formFields(collection, record = {}) {
  if (collection === 'clients') return [
    input('name', 'Business name', record.name, { required: true, extra: 'maxlength="100"' }),
    input('contact', 'Contact name', record.contact, { extra: 'maxlength="100"' }),
    input('email', 'Email', record.email, { type: 'email', extra: 'maxlength="120"' }),
    input('phone', 'Phone', record.phone, { type: 'tel', extra: 'maxlength="40"' }),
    input('address', 'Service address', record.address, { extra: 'maxlength="160"' })
  ].join('');
  if (collection === 'services') return input('name', 'Service name', record.name, { required: true, extra: 'maxlength="100"' }) + amount(record.amount) + note(record.notes);
  const clientOptions = [['', 'Choose a client'], ...state.clients.map(client => [client.id, client.name])];
  const serviceOptions = [['', 'No service selected'], ...state.services.map(service => [service.id, service.name])];
  const recordTitle = input('title', 'Title', record.title, { required: true, extra: 'maxlength="120"' });
  const client = select('clientId', 'Client', record.clientId ?? '', clientOptions);
  const service = select('serviceId', 'Service', record.serviceId ?? '', serviceOptions, false);
  const date = input('date', collection === 'jobs' ? 'Scheduled date' : 'Due date', record.date ?? (collection === 'jobs' ? dateAt() : dateAt(14)), { type: 'date', required: true });
  const when = collection === 'jobs' ? `<div class="form-grid">${date}${input('time', 'Start time', record.time ?? '09:00', { type: 'time', required: true })}</div>
    ${input('crew', 'Crew or assignee', record.crew, { extra: 'maxlength="100"' })}` : date;
  return recordTitle + client + service + when + amount(record.amount) + note(record.notes);
}
function openEditor(collection, record, mode = 'new', parentId = '') {
  if (!labels[collection]) return;
  editing = { collection, id: mode === 'edit' ? record.id : '', mode, parentId };
  returnFocus = document.activeElement;
  document.querySelector('#editor-title').textContent = `${mode === 'edit' ? 'Edit' : 'New'} ${labels[collection]}`;
  fields.innerHTML = formFields(collection, record);
  formError.hidden = true;
  editor.showModal();
  form.elements[0]?.focus();
  fields.querySelector('input')?.focus();
}
function notify(message, error = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}
function formValues(collection) {
  const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value).trim()]));
  const required = collection === 'clients' || collection === 'services' ? 'name' : 'title';
  if (!values[required]) throw Error('Enter a ' + required + '.');
  if (Object.hasOwn(values, 'amount')) {
    const cents = Math.round(Number(values.amount) * 100);
    if (!values.amount || !Number.isFinite(cents) || cents < 0 || cents > 100000000) throw Error('Enter a valid amount.');
    values.amount = cents;
  }
  return values;
}
function saveRecord(event) {
  event.preventDefault();
  if (!editing) return;
  const { collection, id, mode, parentId } = editing;
  try {
    const values = formValues(collection);
    commit(data => {
      if (values.clientId !== undefined && !findRecord(data, 'clients', values.clientId)) throw Error('Choose an existing client.');
      if (values.serviceId && !findRecord(data, 'services', values.serviceId)) throw Error('Choose an existing service.');
      if (id) {
        const existing = findRecord(data, collection, id);
        if (!existing) throw Error('This record is no longer available.');
        Object.assign(existing, values);
        return;
      }
      const record = { id: newId(), ...values };
      if (statuses[collection]) record.status = statuses[collection][0];
      if (mode === 'convert') {
        const quote = findRecord(data, 'quotes', parentId);
        if (quote?.status !== 'Approved') throw Error('This quote has already been updated.');
        record.quoteId = quote.id;
        quote.status = 'Converted';
      }
      if (mode === 'bill') {
        const job = findRecord(data, 'jobs', parentId);
        if (job?.status !== 'Completed' || data.invoices.some(invoice => invoice.jobId === parentId)) throw Error('This job is no longer eligible for a new invoice.');
        record.jobId = job.id;
      }
      data[collection].push(record);
    });
    editor.close();
    if (mode === 'convert' || mode === 'bill') location.hash = collection;
    else render();
    notify(`${labels[collection][0].toUpperCase() + labels[collection].slice(1)} saved.`);
  } catch (error) {
    formError.textContent = error.name === 'QuotaExceededError' ? 'The browser could not save the record.' : error.message;
    formError.hidden = false;
  }
}
function advance(collection, id) {
  try {
    let newStatus;
    commit(data => {
      const record = findRecord(data, collection, id);
      const sequence = statuses[collection];
      const current = sequence.indexOf(record?.status);
      if (current < 0 || current + 1 >= sequence.length || sequence[current + 1] === 'Converted') throw Error('This status cannot be advanced.');
      newStatus = sequence[current + 1];
      record.status = newStatus;
      if (newStatus === 'Paid') record.paidOn = dateAt();
    });
    render();
    notify('Status updated to ' + newStatus.toLowerCase() + '.');
  } catch (error) {
    notify(error.message, true);
  }
}
main.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, collection, id } = button.dataset;
  if (['previous', 'next', 'today'].includes(action)) {
    weekOffset = action === 'today' ? 0 : weekOffset + (action === 'next' ? 1 : -1);
    render();
    main.querySelector(`[data-action="${action}"]`)?.focus();
    return;
  }
  if (action === 'new') {
    if (['jobs', 'quotes', 'invoices'].includes(collection) && !state.clients.length) {
      notify('Create a client before adding a service record.', true);
      return;
    }
    openEditor(collection);
    return;
  }
  const record = findRecord(state, collection, id);
  if (!record) return;
  if (action === 'edit') openEditor(collection, record, 'edit');
  if (action === 'advance') advance(collection, id);
  if (action === 'convert' && record.status === 'Approved') {
    openEditor('jobs', { ...record, date: dateAt(1) }, 'convert', id);
  }
  if (action === 'bill' && record.status === 'Completed') {
    openEditor('invoices', { ...record, date: dateAt(14) }, 'bill', id);
  }
});
function filterRecords(event) {
  const key = event.target.id === 'filter-search' ? 'search' : event.target.id === 'filter-status' ? 'status' : null;
  if (!key) return;
  filters[view] = { ...filters[view], [key]: event.target.value };
  document.querySelector('#records').innerHTML = listMarkup(view);
}
main.addEventListener('input', filterRecords);
main.addEventListener('change', filterRecords);
form.addEventListener('change', event => {
  if (event.target.name !== 'serviceId' || editing?.mode !== 'new' || form.elements.amount.value !== '') return;
  const service = findRecord(state, 'services', event.target.value);
  if (service) form.elements.amount.value = (service.amount / 100).toFixed(2);
});
form.addEventListener('submit', saveRecord);
editor.querySelectorAll('[data-dismiss]').forEach(button => button.addEventListener('click', () => editor.close()));
editor.addEventListener('close', () => {
  editing = null;
  if (returnFocus?.isConnected) returnFocus.focus();
});
window.addEventListener('hashchange', () => navigate(true));
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  state = load();
  if (!editor.open) render();
});
navigate();
