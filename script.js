// =========================
// إعداد البيانات و LocalStorage
// =========================

// إنشاء نافذة modal مرة واحدة فقط
(function setupModalOnce() {
    if (!document.getElementById('flight-modal')) {
        let modal = document.createElement('div');
        modal.id = 'flight-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '50%'; 
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%,-50%)';
        modal.style.background = '#fff';
        modal.style.padding = '24px 30px';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 4px 38px #0077ff27';
        modal.style.zIndex = 9999;
        modal.style.minWidth = '300px';
        modal.style.maxWidth = '90vw';
        modal.style.maxHeight = '70vh';
        modal.style.overflowY = 'auto';
        document.body.appendChild(modal);
    }
    // إغلاق عند النقر خارج المحتوى
    window.onclick = function (e) {
        let modal = document.getElementById('flight-modal');
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    };
})();

function renderFlightsBackground() {
    const bg = document.getElementById('flights-bg-page');
    if (!bg) return;
    bg.innerHTML = '';

    // جمع كل الرحلات من كل الصالات
    let allFlights = [];
    Object.values(halls).forEach(list => {
        allFlights.push(...list);
    });

    // يمكن تقليل العدد اذا كثيرة جدا
    const maxCount = 40; // لتقليل التزاحم
    if (allFlights.length > maxCount) {
        allFlights = allFlights.sort(() => Math.random() - 0.5).slice(0, maxCount);
    }

    allFlights.forEach((flight, i) => {
        const span = document.createElement('span');
        // محتوى الرحلة
        span.textContent = `${flight.FLT || flight.code || ''}  ${flight.arrival || flight.STA || ''}`;
        // توزيع عشوائي
        const top = Math.random() * 85 + 5; // نسبة % من أعلى
        const left = Math.random() * 80 + 10; // نسبة % من اليسار
        const fontSize = 1.2 + Math.random() * 1.8; // بين 1.2em و3em
        const blur = Math.random() > 0.8 ? 2 : 1; // بعض الرحلات blur أعلى
        span.style.top = `${top}vh`;
        span.style.left = `${left}vw`;
        span.style.fontSize = `${fontSize}em`;
        span.style.position = 'absolute';
        span.style.filter = `blur(${blur}px)`;
        span.style.opacity = (0.12 + Math.random() * 0.12).toFixed(2); // شفافية خفيفة
        span.style.pointerEvents = 'none';
        bg.appendChild(span);
    });
}


let currentHall = 1; // 1 إلى 4


const halls = { 1: [], 2: [], 3: [], 4: [] };
const hallNames = {
    1: `<div class="hall-title-content">
          <div class="top">Flights Readiness Clock</div>
          <div class="bottom">صالة 1</div>
        </div>`,
    2: `<div class="hall-title-content">
          <div class="top">Flights Readiness Clock</div>
          <div class="bottom">صالة 2</div>
        </div>`,
    3: `<div class="hall-title-content">
          <div class="top">Flights Readiness Clock</div>
          <div class="bottom">صالة 3</div>
        </div>`,
    4: `<div class="hall-title-content">
          <div class="top">Flights Readiness Clock</div>
          <div class="bottom">صالة 4</div>
        </div>`
  };
  
  
  
// استخراج الوقت فقط من أي نص (دائمًا يرجع HH:mm أو "")
function extractHourMinute(str) {
    let match = String(str).match(/(\d{1,2}):(\d{2})/);
    if (match) {
        let h = match[1].padStart(2, '0');
        let m = match[2];
        return h + ':' + m;
    }
    return ""; // لا يوجد وقت
}

// تحميل بيانات الصالات من LocalStorage
function loadHallsFromStorage() {
    const data = localStorage.getItem('airport_halls_data');
    if (data) {
        const loaded = JSON.parse(data);
        for (let h in loaded) {
            halls[h] = loaded[h];
        }
    }
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}


