/**
 * 오키나와 가족 여행 공통 스크립트 (최종 버전)
 * - Firebase 공지사항 (실시간)
 * - 네비게이션 자동 생성 (홈 탭 추가, 긴급연락처 우측 고정)
 * - 날씨 위젯 & 플로팅 홈 버튼
 * - 앱 실행 오류 개선 (파파고 웹 강제 실행)
 * - PWA 서비스 워커 등록
 */

// 1. Firebase 라이브러리 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCTsBiqB4l1X-f_Bf7e0adCZtS_mmoYjWg",
    authDomain: "okinawa-trip-2026-cdc54.firebaseapp.com",
    projectId: "okinawa-trip-2026-cdc54",
    storageBucket: "okinawa-trip-2026-cdc54.firebasestorage.app",
    messagingSenderId: "775661354652",
    appId: "1:775661354652:web:fb8f57bd60594a6d51f759",
    measurementId: "G-KQSQPGBESP"
};

// 3. Firebase 시작
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// A. 네비게이션 메뉴 설정 (수정됨)
// ==========================================
const menuItems = [
    { name: '홈', url: 'index.html', icon: 'home' },           // [추가됨] 메인 홈
    { name: '일정표', url: 'schedule.html', icon: 'calendar-days' }, // [변경됨] 파일명 schedule.html
    { name: '맵코드', url: 'mapcode.html', icon: 'map-pin' },
    { name: '관광지', url: 'place.html', icon: 'palmtree' },
    { name: '맛집', url: 'dining.html', icon: 'utensils' },
    { name: '쇼핑', url: 'shopping.html', icon: 'shopping-bag' },
    { name: '십계명', url: 'decalogue.html', icon: 'scroll' },
    { name: '숙소', url: 'house.html', icon: 'hotel' },
    { name: '로손', url: 'lawson.html', icon: 'store' },
    { name: '일본어', url: 'talk.html', icon: 'message-circle' },
    { name: '렌트카', url: 'car.html', icon: 'car' },
    { name: '긴급연락처', url: 'emergency.html', icon: 'siren' }, // 항상 우측 고정
];

function renderNavigation() {
    const navContainer = document.getElementById('global-nav');
    if (!navContainer) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // 일반 메뉴와 긴급연락처 분리
    const normalItems = menuItems.filter(item => item.url !== 'emergency.html');
    const emergencyItem = menuItems.find(item => item.url === 'emergency.html');

    // 1. 전체 컨테이너 (Flex로 좌측 스크롤영역 / 우측 고정영역 나눔)
    let navHtml = `<div class="max-w-4xl mx-auto flex items-center bg-white/95 backdrop-blur">`;

    // 2. 좌측 스크롤 영역 (일반 메뉴)
    navHtml += `<div class="flex-1 flex overflow-x-auto no-scrollbar py-0 px-2 space-x-1" id="nav-scroll-area">`;
    normalItems.forEach(item => {
        const isActive = currentPath === item.url;
        const activeClass = isActive ? 'active' : '';
        navHtml += `
            <a href="${item.url}" 
               class="nav-link ${activeClass} flex items-center gap-1.5 flex-none py-3 px-3 text-sm font-bold border-b-2 border-transparent text-slate-500 transition-all whitespace-nowrap">
                <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                ${item.name}
            </a>`;
    });
    navHtml += `</div>`;

    // 3. 우측 고정 영역 (긴급연락처) - 항상 보임
    if (emergencyItem) {
        const isActive = currentPath === emergencyItem.url;
        const extraStyle = isActive 
            ? 'color: #DC2626; border-bottom-color: #DC2626; background-color: #FEF2F2; font-weight: 900;' 
            : 'color: #EF4444; font-weight: 800;';

        navHtml += `
            <div class="flex-none z-10 pl-1 border-l border-slate-100 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] bg-white">
                <a href="${emergencyItem.url}" 
                   class="nav-link flex items-center gap-1.5 py-3 px-3 text-sm border-b-2 border-transparent transition-all whitespace-nowrap"
                   style="${extraStyle}">
                    <i data-lucide="${emergencyItem.icon}" class="w-4 h-4"></i>
                    ${emergencyItem.name}
                </a>
            </div>
        `;
    }

    navHtml += `</div>`;
    navContainer.innerHTML = navHtml;

    // 4. 활성화된 탭이 있으면 자동으로 가운데로 스크롤
    setTimeout(() => {
        const activeLink = document.querySelector('#nav-scroll-area .nav-link.active');
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, 100);

    if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// B. Firebase 실시간 공지사항 팝업
// ==========================================
async function checkAndShowNotice() {
    try {
        const docRef = doc(db, "notices", "latest");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.isActive) return;

            const now = new Date();
            const expiry = new Date(data.expiryDate);
            if (now > expiry) return;

            const hiddenUntil = localStorage.getItem(`hide_${data.id}`);
            if (hiddenUntil && now < new Date(hiddenUntil)) return;

            showNoticePopup(data);
        }
    } catch (error) {
        console.error("공지사항 로드 실패:", error);
    }
}

