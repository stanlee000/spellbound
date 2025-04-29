// Global variables
let selectedText = '';
let floatingMenu = null;
let selectionTimeout = null;
let isMenuDisabledForPage = false;
let isMouseOverMenu = false; // Track mouse state

// Check if menu is globally disabled
chrome.storage.local.get(['menuSettings'], (result) => {
  if (result.menuSettings && result.menuSettings.globallyDisabled) {
    isMenuDisabledForPage = true;
  }
  
  // Check if menu is disabled for this page
  if (result.menuSettings && result.menuSettings.disabledPages) {
    const currentUrl = window.location.hostname;
    if (result.menuSettings.disabledPages.includes(currentUrl)) {
      isMenuDisabledForPage = true;
    }
  }
});

function createFloatingMenu() {
  console.log('[createFloatingMenu] Starting...');
  if (floatingMenu) {
    try {
      floatingMenu.removeEventListener('mouseup', handleMenuClick); 
      document.body.removeChild(floatingMenu);
      floatingMenu = null; // Ensure it's nullified
    } catch (e) {
    }
  }
  
  floatingMenu = document.createElement('div');
  floatingMenu.id = 'spellbound-floating-menu';
  
  // Add logo and buttons with data attributes for delegation
  floatingMenu.innerHTML = `
    <div class="spellbound-logo">🪄</div> 
    <div class="spellbound-action-button" data-action="grammar"><span>Grammar & Style</span></div>
    <div class="spellbound-action-button" data-action="enhance"><span>Enhance & Rewrite</span></div>
    <div class="spellbound-action-button" data-action="translate"><span>Translate</span></div>
    <div class="spellbound-action-button spellbound-disable-button" data-action="toggle-disable-menu">
      <span>⚙️</span>
      <div class="spellbound-dropdown">
        <div class="spellbound-dropdown-item" data-action="disable-page">Disable for this site</div>
        <div class="spellbound-dropdown-item" data-action="disable-global">Disable everywhere</div>
      </div>
    </div>
  `;
  
  // Attach ONE listener to the menu container for delegation - USING MOUSEUP
  floatingMenu.addEventListener('mouseup', handleMenuClick); 
  
  // Add mouse enter/leave listeners to track state
  floatingMenu.addEventListener('mouseenter', () => {
    isMouseOverMenu = true;
  });
  floatingMenu.addEventListener('mouseleave', () => {
    isMouseOverMenu = false;
  });

  try {
    document.body.appendChild(floatingMenu);
  } catch (e) {
    console.error('[createFloatingMenu] Error appending menu to body:', e);
  }
}

// Single handler for all menu clicks using event delegation (now triggered by mouseup)
function handleMenuClick(event) {
  event.stopPropagation();
  event.preventDefault();
  
  const target = event.target;
  if (target.closest('.spellbound-logo')) {
      return;
  }
  
  const actionButton = target.closest('.spellbound-action-button, .spellbound-dropdown-item');
  
  if (!actionButton) {
    return; 
  }
  
  const action = actionButton.dataset.action;
  
  switch (action) {
    case 'grammar':
    case 'enhance':
    case 'translate':
      handleTextProcessingAction(action);
      break;
    case 'toggle-disable-menu':
      const disableButton = actionButton.closest('.spellbound-disable-button');
      if (disableButton) {
        const dropdown = disableButton.querySelector('.spellbound-dropdown');
        if (dropdown) {
          dropdown.classList.toggle('active');
        }
      }
      break;
    case 'disable-page':
      disableForCurrentPage();
      break;
    case 'disable-global':
      disableGlobally();
      break;
    default:
      console.warn('Unknown menu action:', action);
  }
}

// Renamed function to handle text processing actions
function handleTextProcessingAction(action) {
  try {
    const currentSelectedText = selectedText;

    if (!currentSelectedText) {
      console.warn('[handleTextProcessingAction] No stored text available, cannot open popup.');
      hideFloatingMenu(); // Hide menu if no text
      return;
    }

    // Send message directly to background to handle storage and opening
    chrome.runtime.sendMessage({
      action: 'handleTextSelection',
      tabType: action,
      selectedText: currentSelectedText // Send the stored text
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[handleTextProcessingAction] Error sending handleTextSelection message:', chrome.runtime.lastError.message);
      }
    });

    hideFloatingMenu();

  } catch (error) {
    console.error('[handleTextProcessingAction] Error:', error);
    hideFloatingMenu(); // Ensure menu hides on error
  }
}

// Disable the floating menu for the current page
function disableForCurrentPage() {
  const currentUrl = window.location.hostname;
  chrome.storage.local.get(['menuSettings'], (result) => {
    const menuSettings = result.menuSettings || { disabledPages: [] };
    
    if (!menuSettings.disabledPages) {
      menuSettings.disabledPages = [];
    }
    
    if (!menuSettings.disabledPages.includes(currentUrl)) {
      menuSettings.disabledPages.push(currentUrl);
    }
    
    chrome.storage.local.set({ menuSettings }, () => {
      isMenuDisabledForPage = true;
      hideFloatingMenu();
      showFeedback('Menu disabled for ' + currentUrl);
    });
  });
}

