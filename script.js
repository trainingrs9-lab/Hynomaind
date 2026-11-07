
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
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const form = document.getElementById('enquiry-form');
const statusEl = document.getElementById('form-status');

form?.addEventListener('submit', async e => {
  e.preventDefault();

  statusEl.textContent = 'Sending your enquiry…';

  const cfg = window.HYPNOMIND_CONFIG || {};

  if (
    !cfg.supabaseUrl ||
    cfg.supabaseUrl.includes('YOUR-PROJECT') ||
    !cfg.supabaseAnonKey ||
    cfg.supabaseAnonKey.includes('YOUR_SUPABASE')
  ) {
    statusEl.textContent =
      'The enquiry form is not configured. Please contact us by phone or email.';
    return;
  }

  try {
    const client = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabaseAnonKey
    );

    const values = Object.fromEntries(
      new FormData(form).entries()
    );

    // Add the new form details to the existing message field.
    // This keeps compatibility with the existing Supabase table.
    const extraDetails = [];

    if (values.mode) {
      extraDetails.push('Preferred Mode: ' + values.mode);
    }

    if (values.format) {
      extraDetails.push('Training Format: ' + values.format);
    }

    const originalMessage = values.message || '';

    values.message = [
      originalMessage,
      ...extraDetails
    ].filter(Boolean).join('\n\n');

    const { error } = await client.functions.invoke(
      'submit-enquiry',
      { body: values }
    );

    if (error) {
      throw error;
    }

    form.reset();

    statusEl.textContent =
      'Thank you! Your enquiry has been submitted successfully.';

  } catch (err) {
    console.error('Enquiry submission error:', err);

    statusEl.textContent =
      'Sorry, we could not submit your enquiry right now. Please contact us by phone or email.';
  }
});
