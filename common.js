/**
 * 오키나와 가족 여행 웹사이트 공통 스크립트
 * (앱 연동, 날씨 자동 생성 및 데이터 연동, 유틸리티)
 */

// ==========================================
// 1. 앱 실행 (Deep Link) 로직
// ==========================================

/**
 * 앱 실행 헬퍼 함수
 * Android/iOS를 구분하여 앱 스킴을 호출하고, 앱이 없으면 스토어/웹으로 이동 시도
 */
function openApp(urlScheme, storeUrlAndroid, storeUrlIOS, webFallback) {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    // 1. 앱 실행 시도
    if (isAndroid) {
        // 안드로이드는 iframe이나 location.href로 스킴 호출 시도
        // 1.5초 후 반응 없으면 스토어로 이동하는 타임아웃 설정
        const now = new Date().getTime();
        setTimeout(function () {
            if (new Date().getTime() - now < 2000) {
                window.location = storeUrlAndroid;
            }
        }, 1500);
        window.location = urlScheme;
    } else if (isIOS) {
        // iOS도 유사한 방식
        const now = new Date().getTime();
        setTimeout(function () {
            if (new Date().getTime() - now < 2000) {
                window.location = storeUrlIOS;
            }
        }, 1500);
        window.location = urlScheme;
    } else {
        // PC 등 기타 환경은 웹 폴백
        window.open(webFallback);
    }
}

// 카카오 T 실행
function openKakaoT() {
    openApp(
        "kakaot://", 
        "https://play.google.com/store/apps/details?id=com.kakao.taxi", 
        "https://apps.apple.com/app/id981110422", 
        "https://www.kakaocorp.com/service/KakaoT"
    );
}

// 우버(Uber) 실행
function openUber() {
    openApp(
        "uber://", 
        "https://play.google.com/store/apps/details?id=com.ubercab", 
        "https://apps.apple.com/app/id368677368", 
        "https://m.uber.com/ul"
    );
}

// 파파고(Papago) 실행 - 요청하신 연동
function openPapago() {
    openApp(
        "papago://", // 파파고 URL Scheme
        "https://play.google.com/store/apps/details?id=com.naver.labs.translator", 
        "https://apps.apple.com/app/id1147246415", 
        "https://papago.naver.com/"
    );
}