// حفظ بيانات الصالات في LocalStorage
function saveHallsToStorage() {
    localStorage.setItem('airport_halls_data', JSON.stringify(halls));
}

loadHallsFromStorage();

function switchClock(num) {
    for (let i = 1; i <= 4; i++) {
      document.getElementById('clock' + i).style.display = (i === num) ? 'block' : 'none';
    }
  }

// =========================
// إنشاء الساعة ورسم الرحلات
// =========================
function createClock(containerId, hallNum) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="hall-title">${hallNames[hallNum]}</div>
        <div class="clock-face">
            <div class="numbers"></div>
            <div class="ticks-ring"></div>
            <div class="hands">
                <div class="hand hour"></div>
                <div class="hand minute"></div> 
                <div class="hand second"></div>
            </div>
            <div class="center-label">BHS<br><span class="arrival">ARRIVAL</span></div>
            <div class="flight-arrows"></div>
        </div>
        <div class="digital"><span class="now"></span></div>
        <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <input type="file" class="excelInput" accept=".xlsx,.xls,.csv">
            <button type="button" class="clear-flights-btn" style="background:#ff4444;color:#fff;font-size:1em;border:none;border-radius:7px;padding:6px 16px;cursor:pointer;">
                حذف الرحلات
            </button>
        </div>

    `;

    // رسم الأرقام
    const numbersDiv = container.querySelector('.numbers');
    for (let i = 1; i <= 12; i++) {
        const span = document.createElement('span');
        span.className = `number${i}`;
        span.textContent = i;
        numbersDiv.appendChild(span);
    }

    // رسم سنون الدقائق حول الساعة
    const ticksDiv = container.querySelector('.ticks-ring');
    for (let i = 0; i < 60; i++) {
        const tick = document.createElement('span');
        tick.className = 'tick' + (i % 5 === 0 ? ' major' : '');
        tick.style.setProperty('--t', i);
        ticksDiv.appendChild(tick);
    }

    // عقارب الساعة الرقمية
    const hourHand = container.querySelector('.hand.hour');
    const minuteHand = container.querySelector('.hand.minute');
    const secondHand = container.querySelector('.hand.second');
    const nowSpan = container.querySelector('.now');
    function updateClock() {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        hourHand.style.transform = `translate(-50%, 0) rotate(${((h % 12) + m / 60) * 30}deg)`;
        minuteHand.style.transform = `translate(-50%, 0) rotate(${m * 6 + s * 0.1}deg)`;
        secondHand.style.transform = `translate(-50%, 0) rotate(${s * 6}deg)`;
        nowSpan.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    setInterval(updateClock, 1000); updateClock();

    // رسم الرحلات كبابلز على أطراف الساعة
    
    function renderFlightBubbles() {
        const arrowsDiv = container.querySelector('.flight-arrows');
        arrowsDiv.innerHTML = '';
        const maxRadius = 400;
        const minRadius = 120;
        const totalHours = 12;
        const centerStep = (maxRadius - minRadius) / 8;
    
        const bubbleAdjust = {
            2: { rotate: 60, y: 5,   spread: 5, rScale: 0.99, ySpread: 0 },
            3: { rotate: -85, y: 0, spread: 0, rScale: 1.10, ySpread: 0 },
            4:   { rotate: -50, y: -18, spread: -35, rScale: 1.00, ySpread: 8 },
            5: { rotate: 0,   y: 0,   spread: 0,   rScale: 1.25, ySpread: 0 },
            6: { rotate: 0,   y: 0,   spread: 0,   rScale: 1.20, ySpread: -5 },
            8: { rotate: 65,  y: 0,  spread: 2, rScale: 0.80, ySpread: 0 }, 
            9: { rotate: 89, y: -2, spread: 0, rScale: 1.15, ySpread: 0 },
            10:{ rotate: -50, y: 5, spread: 8,  rScale: 1.05, ySpread: 0 },   
        };
    
        // أضف عنصر tooltip مرة واحدة فقط في الصفحة
        let tooltip = document.getElementById('flight-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'flight-tooltip';
            tooltip.style.display = 'none';
            tooltip.style.position = 'fixed';
            tooltip.style.zIndex = 1000;
            tooltip.style.pointerEvents = 'none';
            tooltip.style.background = '#fff';
            tooltip.style.border = '1.5px solid #2987f8';
            tooltip.style.boxShadow = '0 2px 10px #0065c44a';
            tooltip.style.padding = '8px 16px';
            tooltip.style.borderRadius = '13px';
            tooltip.style.fontSize = '1.05em';
            tooltip.style.direction = 'rtl';
            tooltip.style.maxWidth = '340px';
            document.body.appendChild(tooltip);
        }
    
        let flightsByHour = {};
        halls[hallNum].forEach((flight, idx) => {
            let arrivalRaw = flight.STA || flight.arrival || '';
            let match = String(arrivalRaw).match(/(\d{1,2}):(\d{2})/);
            if (!match) return;
            let h = parseInt(match[1], 10);
            let hour12 = h % 12 || 12;
            if (!flightsByHour[hour12]) flightsByHour[hour12] = [];
            flightsByHour[hour12].push({ ...flight, idx, hour12, arrivalTime: match[0], minute: parseInt(match[2], 10) });
        });
    
        for (let h = 1; h <= totalHours; h++) {
            let arr = flightsByHour[h] || [];
            arr.sort((a, b) => {
                if (!a.arrivalTime) return 1;
                if (!b.arrivalTime) return -1;
                const toMinutes = t => {
                    let [hh, mm] = t.split(':').map(Number);
                    return hh * 60 + mm;
                };
                return toMinutes(b.arrivalTime) - toMinutes(a.arrivalTime);
            });
    
            let n = arr.length;
            if (!n) continue;
    
            let angleDeg = ((h % 12) * 30) - 90; // 12 للأعلى
            let angleRad = angleDeg * Math.PI / 180;
            let adjust = bubbleAdjust[h] || { rotate: 0, y: 0, spread: 0, rScale: 1, ySpread: 0 };
    
            for (let j = 0; j < n; j++) {
                let radius, x, y;
                if (n <= 5) {
                    // على نفس الخط الشعاعي، من الرقم باتجاه المركز
                    let baseRadius = maxRadius - 30;  // قريب من الرقم
                    let gap = 24; // فرق بين كل فقاعة
                    radius = baseRadius - j * gap; // أبعد واحدة أقرب للرقم
                    x = Math.cos(angleRad) * radius;
                    y = Math.sin(angleRad) * radius + adjust.y;
                } else {
                    radius = (minRadius + j * centerStep) * adjust.rScale;
                    if (radius > maxRadius) radius = maxRadius * adjust.rScale;
                    x = Math.cos(angleRad) * radius;
                    y = Math.sin(angleRad) * radius + adjust.y;
                    if (n > 1) {
                        x += (j - (n - 1) / 2) * (adjust.spread || 0);
                        y += (j - (n - 1) / 2) * (adjust.ySpread || 0);
                    }
                }
    
                const fontSize = n > 12 ? '0.60em' : n > 8 ? '0.72em' : n > 6 ? '0.78em' : '0.88em';
                const flight = arr[j];
                const box = document.createElement('div');
                box.className = `flight-outer-box`;
                box.style = `
                    left:50%; top:50%;
                    transform:translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${adjust.rotate}deg);
                    z-index:40; font-size:${fontSize}; min-width:0px; min-height:14px; padding:2px 6px;
                `;
                box.innerHTML = `
                    <b style="font-size:0.98em;">${flight.FLT || flight.code || ''}</b>
                    <span style="color:#2987f8; font-size:0.96em;">${flight.arrivalTime}</span>
                `;
    
                // Tooltip (التفاصيل عند المرور)
                box.onmouseenter = e => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <div><b>كود الرحلة:</b> ${flight.FLT || flight.code || ''}</div>
                        <div><b>الوقت:</b> ${flight.arrivalTime}</div>
                      
                    `;
                };
                box.onmousemove = e => {
                    tooltip.style.left = (e.clientX + 16) + 'px';
                    tooltip.style.top = (e.clientY - 14) + 'px';
                };
                box.onmouseleave = e => {
                    tooltip.style.display = 'none';
                };
    
                box.onclick = function(e) {
                    showFlightModal(arr, hallNames[hallNum], this);
                    e.stopPropagation();
                };
    
                arrowsDiv.appendChild(box);
            }
        }
    }
    
    
    function showFlightModal(flightsArr, hallName, anchorElem = null) {
        // أزل القديم
        let old = document.getElementById('modal-flights');
        if (old) old.remove();
    
        // بيانات العنوان
        let total = flightsArr.length;
        let firstFlight = flightsArr[0];
        let hourOnly = firstFlight && firstFlight.arrivalTime
            ? firstFlight.arrivalTime.split(':')[0].padStart(2, '0') + ':00' : "";
        let titleTime = hourOnly;
    
        // إنشاء الصندوق
        let box = document.createElement('div');
        box.id = 'modal-flights';
        box.style.cssText = `
            position:fixed; z-index:50000;
            background:#fff; border-radius:20px; border:2px solid #2987f8;
            box-shadow:0 4px 32px #0360b74a; padding:22px 32px; min-width:220px; max-width:95vw; font-size:1.08em; direction:rtl;
            max-height:70vh; overflow:auto;
        `;
        box.innerHTML = `
            <div style="font-size:1.15em;font-weight:bold;text-align:center;margin-bottom:13px;">
                كل الرحلات ${titleTime ? `<span style="color:#2987f8;">${titleTime}</span>` : ''}
                <span style="color:#d52;font-size:0.99em">(${total})</span>
            </div>
        `;
        flightsArr.forEach(flight => {
            box.innerHTML += `
                <div style="margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid #eee;">
                    <b>${flight.FLT || flight.code || ''}</b>
                    <br>
                    <span style="color:#2987f8">${flight.arrivalTime || ''}</span>
                    <br>
                    <span>${flight.TEP || flight.destination || ''}</span>
                </div>
            `;
        });
        box.innerHTML += `<div style="text-align:center;margin-top:12px;">
            <button onclick="document.getElementById('modal-flights').remove()" style="
                background:#ff4444;color:#fff;font-size:1em;border:none;border-radius:7px;padding:7px 26px;cursor:pointer;">
                إغلاق
            </button>
        </div>`;
    
        document.body.appendChild(box);
    
        // تحديد مكان الصندوق (بحيث لا يخرج خارج الشاشة)
        if (anchorElem) {
            const rect = anchorElem.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            let left = Math.max(10, Math.min(window.innerWidth - box.offsetWidth - 10, midX - box.offsetWidth / 2));
            // افتراضياً فوق الفقاعة
            let top = rect.top - box.offsetHeight - 8;
            // إذا خرج من أعلى، اجعله أسفل الفقاعة
            if (top < 20) top = rect.bottom + 15;
            // إذا خرج من أسفل الشاشة، عدل مكانه للأعلى قليلاً
            if (top + box.offsetHeight > window.innerHeight - 20) {
                top = window.innerHeight - box.offsetHeight - 20;
            }
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
        } else {
            box.style.left = "50%";
            box.style.top = "22%";
            box.style.transform = "translate(-50%, 0)";
        }
    
        // إغلاق عند الضغط خارج البوكس
        setTimeout(() => {
            function closeOnOutside(e) {
                if (box && !box.contains(e.target)) {
                    box.remove();
                    document.removeEventListener('mousedown', closeOnOutside);
                }
            }
            document.addEventListener('mousedown', closeOnOutside);
        }, 100);
    }
    
    
    
    
    
    // رفع إكسل أو CSV وإضافة الرحلات
    const excelInput = container.querySelector('.excelInput');
    excelInput.onchange = function (evt) {
        const file = evt.target.files[0];
        if (!file) return;
    
        function parseTimeCell(cellValue) {
            // استخراج الوقت فقط من الخلية سواء بصيغة تاريخ أو وقت فقط
            if (!cellValue) return '';
            let match = String(cellValue).match(/(\d{1,2}:\d{2})/);
            return match ? match[1] : '';
        }
    
        // دعم CSV
        if (file.name.toLowerCase().endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                let text = e.target.result;
                let rows = text.trim().split('\n').map(row => row.split(','));
                let header = rows[0].map(cell => cell.trim().toUpperCase());
                let codeIdx = header.indexOf("FLT");
                let destIdx = header.indexOf("TEP");
                let staIdx = header.indexOf("STA");
    
                let flightsToAdd = [];
                for (let i = 1; i < rows.length; i++) {
                    let row = rows[i];
                    let code = codeIdx >= 0 ? row[codeIdx].trim() : '';
                    let destination = destIdx >= 0 ? row[destIdx].trim() : '';
                    let arrival = staIdx >= 0 ? parseTimeCell(row[staIdx]) : '';
                    if (code && arrival && destination) {
                        flightsToAdd.push({ code, arrival, destination });
                    }
                }
                halls[hallNum] = flightsToAdd;
                saveHallsToStorage();
                renderFlightBubbles();
                renderFlightsBackground();
                alert(`تم رفع ${flightsToAdd.length} رحلة جديدة وحذف القديمة!`);
            };
            reader.readAsText(file);
    
        } else {
            // دعم Excel (XLSX)
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const header = rows[0].map(cell => String(cell).toUpperCase());
                let codeIdx = header.indexOf("FLT");
                let destIdx = header.indexOf("TEP");
                let staIdx = header.indexOf("STA");
    
                let flightsToAdd = [];
                for (let i = 1; i < rows.length; i++) {
                    let row = rows[i];
                    let code = codeIdx >= 0 ? String(row[codeIdx]).trim() : '';
                    let destination = destIdx >= 0 ? String(row[destIdx]).trim() : '';
                    let arrival = staIdx >= 0 ? parseTimeCell(row[staIdx]) : '';
                    if (code && arrival && destination) {
                        flightsToAdd.push({ code, arrival, destination });
                    }
                }
                halls[hallNum] = flightsToAdd;
                saveHallsToStorage();
                renderFlightBubbles();
                renderFlightsBackground();
                alert(`تم رفع ${flightsToAdd.length} رحلة جديدة وحذف القديمة!`);
            };
            reader.readAsArrayBuffer(file);
        }
    };
    // رسم أولي
    renderFlightBubbles();

    const clearBtn = container.querySelector('.clear-flights-btn');
    clearBtn.onclick = function() {
        if (confirm("هل أنت متأكد أنك تريد حذف جميع الرحلات من هذه الساعة؟")) {
            halls[hallNum] = [];
            saveHallsToStorage();
            renderFlightBubbles();
            renderFlightsBackground();
        }
    };
} 

function renderBigClock() {
    createClock('clock-big', currentHall);
    renderFlightsBackground();
}

renderBigClock();

document.getElementById('prev-hall').onclick = function() {
    let nextHall = (currentHall === 1) ? 4 : currentHall - 1;
    fadeClockAndSwitch(nextHall);
};
document.getElementById('next-hall').onclick = function() {
    let nextHall = (currentHall === 4) ? 1 : currentHall + 1;
    fadeClockAndSwitch(nextHall);
};


function fadeClockAndSwitch(newHall) {
    const clockBox = document.getElementById('clock-big');
    clockBox.classList.add('fade-out');
    setTimeout(() => {
        currentHall = newHall;
        renderBigClock();
        clockBox.classList.remove('fade-out');
        clockBox.classList.add('fade-in');
        setTimeout(() => {
            clockBox.classList.remove('fade-in');
        }, 400);
    }, 450);
}

