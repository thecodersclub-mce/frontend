// --- TIMER CONTROL KEYWORD HERE ---
// Change this variable to "disable" or "enable" to use the timer
const timerControlStatus = "enable"; // Set to "enable" to activate time-based control
// Define the quiz start and end times in IST (Indian Standard Time)
// Format: "Month Day, Year HH:MM:SS AM/PM GMT+0530"
// Use an unambiguous format for Date object parsing.
// Example for 5th July 2025, 6:00 PM IST
const quizStartTime = new Date("November 9, 2025 18:00:00 GMT+0530"); // 6:00 PM IST
const quizEndTime = new Date("November 10, 2025 18:00:00 GMT+0530");  // 6:00 PM IST
// --- END TIMER CONTROL KEYWORD ---


// Object to store original text content for jumbling/unjumbling
const originalTextStore = {};

// Function to shuffle characters in a string
function shuffleString(str) {
    let a = str.split("");
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];

    }    return a.join("");
}

// Function to jumble the text content of an element
function jumbleText(element) {
    // Check if element has any text content to jumble and is not just whitespace
    if (element && element.textContent && element.textContent.trim().length > 0) {
        // Use a unique key for storage, preferring element ID or generating one
        const elementKey = element.id || 'jumble-' + Math.random().toString(36).substring(2, 9);
        if (!element.id) { // Assign ID if it didn't exist for consistent lookup
            element.id = elementKey;
        }

        // Store original text if not already stored
        if (!originalTextStore[elementKey]) {
            originalTextStore[elementKey] = element.textContent;
        }
        element.textContent = shuffleString(element.textContent);
    }
}

// Function to unjumble the text content of an element
function unjumbleText(element) {
    if (element && element.id && originalTextStore[element.id]) {
        element.textContent = originalTextStore[element.id];
        // Optionally delete from store if you don't need it after unjumbling
        // delete originalTextStore[element.id];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setLinkStatus(); // Call the main function to set the quiz status based on the keyword

    // --- NEW CODE TO DISABLE COPY/PASTE ---
    const inputsToRestrict = document.querySelectorAll('input[type="text"], input[type="email"], textarea');

    inputsToRestrict.forEach(input => {
        input.addEventListener('copy', (e) => e.preventDefault());
        input.addEventListener('cut', (e) => e.preventDefault());
        input.addEventListener('paste', (e) => e.preventDefault());
    });
    // --- END NEW CODE ---
});

function setLinkStatus() {
    const statusElement = document.getElementById('status');
    const quizQuestionsSection = document.getElementById('quizQuestionsSection');
    const quizOverlay = document.getElementById('quizOverlay');
    const quizForm = document.getElementById('quizForm');
    const submitButton = quizForm.querySelector('.submit-button');
    const elementsToJumble = quizQuestionsSection.querySelectorAll('.form-group p');
    let quizShouldBeEnabled = false;
    const currentTime = new Date();

    // Priority 1: Manual override via linkControlStatus
    if (timerControlStatus === "enable") {
        if (currentTime >= quizStartTime && currentTime < quizEndTime) {
            quizShouldBeEnabled = true;
            statusElement.innerHTML = 'MINDMASH - 25 QNS QUIZ<br>Quiz is LIVE! Ends on 09/11/2025 6:00 PM IST!';
            statusElement.style.color = '#008000'; // Green for active
        } else if (currentTime < quizStartTime) {
            // Quiz not yet started
            quizShouldBeEnabled = false;
            statusElement.innerHTML = 'MINDMASH - 25 QNS QUIZ<br>starts at 6.00 PM on 09/11/2025!';
            statusElement.style.color = '#FFA500'; // Orange for upcoming
        } else {
            // Quiz ended
            quizShouldBeEnabled = false;
            statusElement.innerHTML = 'MINDMASH - 25 QNS QUIZ<br>QUIZ is now CLOSED!'; // Updated text for clarity
            statusElement.style.color = '#CC0000'; // Red for closed
        }
    }
    // Priority 3: Default to disabled if neither manual nor timer is enabling it
    else {
        quizShouldBeEnabled = false;
        statusElement.innerHTML = 'MINDMASH - FINAL QUIZ<br>Stay Tuned for Updates!'; // Indicate manual disable
        statusElement.style.color = '#CC0000'; // Red
    }


    if (quizShouldBeEnabled) {
        // Quiz is Enabled
        quizOverlay.style.opacity = '0';
        setTimeout(() => {
            quizOverlay.style.visibility = 'hidden';
            quizQuestionsSection.classList.remove('quiz-disabled-overlay');
        }, 500);

        quizQuestionsSection.querySelectorAll('input, textarea, select').forEach(input => {
            input.disabled = false;
        });
        submitButton.disabled = false;

        elementsToJumble.forEach(element => {
            unjumbleText(element);
        });
    } else {
        // Quiz is Disabled
        quizOverlay.style.visibility = 'visible';
        quizOverlay.style.opacity = '1';

        quizQuestionsSection.classList.add('quiz-disabled-overlay');

        quizQuestionsSection.querySelectorAll('input, textarea, select').forEach(input => {
            input.disabled = true;
        });
        submitButton.disabled = true;

        elementsToJumble.forEach(element => {
            jumbleText(element);
        });
    }
}

