chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'track_application') {
    handleTrackApplication(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    
    return true; // Indicates async response
  }
});

async function handleTrackApplication(data) {
  const { apiUrl, apiKey } = await chrome.storage.local.get(['apiUrl', 'apiKey']);

  if (!apiUrl || !apiKey) {
    throw new Error('Please configure TrackHire extension settings first (Click the extension icon).');
  }

  const endpoint = `${apiUrl}/api/extensions/applications`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to track application');
    }

    return { success: true, application: responseData.application };
  } catch (error) {
    throw new Error(error.message || 'Failed to connect to TrackHire server.');
  }
}