function showNoticePopup(data) {
    if (document.getElementById('common-notice-popup')) return;

    const popupHtml = `
        <div id="common-notice-popup" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-5 opacity-0 transition-opacity duration-300">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform duration-300">
                <div class="bg-orange-500 p-4 flex justify-between items-center">
                    <h3 class="text-white font-bold text-lg flex items-center gap-2">
                        <i data-lucide="megaphone" class="w-5 h-5"></i> ${data.title}
                    </h3>
                    <button onclick="window.closeNoticePopup()" class="text-white/80 hover:text-white">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="p-6 text-slate-700 leading-relaxed text-sm">
                    ${data.message}
                </div>
                <div class="border-t border-slate-100 flex">
                    <button onclick="window.closeNoticeToday('${data.id}')" class="flex-1 py-3.5 text-xs text-slate-400 font-medium hover:bg-slate-50 border-r border-slate-100">
                        오늘 하루 그만 보기
                    </button>
                    <button onclick="window.closeNoticePopup()" class="flex-1 py-3.5 text-sm text-orange-600 font-bold hover:bg-orange-50">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    
    setTimeout(() => {
        const el = document.getElementById('common-notice-popup');
        const box = el.querySelector('div');
        if(el) {
            el.classList.remove('opacity-0');
            box.classList.remove('scale-95');
            box.classList.add('scale-100');
        }
        if (window.lucide) window.lucide.createIcons();
    }, 10);
}

window.closeNoticePopup = function() {
    const el = document.getElementById('common-notice-popup');
    if (el) {
        el.classList.add('opacity-0');
        setTimeout(() => el.remove(), 300);
    }
};

window.closeNoticeToday = function(noticeId) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    localStorage.setItem(`hide_${noticeId}`, tomorrow);
    window.closeNoticePopup();
};

// ==========================================
// C. 앱 실행 로직 (Deep Link)
// ==========================================
function openApp(scheme, storeUrlIOS, intentUrlAndroid, webFallback) {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
        window.location.href = scheme;
        const clickedAt = +new Date();
        const clearTimers = () => {
            clearTimeout(timer);
            window.removeEventListener('pagehide', clearTimers);
            window.removeEventListener('blur', clearTimers);
        };
        window.addEventListener('pagehide', clearTimers);
        window.addEventListener('blur', clearTimers);
        const timer = setTimeout(function() {
            if (document.hidden || document.webkitHidden) return;
            if (+new Date() - clickedAt < 2500) { 
                window.location.href = storeUrlIOS;
            }
        }, 2000);
    } else if (isAndroid) {
        if (intentUrlAndroid) {
            window.location.href = intentUrlAndroid;
        } else {
            window.location.href = scheme;
        }
    } else {
        window.open(webFallback, "_blank");
    }
}

// 파파고 웹 실행
window.openPapago = () => {
    window.open("https://papago.naver.com/", "_blank");
};

// 나머지 앱
window.openGoogleTranslate = () => openApp(
    "googletranslate://", 
    "https://apps.apple.com/app/id414706506", 
    "intent://#Intent;package=com.google.android.apps.translate;scheme=googletranslate;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.google.android.apps.translate;end", 
    "https://translate.google.com/"
);

window.openKakaoT = () => openApp(
    "kakaot://", 
    "https://apps.apple.com/app/id981110422", 
    "intent://#Intent;scheme=kakaot;package=com.kakao.taxi;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.kakao.taxi;end", 
    "https://www.kakaocorp.com/service/KakaoT"
);

window.openUber = () => openApp(
    "uber://", 
    "https://apps.apple.com/app/id368677368", 
    "intent://#Intent;scheme=uber;package=com.ubercab;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.ubercab;end", 
    "https://m.uber.com/ul"
);

// 유틸리티 함수
window.copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(window.showToast);
    } else {
        const t = document.createElement("textarea");
        t.value = text;
        t.style.position="fixed"; t.style.left="-9999px";
        document.body.appendChild(t); t.focus(); t.select();
        try { document.execCommand('copy'); window.showToast(); } catch (e) {}
        document.body.removeChild(t);
    }
};
window.showToast = () => {
    const t = document.getElementById('toast');
    if (t) { t.classList.remove('opacity-0'); setTimeout(() => t.classList.add('opacity-0'), 2000); }
};
window.scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };


// ==========================================
// D. 초기화 & 화면 렌더링
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
                <button onclick="window.openPapago()" class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Papago</button>
                <button onclick="window.openGoogleTranslate()" class="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Google</button>
            </div>
            <p class="text-[11px] text-slate-400 mt-2 text-center leading-tight">* 카메라 번역을 위해 앱 실행을 권장합니다.</p>
        </div>
        <div>
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="car" class="w-5 h-5 text-yellow-500"></i> 택시 호출
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="window.openKakaoT()" class="bg-[#FEE500] text-[#3c1e1e] py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">Kakao T</button>
                <button onclick="window.openUber()" class="bg-black text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">Uber</button>
            </div>
        </div>
    `;
}