// Handle form submission to Google Sheet via Google Apps Script
const quizForm = document.getElementById('quizForm');
quizForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission

    // Get button and main status element
    const submitButton = this.querySelector('.submit-button');
    const mainStatusElement = document.getElementById('status'); 
    
    // Target the specific paragraph below the quiz questions
    const submissionInfoElement = document.getElementById('submission-info');

    // Check if the form is disabled by the linkControlStatus or timer
    if (submitButton.disabled) {
        alert('The quiz is currently closed or not yet open.');
        return; // Stop submission if disabled
    }

    const formData = new FormData(quizForm);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (key.endsWith('[]')) { // Handle checkbox arrays
            const originalKey = key.slice(0, -2);
            if (!data[originalKey]) {
                data[originalKey] = [];
            }
            data[originalKey].push(value);
        } else {
            data[key] = value;
        }
    }

    // Convert checkbox arrays to comma-separated strings for easier GSheet logging
    for (const key in data) {
        if (Array.isArray(data[key])) {
            data[key] = data[key].join(', ');
        }
    }

    // Replace 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' with your deployed Apps Script URL
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxv8SoMuCJ-OgnwFy5KatXccNBIzPfjLn6YJ0MkZNeDshqdaRjJfyOONsRnupxrWSxf/exec';

    
    // Temporarily disable the submit button and show a loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Status update logic (main status at the top)
    if (mainStatusElement) {
        mainStatusElement.innerHTML = 'Submission in progress, please wait...';
        mainStatusElement.style.color = '#FFA500'; // Orange/Yellow for loading
    }
    
    // Status update logic (info below the quiz)
    if (submissionInfoElement) {
        submissionInfoElement.textContent = 'Submission in progress, please wait...';
        submissionInfoElement.style.color = '#FFA500'; 
    }


    fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for sending data to Apps Script
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data).toString()
        })
        .then(response => {
            // The no-cors mode prevents a true response object, so we assume success here.
            
            // 1. Change button to green, set text, and add 'submitted' class
            submitButton.classList.add('submitted');
            submitButton.innerHTML = '<i class="fas fa-check"></i> Submitted';
            
            // 2. Update the main status element at the top
            if (mainStatusElement) {
                mainStatusElement.innerHTML = 'Quiz successfully submitted! Thank you.';
                mainStatusElement.style.color = '#4CAF50'; // Green for success
            }
            
            // 3. Update the submission info message below the quiz
            if (submissionInfoElement) {
                submissionInfoElement.textContent = 'Quiz successfully submitted!';
                submissionInfoElement.style.color = '#4CAF50';
            }


            // 4. Clear the form fields
            quizForm.reset(); 
        })
        .catch(error => {
            console.error('Error submitting quiz:', error);
            alert('There was an error submitting the quiz. Please try again.');
            
            // Revert button on error
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Quiz'; // Reset button text
            submitButton.classList.remove('submitted');
            
            if (mainStatusElement) {
                mainStatusElement.innerHTML = 'Submission failed. Please try again.';
                mainStatusElement.style.color = '#CC0000'; // Red for failure
            }

            if (submissionInfoElement) {
                submissionInfoElement.textContent = 'Submission failed. Please try again.';
                submissionInfoElement.style.color = '#CC0000';
            }

        })
        .finally(() => {
            // The button stays disabled and green on success.
        });
});