// Disable the floating menu globally
function disableGlobally() {
  chrome.storage.local.get(['menuSettings'], (result) => {
    const menuSettings = result.menuSettings || {};
    menuSettings.globallyDisabled = true;
    
    chrome.storage.local.set({ menuSettings }, () => {
      isMenuDisabledForPage = true;
      hideFloatingMenu();
      showFeedback('Menu disabled globally');
    });
  });
}

// Show feedback message
function showFeedback(message) {
  const feedback = document.createElement('div');
  feedback.className = 'spellbound-feedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    if (document.body.contains(feedback)) {
      document.body.removeChild(feedback);
    }
  }, 2000);
}

// Calculate optimal position for the floating menu
function calculateMenuPosition(selection) {
  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const menuWidth = 360; // Reduced width for smaller buttons (was 450)
    const menuHeight = 32; // Reduced height to match CSS (was 40)
    
    // Get viewport dimensions safely
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
    
    // Safe scrolling values
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    
    // Default position (above selection, centered)
    let posX = scrollX + rect.left + (rect.width / 2) - (menuWidth / 2);
    let posY = scrollY + rect.top - menuHeight - 10;
    
    // Adjust if off screen horizontally
    if (posX < scrollX) {
      posX = scrollX + 10;
    } else if (posX + menuWidth > scrollX + viewportWidth) {
      // Avoid potential extension context issues by simplifying the calculation
      posX = Math.max(scrollX, scrollX + viewportWidth - menuWidth - 10);
    }
    
    // If not enough space above, position below
    if (posY < scrollY) {
      posY = scrollY + rect.bottom + 10;
    }
    
    return { posX, posY };
  } catch (error) {
    console.error('Error calculating menu position:', error);
    // Return safe fallback position
    return { 
      posX: (window.innerWidth / 2) - (360 / 2),
      posY: 100 
    };
  }
}

// Show floating menu near the selected text
function showFloatingMenu() {
  try {
    chrome.storage.local.get(['menuDisabledGlobally', 'disabledDomains'], (result) => {
      try {
        if (result.menuDisabledGlobally) return;
        const disabledDomains = result.disabledDomains || [];
        const currentDomain = window.location.hostname;
        if (disabledDomains.includes(currentDomain)) return;
        if (isMenuDisabledForPage) return;

        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
          try {
            const selection = window.getSelection();
            if (!selection) return;
            
            const currentTrimmedText = selection.toString().trim();
            if (currentTrimmedText.length > 10) {
              selectedText = currentTrimmedText;
              createFloatingMenu();
              
              const { posX, posY } = calculateMenuPosition(selection);
              
              if (!floatingMenu) {
                console.error('[showFloatingMenu] floatingMenu is null after creation!');
                return;
              }
              
              floatingMenu.style.left = `${posX}px`;
              floatingMenu.style.top = `${posY}px`;
              floatingMenu.style.display = 'flex';
              
              floatingMenu.classList.add('spellbound-menu-appear');
              setTimeout(() => {
                if (floatingMenu) {
                  floatingMenu.classList.remove('spellbound-menu-appear');
                }
              }, 300);

            } else {
              selectedText = ''; 
              if (floatingMenu) {
                 hideFloatingMenu();
              }
            }
          } catch (error) {
            console.error('[showFloatingMenu] Error in selection handling timeout:', error);
            selectedText = ''; // Clear on error
          }
        }, 200);
      } catch (error) {
        console.error('Error in chrome.storage callback:', error);
        selectedText = ''; // Clear on error
      }
    });
  } catch (error) {
    console.error('[showFloatingMenu] Top-level error:', error);
    selectedText = ''; // Clear on error
  }
}

// Hide floating menu
function hideFloatingMenu() {
  if (floatingMenu) {
    floatingMenu.style.display = 'none';
  }
}

// Initialize events
document.addEventListener('mouseup', showFloatingMenu);
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (!isMouseOverMenu && selection && selection.toString().trim().length === 0 && floatingMenu) {
    hideFloatingMenu();
  }
});
document.addEventListener('click', (e) => {
  if (floatingMenu && !floatingMenu.contains(e.target)) {
    hideFloatingMenu();
    const dropdown = floatingMenu.querySelector('.spellbound-dropdown.active');
    if (dropdown) {
      dropdown.classList.remove('active');
    }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && floatingMenu) {
    hideFloatingMenu();
  }
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processText') {
    // Store the selected text in local storage for the popup
    chrome.storage.local.set({ 
      selectedText: message.text,
      activeTab: message.tabType
    });
    
    sendResponse({ success: true });
  } else if (message.action === 'updateMenuSettings') {
    // Update menu settings from popup
    chrome.storage.local.get(['menuSettings'], (result) => {
      if (result.menuSettings && result.menuSettings.globallyDisabled) {
        isMenuDisabledForPage = true;
      } else {
        const currentUrl = window.location.hostname;
        isMenuDisabledForPage = result.menuSettings && 
                               result.menuSettings.disabledPages && 
                               result.menuSettings.disabledPages.includes(currentUrl);
      }
    });
    
    sendResponse({ success: true });
  }
}); 