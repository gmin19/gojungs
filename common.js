/**
 * 오키나와 가족 여행 공통 스크립트
 * (네비게이션 자동 생성, 앱 연동, 날씨 위젯)
 */

// ==========================================
// 1. 네비게이션 메뉴 데이터 & 렌더링 (NEW)
// ==========================================
const menuItems = [
    { name: '일정표', url: 'index.html', icon: 'calendar-days' },
    { name: '맵코드', url: 'mapcode.html', icon: 'map-pin' },
    { name: '관광지', url: 'place.html', icon: 'palmtree' },
    { name: '맛집', url: 'dining.html', icon: 'utensils' },
    { name: '쇼핑', url: 'shopping.html', icon: 'shopping-bag' },
    { name: '십계명', url: 'decalogue.html', icon: 'scroll' },
    { name: '숙소', url: 'house.html', icon: 'hotel' },
    { name: '렌트카', url: 'car.html', icon: 'car' },
    { name: '긴급연락처', url: 'emergency.html', icon: 'siren' },
    // 나중에 여기에 { name: '로손', url: 'lawson.html', icon: 'store' } 만 추가하면 됨
];

function renderNavigation() {
    const navContainer = document.getElementById('global-nav');
    if (!navContainer) return;

    // 현재 페이지 파일명 추출 (예: index.html)
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    let navHtml = `
        <div class="max-w-4xl mx-auto">
            <div class="flex overflow-x-auto no-scrollbar py-0 px-2 space-x-1">
    `;

    menuItems.forEach(item => {
        // 현재 페이지와 URL이 같으면 active 클래스 적용
        // 긴급연락처(emergency.html)는 붉은색 스타일 적용 예외 처리 가능
        const isActive = currentPath === item.url;
        let activeClass = isActive ? 'active' : '';
        let extraStyle = '';

        // 긴급연락처 탭 전용 스타일 (붉은색)
        if (item.url === 'emergency.html') {
            extraStyle = isActive 
                ? 'color: #DC2626; border-bottom-color: #DC2626; background-color: #FEF2F2; font-weight: 900;' 
                : 'color: #EF4444; font-weight: 800;';
        }

        navHtml += `
            <a href="${item.url}" 
               class="nav-link ${activeClass} flex items-center gap-1.5 flex-none py-3 px-3 text-sm font-bold border-b-2 border-transparent text-slate-500 transition-all"
               style="${extraStyle}">
                <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                ${item.name}
            </a>
        `;
    });

    navHtml += `
            </div>
        </div>
    `;

    navContainer.innerHTML = navHtml;
    // 아이콘 새로고침
    if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// 2. 앱 실행 (Deep Link) 로직
// ==========================================
function openApp(urlScheme, storeUrlAndroid, storeUrlIOS, webFallback) {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    if (isAndroid) {
        if (urlScheme.startsWith('intent:')) {
            window.location.href = urlScheme;
        } else {
            const now = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - now < 2500) window.location.href = storeUrlAndroid;
            }, 2000);
            window.location.href = urlScheme;
        }
    } else if (isIOS) {
        const now = new Date().getTime();
        window.location.href = urlScheme;
        setTimeout(() => {
            if (new Date().getTime() - now < 3000) window.location.href = storeUrlIOS;
        }, 2500);
    } else {
        window.open(webFallback);
    }
}

// 앱 실행 함수들 (카카오T, 우버, 파파고, 구글번역) - 기존과 동일
function openKakaoT() {
    openApp(
        /android/i.test(navigator.userAgent) ? "intent://#Intent;scheme=kakaot;package=com.kakao.taxi;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.kakao.taxi;end" : "kakaot://", 
        "https://play.google.com/store/apps/details?id=com.kakao.taxi", 
        "https://apps.apple.com/app/id981110422", 
        "https://www.kakaocorp.com/service/KakaoT"
    );
}
function openUber() {
    openApp(
        /android/i.test(navigator.userAgent) ? "intent://#Intent;scheme=uber;package=com.ubercab;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.ubercab;end" : "uber://", 
        "https://play.google.com/store/apps/details?id=com.ubercab", 
        "https://apps.apple.com/app/id368677368", 
        "https://m.uber.com/ul"
    );
}
function openPapago() {
    openApp(
        /android/i.test(navigator.userAgent) ? "intent://#Intent;scheme=papago;package=com.naver.labs.translator;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.naver.labs.translator;end" : "papago://", 
        "https://play.google.com/store/apps/details?id=com.naver.labs.translator", 
        "https://apps.apple.com/app/id1147246415", 
        "https://papago.naver.com/"
    );
}
function openGoogleTranslate() {
    openApp(
        /android/i.test(navigator.userAgent) ? "intent://#Intent;package=com.google.android.apps.translate;scheme=googletranslate;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.google.android.apps.translate;end" : "googletranslate://", 
        "https://play.google.com/store/apps/details?id=com.google.android.apps.translate", 
        "https://apps.apple.com/app/id414706506", 
        "https://translate.google.com/"
    );
}

