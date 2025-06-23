// API Configuration
const workerUrl = "https://proxy-api-worker.janithaathmajch.workers.dev"; // Cloudflare Worker URL

// Global variables
let isRegistered = false;
let dailyUsageCount = 0;
let currentLanguage = 'english';
let generatedVideoTitle = ''; // To store the first generated video title
let generatedVideoDescription = '';
let chatHistory = [];
let recognition = null; // Speech recognition instance
let isListening = false; // Flag for voice recognition state
let seoChartInstance = null; // To hold the Chart.js instance

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Show loading screen for 3 seconds
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
    }, 3000);

    // Load saved data
    loadSavedData();
    
    // Setup event listeners
    setupEventListeners();
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Setup theme toggle
    setupThemeToggle();
     // Setup sidebar toggle
    addChatHistoryButton(); // This adds the history button to the chat panel
    // Apply visual improvements to the chat panel
    applyChatUIImprovements();
}

function loadSavedData() {
    // Load registration status
    const savedRegistration = localStorage.getItem('jgs_registered');
    if (savedRegistration === 'true') {
        isRegistered = true;
        document.getElementById('registerBtn').classList.add('hidden');
        document.getElementById('registeredStatus').classList.remove('hidden');
    }
    
    // Load daily usage count
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('jgs_usage_date');
    if (savedDate === today) {
        dailyUsageCount = parseInt(localStorage.getItem('jgs_usage_count') || '0');
    } else {
        dailyUsageCount = 0;
        localStorage.setItem('jgs_usage_date', today);
        localStorage.setItem('jgs_usage_count', '0');
    }
    
    // Load chat history
    const savedChat = localStorage.getItem('jgs_chat_history');
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        // Do not display chat history on load. It will be available in a popup.
        // displayChatHistory();
    }
    
    // Load language preference
    const savedLanguage = localStorage.getItem('jgs_language');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.getElementById('languageSelect').value = savedLanguage;
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('jgs_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('themeToggle').checked = true;
    }
}

function setupEventListeners() {
    // Feature card clicks
    document.getElementById('youtubeContentCard').addEventListener('click', () => {
        if (checkUsageLimit()) {
            showSection('youtubeContentPlanner');
        }
    });
    
    document.getElementById('youtubeThumbnailCard').addEventListener('click', () => {
        if (checkUsageLimit()) {
            showSection('youtubeThumbnailAnalyzer');
        }
    });
    
    document.getElementById('socialMediaCard').addEventListener('click', () => {
        if (checkUsageLimit()) {
            showSection('socialMediaPlanner');
        }
    });
    
    // Generate buttons
    document.getElementById('generatePlanBtn').addEventListener('click', generateYouTubePlan);
    document.getElementById('analyzeThumbnailBtn').addEventListener('click', analyzeThumbnail);
    document.getElementById('generateSocialPlanBtn').addEventListener('click', generateSocialPlan);
    
    // Category select
    document.getElementById('categorySelect').addEventListener('change', function() {
        const customInput = document.getElementById('customCategory');
        if (this.value === 'custom') {
            customInput.classList.remove('hidden');
            customInput.focus();
        } else {
            customInput.classList.add('hidden');
        }
    });
    
    // Registration
    document.getElementById('registerBtn').addEventListener('click', openRegistrationModal);
    document.getElementById('verifyBtn').addEventListener('click', verifyRegistration);
    document.getElementById('completeRegisterBtn').addEventListener('click', completeRegistration);
    
    // Language selection
    document.getElementById('languageSelect').addEventListener('change', function() {
        currentLanguage = this.value;
        localStorage.setItem('jgs_language', currentLanguage);
    });
    
    // Chat functionality
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    document.getElementById('voiceBtn').addEventListener('click', toggleVoiceRecognition);
    
    // File upload
    document.getElementById('thumbnailUpload').addEventListener('change', handleFileUpload);
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('thumbnailUpload').click();
    });
    document.getElementById('uploadArea').addEventListener('dragover', handleDragOver);
    document.getElementById('uploadArea').addEventListener('drop', handleFileDrop);
    
    // Output actions
    document.getElementById('saveAsPdfBtn').addEventListener('click', saveAsPDF);
    document.getElementById('copyOutputBtn').addEventListener('click', copyOutput);
      const showTemplateBtn = document.getElementById('showLiveVideoTemplateBtn');
    if (showTemplateBtn) {
        showTemplateBtn.addEventListener('click', showLiveVideoTemplatePopup);
        // Initially hide the button
        showTemplateBtn.classList.add('hidden');
    }
}

function setupThemeToggle() {
    document.getElementById('themeToggle').addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('light-theme');
            localStorage.setItem('jgs_theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('jgs_theme', 'dark');
        }
    });
}

