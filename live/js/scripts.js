
        function toggleDropdown() {
            var dropdown = document.getElementById('matchesDropdown');
            dropdown.classList.toggle('show');
        }

        async function fetchMatches() {
    const response = await fetch('http://news.zerolagvpn.com:3000/matches');
    const matches = await response.json();

    const allMatchesElement = document.querySelector('.allmatches');
    allMatchesElement.innerHTML = '';

    if (matches.length === 0) {
        allMatchesElement.innerHTML = `
            <div class="no-matches">
                <p>هنا يتم عرض مواجهات اليوم والقناة الناقلة لها</p>
                <img src="/path/to/no-matches-icon.png" alt="No Matches" />
            </div>
        `;
        return;
    }

    // عرض المباريات بالترتيب العكسي كما يتم استلامها من الخادم
    matches.forEach(match => {
        const matchElement = document.createElement('div');
        matchElement.className = 'match';
        matchElement.innerHTML = `
            <div class="details">
                <div class="team1">
                    <img src="http://news.zerolagvpn.com:3000/${match.team1Logo}" alt="Team 1 Logo">
                    <span>${match.team1Name}</span>
                </div>
                <span>vs</span>
                <div class="team1">
                    <span>${match.team2Name}</span>
                    <img src="http://news.zerolagvpn.com:3000/${match.team2Logo}" alt="Team 2 Logo">
                </div>
            </div>
            <div class="details2">
                <span><i class="fas fa-clock"></i> ${match.matchTime}</span>
                <span><i class="fas fa-tv"></i> ${match.channel}</span>
            </div>
        `;
        allMatchesElement.appendChild(matchElement);
    });
}

// استدعاء الدالة لجلب المباريات
fetchMatches();

async function fetchNetworkTime() {
    const ntpUrl = 'http://worldclockapi.com/api/json/utc/now';

    try {
        const response = await fetch(ntpUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const serverTime = new Date(data.currentDateTime);
        return serverTime;
    } catch (error) {
        console.error('Error fetching network time:', error);
        return new Date();
    }
}

async function displayDateTime() {
    const datetimeElement = document.getElementById('datetime');
    const dateElement = document.getElementById('date');

    if (!datetimeElement || !dateElement) {
        console.error('Date or Time element not found');
        return;
    }

    const now = await fetchNetworkTime();

    const timeOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    let timeString = now.toLocaleTimeString('en-US', timeOptions);
    timeString = timeString.replace('AM', 'ص').replace('PM', 'م');
    datetimeElement.innerText = timeString;

    const dateOptions = {
        month: 'short',
        day: 'numeric'
    };
    const weekdayOptions = { weekday: 'long' };
    dateElement.innerText = `${now.toLocaleDateString('ar-EG', weekdayOptions)} . ${now.toLocaleDateString('en-US', dateOptions)}`;
}

// استخدم setInterval لتحديث الوقت بشكل مستمر
setInterval(displayDateTime, 1000);

displayDateTime();

function toggleDropdown2() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu) {
        dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    }
}

// أغلق القائمة المنسدلة إذا نقر المستخدم في أي مكان خارجها
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content2");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function () {
    setupButtons();
    loadTickerText();
});

function setupButtons() {
    setupImproveViewButton();
    setupExternalPlayerButton();
}

function setupImproveViewButton() {
    const improveViewButton = document.querySelector('#improveViewButton');
    if (improveViewButton) {
        improveViewButton.addEventListener('click', function (event) {
            event.preventDefault();
            clearBrowserCache();
        });
    } else {
        console.error('زر تحسين المشاهدة غير موجود');
    }
}

function setupExternalPlayerButton() {
    const externalPlayerButton = document.querySelector('#externalPlayerButton');
    if (externalPlayerButton) {
        if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            externalPlayerButton.addEventListener('click', function (event) {
                event.preventDefault();
                alert('ميزة المشغل الخارجي متاحة فقط على الهواتف الذكية.');
            });
        } else {
            externalPlayerButton.addEventListener('click', function (event) {
                event.preventDefault();
                showRemoteControl();
            });
        }
    } else {
        console.error('زر مشغل خارجي غير موجود');
    }
}

