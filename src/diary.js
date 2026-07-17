import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Integrate Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// 2. Setup Scrollytelling Animations
document.querySelectorAll('.panel').forEach((panel, i) => {
  // Background Parallax
  const bg = panel.querySelector('.parallax-bg');
  if (bg) {
    gsap.to(bg, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  // Text Fade & Slide Up
  const textBlocks = panel.querySelectorAll('.text-block');
  textBlocks.forEach((block) => {
    gsap.to(block, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: {
        trigger: block,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });
});

// Context-aware Prompts Configuration
const contextPrompts = {
  'section-xiaopi': '听说小琵曾经在这里找不到食物，想知道后来发生了什么吗？',
  'section-oujie': '你猜猜那家“给鸟开的餐厅”具体是怎么运作的？',
  'section-alu': '好奇欧亚水獭长什么样吗？它对水质的要求到底有多苛刻？',
  'section-fanfan': '你觉得砍掉漂亮的互花米草，真的只为了给短腿鸟让路吗？',
  'section-laoyu': '一万一千公里不吃不喝，你知道斑尾塍鹬起飞前要做哪些准备吗？',
  'section-wanwan': '深圳湾真的是唯一的市中心国家级自然保护区吗？',
  'section-jinjin': '你知道“为鸟熄灯”政策具体是怎么实施的吗？'
};

// ScrollTrigger for Context Bubble
document.querySelectorAll('.panel').forEach((panel) => {
  ScrollTrigger.create({
    trigger: panel,
    start: "top center",
    end: "bottom center",
    onEnter: () => updateContextBubble(panel.id),
    onEnterBack: () => updateContextBubble(panel.id)
  });
});

const bubble = document.getElementById('ai-bubble');
const bubbleText = document.getElementById('ai-bubble-text');
let bubbleTimeout;

function updateContextBubble(sectionId) {
  if (contextPrompts[sectionId]) {
    bubble.classList.remove('show');
    clearTimeout(bubbleTimeout);
    
    bubbleTimeout = setTimeout(() => {
      bubbleText.innerText = contextPrompts[sectionId];
      bubble.classList.add('show');
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        bubble.classList.remove('show');
      }, 10000);
    }, 1000);
  }
}

// 3. AI Assistant Integration (Agnes 2.0 Flash)
const aiTrigger = document.getElementById('ai-trigger');
const aiDrawer = document.getElementById('ai-drawer');
const aiClose = document.getElementById('ai-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');

aiTrigger.addEventListener('click', () => {
  aiDrawer.classList.add('open');
  bubble.classList.remove('show');
});

aiClose.addEventListener('click', () => {
  aiDrawer.classList.remove('open');
});

const SYSTEM_PROMPT = `你是深圳湾国际重要湿地的官方AI生态导览员“红树小灵”。
性格设定：亲切、热情，拥有极其丰富的生态学、城市规划和深圳历史知识。
对话目标：用通俗易懂、富有感染力的语言回答访客关于深圳湾、红树林、候鸟迁徙及游览的提问。
知识点库：
- 深圳湾是全球唯一坐落在千万级人口超大城市CBD腹地的国家级自然保护区。
- 滨海大道曾为生态让道，平移260米并建隔音墙。
- 欧亚水獭消失20年后重返深圳湾，证明水环境治理成功。
- 全国首次拍卖“红树林保护碳汇”，溢价165%，用于生态修复。
- 科学清理互花米草等外来树种，给短腿涉水鸟类留出滩涂。
- 候鸟明星：黑脸琵鹭（旗舰种，濒危）、红嘴鸥（亲民大部队）、斑尾塍鹬（11000km不间断飞行）、反嘴鹬（精准觅食）、白腰杓鹬（长嘴）、太平洋金鸻等。
- 基围鱼塘改造为通过潮汐控制的“专属自助餐厅”。
- 出台全国首个“鸟类友好城市”规范：限高、防反光玻璃、候鸟季为鸟熄灯。

请尽量简明扼要地回答问题，语气自然，不要使用过于晦涩的学术名词。`;

let messages = [
  { role: 'system', content: SYSTEM_PROMPT }
];

async function callAgnesFlash(userMessage) {
  // Append user message
  messages.push({ role: 'user', content: userMessage });
  
  try {
    const response = await fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wk-GZ9VEzB5yJ7Hh7qFhWsevtgkgeybOqkSoEG0kFfUwkiCsyGq',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    if (!response.ok) throw new Error('API Request Failed');
    
    const data = await response.json();
    const botReply = data.choices[0].message.content;
    
    messages.push({ role: 'assistant', content: botReply });
    return botReply;
  } catch (err) {
    console.error('Agnes API Error:', err);
    return '抱歉，我现在有点累了，稍后再试好吗？';
  }
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  
  if (role === 'bot') {
    // Parse basic markdown to HTML (since marked is loaded in html)
    div.innerHTML = window.marked ? marked.parse(text) : text;
  } else {
    div.innerText = text;
  }
  
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing-indicator';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  
  appendMessage('user', text);
  chatInput.value = '';
  
  appendTypingIndicator();
  const reply = await callAgnesFlash(text);
  
  // Anticipation: 0.5s pause before results
  setTimeout(() => {
    removeTypingIndicator();
    appendMessageChunked('bot', reply);
  }, 500);
});

function appendMessageChunked(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  chatHistory.appendChild(div);
  
  // Chunk Reveal: slice by words or punctuation
  const chunks = text.split(/(\s+|,\s*|\.\s*|;\s*|，|。|！|？|、)/).filter(c => c);
  let i = 0;
  
  function reveal() {
    if (i >= chunks.length) {
      if (window.marked && role === 'bot') {
        div.innerHTML = marked.parse(text);
      }
      return;
    }
    div.innerText += chunks[i++];
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Non-uniform delay: 40-120ms
    const delay = 40 + Math.random() * 80;
    setTimeout(reveal, delay);
  }
  reveal();
}

// 4. Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

if (lightbox && lightboxImg) {
  document.querySelectorAll('.panel img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.classList.add('active');
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
}