function addChatHistoryButton() {
    const chatSection = document.getElementById('chatSection');
    const messagesContainer = document.getElementById('chatMessages');
    if (chatSection && messagesContainer) {
        const historyBtn = document.createElement('button');
        historyBtn.id = 'chatHistoryBtn';
        historyBtn.innerHTML = '<i class="fas fa-history"></i> History';
        historyBtn.title = 'View Chat History';
        // Basic styling to place it in the top-right corner of the chat section
        historyBtn.style.position = 'absolute';
        historyBtn.style.top = '20px';
        historyBtn.style.right = '20px';
        historyBtn.style.zIndex = '10';
        historyBtn.style.padding = '8px 12px';
        historyBtn.style.cursor = 'pointer';
        historyBtn.style.border = '1px solid #4a5568';
        historyBtn.style.borderRadius = '5px';

        historyBtn.addEventListener('click', showChatHistoryPopup);
        chatSection.style.position = 'relative'; // Needed for absolute positioning of the button
        chatSection.insertBefore(historyBtn, messagesContainer);
    }
}

function checkUsageLimit() {
    if (!isRegistered && dailyUsageCount >= 1) {
        showLimitationModal();
        return false;
    }
    return true;
}

function incrementUsage() {
    if (!isRegistered) {
        dailyUsageCount++;
        localStorage.setItem('jgs_usage_count', dailyUsageCount.toString());
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = ['welcomeSection', 'youtubeContentPlanner', 'youtubeThumbnailAnalyzer', 'socialMediaPlanner', 'aiOutputSection', 'chatSection'];
    sections.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show requested section
    document.getElementById(sectionId).classList.remove('hidden');
}

function showWelcomeSection() {
    showSection('welcomeSection');
}

async function generateYouTubePlan() {
    if (!checkUsageLimit()) return;

    const categorySelect = document.getElementById('categorySelect').value;
    const category = categorySelect === 'custom'
        ? document.getElementById('customCategory').value.trim()
        : categorySelect.trim();

    const prompt = document.getElementById('contentPrompt').value.trim();
    const numTags = document.getElementById('numTags').value;
    const numHashtags = document.getElementById('numHashtags').value;

    if (!category || !prompt) {
        alert('Please fill in all required fields.');
        return;
    }

    incrementUsage();

    const fullPrompt = `
You are an award-winning, elite-level YouTube strategist, SEO researcher, content creator, and digital growth architect. Your task is to develop a fully optimized, high-performance YouTube content plan that is strategic, data-driven, and capable of going viral.

Use advanced-level copywriting, SEO, and audience engagement psychology to craft the entire plan. Assume this is for a top-tier content creator aiming to maximize reach, retention, monetization, and audience loyalty.

---

### 🔍 USER INPUT:
- **Category:** ${category}
- **Video Idea:** ${prompt}
- **Required Tags:** ${numTags}
- **Required Hashtags:** ${numHashtags}
- **Language:** ${currentLanguage}

---

### 🧠 THINKING INSTRUCTIONS:
Analyze and think like a high-performing YouTube channel with millions of subscribers. Each section must be practical, strategic, and designed to deliver results.

---

### ✅ OUTPUT FORMAT (Language: ${currentLanguage}):

## 1. STRATEGIC OVERVIEW
Give a high-level overview of the video potential, relevance to the category, trends it aligns with, and projected content performance.

## 2. VIDEO IDEA TRANSFORMATION
Improve and elevate the idea. Add a unique twist, viral angle, or story hook that makes the content irresistible.

## 3. CLICKBAIT-FREE TITLE VARIANTS
Create 3 short, optimized titles under 60 characters using power words, emotion, and keyword targeting.
* Title 1:
* Title 2:
* Title 3:

## 4. SEO-RICH VIDEO DESCRIPTION (Inside Copyable Code Block)
\`\`\`copyable
[Opening Hook - strong 2 lines before “show more” cutoff]

[Detailed description using primary and semantic keywords. Show what the viewer learns and why it matters.]

⏰ TIMESTAMPS:
00:00 - Hook + Intro
01:15 - [Main Section 1]
03:45 - [Main Section 2]
06:00 - [Main Section 3]
08:30 - Wrap-up & CTA

🔔 SUBSCRIBE & ENGAGE:
Encourage likes, comments, shares, and ask a thought-provoking question.

🔗 RESOURCES & LINKS:
- [Related content or affiliate links]

🤝 CONNECT:
- Instagram: [Handle]
- Facebook: [Page]
- Website: [URL]

#${category.replace(/\s+/g, '')} #[Keyword2] #[Keyword3]
\`\`\`

## 5. SHORT VIDEO COPY
Short summary (2–3 lines) for use in Shorts or social captions. Intriguing and emotionally compelling.

## 6. SEO TAGS (${numTags})
\`\`\`copyable
[tag1, tag2, tag3, ...]
\`\`\`

## 7. HASHTAGS (${numHashtags})
\`\`\`copyable
#hashtag1 #hashtag2 #hashtag3 ...
\`\`\`

## 8. THUMBNAIL STRATEGY
Describe layout, emotional trigger, color contrast, subject position, and text overlay recommendations.

## 9. VIDEO EDITING STRATEGY
Recommend pacing, pattern interrupts, B-roll usage, on-screen text, editing software, and stylistic tone.

## 10. GROWTH TACTICS
Advanced promotion tactics: Community posts, teaser trailers, collabs, Shorts, and pinned comments strategy.

## 11. SUCCESS POTENTIAL ANALYSIS
Audience fit, topic longevity, ad revenue potential, viral trigger assessment.

## 12. SEO AUDIT SCORECARD
- **Keyword Optimization:** /100
- **Title Strength:** /100
- **Description Quality:** /100
- **Readability:** /100
- **Total Score:** %

## 13. SEARCH RANK PREDICTION
- **Estimated Ranking:** [1–10]
- **Success Probability:** [Exact %]
- **Key Success Factors:** [List top items]
- **Suggestions to Improve:** [List]
`;

    await generateAIContent(fullPrompt, 'youtube');
}

async function analyzeThumbnail() {
    if (!checkUsageLimit()) return;

    const fileInput = document.getElementById('thumbnailUpload');
    const analysisPrompt = document.getElementById('analysisPrompt').value;

    if (!fileInput || fileInput.files.length === 0) {
        alert('Please upload a thumbnail image first.');
        return;
    }

    incrementUsage();

    const file = fileInput.files[0];
    const promptText = analysisPrompt || 'Analyze this YouTube thumbnail with deep-level feedback on effectiveness, design psychology, and CTR optimization.';

    try {
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });

        const imageMimeType = file.type;

        const fullPrompt = {
            text: `
You are a professional YouTube strategist and graphic designer who specializes in thumbnail optimization for maximum click-through rate (CTR) and audience retention.

Analyze the following thumbnail image with surgical precision and creativity. Assume the creator wants **high performance and viral impact**.

---

### 🔍 USER REQUEST:
${promptText}

### 📌 OUTPUT FORMAT (Language: ${currentLanguage}):

## 1. VISUAL IMPACT REVIEW
- **Score (1-10):** [Visual impression]
- **Strengths:** [Color contrast, emotion, design balance, expression]
- **Weaknesses:** [Overcrowding, low readability, muted visuals]

## 2. CTR POTENTIAL
- **Predicted Click Rate:** [%]
- **Based on:** [Font size, facial expression, emotional trigger, curiosity]

## 3. DESIGN & PSYCHOLOGY FEEDBACK
- Font readability
- Subject placement
- Composition balance
- Use of visual storytelling

## 4. SPECIFIC RECOMMENDATIONS
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## 5. PRIORITY CHANGES
**Top 3 Immediate Fixes:**
- [Fix A]
- [Fix B]
- [Fix C]

## 6. REFERENCE STYLES (Optional)
Suggest similar successful thumbnails as examples (mention channels or formats if needed).

IMPORTANT: All content must be in ${currentLanguage}.
`,
            image: {
                mimeType: imageMimeType,
                data: base64Image
            }
        };

        await generateAIContent(fullPrompt, 'thumbnail');

    } catch (error) {
        console.error('Error preparing thumbnail for analysis:', error);
        const outputDiv = document.getElementById('aiOutput');
        outputDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Could not process the image. Please try a different image or check the console for errors.</div>';
    }
}


