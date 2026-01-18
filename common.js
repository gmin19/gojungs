/**
 * 오키나와 가족 여행 웹사이트 공통 스크립트
 * (앱 연동 최적화, 플로팅 홈 버튼, 날씨 위젯)
 */

// ==========================================
// 1. 앱 실행 (Deep Link) 로직 - 카메라 기능 보장형
// ==========================================

function openApp(urlScheme, storeUrlAndroid, storeUrlIOS, webFallback) {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    if (isAndroid) {
        // [안드로이드] Intent 방식 사용 (가장 안정적)
        // 앱이 설치되어 있으면 실행, 없으면 스토어로 자동 이동되는 네이티브 방식
        // 파파고/구글번역 등 카메라 기능 사용을 위해 웹 폴백을 제거하고 스토어로 유도
        if (urlScheme.startsWith('intent:')) {
            window.location.href = urlScheme;
        } else {
            // 일반 스킴일 경우
            const now = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - now < 2500) {
                    window.location.href = storeUrlAndroid;
                }
            }, 2000);
            window.location.href = urlScheme;
        }
    } else if (isIOS) {
        // [iOS]
        const now = new Date().getTime();
        
        // 1. 앱 실행 시도
        window.location.href = urlScheme;

        // 2. 앱이 설치되지 않았거나 실행 확인 창에서 늦게 반응할 경우
        // 카메라 기능 사용을 위해 '웹사이트'가 아닌 '앱스토어'로 이동시킴
        setTimeout(() => {
            // 앱이 실행되어 백그라운드로 넘어가면 시간이 멈추므로 이 코드는 실행되지 않음
            // 화면이 그대로라면 앱이 없는 것으로 간주
            if (new Date().getTime() - now < 3000) {
                window.location.href = storeUrlIOS;
            }
        }, 2500);
    } else {
        // [PC] 웹사이트로 이동
        window.open(webFallback);
    }
}

// 카카오 T
function openKakaoT() {
    // 안드로이드 Intent 생성
    const intentAndroid = "intent://#Intent;scheme=kakaot;package=com.kakao.taxi;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.kakao.taxi;end";
    
    openApp(
        isAndroid() ? intentAndroid : "kakaot://", 
        "https://play.google.com/store/apps/details?id=com.kakao.taxi", 
        "https://apps.apple.com/app/id981110422", 
        "https://www.kakaocorp.com/service/KakaoT"
    );
}

// 우버 (Uber)
function openUber() {
    const intentAndroid = "intent://#Intent;scheme=uber;package=com.ubercab;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.ubercab;end";

    openApp(
        isAndroid() ? intentAndroid : "uber://", 
        "https://play.google.com/store/apps/details?id=com.ubercab", 
        "https://apps.apple.com/app/id368677368", 
        "https://m.uber.com/ul"
    );
}

// 파파고 (Papago) - 카메라 기능 필수
function openPapago() {
    // 안드로이드: 앱 없으면 바로 스토어로 이동하도록 fallback 설정
    const intentAndroid = "intent://#Intent;scheme=papago;package=com.naver.labs.translator;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.naver.labs.translator;end";
    
    openApp(
        isAndroid() ? intentAndroid : "papago://", 
        "https://play.google.com/store/apps/details?id=com.naver.labs.translator", 
        "https://apps.apple.com/app/id1147246415", 
        "https://papago.naver.com/" // PC에서만 웹으로
    );
}

// 구글 번역 - 카메라 기능 필수
function openGoogleTranslate() {
    const intentAndroid = "intent://#Intent;package=com.google.android.apps.translate;scheme=googletranslate;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.google.android.apps.translate;end";

    openApp(
        isAndroid() ? intentAndroid : "googletranslate://", 
        "https://play.google.com/store/apps/details?id=com.google.android.apps.translate", 
        "https://apps.apple.com/app/id414706506", 
        "https://translate.google.com/" // PC에서만 웹으로
    );
}

// OS 체크 헬퍼
function isAndroid() {
    return /android/i.test(navigator.userAgent);
}


// ==========================================
// 2. 공통 UI 렌더링
// ==========================================
function renderGlobalApps() {
    const container = document.getElementById('global-apps-container');
    if (!container) return;
    container.innerHTML = `
        <div class="mb-6">
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="languages" class="w-5 h-5 text-blue-500"></i> 번역 앱 (카메라/음성)
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openPapago()" class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Papago
                </button>
                <button onclick="openGoogleTranslate()" class="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Google
                </button>
            </div>
            <p class="text-[11px] text-slate-400 mt-2 text-center leading-tight">
                * 카메라 번역을 위해 앱 실행을 권장합니다.<br>설치되지 않은 경우 스토어로 이동합니다.
            </p>
        </div>
        <div>
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="car" class="w-5 h-5 text-yellow-500"></i> 택시 호출
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openKakaoT()" class="bg-[#FEE500] text-[#3c1e1e] py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Kakao T
                </button>
                <button onclick="openUber()" class="bg-black text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">
                    Uber
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// 3. UI 인젝션: 날씨 & 플로팅 홈 버튼 (디자인 개선)
// ==========================================
const weatherIconMap = {
    0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud',
    45: 'cloud-fog', 48: 'cloud-fog',
    51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
    61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain',
    80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-rain',
    95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning'
};

function injectCommonElements() {
    if (document.getElementById('current-temp')) return; // Index 페이지 제외

    // 1. 헤더 날씨 위젯
    const headerFlex = document.querySelector('header .max-w-4xl .flex.justify-between');
    if (headerFlex) {
        const weatherHtml = `
            <a href="https://tenki.jp/forecast/10/50/9110/47201/" target="_blank" class="flex-none bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/10 w-[180px] shadow-lg hover:bg-white/20 transition-colors cursor-pointer block text-decoration-none ml-2">
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
        `;
        headerFlex.insertAdjacentHTML('beforeend', weatherHtml);
    }

    // 2. 플로팅 홈 버튼 (가독성 개선: 반투명 + 블러)
    // bg-slate-900/80 (투명도 80%), backdrop-blur-md (블러 효과)
    const homeBtnHtml = `
        <a href="index.html" class="fixed bottom-[90px] right-[24px] z-50 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-full shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center border border-white/10">
            <i data-lucide="home" class="w-6 h-6"></i>
        </a>
    `;
    document.body.insertAdjacentHTML('beforeend', homeBtnHtml);
}

async function updateWeather() {
    injectCommonElements();

    const tempEl = document.getElementById('current-temp');
    if (!tempEl) return;

    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=5");
        const data = await res.json();
        
        if (data && data.current_weather && data.daily) {
            const currentTemp = Math.round(data.current_weather.temperature);
            tempEl.innerText = currentTemp + "°";
            
            const currentCode = data.current_weather.weathercode;
            const mainIcon = weatherIconMap[currentCode] || 'cloud';
            const iconEl = document.getElementById('weather-icon-main');
            if (iconEl) iconEl.setAttribute('data-lucide', mainIcon);

            const todayMin = Math.round(data.daily.temperature_2m_min[0]);
            const todayMax = Math.round(data.daily.temperature_2m_max[0]);
            const rangeEl = document.getElementById('today-range');
            if (rangeEl) rangeEl.innerText = `${todayMin}°/${todayMax}°`;

            const forecastGrid = document.getElementById('forecast-grid');
            if (forecastGrid) {
                forecastGrid.innerHTML = ''; 
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const today = new Date();
                
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