// ==========================================
// 3. UI 인젝션: 공통 앱 & 날씨 & 홈 버튼
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
                <button onclick="openPapago()" class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Papago</button>
                <button onclick="openGoogleTranslate()" class="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Google</button>
            </div>
            <p class="text-[11px] text-slate-400 mt-2 text-center leading-tight">* 카메라 번역을 위해 앱 실행을 권장합니다.</p>
        </div>
        <div>
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="car" class="w-5 h-5 text-yellow-500"></i> 택시 호출
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openKakaoT()" class="bg-[#FEE500] text-[#3c1e1e] py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Kakao T</button>
                <button onclick="openUber()" class="bg-black text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">Uber</button>
            </div>
        </div>
    `;
}

// 날씨 관련 (기존 코드 유지)
const weatherIconMap = { 0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud', 45: 'cloud-fog', 48: 'cloud-fog', 51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle', 61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain', 80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-rain', 95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning' };

async function updateWeather() {
    // 1. 헤더 날씨 위젯 삽입 (없을 경우)
    const headerFlex = document.querySelector('header .max-w-4xl .flex.justify-between');
    if (headerFlex && !document.getElementById('current-temp')) {
        const weatherHtml = `
            <a href="https://tenki.jp/forecast/10/50/9110/47201/" target="_blank" class="flex-none bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/10 w-[180px] shadow-lg hover:bg-white/20 transition-colors cursor-pointer block text-decoration-none ml-2">
                <div class="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-sky-300 font-bold mb-0.5 flex items-center gap-1">오키나와(나하) <i data-lucide="external-link" class="w-2 h-2"></i></span>
                        <span id="current-temp" class="text-3xl font-black text-white leading-none tracking-tighter">--°</span>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <i data-lucide="cloud" class="w-6 h-6 text-yellow-400 mb-0.5" id="weather-icon-main"></i>
                        <div class="text-[10px] text-slate-200 font-medium bg-white/10 px-1.5 py-0.5 rounded"><span id="today-range">--/--</span></div>
                    </div>
                </div>
                <div class="grid grid-cols-4 gap-1 text-center" id="forecast-grid"><div class="text-[10px] text-slate-400 col-span-4 py-1">예보 로딩...</div></div>
            </a>
        `;
        headerFlex.insertAdjacentHTML('beforeend', weatherHtml);
    }

    // 2. 플로팅 홈 버튼 삽입
    if (!document.querySelector('.fixed.bottom-\\[90px\\]')) {
        const homeBtnHtml = `<a href="index.html" class="fixed bottom-[90px] right-[24px] z-50 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-full shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center border border-white/10"><i data-lucide="home" class="w-6 h-6"></i></a>`;
        document.body.insertAdjacentHTML('beforeend', homeBtnHtml);
    }

    // 3. API 호출
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=5");
        const data = await res.json();
        if (data && data.current_weather && data.daily) {
            const tempEl = document.getElementById('current-temp');
            if (tempEl) tempEl.innerText = Math.round(data.current_weather.temperature) + "°";
            
            const iconEl = document.getElementById('weather-icon-main');
            if (iconEl) iconEl.setAttribute('data-lucide', weatherIconMap[data.current_weather.weathercode] || 'cloud');

            const rangeEl = document.getElementById('today-range');
            if (rangeEl) rangeEl.innerText = `${Math.round(data.daily.temperature_2m_min[0])}°/${Math.round(data.daily.temperature_2m_max[0])}°`;

            const forecastGrid = document.getElementById('forecast-grid');
            if (forecastGrid) {
                forecastGrid.innerHTML = '';
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const today = new Date();
                for (let i = 1; i < 5; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + i);
                    const cell = document.createElement('div');
                    cell.className = 'flex flex-col items-center justify-center p-1 bg-white/5 rounded hover:bg-white/10 transition-colors';
                    cell.innerHTML = `<span class="text-[9px] text-slate-300 mb-0.5">${days[date.getDay()]}</span><i data-lucide="${weatherIconMap[data.daily.weathercode[i]] || 'cloud'}" class="w-3.5 h-3.5 text-slate-200 mb-0.5"></i><span class="text-[9px] font-bold text-white leading-tight">${Math.round(data.daily.temperature_2m_max[i])}°<br><span class="text-slate-400 font-normal">${Math.round(data.daily.temperature_2m_min[i])}°</span></span>`;
                    forecastGrid.appendChild(cell);
                }
            }
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) { console.error("Weather Error", e); }
}

// 유틸리티
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showToast);
    } else {
        const t = document.createElement("textarea");
        t.value = text;
        t.style.position="fixed"; t.style.left="-9999px";
        document.body.appendChild(t); t.focus(); t.select();
        try { document.execCommand('copy'); showToast(); } catch (e) {}
        document.body.removeChild(t);
    }
}
function showToast() {
    const t = document.getElementById('toast');
    if (t) { t.classList.remove('opacity-0'); setTimeout(() => t.classList.add('opacity-0'), 2000); }
}
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
window.addEventListener('scroll', () => {
    const b = document.getElementById('top-btn');
    if (b) window.scrollY > 300 ? b.classList.add('visible') : b.classList.remove('visible');
});

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    renderNavigation(); // [NEW] 네비게이션 자동 생성
    renderGlobalApps();
    updateWeather();
    if (window.lucide) window.lucide.createIcons();
});