async function generateSocialPlan() {
    if (!checkUsageLimit()) return;

    const platform = document.getElementById('platformSelect').value.trim();
    const contentType = document.getElementById('contentTypeSelect').value.trim();
    const contentPrompt = document.getElementById('socialContentPrompt').value.trim();

    if (!platform || !contentType || !contentPrompt) {
        alert('Please fill in all required fields.');
        return;
    }

    incrementUsage();

    const fullPrompt = `
You are a senior social media growth strategist working with global brands. Create a highly professional, fully optimized, platform-specific content strategy with maximum virality, engagement, and brand recall.

---

### 🔍 USER INPUT:
- **Platform:** ${platform}
- **Content Type:** ${contentType}
- **Content Prompt:** ${contentPrompt}
- **Language:** ${currentLanguage}

---

### 📌 OUTPUT FORMAT (Language: ${currentLanguage}):

## 1. PLATFORM STRATEGY OVERVIEW
- **Audience Behavior on ${platform}**
- **Current Trend Alignment**
- **Virality & Brand Fit Analysis**

## 2. CONTENT OPTIMIZATION GUIDE
- **Format Guidance:** (e.g., Reel, Post, Story, Carousel, Tweet)
- **Emotional Triggers:** [What to use]
- **Visual Structure Tips:** [Composition & Branding]

## 3. PRIMARY CAPTION (Copyable)
\`\`\`copyable
[1 Highly optimized caption — includes hook, CTA, keywords]
\`\`\`

## 4. ALTERNATIVE CAPTIONS
- [Caption 2]
- [Caption 3]

## 5. HASHTAG STRATEGY
- **Main Hashtags:** [10-15]
- **Niche Hashtags:** [5-10]
- **Trending Hashtags:** [Top 3 current ones]

## 6. POSTING TIMING & FREQUENCY
- **Best Days:** [e.g., Tue/Thu/Sun]
- **Best Times:** [e.g., 6pm-9pm]
- **Recommended Frequency:** [How often per week]

## 7. ENGAGEMENT STRATEGY
- **Pre-Post Activities:** [Countdown, teaser, polls]
- **Post-Launch:** [Pin comment, DM replies, story reposts]
- **Community Growth Tips:** [Contests, collaborations, giveaways]

## 8. VISUAL CONTENT GUIDELINES
- **Image/Video Size:** [Specs]
- **Color Palette & Aesthetic**
- **Text Placement Strategy**

## 9. GROWTH & SCALING INSIGHTS
- **Content Series Ideas**
- **Cross-Promotion Tips**
- **Paid Boost Strategy (if applicable)**

IMPORTANT: Write everything clearly, copyable, in ${currentLanguage}.
`;

    await generateAIContent(fullPrompt, 'social');
}


