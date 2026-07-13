import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Shuffle, 
  Plus, 
  X, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  AlertCircle, 
  Code
} from "lucide-react";

// Initial default food menu list with emojis
const DEFAULT_MENU = [
  "🍔 麦当劳",
  "🍗 KFC",
  "🍟 汉堡王",
  "🍜 兰州拉面",
  "🍛 黄焖鸡",
  "🍲 麻辣烫",
  "🥟 饺子",
  "🍝 意大利面",
  "🍣 寿司",
  "🥩 烤肉",
  "🍕 披萨",
  "🥗 沙拉",
  "🍚 煲仔饭",
  "🍖 烧腊饭",
  "🍤 炒饭",
  "🍢 烧烤",
  "🥘 火锅",
  "🍜 牛肉面",
  "🍛 咖喱饭",
  "🥪 三明治"
];

// List of fallback food emojis for custom-added foods that don't have emojis
const FOOD_EMOJIS = ["🍔", "🍜", "🍛", "🍲", "🥟", "🍣", "🥩", "🍕", "🥗", "🥘", "🥪", "🍰", "🍙", "🍢", "🍳", "🍗"];

// Helper function to extract emoji and food name
function parseFood(foodStr: string) {
  const trimmed = foodStr.trim();
  // Regex to match an emoji at the start
  const match = trimmed.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji})\s*(.*)$/u);
  if (match) {
    return { emoji: match[1], name: match[2].trim() };
  }
  // If no emoji found, we can assign a deterministic one based on string length, or a default
  const emojiIndex = Math.abs(hashCode(trimmed)) % FOOD_EMOJIS.length;
  return { emoji: FOOD_EMOJIS[emojiIndex], name: trimmed };
}