// 구글 번역 실행
function openGoogleTranslate() {
    const userAgent = navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);
    
    if (isAndroid) {
        // 안드로이드 Intent 방식 (더 확실한 방법)
        const intentUrl = "intent://#Intent;package=com.google.android.apps.translate;scheme=googletranslate;end;";
        window.location = intentUrl;
    } else {
        openApp(
            "googletranslate://", 
            "https://play.google.com/store/apps/details?id=com.google.android.apps.translate", 
            "https://apps.apple.com/app/id414706506", 
            "https://translate.google.com/"
        );
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
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="languages" class="w-5 h-5 text-blue-500"></i> 번역 앱 실행
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openPapago()" class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Papago
                </button>
                <button onclick="openGoogleTranslate()" class="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Google
                </button>
            </div>
        </div>

        <div>
            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="car" class="w-5 h-5 text-yellow-500"></i> 택시 앱 호출
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="openKakaoT()" class="bg-[#FEE500] text-[#3c1e1e] py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                    Kakao T
                </button>
                <button onclick="openUber()" class="bg-black text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">
                    Uber
                </button>
            </div>
            <p class="text-[12px] text-slate-500 mt-2 text-center leading-normal">
                * 앱이 설치되어 있어야 실행됩니다. (일본 내 Kakao T는 JapanTaxi(GO)와 연동)
            </p>
        </div>
    `;
}


// ==========================================
// 3. 날씨 위젯 자동 생성 및 데이터 연동
// ==========================================

// 날씨 아이콘 매핑
const weatherIconMap = {
    0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud',
    45: 'cloud-fog', 48: 'cloud-fog',
    51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
    61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain',
    80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-rain',
    95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning'
};

/**
 * 페이지 헤더에 날씨 위젯 HTML을 동적으로 삽입하는 함수
 * (Index 페이지는 이미 HTML이 있으므로 건너뜀)
 */
function injectWeatherWidget() {
    // 이미 날씨 위젯이 존재하는지 확인 (Index 페이지 등)
    if (document.getElementById('current-temp')) return;

    // 헤더의 타이틀 영역 찾기 (flex justify-between 구조)
    const headerFlex = document.querySelector('header .max-w-4xl .flex.justify-between');
    
    if (headerFlex) {
        // 날씨 위젯 HTML 생성
        const widgetHtml = `
            <a href="https://tenki.jp/forecast/10/50/9110/47201/" target="_blank" class="flex-none bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/10 w-[140px] shadow-lg hover:bg-white/20 transition-colors cursor-pointer block text-decoration-none ml-2">
                <div class="flex justify-between items-center mb-1 pb-1 border-b border-white/10">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-sky-300 font-bold mb-0.5 flex items-center gap-1">나하 <i data-lucide="external-link" class="w-2 h-2"></i></span>
                        <span id="current-temp" class="text-2xl font-black text-white leading-none tracking-tighter">--°</span>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <i data-lucide="cloud" class="w-5 h-5 text-yellow-400 mb-0.5" id="weather-icon-main"></i>
                        <div class="text-[9px] text-slate-200 font-medium bg-white/10 px-1 py-0.5 rounded">
                            <span id="today-range">--/--</span>
                        </div>
                    </div>
                </div>
                <div class="text-[9px] text-center text-slate-300" id="forecast-simple">
                    로딩중..
                </div>
            </a>
        `;
        
        // HTML 삽입
        headerFlex.insertAdjacentHTML('beforeend', widgetHtml);
    }
}

/**
 * 날씨 데이터 가져오기 (Open-Meteo API)
 */
async function updateWeather() {
    // 위젯 주입 시도 (없으면 생성)
    injectWeatherWidget();

    // 주입 후에도 엘리먼트가 없으면 중단
    const tempEl = document.getElementById('current-temp');
    if (!tempEl) return;

    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=5");
        const data = await res.json();
        
        if (data && data.current_weather && data.daily) {
            // 현재 기온
            const currentTemp = Math.round(data.current_weather.temperature);
            tempEl.innerText = currentTemp + "°";
            
            // 메인 아이콘
            const currentCode = data.current_weather.weathercode;
            const mainIcon = weatherIconMap[currentCode] || 'cloud';
            const iconEl = document.getElementById('weather-icon-main');
            if (iconEl) iconEl.setAttribute('data-lucide', mainIcon);

            // 오늘 최저/최고
            const todayMin = Math.round(data.daily.temperature_2m_min[0]);
            const todayMax = Math.round(data.daily.temperature_2m_max[0]);
            const rangeEl = document.getElementById('today-range');
            if (rangeEl) rangeEl.innerText = `${todayMin}°/${todayMax}°`;

            // 1. Index 페이지용 (상세 그리드)
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

            // 2. 다른 페이지용 (간소화 텍스트)
            const forecastSimple = document.getElementById('forecast-simple');
            if (forecastSimple) {
                // 내일 날씨만 간단히 표시
                const tomorrowCode = data.daily.weathercode[1];
                const tomorrowMax = Math.round(data.daily.temperature_2m_max[1]);
                // 날씨 코드에 따른 텍스트 (간단 변환)
                let weatherText = "맑음";
                if (tomorrowCode > 3) weatherText = "흐림";
                if (tomorrowCode > 50) weatherText = "비";
                
                forecastSimple.innerText = `내일: ${weatherText} (최고 ${tomorrowMax}°)`;
            }

            // 동적으로 추가된 아이콘 렌더링
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) {
        console.error("날씨 정보 로딩 실패", e);
    }
}


// ==========================================
// 4. 유틸리티 기능 (복사, 스크롤, 토스트)
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
        } catch (err) {
            console.error('복사 실패', err);
        }
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
    const searchContainer = document.getElementById('search-container'); // 맵코드 페이지용

    if (topBtn) {
        if (window.scrollY > 300) {
            topBtn.classList.add('visible');
        } else {
            topBtn.classList.remove('visible');
        }
    }
    
    // 맵코드 페이지 검색바 스타일링
    if (searchContainer) {
        if (window.scrollY > 200) {
            searchContainer.classList.add('shadow-md', 'bg-white/95', 'backdrop-blur');
        } else {
            searchContainer.classList.remove('shadow-md', 'bg-white/95', 'backdrop-blur');
        }
    }
});


// ==========================================
// 5. 초기화 (페이지 로드 시 실행)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderGlobalApps(); // 1. 하단 앱 버튼 생성
    updateWeather();    // 2. 날씨 위젯 생성 및 데이터 로드
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