async function generateAIContent(prompt, type) {
    showSection('aiOutputSection');
    const outputDiv = document.getElementById('aiOutput');

    outputDiv.innerHTML = '<div class="typing-indicator">Generating content...<div class="typing-dots"></div></div>';

    // Construct the payload based on the prompt type
    let requestBody;
    if (typeof prompt === 'string') {
        // For text-only prompts
        requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
        };
    } else if (typeof prompt === 'object' && prompt.image) {
        // For multimodal (image + text) prompts
        requestBody = {
            contents: [{
                parts: [
                    { text: prompt.text },
                    { inline_data: { mime_type: prompt.image.mimeType, data: prompt.image.data } }
                ]
            }],
        };
    } else {
        outputDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Invalid prompt format.</div>';
        return;
    }

    // Add generationConfig to the requestBody
    requestBody.generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
    };

    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
         // Extract first title and description for the live video template if it's a YouTube plan
        if (type === 'youtube') {
            const titleMatch = aiResponse.match(/## 3\. OPTIMIZED VIDEO TITLES\s*\* Title 1: (.*)/);
            if (titleMatch && titleMatch[1]) {
                generatedVideoTitle = titleMatch[1].trim();
            }
            const descriptionMatch = aiResponse.match(/## 4\. ADVANCED VIDEO DESCRIPTION\s*\`\`\`copyable\n([\s\S]*?)\n\`\`\`/);
            if (descriptionMatch && descriptionMatch[1]) {
                generatedVideoDescription = descriptionMatch[1].trim();
            }
        }
        
        // Use the superior formatAIResponse function to parse markdown and display content.
        // This replaces the old, less reliable displayFormattedContent function.
        outputDiv.innerHTML = formatAIResponse(aiResponse);

        // Animate the appearance of the new content
        outputDiv.style.opacity = '0';
        outputDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            outputDiv.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            outputDiv.style.opacity = '1';
            outputDiv.style.transform = 'translateY(0)';
        }, 50);
        
        // Show SEO chart for YouTube content
        if (type === 'youtube') {
              // Show the Live Video Template button
            const liveTemplateBtn = document.getElementById('showLiveVideoTemplateBtn');
            if (liveTemplateBtn) {
                liveTemplateBtn.classList.remove('hidden');
            }
             // Parse the SEO data from the raw text response
            const seoData = parseSeoDataFromResponse(aiResponse);
               const seoChartEl = document.getElementById('seoChart');
            
            // Check if we have any data to render
            if (seoChartEl && Object.keys(seoData).length > 0) {
                renderSeoChart(seoData);
             } else if (seoChartEl) {
                // Hide the chart if no data is found
                document.getElementById('seoChart').classList.add('hidden');
            }
        }
        
    } catch (error) {
        console.error('Error generating AI content:', error);
        // The indicator will be cleared by the line below.
        outputDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Sorry, there was an error generating content. Please try again later.</div>`;
    }
}

async function displayFormattedContent(content, container) {
    container.innerHTML = '';
    
    // Split content by main sections (##)
    const sections = content.split(/(?=##\s*\d+\.)/);
    
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'content-section';
            
            // Process section content
            const formattedSection = formatSectionContent(section);
            
            // Add typing effect
            await typeFormattedContent(formattedSection, sectionDiv);
            container.appendChild(sectionDiv);
            
            // Small delay between sections
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

function formatSectionContent(content) {
    let formatted = content;
    
    // Format main headers (##)
    formatted = formatted.replace(/^##\s*(\d+\.\s*.*$)/gim, '<div class="section-header"><i class="fas fa-star"></i><h2>$1</h2></div>');
    
    // Format sub-headers (**)
    formatted = formatted.replace(/\*\*(.*?):\*\*/g, '<div class="sub-header"><h3>$1:</h3></div>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<div class="sub-header"><h3>$1</h3></div>');
    
    // Format lists with bullets
    formatted = formatted.replace(/^[-•]\s*(.*$)/gim, '<li class="bullet-item">$1</li>');
    
    // Format numbered lists
    formatted = formatted.replace(/^\d+\.\s*(.*$)/gim, '<li class="numbered-item">$1</li>');
    
    // Wrap consecutive list items
    formatted = formatted.replace(/(<li class="bullet-item">.*?<\/li>)/gs, '<ul class="bullet-list">$1</ul>');
    formatted = formatted.replace(/(<li class="numbered-item">.*?<\/li>)/gs, '<ol class="numbered-list">$1</ol>');
    
    // Format hashtags and tags
    formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    
    // Format code blocks for copyable content
    formatted = formatted.replace(/\[([^\]]+)\]/g, '<div class="copyable-content"><div class="copy-header"><span>Click to Copy</span><i class="fas fa-copy copy-icon"></i></div><div class="copy-text">$1</div></div>');
    
    // Format regular paragraphs
    const lines = formatted.split('\n');
    let result = '';
    let inList = false;
    
    for (let line of lines) {
        line = line.trim();
        if (line) {
            if (line.includes('<li class=') || line.includes('<ul class=') || line.includes('<ol class=')) {
                inList = true;
                result += line + '\n';
            } else if (line.includes('</ul>') || line.includes('</ol>')) {
                inList = false;
                result += line + '\n';
            } else if (line.includes('<div class="section-header">') || line.includes('<div class="sub-header">') || line.includes('<div class="copyable-content">')) {
                result += line + '\n';
            } else if (!inList && !line.includes('<h') && !line.includes('<div')) {
                result += '<p class="content-paragraph">' + line + '</p>\n';
            } else {
                result += line + '\n';
            }
        }
    }
    
    return result;
}

async function typeFormattedContent(htmlContent, element) {
    element.innerHTML = htmlContent;
    
    // Add click handlers for copyable content
    const copyableElements = element.querySelectorAll('.copyable-content');
    copyableElements.forEach(copyElement => {
        copyElement.addEventListener('click', function() {
            const textToCopy = this.querySelector('.copy-text').textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const copyIcon = this.querySelector('.copy-icon');
                const originalClass = copyIcon.className;
                copyIcon.className = 'fas fa-check copy-icon copied';
                setTimeout(() => {
                    copyIcon.className = originalClass;
                }, 2000);
            });
        });
    });
    
    // Animate the section appearance
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    return new Promise(resolve => {
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            resolve();
        }, 100);
    });
}

/**
 * Renders the SEO analysis chart using Chart.js.
 * @param {object} seoData - An object containing SEO scores.
 * e.g., { keyword: 85, readability: 75, title: 90, description: 80 }
 */
function renderSeoChart(seoData) {
      if (!document.getElementById('seoChart') || !document.getElementById('seoCanvas')) return;
    const seoChartContainer = document.getElementById('seoChart');
    const ctx = document.getElementById('seoCanvas').getContext('2d');

    // If a chart instance already exists, destroy it before drawing a new one
    if (seoChartInstance) {
        seoChartInstance.destroy();
    }

    // Chart.js data configuration
    const data = {
        labels: ['Keyword Optimization', 'Readability', 'Title Strength', 'Description Quality'],
        datasets: [{
            label: 'SEO Score (out of 100)',
            data: [
                seoData.keyword || 0, 
                seoData.readability || 0, 
                seoData.title || 0, 
                seoData.description || 0
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)'
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };

    // Chart.js configuration options
    const config = {
        type: 'bar', // Can be 'line', 'radar', 'pie', etc.
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100 // Set the maximum value for the y-axis
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide the legend if not needed
                },
                title: {
                    display: true,
                    text: 'SEO Performance Breakdown'
                }
            }
        }
    };

    // Create the new chart and store the instance
    seoChartInstance = new Chart(ctx, config);

    // Make the chart container visible
    seoChartContainer.classList.remove('hidden');
}
/**
 * Parses the AI response text to extract SEO scores.
 * @param {string} responseText - The full text response from the AI.
 * @returns {object} An object containing the parsed SEO scores.
 */
function parseSeoDataFromResponse(responseText) {
    const seoData = {};
    const extractScore = (regex) => {
        const match = responseText.match(regex);
        // Return the parsed number or 0 if not found
        return match ? parseInt(match[1], 10) : 0;
    };
     seoData.keyword = extractScore(/\*\*Keyword Optimization:\*\*\s*\[?(\d+)/);
    seoData.readability = extractScore(/\*\*Readability:\*\*\s*\[?(\d+)/);
    seoData.title = extractScore(/\*\*Title Strength:\*\*\s*\[?(\d+)/);
    seoData.description = extractScore(/\*\*Description Quality:\*\*\s*\[?(\d+)/);

    return seoData;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    if (!checkUsageLimit()) return;

    // Hide other sections and show chat
    showSection('chatSection');

    // Clear input
    input.value = '';

    // Add user message
    addChatMessage(message, 'user');

    // Define a powerful system prompt for a high-quality, general-purpose chatbot
    const systemPrompt = `You are JGS AI, a highly advanced, multilingual conversational assistant. Your purpose is to provide users with accurate, insightful, and well-structured answers on any topic.
- You must communicate fluently in Sinhala, Tamil, and English.
- Always respond in the same language as the user's last message. The primary language for this conversation is set to ${currentLanguage}.
- Structure your answers for clarity. When appropriate, use markdown for formatting:
  - Use **bold text** for emphasis.
  - Use bullet points starting with * for lists.
- Your responses should be high-quality, helpful, and maintain a friendly, professional tone.`;

    // Construct the conversation history for the API in the correct format
    const historyForApi = chatHistory.slice(-6).flatMap(chat => ([
        { role: "user", parts: [{ text: chat.user }] },
        { role: "model", parts: [{ text: chat.ai }] }
    ]));

    const contents = [
        ...historyForApi,
        { role: "user", parts: [{ text: message }] }
    ];

    const requestBody = {
        contents: contents,
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            throw new Error('The model returned an empty or blocked response.');
        }
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Add AI response with typing effect
        await addChatMessageWithTyping(aiResponse, 'ai');

        // Save to chat history
        chatHistory.push({ user: message, ai: aiResponse, timestamp: Date.now() });
        localStorage.setItem('jgs_chat_history', JSON.stringify(chatHistory));
        
        incrementUsage();
        
    } catch (error) {
        console.error('Error in chat:', error);
        addChatMessageWithTyping('I apologize, but I encountered an error while processing your request. Please try again.', 'ai');
    }
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    // Format message to display newlines correctly
    content.innerHTML = message.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function addChatMessageWithTyping(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);

    // Typing effect
    const formattedMessage = formatChatMessage(message);
    await typeText(formattedMessage, content);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function typeText(html, element) {
    // Instantly render the formatted message to improve user experience and fix formatting issues.
    // The original typing effect was slow and didn't handle newlines.
    element.innerHTML = html;
    return Promise.resolve();
}

/**
 * Formats a raw text string with simple markdown into HTML for chat display.
 * @param {string} text The raw text from the AI.
 * @returns {string} The formatted HTML string.
 */
function formatChatMessage(text) {
    if (!text) return '';

    // Convert **bold** to <strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert markdown-style lists to HTML lists
    html = html.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
    // Wrap consecutive list items in <ul> tags
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert remaining newlines to <br>, but not inside list tags
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<\/li><br>/g, '</li>'); // Remove <br> after a list item

    return html;
}

function displayChatHistory() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    chatHistory.forEach(chat => {
        addChatMessage(chat.user, 'user');
        addChatMessage(chat.ai, 'ai');
    });
}

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'sinhala' ? 'si-LK' : (currentLanguage === 'tamil' ? 'ta-LK' : 'en-US');
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
        };
        
        recognition.onend = function() {
            isListening = false;
            document.getElementById('voiceBtn').classList.remove('recording');
        };
    }
}

function toggleVoiceRecognition() {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser.');
        return;
    }
    
    if (isListening) {
        recognition.stop();
        isListening = false;
        document.getElementById('voiceBtn').classList.remove('recording');
    } else {
        recognition.start();
        isListening = true;
        document.getElementById('voiceBtn').classList.add('recording');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const uploadArea = document.getElementById('uploadArea');
        const uploadPrompt = uploadArea.querySelector('.upload-prompt');
        const uploadStatus = uploadArea.querySelector('.upload-status');

        if (uploadPrompt) {
            uploadPrompt.style.display = 'none'; // Hide the initial prompt
        }
        
        if (uploadStatus) {
            uploadStatus.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
                <p style="color: #10b981;">File ready: ${file.name}</p>
            `;
            uploadStatus.style.display = 'block'; // Show the status
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const uploadArea = event.currentTarget;
    uploadArea.classList.remove('drag-over');

    if (files.length > 0) {
        document.getElementById('thumbnailUpload').files = files;
        handleFileUpload({ target: { files: files } });
    }
}