function clearBrowserCache() {
    if ('caches' in window) {
        caches.keys().then(function (names) {
            names.forEach(function (name) {
                caches.delete(name);
            });
        });
        console.log('تم حذف الكاش باستخدام Caches API');
    } else {
        console.warn('Caches API غير مدعومة في هذا المتصفح');
    }

    const cookies = document.cookie.split(';');
    cookies.forEach(function (cookie) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    console.log('تم حذف الكوكيز');

    alert('تم تحسين المتصفح للمشاهدة قم بإختيار القناة والجودة المناسبة');
    location.reload();
}

function loadTickerText() {
    fetch('http://news.zerolagvpn.com:3000/ticker')
        .then(response => response.json())
        .then(data => {
            const tickerMove = document.querySelector('.ticker-move');
            tickerMove.innerHTML = '';

            data.forEach((item, index) => {
                const tickerItem = document.createElement('div');
                tickerItem.className = 'ticker-item';
                tickerItem.innerHTML = `
                    <span class="ticker-text">${item.text}</span>
                    ${item.icon ? `<img src="http://news.zerolagvpn.com:3000/uploads/${item.icon}" alt="icon" class="ticker-icon">` : ''}
                `;
                tickerMove.appendChild(tickerItem);
            });

            startTickerAnimation();
        })
        .catch(error => {
            console.error('Error fetching ticker text:', error);
        });
}

function startTickerAnimation() {
    const tickerMove = document.querySelector('.ticker-move');
    const tickerWidth = tickerMove.scrollWidth;
    const viewportWidth = window.innerWidth;

    let startPos = viewportWidth;
    let endPos = -tickerWidth;

    function animate() {
        if (startPos <= endPos) {
            startPos = viewportWidth;
        } else {
            startPos -= 2;
        }
        tickerMove.style.transform = `translateX(${startPos}px)`;
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}
document.addEventListener('DOMContentLoaded', loadSerial);

let serials = [];

async function loadSerial() {
    try {
        const response = await fetch('./js/flv.json');
        if (!response.ok) throw new Error('Network error: ' + response.statusText);

        const data = await response.json();
        const serial = data['serial-number'];
        if (!serial) throw new Error('No serial number found');

        serials.push(serial);

        // ✅ تمرير الرقم التسلسلي إلى دالة تحميل القنوات بشكل صحيح
        loadChannels(serial);
    } catch (error) {
        console.error('Error:', error);
        alert('يوجد لديك نقص بملفات النظام ');
    }
}

// دالة عرض رسالة خطأ في واجهة المستخدم
function displayErrorMessage(message) {
    let errorContainer = document.getElementById('errorContainer');
    
    // التأكد من وجود العنصر، وإلا يتم إنشاؤه
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'errorContainer';
        document.body.appendChild(errorContainer);
    }

    errorContainer.innerText = message;
    errorContainer.style.color = 'red';
    errorContainer.style.fontWeight = 'bold';
    errorContainer.style.display = 'block';
}

async function loadChannels(serial) {
    try {
        console.log('loadChannels called with serial:', serial);  // إضافة تسجيل
        if (!serial) {
            displayErrorMessage('الرقم التسلسلي مطلوب لتحميل القنوات.');
            throw new Error('Serial number is required to load channels');
        }

        const response = await fetch('http://news.zerolagvpn.com:3000/channels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serial: serial }) 
        });

        if (!response.ok) {
            displayErrorMessage('تعذر تحميل القنوات. الوصول غير مصرح به.');
            throw new Error('Failed to load channels. Unauthorized access.');
        }

        const channels = await response.json();
        const channelButtons = document.getElementById('channelButtons');
        clearElementChildren(channelButtons);

        channels.forEach(channel => {
            const button = document.createElement('button');
            button.className = 'channel-button';
            button.innerText = channel.name;

            button.addEventListener('click', () => {
                highlightButton(button, 'channel');
                showQualityOptions(channel.options || []);
            });

            channelButtons.appendChild(button);
        });

    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

function clearElementChildren(element) {
    while (element.firstChild) {
        removeEventListeners(element.firstChild);
        element.removeChild(element.firstChild);
    }
}

function removeEventListeners(element) {
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
}

function showQualityOptions(options) {
    const qualityOptionsDiv = document.getElementById('qualityOptions');
    
    // تحقق من وجود العنصر قبل تعيين خصائص له
    if (!qualityOptionsDiv) {
        console.error('Element with id "qualityOptions" not found.');
        return;
    }
    
    console.log('showQualityOptions called with options:', options);
    
    // تفريغ المحتويات القديمة
    qualityOptionsDiv.innerHTML = '';
    
    // إضافة الخيارات الجديدة
    options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.className = 'channel-button2';
        optionButton.innerText = option.quality;
        optionButton.addEventListener('click', function () {
            highlightButton(optionButton, 'quality');
            playVideo(option.url, option.type);
            showInternetSpeedNote(option.quality);
        });
        
        qualityOptionsDiv.appendChild(optionButton);
    });

    // إظهار العنصر
    qualityOptionsDiv.style.display = 'block';
}

function showInternetSpeedNote(quality) {
    let note = '';

    switch (quality) {
        case 'جودة منخفضة':
            note = 'هذه الجودة تتطلب سرعة إنترنت لا تقل عن 300 كيلوبت في الثانية.';
            break;
        case 'جودة متوسطه':
            note = 'هذه الجودة تتطلب سرعة إنترنت لا تقل عن 1 ميجابت في الثانية.';
            break;
        case 'جودة عالية':
            note = 'هذه الجودة تتطلب سرعة إنترنت لا تقل عن 1.5 ميجابت في الثانية.';
            break;
        case 'ايفون':
            note = 'هذا المشغل مخصص لأجهزة الايفون.';
            break;
    }

    const noteElement = document.getElementById('note');
    noteElement.innerText = note;
    noteElement.style.display = 'block';
}

