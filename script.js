
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

  if (!statusEl) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.innerHTML || 'Send Enquiry';

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting your enquiry...';
    submitButton.style.opacity = '0.65';
    submitButton.style.cursor = 'not-allowed';
  }

  statusEl.textContent = 'Please wait. Your enquiry is being submitted...';
  statusEl.style.color = '#8a6a35';

  const restoreButton = () => {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      submitButton.style.opacity = '1';
      submitButton.style.cursor = 'pointer';
    }
  };

  const cfg = window.HYPNOMIND_CONFIG || {};

  if (
    !cfg.supabaseUrl ||
    cfg.supabaseUrl.includes('YOUR-PROJECT') ||
    !cfg.supabaseAnonKey ||
    cfg.supabaseAnonKey.includes('YOUR_SUPABASE')
  ) {
    statusEl.textContent =
      'The enquiry form is not configured. Please contact us by phone or email.';
    statusEl.style.color = '#b42318';
    restoreButton();
    return;
  }

  try {
    const client = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabaseAnonKey
    );

    const values = Object.fromEntries(new FormData(form).entries());

    const extraDetails = [];

    if (values.mode) {
      extraDetails.push('Preferred Mode: ' + values.mode);
    }

    if (values.format) {
      extraDetails.push('Training Format: ' + values.format);
    }

    values.message = [
      values.message || '',
      ...extraDetails
    ].filter(Boolean).join('\n\n');

    const { data, error } = await client.functions.invoke(
      'submit-enquiry',
      { body: values }
    );

    if (error) throw error;

    if (!data?.success || !data?.queryCode) {
      throw new Error('Query ID was not returned.');
    }

    form.reset();

    statusEl.textContent = '';
    statusEl.style.color = '#176b43';
    statusEl.style.background = '#edf8f1';
    statusEl.style.padding = '18px';
    statusEl.style.borderRadius = '12px';
    statusEl.style.lineHeight = '1.8';

    const heading = document.createElement('strong');
    heading.textContent = '✓ Enquiry submitted successfully!';
    heading.style.display = 'block';
    heading.style.fontSize = '16px';

    const message = document.createElement('span');
    message.textContent =
      'Thank you for contacting HypnoMind. Your enquiry has been received. Please save your Query ID for future communication.';
    message.style.display = 'block';
    message.style.marginTop = '6px';

    const queryLine = document.createElement('div');
    queryLine.style.marginTop = '12px';

    const queryLabel = document.createElement('strong');
    queryLabel.textContent = 'Your Query ID: ';

    const queryValue = document.createElement('strong');
    queryValue.textContent = data.queryCode;
    queryValue.style.fontSize = '18px';
    queryValue.style.letterSpacing = '1px';

    queryLine.append(queryLabel, queryValue);

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy Query ID';
    copyButton.style.display = 'inline-block';
    copyButton.style.marginTop = '12px';
    copyButton.style.padding = '10px 16px';
    copyButton.style.border = '0';
    copyButton.style.borderRadius = '7px';
    copyButton.style.background = '#101b2b';
    copyButton.style.color = '#ffffff';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontWeight = '600';

    const copyStatus = document.createElement('span');
    copyStatus.style.display = 'block';
    copyStatus.style.marginTop = '6px';

    copyButton.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(data.queryCode);
        } else {
          const temporaryInput = document.createElement('textarea');
          temporaryInput.value = data.queryCode;
          temporaryInput.style.position = 'fixed';
          temporaryInput.style.opacity = '0';
          document.body.appendChild(temporaryInput);
          temporaryInput.select();

          const copied = document.execCommand('copy');
          temporaryInput.remove();

          if (!copied) throw new Error('Copy failed');
        }

        copyButton.textContent = '✓ Copied!';
        copyStatus.textContent = 'Query ID copied successfully.';
      } catch (copyError) {
        copyStatus.textContent =
          'Please select and copy your Query ID manually.';
      }
    });

    const contactMessage = document.createElement('span');
    contactMessage.textContent =
      'Need help? Contact HypnoMind on WhatsApp or phone and share your Query ID.';
    contactMessage.style.display = 'block';
    contactMessage.style.marginTop = '12px';
    contactMessage.style.fontSize = '12px';

    statusEl.append(
      heading,
      message,
      queryLine,
      copyButton,
      copyStatus,
      contactMessage
    );

    statusEl.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

  } catch (err) {
    console.error('Enquiry submission error:', err);

    statusEl.textContent =
      'Sorry, we could not confirm your enquiry. Please contact HypnoMind by phone or email before submitting again.';

    statusEl.style.color = '#b42318';
    statusEl.style.background = '#fff1f0';
    statusEl.style.padding = '12px';
    statusEl.style.borderRadius = '8px';

  } finally {
    restoreButton();
  }
});