// Simple hash code generator to map strings deterministically
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export default function App() {
  const [menu, setMenu] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [currentRollResult, setCurrentRollResult] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);

  // Load menu from localStorage or default on mount
  useEffect(() => {
    const savedMenu = localStorage.getItem("today_eat_menu");
    if (savedMenu) {
      try {
        setMenu(JSON.parse(savedMenu));
      } catch (e) {
        setMenu(DEFAULT_MENU);
      }
    } else {
      setMenu(DEFAULT_MENU);
    }
  }, []);

  // Save to localStorage when menu changes
  const saveMenu = (newMenu: string[]) => {
    setMenu(newMenu);
    localStorage.setItem("today_eat_menu", JSON.stringify(newMenu));
  };

  // Add new food item
  const handleAddFood = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = inputValue.trim();
    if (!cleanInput) {
      showError("输入内容不能为空哦！");
      return;
    }

    // Check if duplicate (normalize by extracting name)
    const newFoodParsed = parseFood(cleanInput);
    const isDuplicate = menu.some(item => {
      const parsed = parseFood(item);
      return parsed.name.toLowerCase() === newFoodParsed.name.toLowerCase();
    });

    if (isDuplicate) {
      showError("这个美食已经在菜单里啦！");
      return;
    }

    // Add emoji automatically if the user didn't enter one
    const foodToAdd = cleanInput.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji})/u)
      ? cleanInput
      : `${newFoodParsed.emoji} ${newFoodParsed.name}`;

    const updatedMenu = [...menu, foodToAdd];
    saveMenu(updatedMenu);
    setInputValue("");
    setErrorMsg("");
  };

  // Delete food item
  const handleDeleteFood = (indexToDelete: number) => {
    const updatedMenu = menu.filter((_, idx) => idx !== indexToDelete);
    saveMenu(updatedMenu);
  };

  // Reset to default menu
  const handleResetMenu = () => {
    if (window.confirm("确定要恢复默认的 20 种美食菜单吗？")) {
      saveMenu(DEFAULT_MENU);
      setFinalResult(null);
      setCurrentRollResult(null);
    }
  };

  // Helper to show temporary error messages
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => {
      setErrorMsg(prev => prev === msg ? "" : prev);
    }, 3000);
  };

  // Decelerating rolling selection animation
  const startRolling = () => {
    if (menu.length === 0 || isRolling) return;

    setIsRolling(true);
    setFinalResult(null);
    setErrorMsg("");

    let delay = 30; // Initial interval delay (ms)
    const maxDelay = 200; // Stop rolling once delay exceeds this
    let timerId: any = null;

    const roll = () => {
      const randomIndex = Math.floor(Math.random() * menu.length);
      setCurrentRollResult(menu[randomIndex]);

      // Gradually increase delay to create realistic slot machine deceleration
      delay += 10;

      if (delay < maxDelay) {
        timerId = setTimeout(roll, delay);
      } else {
        // Stop and set final result
        const winner = menu[Math.floor(Math.random() * menu.length)];
        setFinalResult(winner);
        setIsRolling(false);
      }
    };

    roll();
  };

  // Copy final result to clipboard
  const copyResultToClipboard = () => {
    if (!finalResult) return;
    const parsed = parseFood(finalResult);
    const textToCopy = `今天吃这个：${parsed.emoji} ${parsed.name}！感觉棒棒哒！`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Generate self-contained HTML for exporting
  const getSingleFileHTMLCode = () => {
    const menuJSON = JSON.stringify(menu.length > 0 ? menu : DEFAULT_MENU, null, 2);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>今天吃什么？- 极简随机选择器</title>
    <!-- Google Fonts Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Tailwind CSS Play CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            bg: '#F7F7F7',
                            card: '#FFFFFF',
                            text: '#222222',
                            muted: '#888888',
                            btn: '#111111',
                            success: '#4CAF50',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F7F7F7;
            color: #222222;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        @keyframes pulseGlow {
            0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
            50% { transform: scale(1.1) translate(10px, -10px); opacity: 0.5; }
        }
        .glow-orb-1 { animation: pulseGlow 15s ease-in-out infinite; }
        .glow-orb-2 { animation: pulseGlow 20s ease-in-out infinite alternate; }
    </style>
</head>
<body class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-x-hidden selection:bg-black selection:text-white">

    <!-- Decorative Soft Glow Background -->
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/20 filter blur-[120px] glow-orb-1 -z-10 pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 filter blur-[120px] glow-orb-2 -z-10 pointer-events-none"></div>

    <!-- Main Card Container -->
    <div class="w-full max-w-[520px] glass-panel rounded-[24px] p-6 sm:p-8 shadow-2xl shadow-black/5 transition-all duration-300 relative">
        
        <!-- Header -->
        <div class="flex flex-col items-center text-center mb-8">
            <div class="text-4xl mb-3 animate-bounce duration-1000">🍜</div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-1.5">今天吃什么？</h1>
            <p class="text-sm text-brand-muted font-medium">不知道今天吃什么？交给随机吧。</p>
        </div>

        <!-- Selection Display Area -->
        <div id="display-area" class="w-full min-h-[160px] bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200 flex flex-col items-center justify-center p-6 text-center mb-8 transition-all duration-300">
            <div id="display-emoji" class="text-4xl mb-2 transition-transform duration-200">🍽️</div>
            <div id="display-text" class="text-neutral-500 text-sm font-medium">点击下方按钮开始随机</div>
        </div>

        <!-- Action Button -->
        <div class="flex justify-center mb-8">
            <button id="roll-button" onclick="startRolling()" class="w-[220px] h-[56px] bg-brand-btn text-white rounded-full font-semibold shadow-lg hover:shadow-black/10 transition-all active:scale-[0.97] hover:scale-[1.03] duration-200 flex items-center justify-center gap-2">
                <span>🎲</span> 今天吃什么？
            </button>
        </div>

        <!-- Add Food Form -->
        <div class="mb-8 border-t border-neutral-100 pt-6">
            <div class="flex items-center justify-between mb-3.5">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">添加美食</h3>
                <span id="error-message" class="text-xs text-red-500 font-medium transition-opacity duration-300 opacity-0"></span>
            </div>
            <form id="add-food-form" onsubmit="handleAddFood(event)" class="flex gap-2">
                <input id="food-input" type="text" placeholder="输入新的食物..." maxlength="15" class="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all">
                <button type="submit" class="p-3 bg-brand-btn text-white rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center shadow-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v14m7-7H5"></path></svg>
                </button>
            </form>
        </div>

        <!-- Food Menu Section -->
        <div>
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">我的菜单</h3>
                    <span id="menu-count" class="bg-neutral-100 text-neutral-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">0</span>
                </div>
                <button onclick="resetMenu()" class="text-xs text-neutral-400 hover:text-neutral-600 font-medium flex items-center gap-1.5 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.24 8H18.24"></path></svg>
                    恢复默认
                </button>
            </div>
            <!-- Scrollable Tags -->
            <div id="tags-container" class="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1.5 scrollbar-thin">
                <!-- Tags populated dynamically -->
            </div>
        </div>
    </div>

    <script>
        // Default menu items
        const DEFAULT_MENU = ${menuJSON};
        const FOOD_EMOJIS = ["🍔", "🍜", "🍛", "🍲", "🥟", "🍣", "🥩", "🍕", "🥗", "🥘", "🥪", "🍰", "🍙", "🍢", "🍳", "🍗"];

        let menu = [];
        let isRolling = false;

        // Initialize from LocalStorage or Default
        function init() {
            const saved = localStorage.getItem('today_eat_menu');
            if (saved) {
                try { menu = JSON.parse(saved); } catch(e) { menu = [...DEFAULT_MENU]; }
            } else {
                menu = [...DEFAULT_MENU];
            }
            renderMenu();
        }

        // Helper to hash string deterministically
        function hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }

        // Parse food helper
        function parseFood(foodStr) {
            const trimmed = foodStr.trim();
            const match = trimmed.match(/^([\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|\\p{Emoji_Presentation}|\\p{Emoji})\\s*(.*)$/u);
            if (match) {
                return { emoji: match[1], name: match[2].trim() };
            }
            const emojiIndex = Math.abs(hashCode(trimmed)) % FOOD_EMOJIS.length;
            return { emoji: FOOD_EMOJIS[emojiIndex], name: trimmed };
        }

        // Display error helper
        function showError(msg) {
            const errSpan = document.getElementById('error-message');
            errSpan.textContent = msg;
            errSpan.style.opacity = '1';
            setTimeout(() => {
                errSpan.style.opacity = '0';
            }, 3000);
        }

        // Add food
        function handleAddFood(e) {
            e.preventDefault();
            const input = document.getElementById('food-input');
            const cleanInput = input.value.trim();
            if (!cleanInput) {
                showError("食物名称不能为空哦！");
                return;
            }

            const parsedNew = parseFood(cleanInput);
            const isDuplicate = menu.some(item => {
                const p = parseFood(item);
                return p.name.toLowerCase() === parsedNew.name.toLowerCase();
            });

            if (isDuplicate) {
                showError("已经在菜单里啦！");
                return;
            }

            const foodToAdd = cleanInput.match(/^([\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|\\p{Emoji_Presentation}|\\p{Emoji})/u)
                ? cleanInput
                : parsedNew.emoji + ' ' + parsedNew.name;

            menu.push(foodToAdd);
            localStorage.setItem('today_eat_menu', JSON.stringify(menu));
            input.value = '';
            renderMenu();
        }

        // Delete food
        function deleteFood(index) {
            menu.splice(index, 1);
            localStorage.setItem('today_eat_menu', JSON.stringify(menu));
            renderMenu();
        }

        // Reset menu
        function resetMenu() {
            if (confirm("确定要重置并恢复默认菜单吗？")) {
                menu = [...DEFAULT_MENU];
                localStorage.setItem('today_eat_menu', JSON.stringify(menu));
                renderMenu();
                // Clear displays
                document.getElementById('display-emoji').textContent = '🍽️';
                document.getElementById('display-text').className = "text-neutral-500 text-sm font-medium";
                document.getElementById('display-text').textContent = '点击下方按钮开始随机';
            }
        }

        // Render food tags
        function renderMenu() {
            const container = document.getElementById('tags-container');
            const countBadge = document.getElementById('menu-count');
            const rollBtn = document.getElementById('roll-button');
            
            container.innerHTML = '';
            countBadge.textContent = menu.length;

            if (menu.length === 0) {
                rollBtn.disabled = true;
                rollBtn.className = "w-[220px] h-[56px] bg-neutral-200 text-neutral-400 rounded-full font-semibold cursor-not-allowed flex items-center justify-center gap-2";
                rollBtn.innerHTML = "<span>⚠️</span> 菜单为空";
                
                document.getElementById('display-emoji').textContent = '⚠️';
                document.getElementById('display-text').textContent = '菜单已空，请先添加一些美味吧！';
                document.getElementById('display-text').className = "text-red-500 text-sm font-medium";
            } else {
                rollBtn.disabled = isRolling;
                if (!isRolling) {
                    rollBtn.className = "w-[220px] h-[56px] bg-brand-btn text-white rounded-full font-semibold shadow-lg hover:shadow-black/10 transition-all active:scale-[0.97] hover:scale-[1.03] duration-200 flex items-center justify-center gap-2";
                    rollBtn.innerHTML = "<span>🎲</span> 今天吃什么？";
                }
            }

            menu.forEach((food, idx) => {
                const parsed = parseFood(food);
                const tag = document.createElement('div');
                tag.className = "flex items-center gap-1.5 bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 text-sm py-1.5 px-3 rounded-full transition-all duration-150 group shrink-0 select-none cursor-default";
                tag.innerHTML = \`
                    <span>\${parsed.emoji}</span>
                    <span class="font-medium">\${parsed.name}</span>
                    <button onclick="deleteFood(\${idx})" class="text-neutral-400 hover:text-red-500 transition-colors focus:outline-none leading-none text-xs ml-0.5">×</button>
                \`;
                container.appendChild(tag);
            });
        }

        // Slot Machine Decelerating Roll Effect
        function startRolling() {
            if (menu.length === 0 || isRolling) return;

            isRolling = true;
            renderMenu();

            const displayArea = document.getElementById('display-area');
            const displayEmoji = document.getElementById('display-emoji');
            const displayText = document.getElementById('display-text');
            const rollBtn = document.getElementById('roll-button');

            rollBtn.disabled = true;
            rollBtn.className = "w-[220px] h-[56px] bg-neutral-300 text-white rounded-full font-semibold cursor-not-allowed duration-200 flex items-center justify-center gap-2";
            rollBtn.innerHTML = "<span>⏳</span> 正在挑选...";

            displayArea.className = "w-full min-h-[160px] bg-neutral-50/50 rounded-2xl border border-dashed border-black/10 flex flex-col items-center justify-center p-6 text-center mb-8 transition-all duration-300 scale-[0.98] animate-pulse";

            let delay = 30;
            const maxDelay = 220;

            function roll() {
                const randomIndex = Math.floor(Math.random() * menu.length);
                const item = menu[randomIndex];
                const parsed = parseFood(item);

                displayEmoji.textContent = parsed.emoji;
                displayEmoji.className = "text-4xl mb-2 scale-110 transition-transform duration-75";
                
                displayText.textContent = parsed.name;
                displayText.className = "text-brand-text text-xl font-bold tracking-tight";

                delay += 10;

                if (delay < maxDelay) {
                    setTimeout(roll, delay);
                } else {
                    // Final Selection
                    const finalWinner = menu[Math.floor(Math.random() * menu.length)];
                    const finalParsed = parseFood(finalWinner);

                    isRolling = false;
                    renderMenu();

                    displayArea.className = "w-full min-h-[160px] bg-green-50/50 rounded-2xl border border-solid border-green-200 flex flex-col items-center justify-center p-6 text-center mb-8 shadow-inner transition-all duration-300 scale-100";
                    
                    displayEmoji.textContent = '🎉';
                    displayEmoji.className = "text-4xl mb-2 animate-[bounce_1s_ease-in-out_infinite]";
                    
                    displayText.innerHTML = \`<span class="text-xs font-semibold text-green-600 block mb-1">今日推荐美食</span><span class="text-2xl font-extrabold text-brand-text">\${finalParsed.emoji} \${finalParsed.name}</span>\`;
                    displayText.className = "";
                }
            }

            roll();
        }

        // Initialize app on load
        window.onload = init;
    </script>
</body>
</html>`;
  };

  const handleDownloadHTML = () => {
    const code = getSingleFileHTMLCode();
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "今天吃什么.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyHTML = () => {
    const code = getSingleFileHTMLCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 2000);
    });
  };

  const parsedFinal = finalResult ? parseFood(finalResult) : null;
  const parsedRolling = currentRollResult ? parseFood(currentRollResult) : null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-x-hidden selection:bg-black selection:text-white">
      {/* Decorative Soft Glow Background Orbs specified in the Frosted Glass theme */}
      <div className="bg-glow -z-10 pointer-events-none" />
      <div className="bg-glow-bottom -z-10 pointer-events-none" />

      {/* Main Glassmorphic Card Container matching the theme parameters */}
      <div id="main-selector-card" className="w-full max-w-[520px] glass-panel rounded-[32px] p-8 sm:p-10 transition-all duration-300 relative">
        
        {/* Floating Utility Export Panel (Pro-UX Detail) */}
        <div className="absolute top-5 right-5 flex gap-1.5">
          <button 
            id="btn-export-trigger"
            onClick={() => setShowExportModal(true)}
            title="导出为单文件 HTML 网页"
            className="p-2 text-neutral-400 hover:text-black bg-neutral-50 hover:bg-neutral-100 rounded-full border border-neutral-100/50 transition-all flex items-center justify-center shadow-sm"
          >
            <Code size={15} />
          </button>
        </div>

        {/* Title Header with typography adjustments */}
        <div className="flex flex-col items-center text-center mb-8">
          <span className="text-[40px] block mb-3 leading-none select-none">🍜</span>
          <h1 className="text-[28px] font-bold tracking-tight text-[#222222] mb-2 leading-tight">今天吃什么？</h1>
          <p className="text-sm text-[#888888]">不知道今天吃什么？交给随机吧。</p>
        </div>

        {/* Display Area */}
        <div 
          id="display-box"
          className={`w-full min-h-[140px] rounded-[20px] flex flex-col items-center justify-center p-6 text-center mb-8 transition-all duration-300 ${
            isRolling 
              ? "bg-black/[0.02] border border-dashed border-black/10 scale-[0.98] animate-pulse" 
              : finalResult 
                ? "bg-emerald-50/50 border border-solid border-emerald-200 scale-100 shadow-inner" 
                : menu.length === 0 
                  ? "bg-red-50/30 border border-dashed border-red-200"
                  : "bg-black/[0.02] border border-dashed border-neutral-200"
          }`}
        >
          {isRolling && parsedRolling ? (
            <div className="transition-all duration-100 transform scale-110">
              <div className="text-[42px] font-bold flex items-center justify-center gap-3">
                <span>{parsedRolling.emoji}</span>
                <span>{parsedRolling.name}</span>
              </div>
            </div>
          ) : finalResult && parsedFinal ? (
            <div className="animate-scaleUp duration-300 text-center flex flex-col items-center">
              <div className="text-[42px] font-bold flex items-center justify-center gap-3 scale-up">
                <span>🎉</span>
                <span>{parsedFinal.name}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest block mt-2 mb-4">今天就吃这个啦！</span>
              
              <div className="flex items-center gap-2">
                <button 
                  id="btn-copy-result"
                  onClick={copyResultToClipboard}
                  className="px-3.5 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {copySuccess ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copySuccess ? "已复制" : "分享给朋友"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="text-[42px] mb-1">
                {menu.length === 0 ? "⚠️" : "🍽️"}
              </div>
              <div className={`text-sm font-medium ${menu.length === 0 ? "text-red-500" : "text-neutral-500"} mt-2`}>
                {menu.length === 0 ? "菜单已空，请先添加一些美味吧！" : "点击下方按钮开始随机"}
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="flex justify-center mb-8">
          <button
            id="btn-trigger-roll"
            onClick={startRolling}
            disabled={isRolling || menu.length === 0}
            className={`w-[220px] h-[56px] rounded-full font-semibold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.95] hover:scale-[1.05] duration-300 ${
              menu.length === 0
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                : isRolling
                  ? "bg-neutral-300 text-white cursor-not-allowed animate-pulse"
                  : "bg-[#111111] hover:bg-black text-white shadow-black/10 cursor-pointer"
            }`}
          >
            {isRolling ? (
              <>
                <span>⏳</span> 正在挑选...
              </>
            ) : menu.length === 0 ? (
              <>
                <span>⚠️</span> 菜单为空
              </>
            ) : (
              <>
                <span>🎲</span> 今天吃什么？
              </>
            )}
          </button>
        </div>

        {/* Add Food Input Panel */}
        <div className="mb-6 border-t border-black/[0.05] pt-6 add-food">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888888]">添加美食</h3>
            {errorMsg && (
              <span id="txt-error-alert" className="text-xs text-red-500 font-semibold flex items-center gap-1 animate-pulse">
                <AlertCircle size={12} />
                {errorMsg}
              </span>
            )}
          </div>
          <form id="form-add-food" onSubmit={handleAddFood} className="flex gap-2">
            <input
              id="input-food-name"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入新的食物..."
              maxLength={15}
              disabled={isRolling}
              className="flex-1 h-11 px-4 bg-black/[0.01] border border-black/[0.08] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              id="btn-add-food"
              type="submit"
              disabled={isRolling}
              className="h-11 px-5 bg-neutral-100 hover:bg-neutral-200 text-[#222222] font-semibold text-sm rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-50"
            >
              添加
            </button>
          </form>
        </div>

        {/* My Menu Section */}
        <div className="menu-list">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888888]">我的菜单</h3>
              <span id="badge-menu-count" className="bg-black/[0.04] text-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {menu.length}
              </span>
            </div>
            <button
              id="btn-reset-menu"
              onClick={handleResetMenu}
              disabled={isRolling}
              className="text-xs text-[#888888] hover:text-[#222222] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={13} />
              恢复默认
            </button>
          </div>

          {/* Capsule Tags Area */}
          <div 
            id="tags-list"
            className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin"
          >
            {menu.map((food, index) => {
              const { emoji, name } = parseFood(food);
              return (
                <div
                  id={`tag-food-${index}`}
                  key={index}
                  className="flex items-center gap-1.5 bg-black/[0.04] hover:bg-black/[0.08] text-[#222222] text-[13px] py-1.5 px-3.5 rounded-full transition-all duration-150 select-none cursor-default"
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{name}</span>
                  <button
                    id={`btn-delete-food-${index}`}
                    type="button"
                    onClick={() => handleDeleteFood(index)}
                    disabled={isRolling}
                    className="text-neutral-400 hover:text-red-500 transition-colors focus:outline-none leading-none text-base ml-1.5 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {menu.length === 0 && (
              <div className="text-xs text-neutral-400 italic py-2">
                还没有食物呢，赶紧添加一个吧！
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Floating Modal (Apple Modal Style) */}
      {showExportModal && (
        <div id="export-modal" className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl p-6 relative border border-neutral-100 animate-scaleUp">
            <button 
              id="btn-close-export"
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-50 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-1.5">
                <Sparkles size={18} className="text-amber-500" />
                导出单文件 HTML 网页
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                您可以将下面生成的完整代码直接存为单 HTML 文件，双击即可在任何地方（电脑、手机）脱离 Node.js / React 离线完美运行！
              </p>
            </div>

            <div className="bg-neutral-900 rounded-xl p-4 mb-5 max-h-[220px] overflow-y-auto">
              <pre className="text-xs font-mono text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {getSingleFileHTMLCode()}
              </pre>
            </div>

            <div className="flex gap-2.5">
              <button
                id="btn-download-html"
                onClick={handleDownloadHTML}
                className="flex-1 py-3 px-4 bg-black text-white hover:bg-neutral-800 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
              >
                <Download size={14} />
                下载 HTML 文件
              </button>
              <button
                id="btn-copy-html"
                onClick={handleCopyHTML}
                className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedHTML ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedHTML ? "已复制到剪切板" : "复制全部源码"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Humble credit line */}
      <footer className="mt-8 text-neutral-300 text-[10px] font-mono select-none">
        Crafted with minimal elegance
      </footer>
    </div>
  );
}
