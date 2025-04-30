// Global variables
let selectedText = '';
let floatingMenu = null;
let selectionTimeout = null;
let isMenuDisabledForPage = false;
let isMouseOverMenu = false; // Track mouse state

// Indicator icon variables
let indicatorIcon = null;
let indicatorTargetField = null;
let typingTimer = null;
const typingDelay = 1500; // Increased delay to 1.5 seconds
let suggestionCache = { text: null, count: null };
let showIndicatorIconEnabled = false; // Default to disabled

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

// Load initial setting
chrome.storage.local.get(['settings'], (result) => {
  if (chrome.runtime.lastError) {
      console.error("Error loading initial settings:", chrome.runtime.lastError);
      return;
  }
  if (result.settings && result.settings.showIndicatorIcon !== undefined) {
    showIndicatorIconEnabled = result.settings.showIndicatorIcon;
    console.log('[ContentScript] Initial indicator icon setting:', showIndicatorIconEnabled);
  } else {
    console.log('[ContentScript] Indicator icon setting not found, defaulting to false.');
    showIndicatorIconEnabled = false;
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
    
    const inputHasSelection = (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) && 
                              activeElement.selectionStart !== activeElement.selectionEnd;
                              
    if (!isMouseOverMenu && 
        (!selection || selection.isCollapsed) &&
        !inputHasSelection &&
        floatingMenu && floatingMenu.style.display !== 'none') 
    {
      hideFloatingMenu(); // Only hides the selection floating menu
    }
  } catch (error) {
      console.error('[selectionchange listener] Error:', error);
  }
});

document.addEventListener('click', (e) => {
  try {
    // Hide floating selection menu if clicking outside it
    if (floatingMenu && floatingMenu.style.display !== 'none' && !floatingMenu.contains(e.target)) {
      hideFloatingMenu();
      const dropdown = floatingMenu.querySelector('.spellbound-dropdown.active');
      if (dropdown) {
        dropdown.classList.remove('active');
      }
    }
    
    // Hide indicator icon only if clicking outside the icon AND the target field it belongs to
    if (indicatorIcon && indicatorIcon.style.display !== 'none' && 
        !indicatorIcon.contains(e.target) && 
        (!indicatorTargetField || !indicatorTargetField.contains(e.target))) {
            hideIndicatorIcon();
    }

  } catch (error) {
      console.error('[click listener] Error:', error);
  }
});