function openRegistrationModal() {
    document.getElementById('registrationModal').classList.remove('hidden');
    // Ensure the modal starts at the correct step: showing the registration link button first.
    document.getElementById('verificationStep').classList.add('hidden');
    document.getElementById('registerStep').classList.remove('hidden');
}

function closeRegistrationModal() {
    document.getElementById('registrationModal').classList.add('hidden');
}

function verifyRegistration() {
    const code = document.getElementById('verificationCode').value.trim();
    // This function now handles the FINAL verification and registration completion.
    if (code === 'UIM167658CM' || code === 'UIM168558CM') {
        // If the code is valid, complete the registration.
        isRegistered = true;
        localStorage.setItem('jgs_registered', 'true');

        document.getElementById('registerBtn').classList.add('hidden');
        document.getElementById('registeredStatus').classList.remove('hidden');

        closeRegistrationModal();
    } else {
        alert('Invalid verification code. Please try again.');
    }
}

function completeRegistration() {
    // This function's only job is to open the external registration form.
    window.open('https://forms.gle/J5rPrkWNrFTgaV6s5', '_blank');
    // After opening the link, switch the modal to the verification code input step.
    document.getElementById('registerStep').classList.add('hidden');
    document.getElementById('verificationStep').classList.remove('hidden');
}

