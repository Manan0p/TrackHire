let lastUrl = location.href;

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
  }

  // Only inject if we are looking at a job
  if (location.href.includes('/jobs/')) {
    injectFloatingButton();
  } else {
    // Remove if we navigate away from jobs
    const btn = document.getElementById('trackhire-inject-btn');
    if (btn) btn.remove();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial check
if (location.href.includes('/jobs/')) {
  setTimeout(injectFloatingButton, 1000);
}

function injectFloatingButton() {
  if (document.getElementById('trackhire-inject-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'trackhire-inject-btn';
  btn.innerHTML = '🎯 Track in TrackHire';
  btn.style.cssText = `
    position: fixed;
    bottom: 40px;
    right: 40px;
    z-index: 999999;
    background-color: #005F4B;
    color: white;
    border: none;
    border-radius: 30px;
    padding: 16px 24px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0, 95, 75, 0.4);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  `;

  btn.onmouseover = () => {
    btn.style.backgroundColor = '#004D3C';
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 12px 28px rgba(0, 95, 75, 0.5)';
  };
  btn.onmouseout = () => {
    btn.style.backgroundColor = '#005F4B';
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 8px 24px rgba(0, 95, 75, 0.4)';
  };

  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    btn.innerHTML = '⏳ Saving...';
    btn.style.backgroundColor = '#4B5563';
    btn.disabled = true;

    // Robust Job Title Extraction
    let jobTitle = '';
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title') || 
                    document.querySelector('.jobs-unified-top-card__job-title') ||
                    document.querySelector('.job-view-layout-jobs-details h1');
    if (titleEl) {
      jobTitle = titleEl.innerText.trim();
      if (jobTitle.includes('\\n')) jobTitle = jobTitle.split('\\n')[0].trim();
    }

    // Robust Company Extraction
    let company = '';
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') || 
                      document.querySelector('.jobs-unified-top-card__company-name') ||
                      document.querySelector('.job-details-jobs-unified-top-card__primary-description a');
    if (companyEl) {
      company = companyEl.innerText.trim();
    }
    
    if (!company) {
       const primaryDescEl = document.querySelector('.job-details-jobs-unified-top-card__primary-description') ||
                             document.querySelector('.jobs-unified-top-card__primary-description');
       if (primaryDescEl) {
         company = primaryDescEl.innerText.split('·')[0].trim();
       }
    }

    // Ultimate Fallback: Parse the document title!
    // LinkedIn titles look like: "(20) Job Title | Company Name | LinkedIn" or "Job Title at Company Name | LinkedIn"
    if (!jobTitle || !company) {
      const docTitle = document.title;
      if (docTitle.includes('|')) {
        const parts = docTitle.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          if (!jobTitle) {
            let t = parts[0];
            // Remove notification counts like "(20)"
            t = t.replace(/^\([0-9]+\)\s*/, '');
            jobTitle = t;
          }
          if (!company && !parts[1].toLowerCase().includes('linkedin')) {
            company = parts[1];
          }
        }
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('currentJobId');
    const jobUrl = jobId ? `https://www.linkedin.com/jobs/view/${jobId}/` : window.location.href.split('?')[0];

    if (!jobTitle || !company) {
      alert('TrackHire: Could not find job title or company name. LinkedIn may have completely updated their layout.');
      resetButton(btn);
      return;
    }

    const data = {
      role: jobTitle,
      company: company,
      jobUrl: jobUrl,
      source: 'LINKEDIN'
    };

    chrome.runtime.sendMessage({ action: 'track_application', data }, (response) => {
      if (response && response.success) {
        btn.innerHTML = '✅ Saved to TrackHire';
        btn.style.backgroundColor = '#059669';
        
        setTimeout(() => {
          resetButton(btn);
        }, 3000);
      } else {
        alert('TrackHire Error: ' + (response?.error || 'Unknown error. Check extension configuration.'));
        resetButton(btn);
      }
    });
  };

  document.body.appendChild(btn);
}

function resetButton(btn) {
  btn.innerHTML = '🎯 Track in TrackHire';
  btn.style.backgroundColor = '#005F4B';
  btn.disabled = false;
}