document.addEventListener('keydown', (e) => {
  try {
    if (e.key === 'Escape') {
       if (floatingMenu && floatingMenu.style.display !== 'none') {
         hideFloatingMenu();
       }
       if (indicatorIcon && indicatorIcon.style.display !== 'none') {
         hideIndicatorIcon();
       }
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
    } else if (message.action === 'updateIndicatorSettings') {
      console.log('[ContentScript] Received indicator setting update:', message.enabled);
      const wasEnabled = showIndicatorIconEnabled;
      showIndicatorIconEnabled = message.enabled === true;
      // If the setting was just disabled, hide any visible icon immediately
      if (wasEnabled && !showIndicatorIconEnabled) {
          hideIndicatorIcon();
      }
      sendResponse({ success: true });
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

// Function to create or get the indicator icon
function getOrCreateIndicatorIcon() {
  if (!indicatorIcon || !document.body.contains(indicatorIcon)) {
    indicatorIcon = document.createElement('div');
    indicatorIcon.id = 'spellbound-indicator-icon';
    indicatorIcon.style.display = 'none'; // Initially hidden
    // Structure with image and a placeholder for the count badge
    indicatorIcon.innerHTML = `
      <img src="${chrome.runtime.getURL('icons/icon16.png')}" alt="Check Text">
      <span class="spellbound-indicator-count" style="display: none;"></span>
    `;
    indicatorIcon.addEventListener('click', handleIndicatorClick);
    document.body.appendChild(indicatorIcon);
  }
  return indicatorIcon;
}

// Function to update the indicator icon with a count
function updateIndicatorIconCount(count) {
  const icon = getOrCreateIndicatorIcon();
  if (!icon) return;
  
  const countBadge = icon.querySelector('.spellbound-indicator-count');
  if (!countBadge) return;
  
  if (typeof count === 'number' && count > 0) {
    countBadge.textContent = count > 9 ? '9+' : count.toString(); // Cap at 9+
    countBadge.style.display = 'flex'; // Show badge
     // Adjust main icon style slightly if count is shown (optional)
     icon.classList.add('has-count'); 
  } else {
    countBadge.textContent = '';
    countBadge.style.display = 'none'; // Hide badge if count is 0 or invalid
    icon.classList.remove('has-count'); 
  }
}

// Function to position the indicator icon relative to the target field
function positionIndicatorIcon(targetField, showImmediately = false) {
  const icon = getOrCreateIndicatorIcon();
  if (!targetField || !document.body.contains(targetField)) {
      hideIndicatorIcon(); 
      return;
  }
  if (!icon) {
       return;
  }

  try {
    const fieldRect = targetField.getBoundingClientRect();
    // Log the rect specifically when positioning for contenteditable
    /* // Removed logs
    if (targetField.isContentEditable) {
        console.log('[positionIndicatorIcon] Rect for contentEditable target:', JSON.stringify(fieldRect));
    } else {
         console.log('[positionIndicatorIcon] Rect for standard input/textarea:', JSON.stringify(fieldRect));
    }
    */

    // Basic validation of the rect
    if ((fieldRect.width === 0 || fieldRect.height === 0) && !targetField.isContentEditable) {
        console.warn('[positionIndicatorIcon] Target field has zero dimensions and is not contentEditable.');
        hideIndicatorIcon();
        return;
    }
    if (fieldRect.bottom < 0 || fieldRect.top > window.innerHeight || fieldRect.right < 0 || fieldRect.left > window.innerWidth) {
        console.warn('[positionIndicatorIcon] Target field bounding rect seems offscreen.');
        hideIndicatorIcon();
        return;
    }

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    const iconHeight = 24; 
    const iconWidth = 24; 

    // Calculate desired absolute position (relative to document)
    let desiredTop = scrollY + fieldRect.top + (fieldRect.height / 2) - (iconHeight / 2); 
    let desiredLeft = scrollX + fieldRect.right + 5; 

    // Boundary checks (compare absolute desired position with absolute viewport edges)
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const viewportRightEdge = scrollX + viewportWidth;
    const viewportBottomEdge = scrollY + viewportHeight;

    if (desiredLeft + iconWidth > viewportRightEdge - 5) { 
        desiredLeft = scrollX + fieldRect.right - iconWidth - 5; 
    }

    desiredTop = Math.max(scrollY + 5, desiredTop); 
    desiredTop = Math.min(viewportBottomEdge - iconHeight - 5, desiredTop);
    desiredLeft = Math.max(scrollX + 5, desiredLeft); 

    // Apply final position
    icon.style.top = `${Math.round(desiredTop)}px`;
    icon.style.left = `${Math.round(desiredLeft)}px`;
    
    if (showImmediately) {
       icon.style.display = 'flex'; 
    } else {
       updateIndicatorIconCount(null);
       icon.style.display = 'flex'; 
    }
    
    indicatorTargetField = targetField; 
    
  } catch (e) {
      console.error("[positionIndicatorIcon] Error during positioning:", e);
      hideIndicatorIcon();
  }
}

// Function to hide the indicator icon
function hideIndicatorIcon() {
  if (indicatorIcon) {
    indicatorIcon.style.display = 'none';
  }
  indicatorTargetField = null;
  clearTimeout(typingTimer);
  // Clear cache when icon is hidden
  suggestionCache = { text: null, count: null }; 
}

// Handler for clicking the indicator icon
function handleIndicatorClick(event) {
  event.stopPropagation();
  if (!indicatorTargetField) return;

  const textToCheck = indicatorTargetField.value;
  if (!textToCheck || textToCheck.trim().length === 0) {
    hideIndicatorIcon();
    return;
  }
  
  console.log('[handleIndicatorClick] Sending text for grammar check:', textToCheck.substring(0, 50) + '...');

  // Send message to background to open popup with grammar tab
  chrome.runtime.sendMessage({
    action: 'handleTextSelection',
    tabType: 'grammar', // Default to grammar check
    selectedText: textToCheck // Send the full field content
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[handleIndicatorClick] Error sending message:', chrome.runtime.lastError.message);
    }
  });

  hideIndicatorIcon();
}

// Event listener for input events on relevant fields
function handleFieldInput(event) {
  // console.log('[handleFieldInput] Input event triggered for element:', event.target); // Removed log
  const target = event.target;
  if (!showIndicatorIconEnabled || isMenuDisabledForPage) return; 

  clearTimeout(typingTimer);

  if (indicatorIcon && indicatorIcon.style.display !== 'none') {
      hideIndicatorIcon(); 
  }
  
  typingTimer = setTimeout(() => {
    const timerTarget = target; 
    const currentText = timerTarget.isContentEditable ? timerTarget.textContent : timerTarget.value; 
    const trimmedText = currentText.trim(); 

    if (trimmedText.length > 5) { 
       // --- Check Cache --- 
       if (suggestionCache.text === trimmedText && suggestionCache.count !== null) { 
           if (suggestionCache.count > 0) { 
               positionIndicatorIcon(timerTarget, false);
               updateIndicatorIconCount(suggestionCache.count); 
           } else {
               hideIndicatorIcon(); 
           }
           return; 
       }
       
       // --- Cache Miss ---
       updateIndicatorIconCount(null); // Reset icon appearance

       chrome.runtime.sendMessage({ action: 'getSuggestionCount', text: trimmedText }, (response) => { 
         if (chrome.runtime.lastError) {
           console.warn('[handleFieldInput] Context invalidated before receiving suggestion count:', chrome.runtime.lastError.message);
           return;
         }
         
         let count = 0; 

         if (response) { 
            if (response.error) {
              console.error('[handleFieldInput] Background script error fetching count:', response.error);
            } else if (typeof response.count === 'number') {
              count = response.count; 
            } else {
              console.warn('[handleFieldInput] Invalid response content received for suggestion count:', response);
            }
         } else {
             console.warn('[handleFieldInput] Null or undefined response received from background script.');
         }
         
         // Correct cache update is here:
         suggestionCache.text = trimmedText; 
         suggestionCache.count = count; 

         // --- Icon Display Logic --- 
         if (count > 0) {
            positionIndicatorIcon(timerTarget, false);
            updateIndicatorIconCount(count);
         } else {
            hideIndicatorIcon(); 
         }
       });
       
    } else {
       hideIndicatorIcon();
    }
  }, typingDelay);
}

// Event listener for focus events
function handleFieldFocus(event) {
  // Exit early if feature is disabled
  if (!showIndicatorIconEnabled) return; 

  const target = event.target;
   clearTimeout(typingTimer); 
   hideIndicatorIcon(); 
}

// Event listener for blur events
function handleFieldBlur(event) {
   // Exit early if feature is disabled (optional, but good practice)
   if (!showIndicatorIconEnabled) return; 

  // Use a short delay on blur to allow clicking the icon
  setTimeout(() => {
    if (document.activeElement !== indicatorIcon) {
         hideIndicatorIcon(); 
    }
  }, 150);
}

// Function to check if an element is a relevant input field
function isRelevantInputField(element) {
  if (!element) return false;
  const isEditable = element.isContentEditable || (element.parentNode && element.parentNode.isContentEditable);
  
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT') {
    const inputType = element.type ? element.type.toLowerCase() : '';
    const isTextInputType = ['text', 'search', 'url', 'tel', 'email', 'password', ''].includes(inputType);
    return isTextInputType;
  }
  if (isEditable) return true; 
  return false;
}

// Add event listeners dynamically using event delegation on document
document.addEventListener('focusin', (event) => {
  const isRelevant = isRelevantInputField(event.target);
  
  if (isRelevant) {
    handleFieldFocus(event);
    // Use different event for contenteditable?
    const eventNameToListen = event.target.isContentEditable ? 'input' : 'input'; // Stick with input for now, but could be keyup/keydown
    event.target.addEventListener(eventNameToListen, handleFieldInput); 
    event.target.addEventListener('blur', handleFieldBlur);
  }
});

document.addEventListener('focusout', (event) => {
   const isRelevant = isRelevantInputField(event.target);

   if (isRelevant) {
     const eventNameToListen = event.target.isContentEditable ? 'input' : 'input';
     event.target.removeEventListener(eventNameToListen, handleFieldInput);
     event.target.removeEventListener('blur', handleFieldBlur);
     handleFieldBlur(event); 
   }
}); 