function showLimitationModal() {
    document.getElementById('limitationModal').classList.remove('hidden');
}

function closeLimitationModal() {
    document.getElementById('limitationModal').classList.add('hidden');
}

function showChatHistoryPopup() {
    if (document.getElementById('historyModalOverlay')) return;

    // Add styles for the modal if they don't exist
    if (!document.getElementById('historyModalStyles')) {
        const style = document.createElement('style');
        style.id = 'historyModalStyles';
        style.innerHTML = `
            .history-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;
            }
            .history-modal {
                background: #2d3748; color: #f7fafc; border-radius: 8px; width: 90%; max-width: 600px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5); display: flex; flex-direction: column;
            }
            .history-modal-header {
                padding: 15px; border-bottom: 1px solid #4a5568; display: flex; justify-content: space-between; align-items: center;
                flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
            }
            .history-modal-header h2 { margin: 0; font-size: 1.25rem; }
            .history-modal-close-btn { background: none; border: none; font-size: 1.5rem; color: #f7fafc; cursor: pointer; }
            .history-modal-body { padding: 15px; max-height: 70vh; overflow-y: auto; }
            .history-message {
                padding: 10px;
                border-bottom: 1px solid #4a5568;
            }
            .history-message:last-child { border-bottom: none; }
            .history-message strong { color: #90cdf4; }
            .history-message p { margin: 5px 0 0 0; line-height: 1.5; word-wrap: break-word; white-space: pre-wrap; }
            .history-modal-clear-btn {
                background: none;
                border: 1px solid #ef4444; /* Red border for clear action */
                color: #ef4444; /* Red text */
                font-size: 0.9rem;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s ease, color 0.2s ease;
                margin-right: 10px; /* Space between clear and close buttons */
            }
            .history-modal-clear-btn:hover {
                background-color: #ef4444;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'history-modal-overlay';
    modalOverlay.id = 'historyModalOverlay';
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeChatHistoryPopup(); };

    const modal = document.createElement('div');
    modal.className = 'history-modal';
    
    // Create a container for buttons to manage their layout
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';

    // Clear History Button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'history-modal-clear-btn';
    clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear';
    clearBtn.title = 'Clear All Chat History';
    clearBtn.onclick = clearChatHistory;
    buttonContainer.appendChild(clearBtn);

    // Close Button
    const modalHeader = document.createElement('div');
    modalHeader.className = 'history-modal-header';
    modalHeader.innerHTML = '<h2>Chat History</h2>';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-modal-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeChatHistoryPopup;
    buttonContainer.appendChild(closeBtn);
    modalHeader.appendChild(buttonContainer); // Append the button container to the header

    const modalBody = document.createElement('div');
    modalBody.className = 'history-modal-body';

    if (chatHistory.length > 0) {
        chatHistory.forEach(chat => {
            const messageBlock = document.createElement('div');
            messageBlock.className = 'history-message';
            messageBlock.innerHTML = `<strong>You:</strong><p>${chat.user.replace(/\n/g, '<br>')}</p><br><strong>AI:</strong><p>${chat.ai.replace(/\n/g, '<br>')}</p>`;
            modalBody.appendChild(messageBlock);
        });
    } else {
        modalBody.innerHTML = '<p>No chat history found.</p>';
    }

    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
}

function closeChatHistoryPopup() {
    const modalOverlay = document.getElementById('historyModalOverlay');
    if (modalOverlay) {
        modalOverlay.parentNode.removeChild(modalOverlay);
    }
}

function saveAsPDF() {
    const content = document.getElementById('aiOutput').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
        <head>
            <title>JGS AI Content Plan</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .content-section { margin-bottom: 30px; padding: 20px; border-left: 4px solid #667eea; }
                .section-header h2 { color: #667eea; font-size: 18px; margin-bottom: 15px; }
                .sub-header h3 { color: #333; font-size: 16px; margin: 10px 0; }
                .copyable-content { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .hashtag { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; margin: 2px; }
                .bullet-list, .numbered-list { margin: 10px 0 10px 20px; }
                .content-paragraph { margin: 8px 0; }
            </style>
        </head>
        <body>
            <h1>JGS AI Content Plan</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            <hr>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function copyOutput() {
    const output = document.getElementById('aiOutput');
    const text = output.innerText || output.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyOutputBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

/**
 * Parses markdown-like text from the AI and converts it into structured HTML
 * using the classes defined in style.css.
 * @param {string} markdown - The raw markdown text from the AI.
 * @returns {string} - The formatted HTML string.
 */
function formatAIResponse(markdown) {

    if (!markdown) return '';

    let html = '';

    // Global replacements for simple markdown
    // Bold text: **text** -> <strong>text</strong>
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Hashtags: #tag -> <span class="hashtag">#tag</span>
    markdown = markdown.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');

    // Split the entire response into sections based on H2 headings (##)
    const sections = markdown.split(/(?=^##\s)/m);

    sections.forEach(section => {
        if (section.trim() === '') return;

        let sectionHtml = '';
        const lines = section.split('\n');
        let inList = null; // 'ul' or 'ol'
        let inCopyable = false;
        let copyableContent = '';
        let copyableHeader = 'Copy';

        // The first line of a section is the title
        const titleLine = lines.shift() || '';
        const title = titleLine.replace(/^##\s/, '').trim();
        sectionHtml += `<div class="section-header"><h2><i class="fas fa-lightbulb"></i> ${title}</h2></div>`;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Handle copyable code blocks
            if (trimmedLine.startsWith('```copyable')) {
                if (inCopyable) { // Close previous block if any
                    copyableContent += `</pre></div></div>`;
                    sectionHtml += copyableContent;
                }
                inCopyable = true;
                copyableHeader = trimmedLine.substring(11).trim() || 'Copy';
                copyableContent = `<div class="copyable-content" onclick="copyToClipboard(this)">
                                        <div class="copy-header">
                                            <span>${copyableHeader}</span>
                                            <i class="far fa-copy copy-icon"></i>
                                        </div>
                                        <div class="copy-text"><pre>`;
                continue;
            }

            if (trimmedLine.startsWith('```') && inCopyable) {
                inCopyable = false;
                copyableContent += `</pre></div></div>`;
                sectionHtml += copyableContent;
                copyableContent = '';
                continue;
            }

            if (inCopyable) {
                copyableContent += `${line}\n`;
                continue;
            }

            // Close list if the current line is not a list item
            if (!trimmedLine.match(/^(\*|\d+\.)\s/)) {
                if (inList === 'ul') sectionHtml += '</ul>';
                if (inList === 'ol') sectionHtml += '</ol>';
                inList = null;
            }

            // ### Sub-headings
            if (trimmedLine.startsWith('### ')) {
                sectionHtml += `<div class="sub-header"><h3>${trimmedLine.substring(4)}</h3></div>`;
            }
            // * Unordered list
            else if (trimmedLine.startsWith('* ')) {
                if (inList !== 'ul') {
                    sectionHtml += '<ul class="bullet-list">';
                    inList = 'ul';
                }
                sectionHtml += `<li class="bullet-item">${trimmedLine.substring(2)}</li>`;
            }
            // 1. Ordered list
            else if (trimmedLine.match(/^\d+\.\s/)) {
                if (inList !== 'ol') {
                    sectionHtml += '<ol class="numbered-list">';
                    inList = 'ol';
                }
                sectionHtml += `<li class="numbered-item">${trimmedLine.replace(/^\d+\.\s/, '')}</li>`;
            }
            // Paragraphs
            else if (trimmedLine) {
                sectionHtml += `<p class="content-paragraph">${line}</p>`;
            }
        }

        // Close any remaining open lists or blocks
        if (inList === 'ul') sectionHtml += '</ul>';
        if (inList === 'ol') sectionHtml += '</ol>';
        if (inCopyable) {
            copyableContent += `</pre></div></div>`;
            sectionHtml += copyableContent;
        }

        // Wrap everything in a content-section
        html += `<div class="content-section">${sectionHtml}</div>`;
    });

    return html;
}

