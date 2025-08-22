
// 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

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const capabilitiesButton = document.getElementById('capabilities-btn');
const voiceButton = document.getElementById('voice-btn'); // New element
const chatBox = document.getElementById('chat-box');


let messages = [];

// Event listeners
sendButton.addEventListener('click', sendMessage);
capabilitiesButton.addEventListener('click', showCapabilities);
voiceButton.addEventListener('click', toggleVoiceInput); // New event listener
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

const capabilitiesMarkdown = `
**Answer Questions**
* Provide explanations on various topics (science, history, technology, etc.).
* Clarify concepts or definitions.
* Offer general knowledge and trivia.

**Writing Assistance**
* Help draft emails, essays, reports, or creative writing.
* Proofread and edit text for grammar, clarity, and tone.
* Generate ideas or outlines for projects.

**Learning and Education**
* Explain complex topics in simple terms.
* Assist with homework or study questions.
`;

// Voice assistance variables
let recognition;
let synth;

// Check if the browser supports Speech Recognition and Synthesis
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Listen for a single utterance
    recognition.lang = 'en-US';

    // Handle the speech recognition result
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };

    // Handle when speech recognition ends
    recognition.onend = () => {
        voiceButton.classList.remove('active');
        userInput.placeholder = "Type a message...";
    };

    // Handle speech recognition errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceButton.classList.remove('active');
        userInput.placeholder = "Type a message...";
        addMessage('bot', `Voice input error: ${event.error}`);
    };
} else {
    // Hide the voice button if not supported
    voiceButton.style.display = 'none';
    console.warn('Web Speech API is not supported by this browser.');
}

if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
}

function toggleVoiceInput() {
    if (voiceButton.classList.contains('active')) {
        recognition.stop();
    } else {
        voiceButton.classList.add('active');
        userInput.placeholder = "Listening...";
        recognition.start();
    }
}

async function sendMessage() {
    // ... (rest of the sendMessage function remains the same) ...
    // After the bot's reply is received, add a call to speak the reply
    try {
      // ... (existing code to fetch bot reply) ...
      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again.";

      updateMessage(botThinkingMessage, botReply);
      messages.push({ role: "assistant", content: botReply });

      // Speak the bot's reply
      speakMessage(botReply);

    } catch (error) {
      // ... (existing error handling) ...
    } finally {
      // ... (existing finally block) ...
    }
}

function speakMessage(text) {
    if (synth) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2; // Optional: control the speech rate
        synth.speak(utterance);
    }
}
function showCapabilities() {
    // Add the special message to the chat
    addMessage('special', capabilitiesMarkdown);
}

async function sendMessage() {
    const userMessageText = userInput.value.trim();
    if (!userMessageText) return;

    // Add user message to the chat
    messages.push({ role: "user", content: userMessageText });
    addMessage('user', userMessageText);

    // Clear input and disable button
    userInput.value = '';
    sendButton.disabled = true;

    // Add thinking message for the bot
    const botThinkingMessage = addMessage('bot', 'Thinking...', true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: messages,
                max_tokens: 450,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again.";

        // Update the thinking message with the bot's reply
        updateMessage(botThinkingMessage, botReply);
        messages.push({ role: "assistant", content: botReply });

    } catch (error) {
        console.error("Error fetching bot reply:", error);
        updateMessage(botThinkingMessage, "An error occurred. Please try again.");
    } finally {
        // Re-enable the send button and scroll to the bottom
        sendButton.disabled = false;
        scrollToBottom();
    }
}

function addMessage(sender, text, isTemporary = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (sender === 'special') {
        messageElement.classList.add('special-message');
    } else {
        messageElement.classList.add(`${sender}-message`);
    }

    messageElement.innerHTML = marked.parse(text);

    if (isTemporary) {
        messageElement.classList.add('thinking-message');
    }

    chatBox.appendChild(messageElement);

    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);

    // Only scroll to bottom for user-sent messages to preserve scroll position
    if (sender === 'user' || sender === 'special') {
      scrollToBottom();
    }

    return messageElement;
}

function updateMessage(element, newText) {
    const htmlContent = marked.parse(newText);
    element.innerHTML = htmlContent;
    element.classList.remove('thinking-message');
    scrollToBottom();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}