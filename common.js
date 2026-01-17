/**
 * 오키나와 가족 여행 웹사이트 공통 스크립트
 * (앱 연동 최적화, 홈 버튼/날씨 위젯 통합 관리, 5일 예보 포함)
 */

// ==========================================
// 1. 앱 실행 (Deep Link) 로직
// ==========================================
function openApp(urlScheme, storeUrlAndroid, storeUrlIOS, webFallback) {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    if (isAndroid) {
        const now = new Date().getTime();
        setTimeout(function () {
            if (new Date().getTime() - now < 3000) {
                window.location = webFallback || storeUrlAndroid;
            }
        }, 2500);
        window.location = urlScheme;
    } else if (isIOS) {
        const now = new Date().getTime();
        setTimeout(function () {
            if (new Date().getTime() - now < 3500) {
                window.location = webFallback || storeUrlIOS;
            }
        }, 3000);
        window.location.href = urlScheme;
    } else {
        window.open(webFallback);
    }
}

function openKakaoT() {
    openApp("kakaot://", "https://play.google.com/store/apps/details?id=com.kakao.taxi", "https://apps.apple.com/app/id981110422", "https://www.kakaocorp.com/service/KakaoT");
}
function openUber() {
    openApp("uber://", "https://play.google.com/store/apps/details?id=com.ubercab", "https://apps.apple.com/app/id368677368", "https://m.uber.com/ul");
}
function openPapago() {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    if (isAndroid) {
        window.location = "intent://#Intent;scheme=papago;package=com.naver.labs.translator;S.browser_fallback_url=https://papago.naver.com/;end";
    } else {
        openApp("papago://", "", "https://apps.apple.com/app/id1147246415", "https://papago.naver.com/");
    }
}
function openGoogleTranslate() {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    if (isAndroid) {
        window.location = "intent://#Intent;package=com.google.android.apps.translate;scheme=googletranslate;S.browser_fallback_url=https://translate.google.com/;end;";
    } else {
        openApp("googletranslate://", "", "https://apps.apple.com/app/id414706506", "https://translate.google.com/");
    }
}

// ==========================================
// 2. 공통 UI 렌더링 (하단 앱 버튼)
// ==========================================
function renderGlobalApps() {
    const container = document.getElementById('global-apps-container');
    if (!container) return;
    container.innerHTML = `
        <div class="mb-6">
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2"><i data-lucide="languages" class="w-5 h-5 text-blue-500"></i> 번역 앱 실행</h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openPapago()" class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Papago</button>
                <button onclick="openGoogleTranslate()" class="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Google</button>
            </div>
        </div>
        <div>
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2"><i data-lucide="car" class="w-5 h-5 text-yellow-500"></i> 택시 앱 호출</h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openKakaoT()" class="bg-[#FEE500] text-[#3c1e1e] py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Kakao T</button>
                <button onclick="openUber()" class="bg-black text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">Uber</button>
            </div>
            <p class="text-[12px] text-slate-500 mt-2 text-center leading-normal">* 앱이 설치되어 있어야 실행됩니다.</p>
        </div>
    `;
}

// ==========================================
// 3. 홈 버튼 & 날씨 위젯 통합 생성 (+4일 예보 포함)
// ==========================================
const weatherIconMap = {
    0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud',
    45: 'cloud-fog', 48: 'cloud-fog',
    51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
    61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain',
    80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-rain',
    95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning'
};

