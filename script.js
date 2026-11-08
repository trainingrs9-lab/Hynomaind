const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

const form = document.getElementById('enquiry-form');
const statusEl = document.getElementById('form-status');

form?.addEventListener('submit', async e => {
  e.preventDefault();
  statusEl.textContent = 'Sending your enquiry…';

  const cfg = window.HYPNOMIND_CONFIG || {};
  if (!cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR-PROJECT') ||
      !cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes('YOUR_SUPABASE')) {
    statusEl.textContent = 'The enquiry form is not configured. Please contact us by phone or email.';
    return;
  }

  try {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const values = Object.fromEntries(new FormData(form).entries());
    const extraDetails = [];
    if (values.mode) extraDetails.push('Preferred Mode: ' + values.mode);
    if (values.format) extraDetails.push('Training Format: ' + values.format);
    values.message = [values.message || '', ...extraDetails].filter(Boolean).join('\n\n');

    const { data, error } = await client.functions.invoke('submit-enquiry', { body: values });
    if (error) throw error;
    if (!data?.success || !data?.queryCode) {
      throw new Error('The enquiry was submitted, but its reference number was not returned. Please contact HypnoMind.');
    }

    form.reset();
    statusEl.textContent = 'Thank you! Your enquiry has been submitted successfully. Your Query ID is ' +
      data.queryCode + '. Please save this ID and share it with us when you contact HypnoMind.';
  } catch (err) {
    console.error('Enquiry submission error:', err);
    statusEl.textContent = 'Sorry, we could not confirm your enquiry right now. Please contact us by phone or email.';
  }
});