function highlightButton(button, type) {
    if (type === 'channel') {
        const channelButtons = document.querySelectorAll('.channel-button');
        channelButtons.forEach(btn => btn.classList.remove('active-channel-button'));
        button.classList.add('active-channel-button');
    } else if (type === 'quality') {
        const qualityButtons = document.querySelectorAll('.channel-button2');
        qualityButtons.forEach(btn => btn.classList.remove('active-quality-option-button'));
        button.classList.add('active-quality-option-button');
    }
}

let currentType = '';
let player = null;

function stopCurrentPlayer() {
    if (player) {
        switch (currentType) {
            case 'mpegts':
            case 'flv':
                player.unload();
                player.detachMediaElement();
                player.destroy();
                break;
            case 'hls':
                player.destroy();
                break;
            case 'dash':
                player.reset();
                break;
        }
        player = null;
        currentType = '';
    }
}

function playVideo(url, type) {
    const videoElement = document.getElementById('videoElement');

    if (player) {
        if (currentType === type && player.url === url) {
            return;
        }
        stopCurrentPlayer();
    }

    const encoderConfigs = {
        'flv': {
            checkSupport: () => flvjs.isSupported(),
            createPlayer: () => {
                const flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    url: url,
                    config: {
                        enableStashBuffer: true,
                        stashInitialSize: 512 * 1024,
                        isLive: true
                    }
                });
                flvPlayer.attachMediaElement(videoElement);
                flvPlayer.load();
                flvPlayer.play();
                return flvPlayer;
            },
            error: 'المتصفح لا يدعم FLV أو هناك مشكلة في التشغيل.'
        },
        'hls': {
            checkSupport: () => Hls.isSupported(),
            createPlayer: () => {
                const hlsPlayer = new Hls({
                    maxBufferLength: 5,
                    maxMaxBufferLength: 15,
                    startLevel: 1,
                    liveSyncDuration: 2
                });
                hlsPlayer.loadSource(url);
                hlsPlayer.attachMedia(videoElement);
                hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
                    videoElement.play();
                });
                return hlsPlayer;
            }
        },
        'dash': {
            checkSupport: () => 'MediaSource' in window,
            createPlayer: () => {
                const dashPlayer = dashjs.MediaPlayer().create();
                dashPlayer.initialize(videoElement, url, true);
                return dashPlayer;
            },
            error: 'المتصفح لا يدعم DASH أو هناك مشكلة في التشغيل.'
        },
        'mp4': {
            checkSupport: () => videoElement.canPlayType('video/mp4'),
            createPlayer: () => {
                videoElement.src = url;
                videoElement.play();
                return videoElement;
            },
            error: 'المتصفح لا يدعم MP4 أو هناك مشكلة في التشغيل.'
        }
    };

    const config = encoderConfigs[type];
    
    if (!config) {
        console.error(`نوع المشغل ${type} غير معرّف.`);
        return;
    }

    if (!config.checkSupport()) {
        console.error(config.error || `نوع المشغل ${type} غير مدعوم.`);
        return;
    }

    if (currentType === type && player) {
        console.log('المشغل الحالي يعمل بالفعل بهذا النوع.');
        return;
    }

    stopCurrentPlayer();

    player = config.createPlayer(url);
    currentType = type;
}

function showRemoteControl() {
    const remoteControl = document.getElementById('remoteControl');
    const channelList = document.getElementById('channelList');

    if (!remoteControl || !channelList) {
        console.error('عناصر جهاز التحكم غير موجودة');
        return;
    }
    remoteControl.style.display = 'block';
    channelList.innerHTML = '';

    channels.forEach(channel => {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel-item';
        channelDiv.innerHTML = `<h3>${channel.name}</h3>`;

        channel.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.quality;
            button.addEventListener('click', () => openExternalPlayer(option.url));
            channelDiv.appendChild(button);
        });

        channelList.appendChild(channelDiv);
    });
}

function openExternalPlayer(url) {
    if (/Android/i.test(navigator.userAgent)) {
        const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;action=android.intent.action.VIEW;scheme=http;package=com.mxtech.videoplayer.ad;end;`;
        window.location.href = intentUrl;
    } else {
        alert('المشغل الخارجي متاح فقط على الهواتف الذكية.');
    }
}

function closeRemoteControl() {
    const remoteControl = document.getElementById('remoteControl');
    if (remoteControl) {
        remoteControl.style.display = 'none';
    }
}


