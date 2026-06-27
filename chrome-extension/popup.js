document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing config
  chrome.storage.local.get(['apiUrl', 'apiKey'], (result) => {
    if (result.apiUrl) apiUrlInput.value = result.apiUrl;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
  });

  saveBtn.addEventListener('click', () => {
    let apiUrl = apiUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Remove trailing slash
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    // Default to localhost if empty
    if (!apiUrl) {
      apiUrl = 'http://localhost:3000';
      apiUrlInput.value = apiUrl;
    }

    chrome.storage.local.set({ apiUrl, apiKey }, () => {
      statusDiv.textContent = 'Configuration saved!';
      statusDiv.className = 'success';
      
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