// 날씨 위젯
const weatherIconMap = { 0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud', 45: 'cloud-fog', 48: 'cloud-fog', 51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle', 61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain', 80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-rain', 95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning' };
async function updateWeather() {
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
            </a>`;
        headerFlex.insertAdjacentHTML('beforeend', weatherHtml);
    }
    
    // [수정됨] 홈(index.html)에서는 플로팅 홈 버튼 숨김, 서브 페이지에서만 표시
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath !== 'index.html' && !document.querySelector('.fixed.bottom-\\[90px\\]')) {
        const homeBtnHtml = `<a href="index.html" class="fixed bottom-[90px] right-[24px] z-50 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-full shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center border border-white/10"><i data-lucide="home" class="w-6 h-6"></i></a>`;
        document.body.insertAdjacentHTML('beforeend', homeBtnHtml);
    }

    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=5");
        const data = await res.json();
        if (data && data.current_weather && data.daily) {
            const tempEl = document.getElementById('current-temp'); if(tempEl) tempEl.innerText = Math.round(data.current_weather.temperature) + "°";
            const iconEl = document.getElementById('weather-icon-main'); if(iconEl) iconEl.setAttribute('data-lucide', weatherIconMap[data.current_weather.weathercode] || 'cloud');
            const rangeEl = document.getElementById('today-range'); if(rangeEl) rangeEl.innerText = `${Math.round(data.daily.temperature_2m_min[0])}°/${Math.round(data.daily.temperature_2m_max[0])}°`;
            const forecastGrid = document.getElementById('forecast-grid');
            if (forecastGrid) {
                forecastGrid.innerHTML = '';
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const today = new Date();
                for (let i = 1; i < 5; i++) {
                    const date = new Date(today); date.setDate(today.getDate() + i);
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

window.addEventListener('scroll', () => {
    const b = document.getElementById('top-btn');
    if (b) window.scrollY > 300 ? b.classList.add('visible') : b.classList.remove('visible');
});

// ==========================================
// E. PWA 서비스 워커 등록
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker 등록 성공:', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker 등록 실패:', err);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderNavigation();
    renderGlobalApps();
    updateWeather();
    checkAndShowNotice();
    if (window.lucide) window.lucide.createIcons();
});