function injectHeaderElements() {
    // 1. 이미 날씨가 있는 페이지(Index)는 건너뜀 (Index는 이 함수가 필요 없음)
    if (document.getElementById('current-temp')) return;

    // 2. 헤더의 Flex 컨테이너 찾기
    const headerFlex = document.querySelector('header .max-w-4xl .flex.justify-between');
    if (!headerFlex) return;

    // 3. 홈 버튼 + 날씨 위젯(5일치 그리드 포함) 삽입
    // - 너비 w-[180px]로 고정하여 4일치 예보가 잘 보이도록 함
    const rightSideHtml = `
        <div class="flex flex-col items-end gap-2 ml-2">
            <a href="index.html" class="flex items-center gap-1 text-slate-300 hover:text-white transition-colors bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-700 shadow-sm text-xs font-bold">
                <i data-lucide="home" class="w-3.5 h-3.5"></i> 홈으로
            </a>

            <a href="https://tenki.jp/forecast/10/50/9110/47201/" target="_blank" class="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/10 w-[180px] shadow-lg hover:bg-white/20 transition-colors cursor-pointer block text-decoration-none">
                <div class="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-sky-300 font-bold mb-0.5 flex items-center gap-1">오키나와(나하) <i data-lucide="external-link" class="w-2 h-2"></i></span>
                        <span id="current-temp" class="text-3xl font-black text-white leading-none tracking-tighter">--°</span>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <i data-lucide="cloud" class="w-6 h-6 text-yellow-400 mb-0.5" id="weather-icon-main"></i>
                        <div class="text-[10px] text-slate-200 font-medium bg-white/10 px-1.5 py-0.5 rounded">
                            <span id="today-range">--/--</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-4 gap-1 text-center" id="forecast-grid">
                    <div class="text-[10px] text-slate-400 col-span-4 py-1">예보 로딩...</div>
                </div>
            </a>
        </div>
    `;

    // 헤더의 맨 뒤(오른쪽)에 삽입
    headerFlex.insertAdjacentHTML('beforeend', rightSideHtml);
}

async function updateWeather() {
    injectHeaderElements(); // 위젯 생성 시도

    const tempEl = document.getElementById('current-temp');
    if (!tempEl) return;

    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=5");
        const data = await res.json();
        
        if (data && data.current_weather && data.daily) {
            // 현재 날씨
            const currentTemp = Math.round(data.current_weather.temperature);
            tempEl.innerText = currentTemp + "°";
            
            const currentCode = data.current_weather.weathercode;
            const mainIcon = weatherIconMap[currentCode] || 'cloud';
            const iconEl = document.getElementById('weather-icon-main');
            if (iconEl) iconEl.setAttribute('data-lucide', mainIcon);

            // 오늘 최저/최고
            const todayMin = Math.round(data.daily.temperature_2m_min[0]);
            const todayMax = Math.round(data.daily.temperature_2m_max[0]);
            const rangeEl = document.getElementById('today-range');
            if (rangeEl) rangeEl.innerText = `${todayMin}°/${todayMax}°`;

            // +4일 예보 채우기
            const forecastGrid = document.getElementById('forecast-grid');
            if (forecastGrid) {
                forecastGrid.innerHTML = ''; 
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const today = new Date();
                
                // 내일부터 4일간 (i=1 to 4)
                for (let i = 1; i < 5; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + i);
                    const dayName = days[date.getDay()];
                    
                    const code = data.daily.weathercode[i];
                    const icon = weatherIconMap[code] || 'cloud';
                    const min = Math.round(data.daily.temperature_2m_min[i]);
                    const max = Math.round(data.daily.temperature_2m_max[i]);

                    const cell = document.createElement('div');
                    cell.className = 'flex flex-col items-center justify-center p-1 bg-white/5 rounded hover:bg-white/10 transition-colors';
                    cell.innerHTML = `
                        <span class="text-[9px] text-slate-300 mb-0.5">${dayName}</span>
                        <i data-lucide="${icon}" class="w-3.5 h-3.5 text-slate-200 mb-0.5"></i>
                        <span class="text-[9px] font-bold text-white leading-tight">${max}°<br><span class="text-slate-400 font-normal">${min}°</span></span>
                    `;
                    forecastGrid.appendChild(cell);
                }
            }
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) {
        console.error("Weather Error", e);
    }
}

// ==========================================
// 4. 유틸리티 기능
// ==========================================
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showToast);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast();
        } catch (err) {}
        document.body.removeChild(textArea);
    }
}
function showToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2000);
}
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.addEventListener('scroll', () => {
    const topBtn = document.getElementById('top-btn');
    if (topBtn) {
        if (window.scrollY > 300) topBtn.classList.add('visible');
        else topBtn.classList.remove('visible');
    }
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        if (window.scrollY > 200) searchContainer.classList.add('shadow-md', 'bg-white/95', 'backdrop-blur');
        else searchContainer.classList.remove('shadow-md', 'bg-white/95', 'backdrop-blur');
    }
});

// ==========================================
// 5. 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderGlobalApps();
    updateWeather();
    if (window.lucide) window.lucide.createIcons();
});