/**
 * Helper function to copy text from .copyable-content blocks to the clipboard.
 * @param {HTMLElement} element - The .copyable-content element that was clicked.
 */
function copyToClipboard(element) {
    const textToCopy = element.querySelector('.copy-text pre').innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = element.querySelector('.copy-icon');
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check', 'copied');

        setTimeout(() => {
            icon.classList.remove('fa-check', 'copied');
            icon.classList.add('fa-copy');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text.');
    });
}

function applyChatUIImprovements() {
    // This function injects CSS directly to fix common UI issues in the chat panel
    // without needing to modify the original style.css file.
    const style = document.createElement('style');
    style.id = 'chat-ui-improvements';
    style.innerHTML = `
        /* --- Chat Panel UI Improvements --- */

        /* Add more space at the bottom of the message list to prevent the last message
           from touching the input bar, which can cause visual glitches. */
        #chatMessages {
            padding-bottom: 1rem;
        }

        /* Make individual message boxes more compact and add clear separation. */
        .message {
            max-width: 85%; /* Prevent messages from taking up the full width */
            margin-bottom: 1rem; /* Add space between consecutive messages */
        }

        /* Reduce the padding inside the message content to make the boxes smaller. */
        .message .message-content {
            padding: 0.75rem 1rem;
        }

        /* Ensure user messages are clearly aligned to the right. */
        .message.user {
            margin-left: auto;
            margin-right: 0;
        }
    `;
    document.head.appendChild(style);
}
/**
 * Clears the chat history from memory and localStorage after user confirmation.
 */
function clearChatHistory() {
    // පරිශීලකයාගෙන් තහවුරු කිරීමක් ලබා ගැනීම
    if (confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
        // 1. මතකයේ ඇති chatHistory array එක හිස් කිරීම
        chatHistory = [];

        // 2. localStorage එකෙන් ඉතිහාසය ඉවත් කිරීම
        localStorage.removeItem('jgs_chat_history');

        // 3. චැට් එකේ පෙනුම (UI) යාවත්කාලීන කිරීම
        const chatMessagesDiv = document.getElementById('chatMessages');
        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '';
        }

        // 4. ඉතිහාසය පෙන්වන modal එක වැසීම
        // ඔබගේ history modal එකේ ID එක වෙනස් නම්, කරුණාකර එය මෙතැනට යොදන්න
        const historyModal = document.getElementById('historyModal'); 
        if (historyModal) {
            historyModal.classList.add('hidden');
        }
    }
}
