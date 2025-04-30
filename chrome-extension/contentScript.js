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
      if (document.body.contains(floatingMenu)) {
          document.body.removeChild(floatingMenu);
      }
      floatingMenu = null; // Ensure it's nullified
    } catch (e) {
      console.error('[createFloatingMenu] Error removing existing menu:', e);
      floatingMenu = null; // Ensure nullified even on error
    }
  }
  
  floatingMenu = document.createElement('div');
  floatingMenu.id = 'spellbound-floating-menu';
  
  // Add logo and buttons with data attributes for delegation
  floatingMenu.innerHTML = `
    <div class="spellbound-logo">
        <img src="${chrome.runtime.getURL('icons/icon16.png')}" alt="Spellbound Logo">
    </div> 
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
    if (chrome.runtime.lastError) {
      console.error('[disableForCurrentPage] Error getting menuSettings:', chrome.runtime.lastError.message);
      return;
    }

    const menuSettings = result.menuSettings || { disabledPages: [] };
    
    if (!menuSettings.disabledPages) {
      menuSettings.disabledPages = [];
    }
    
    if (!menuSettings.disabledPages.includes(currentUrl)) {
      menuSettings.disabledPages.push(currentUrl);
    }
    
    chrome.storage.local.set({ menuSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[disableForCurrentPage] Error setting menuSettings:', chrome.runtime.lastError.message);
        showFeedback('Error saving setting');
      } else {
        isMenuDisabledForPage = true;
        hideFloatingMenu();
        showFeedback('Menu disabled for ' + currentUrl);
      }
    });
  });
}

// Disable the floating menu globally
function disableGlobally() {
  chrome.storage.local.get(['menuSettings'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('[disableGlobally] Error getting menuSettings:', chrome.runtime.lastError.message);
      return;
    }
    const menuSettings = result.menuSettings || {};
    menuSettings.globallyDisabled = true;
    
    chrome.storage.local.set({ menuSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[disableGlobally] Error setting menuSettings:', chrome.runtime.lastError.message);
        showFeedback('Error saving setting');
      } else {
        isMenuDisabledForPage = true;
        hideFloatingMenu();
        showFeedback('Menu disabled globally');
      }
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

// Calculate optimal position for the floating menu based on selection range or input element
function calculateMenuPosition(target) {
  try {
    let rect;
    let targetIsInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

    if (target instanceof Selection) {
      if (!target || target.rangeCount === 0 || target.isCollapsed) {
        console.warn('[calculateMenuPosition] Invalid Selection object.');
        return { posX: (window.innerWidth / 2) - (180), posY: 100 }; // Centered fallback
      }
      const range = target.getRangeAt(0);
      rect = range.getBoundingClientRect();
    } else if (targetIsInput) {
       rect = target.getBoundingClientRect();
    } else {
        console.warn('[calculateMenuPosition] Invalid target type.');
        return { posX: (window.innerWidth / 2) - (180), posY: 100 }; // Centered fallback
    }

    if (!rect || (rect.width === 0 && rect.height === 0)) {
        console.warn('[calculateMenuPosition] Could not get valid bounding rect.');
        // Fallback to positioning relative to the element itself if possible
         if (targetIsInput) {
             rect = target.getBoundingClientRect(); // Try again for input
         } else {
            // Try to get element from selection if possible, otherwise fallback
            try {
                const range = target.getRangeAt(0);
                const parentElement = range.commonAncestorContainer.parentElement || document.body;
                rect = parentElement.getBoundingClientRect();
            } catch (e) {
                console.error("Error getting fallback rect from selection parent:", e)
                return { posX: (window.innerWidth / 2) - (180), posY: 100 };
            }
         }
         // If still no valid rect after fallbacks
         if (!rect || (rect.width === 0 && rect.height === 0)) {
             return { posX: (window.innerWidth / 2) - (180), posY: 100 };
         }
    }
    
    const menuWidth = 360; 
    const menuHeight = 32; 
    
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
    
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    
    // Default position (above selection/element, centered)
    let posX = scrollX + rect.left + (rect.width / 2) - (menuWidth / 2);
    let posY = scrollY + rect.top - menuHeight - 10; // 10px buffer above
    
    // Adjust if off screen horizontally
    if (posX < scrollX) {
      posX = scrollX + 10;
    } else if (posX + menuWidth > scrollX + viewportWidth) {
      posX = Math.max(scrollX, scrollX + viewportWidth - menuWidth - 10);
    }
    
    // If not enough space above, position below
    // Also position below if the target is an input field for better UX
    if (posY < scrollY || targetIsInput) {
      posY = scrollY + rect.bottom + 10; // 10px buffer below
      // Ensure it doesn't go off bottom of screen when positioned below
      if (posY + menuHeight > scrollY + viewportHeight) {
          posY = scrollY + viewportHeight - menuHeight - 10; // Place just above bottom edge
          // If really constrained, place it back above if possible
           if (posY < scrollY + rect.top) {
               posY = scrollY + rect.top - menuHeight - 10;
           }
      }
    }
    
    // Final boundary check
    posX = Math.max(scrollX + 5, posX);
    posY = Math.max(scrollY + 5, posY);


    return { posX: Math.round(posX), posY: Math.round(posY) };
  } catch (error) {
    console.error('Error calculating menu position:', error);
    // Return safe fallback position (center top)
    return { 
      posX: Math.round((window.innerWidth / 2) - (180)),
      posY: 100 
    };
  }
}

// Show floating menu near the selected text or within an input field
// targetElement is the element that received the mouseup event, if available
function showFloatingMenu(targetElement = null) { 
  try {
    // Debounce the call slightly to avoid flicker on rapid selections/clicks
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
        chrome.storage.local.get(['menuSettings'], (result) => {
          try {
            if (chrome.runtime.lastError) {
                console.error('[showFloatingMenu] Error getting storage:', chrome.runtime.lastError.message);
                return;
            }

            // Check if globally disabled
            const globallyDisabled = (result.menuSettings && result.menuSettings.globallyDisabled);
            if (globallyDisabled) return;

            // Check if disabled for this site
            const disabledPages = (result.menuSettings && result.menuSettings.disabledPages) ? result.menuSettings.disabledPages : [];
            const currentHostname = window.location.hostname;
            const siteDisabled = disabledPages.includes(currentHostname);
            if (siteDisabled) {
                isMenuDisabledForPage = true;
                return;
            } else {
                isMenuDisabledForPage = false;
            }
            
            let potentialTarget = targetElement || document.activeElement;
            let selectionSource = null; // Will be 'input' or 'window'
            let currentTrimmedText = '';
            let positionTarget = null; // Will be the element or selection object

            // --- Check for selection in input/textarea first ---
            if (potentialTarget instanceof HTMLInputElement || potentialTarget instanceof HTMLTextAreaElement) {
                // Check common text input types
                 const inputType = potentialTarget.type ? potentialTarget.type.toLowerCase() : '';
                 const isTextInput = potentialTarget.tagName === 'TEXTAREA' || 
                                     (potentialTarget.tagName === 'INPUT' && 
                                      ['text', 'search', 'url', 'tel', 'email', 'password', ''].includes(inputType)); // Include '' for default type=text

                if (isTextInput && typeof potentialTarget.selectionStart === 'number' && potentialTarget.selectionStart !== potentialTarget.selectionEnd) {
                    currentTrimmedText = potentialTarget.value.substring(potentialTarget.selectionStart, potentialTarget.selectionEnd).trim();
                    if (currentTrimmedText.length > 0) { // Allow menu for any length in inputs for now
                         selectionSource = 'input';
                         positionTarget = potentialTarget; // Position relative to the input element
                    }
                }
            }

            // --- If no input selection, check window selection ---
            if (!selectionSource) {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
                    currentTrimmedText = selection.toString().trim();
                     if (currentTrimmedText.length > 10) { // Keep minimum length for window selection
                        selectionSource = 'window';
                        positionTarget = selection; // Position relative to the selection range
                    }
                }
            }

            // --- Show or hide menu based on findings ---
            if (selectionSource && currentTrimmedText.length > 0 && positionTarget) { // Require some text
              selectedText = currentTrimmedText; // Store the selected text globally
              
              // Create menu if it doesn't exist
              if (!floatingMenu || !document.body.contains(floatingMenu)) {
                createFloatingMenu(); 
              }
              
              if (!floatingMenu) {
                console.error('[showFloatingMenu] floatingMenu is null even after trying to create it!');
                return; 
              }

              const { posX, posY } = calculateMenuPosition(positionTarget); // Pass the correct target
                            
              floatingMenu.style.left = `${posX}px`;
              floatingMenu.style.top = `${posY}px`;
              floatingMenu.style.display = 'flex';
              
              // Add appear animation (ensure class is removed first if reappearing quickly)
              floatingMenu.classList.remove('spellbound-menu-appear');
              void floatingMenu.offsetWidth; // Trigger reflow to restart animation
              floatingMenu.classList.add('spellbound-menu-appear');
              setTimeout(() => {
                if (floatingMenu) {
                  floatingMenu.classList.remove('spellbound-menu-appear');
                }
              }, 300);

            } else {
              // No valid selection found, or text too short (for window selection)
              selectedText = ''; 
              if (floatingMenu) {
                 hideFloatingMenu();
              }
            }
          } catch (error) {
             if (error.message && error.message.includes('Extension context invalidated')) {
                console.warn('Context invalidated during storage/selection handling, likely page navigation or closure.');
             } else {
                console.error('[showFloatingMenu] Error in selection/storage handling:', error);
             }
             selectedText = ''; // Clear on error
             if (floatingMenu) hideFloatingMenu(); // Hide menu on error
          }
        });
    }, 50); // Short delay (50ms) for debounce
  } catch (error) {
    // Catch top-level errors (less likely now with inner try/catch)
    if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('[showFloatingMenu] Top-level context invalidated.');
    } else {
        console.error('[showFloatingMenu] Top-level error:', error);
    }
    selectedText = ''; 
    if (floatingMenu) hideFloatingMenu();
  }
}

// Hide floating menu
function hideFloatingMenu() {
  if (floatingMenu) {
    floatingMenu.style.display = 'none';
  }
}

// Initialize events
document.addEventListener('mouseup', (event) => {
    try {
        // Prevent triggering if clicking inside the menu itself
        if (floatingMenu && floatingMenu.contains(event.target)) {
            return;
        }
        // Pass the event target to potentially identify input selections
        showFloatingMenu(event.target); 
    } catch (error) {
        console.error('[mouseup listener] Error:', error);
    }
});

document.addEventListener('selectionchange', () => {
  try {
    const selection = window.getSelection();
    const activeElement = document.activeElement;
    
    // Hide menu if:
    // 1. Not hovering over the menu AND
    // 2. Window selection is empty/collapsed AND
    // 3. EITHER the active element is NOT an input/textarea OR it IS but has no selection within it
    // 4. AND the menu is currently visible
    const inputHasSelection = (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) && 
                              activeElement.selectionStart !== activeElement.selectionEnd;
                              
    if (!isMouseOverMenu && 
        (!selection || selection.isCollapsed) &&
        !inputHasSelection &&
        floatingMenu && floatingMenu.style.display !== 'none') 
    {
      hideFloatingMenu();
    }
  } catch (error) {
      console.error('[selectionchange listener] Error:', error);
  }
});

document.addEventListener('click', (e) => {
  try {
    if (floatingMenu && floatingMenu.style.display !== 'none' && !floatingMenu.contains(e.target)) {
      hideFloatingMenu();
      const dropdown = floatingMenu.querySelector('.spellbound-dropdown.active');
      if (dropdown) {
        dropdown.classList.remove('active');
      }
    }
  } catch (error) {
      console.error('[click listener] Error:', error);
  }
});

document.addEventListener('keydown', (e) => {
  try {
    if (e.key === 'Escape' && floatingMenu && floatingMenu.style.display !== 'none') {
      hideFloatingMenu();
    }
  } catch (error) {
      console.error('[keydown listener] Error:', error);
  }
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'processText') {
      // Store the selected text in local storage for the popup
      chrome.storage.local.set({ 
        selectedText: message.text,
        activeTab: message.tabType
      }, () => {
         if (chrome.runtime.lastError) {
            console.error('[onMessage processText] Error setting storage:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
         } else {
            sendResponse({ success: true });
         }
      });
      return true; // Indicate asynchronous response
    } else if (message.action === 'updateMenuSettings') {
      // Update menu settings from popup/options
      chrome.storage.local.get(['menuSettings'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('[onMessage updateMenuSettings] Error getting storage:', chrome.runtime.lastError.message);
             sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return; // Exit early on error
        }

        if (result.menuSettings && result.menuSettings.globallyDisabled) {
          isMenuDisabledForPage = true;
        } else {
          const currentUrl = window.location.hostname;
          isMenuDisabledForPage = result.menuSettings && 
                                 result.menuSettings.disabledPages && 
                                 result.menuSettings.disabledPages.includes(currentUrl);
        }
         sendResponse({ success: true }); // Respond after processing
      });
      return true; // Indicate asynchronous response
    }
  } catch (error) {
      console.error('[onMessage listener] General error:', error);
      // Attempt to send an error response if possible
      try {
          sendResponse({ success: false, error: error.message });
      } catch (e) {
          // Ignore errors trying to send response if channel closed etc.
      }
  }
  // Return false if not sending an async response
  return false; 
}); 