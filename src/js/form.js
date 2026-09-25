import { CONFIG } from './config.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initForm() {
  const form = document.querySelector('.form');
  const status = form.querySelector('.form__status');
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets[0].setAttribute('aria-describedby', 'f-type-err');
  fieldsets[1].setAttribute('aria-describedby', 'f-budget-err');

  const rules = [
    { el: form.elements.name, err: '#f-name-err', test: (v) => v.trim().length > 1, msg: 'Tell us your name.' },
    { el: form.elements.email, err: '#f-email-err', test: (v) => EMAIL.test(v.trim()), msg: 'We need a valid email to reply to.' },
    { group: 'project_type', err: '#f-type-err', msg: 'Pick the closest project type.' },
    { group: 'budget', err: '#f-budget-err', msg: 'Pick a budget range — a rough one is fine.' },
    { el: form.elements.message, err: '#f-message-err', test: (v) => v.trim().length >= 10, msg: 'A sentence or two about the project, please.' },
  ];

  function check(rule) {
    const ok = rule.group ? Boolean(form.querySelector(`input[name="${rule.group}"]:checked`)) : rule.test(rule.el.value);
    const errEl = form.querySelector(rule.err);
    errEl.textContent = ok ? '' : rule.msg;
    const field = errEl.closest('.field');
    field.classList.toggle('has-error', !ok);
    if (rule.el) rule.el.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  rules.forEach((rule) => {
    if (rule.el) rule.el.addEventListener('blur', () => rule.el.value && check(rule));
    else form.querySelectorAll(`input[name="${rule.group}"]`).forEach((r) => r.addEventListener('change', () => check(rule)));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = rules.map(check);
    const firstBad = results.indexOf(false);
    if (firstBad !== -1) {
      const r = rules[firstBad];
      (r.el || form.querySelector(`input[name="${r.group}"]`)).focus();
      status.textContent = 'A few fields need a look.';
      return;
    }
    const data = new FormData(form);
    if (data.get('company-website')) return; // honeypot

    form.classList.add('is-sending');
    status.textContent = 'Sending…';
    try {
      await deliver(data);
      form.reset();
      status.textContent = 'Received — it’s in the fire. We’ll reply within one working day.';
    } catch {
      status.innerHTML = `Something went wrong sending that. Please email <a href="${mailto(data)}">${CONFIG.contactEmail}</a> instead.`;
    } finally {
      form.classList.remove('is-sending');
    }
  });
}

function mailto(data) {
  const subject = `New project: ${data.get('project_type') || 'enquiry'} (${data.get('budget') || 'budget tbc'})`;
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nProject type: ${data.get('project_type')}\nBudget: ${data.get('budget')}\n\n${data.get('message')}`;
  return `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function deliver(data) {
  const provider = CONFIG.formProvider;
  let res;
  if (provider === 'mailto') {
    window.location.href = mailto(data);
    return;
  }
  if (provider === 'netlify') {
    res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    });
  } else if (provider === 'php') {
    res = await fetch('/contact.php', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
  } else {
    res = await fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
