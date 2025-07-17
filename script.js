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


const halls = { 1: [], 2: [], 3: [], 4: [] };
const hallNames = { 1: 'صالة 1', 2: 'صالة 2', 3: 'صالة 3', 4: 'صالة 4' };

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
        const maxRadius = 320;
        const bubbleAdjust = {
            1:   { rotate: 50, y: -18 },
            2:   { rotate: 50, y: -18 },
            3:   { rotate: -85, y: 0 },
            4:   { rotate: -25, y: -18 },
            5:   { rotate: 0,   y: 0 },
            6:   { rotate: 0,   y: 0 },
            7:   { rotate: 0,   y: 0 },
            8:   { rotate: 75,  y: 13 },
            9:   { rotate: 80,  y: -6 },
            10:  { rotate: -40,  y: 16 },
            11:  { rotate: -15,  y: 15 },
            12:  { rotate: 0,   y: 0 },
        };
    
        // تجميع الرحلات حسب الرقم فقط
        const groups = {};
        halls[hallNum].forEach((flight, idx) => {
            let arrivalRaw = flight.STA || flight.arrival || '';
            let timeStr = String(arrivalRaw).trim();
            if (timeStr.includes(' ')) timeStr = timeStr.split(' ').pop();
            let match = timeStr.match(/(\d{1,2}):(\d{2})/);
            let h = 0, m = 0;
            if (match) {
                h = parseInt(match[1], 10);
                m = parseInt(match[2], 10);
            }
            let key = h.toString().padStart(2, '0');
            let deg = (h % 12) * 30;
            if (!groups[key]) groups[key] = [];
            groups[key].push({
                ...flight, idx, deg,
                arrivalTime: match ? match[0] : ''
            });
        });
    
        // جمع الفقاعات حسب الزاوية الدقيقة لتسهيل اكتشاف التراكب
        const boxesByAngle = {}; // key = angleDeg, value = [ {box, flight, ...}, ... ]
        // إعداد التولتيب Tooltip
        let tooltip = document.createElement('div');
        tooltip.className = 'flight-tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = 1000;
        tooltip.style.pointerEvents = 'none';
        tooltip.style.background = '#fff';
        tooltip.style.border = '1.5px solid #2987f8';
        tooltip.style.boxShadow = '0 2px 10px #0065c44a';
        tooltip.style.padding = '7px 13px';
        tooltip.style.borderRadius = '13px';
        tooltip.style.fontSize = '1em';
        tooltip.style.direction = 'rtl';
        document.body.appendChild(tooltip);
    
        // رسم الفقاعات وتخزينها حسب الزاوية
        Object.values(groups).forEach(arr => {
            let angleDeg = arr[0].deg;
            let hour = Math.round(angleDeg / 30) || 12;
            let adjust = bubbleAdjust[hour] || { rotate: 0, y: 0 };
    
            if (hour === 0 || hour === 24) {
                angleDeg = 0;
                hour = 12;
                adjust = bubbleAdjust[12];
            }
    
            let minRadius = 80;
            let count = arr.length;
            let dynamicBubbleGap = count > 1 ? Math.min(38, Math.max(20, Math.floor((maxRadius - minRadius) / (count - 1)))) : 38;
            let fontSize = count > 8 ? '0.72em' : count > 6 ? '0.78em' : '0.83em';
    
            arr.forEach((flight, j) => {
                let radius = maxRadius - (j * dynamicBubbleGap);
                if (radius < minRadius) radius = minRadius;
                let rad = (angleDeg - 90) * Math.PI / 180;
                let x = Math.cos(rad) * radius;
                let y = Math.sin(rad) * radius;
    
                const box = document.createElement('div');
                box.className = `flight-outer-box`;
                box.style = `
                    left:50%; top:50%;
                    transform:translate(-50%, -50%) translate(${x}px, ${y + adjust.y}px) rotate(${adjust.rotate}deg);
                    z-index:40; font-size:${fontSize}; min-width:0px; min-height:18px; padding:2px 7px;
                `;
                box.innerHTML = `
                    <b style="font-size:0.90em;">${flight.FLT || flight.code || ''}</b>
                    <span style="color:#2987f8; font-size:0.92em;">${flight.arrivalTime}</span>
                    <span style="font-size:0.90em;">${flight.TEP || flight.destination || ''}</span>
                `;
    
                // سجل كل فقاعة حسب زاويتها بدقة 3 منازل (يكفي)
                let angleKey = angleDeg.toFixed(3);
                if (!boxesByAngle[angleKey]) boxesByAngle[angleKey] = [];
                boxesByAngle[angleKey].push({ box, flight, hour, idx: j, group: arr });
    
                // Tooltip عند المرور
                box.onmouseenter = e => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <div><b>كود الرحلة:</b> ${flight.FLT || flight.code || ''}</div>
                        <div><b>الوقت:</b> ${flight.arrivalTime}</div>
                        <div><b>الوجهة:</b> ${flight.TEP || flight.destination || ''}</div>
                        <div><b>قاعة:</b> ${hallNames[hallNum]}</div>
                    `;
                };
                box.onmousemove = e => {
                    tooltip.style.left = (e.clientX + 14) + 'px';
                    tooltip.style.top = (e.clientY - 16) + 'px';
                };
                box.onmouseleave = e => {
                    tooltip.style.display = 'none';
                };
    
                // عند الضغط على أي فقاعة في نفس الشعاع
                box.onclick = function(e) {
                    let groupArr = boxesByAngle[angleKey].map(b => b.flight);
                    if (groupArr.length > 0) {
                        showFlightModal(groupArr, hallNames[hallNum]);
                    }
                    e.stopPropagation();
                };
                
    
                arrowsDiv.appendChild(box);
            });
        });
        
    
        // نافذة لعرض تفاصيل الرحلات المتراكبة
        function showFlightModal(flightsArr, hallName, anchorElem = null) {
            let old = document.getElementById('modal-flights');
            if (old) old.remove();
        
            // حساب معلومات التكرار
            const countMap = {};
            flightsArr.forEach(flight => {
                let key = (flight.FLT || flight.code || '') + '_' + (flight.arrivalTime || '');
                countMap[key] = (countMap[key] || 0) + 1;
            });
            let total = flightsArr.length;
            let firstFlight = flightsArr[0];
            let hourOnly = "";
            if (firstFlight && firstFlight.arrivalTime) {
                let parts = firstFlight.arrivalTime.split(':');
                hourOnly = parts[0].padStart(2, '0') + ':00';
            }
            let titleTime = hourOnly;
        
            // بناء النافذة
            let box = document.createElement('div');
            box.id = 'modal-flights';
            box.style.cssText = `
                position:fixed; z-index:50000;
                background:#fff; border-radius:20px; border:2px solid #2987f8;
                box-shadow:0 4px 32px #0360b74a; padding:22px 32px; min-width:220px; font-size:1.08em; direction:rtl;
                max-height:70vh; overflow:auto;
            `;
        
            // العنوان
            box.innerHTML = `
                <div style="font-size:1.15em;font-weight:bold;text-align:center;margin-bottom:13px;">
                    كل الرحلات ${titleTime ? `<span style="color:#2987f8;">${titleTime}</span>` : ''}
                    <span style="color:#d52;font-size:0.99em">(${total})</span>
                </div>
            `;
            flightsArr.forEach(flight => {
                let key = (flight.FLT || flight.code || '') + '_' + (flight.arrivalTime || '');
                let count = countMap[key];
                box.innerHTML += `
                    <div style="margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid #eee;">
                        ${flight.FLT || flight.code || ''}
                        ${count > 1 ? `<span style="color:#d52;font-weight:bold">(${count})</span>` : ""}
                        <br>
                        ${flight.arrivalTime}<br>
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
        
            // تحديد مكان ظهور الصندوق حسب عنصر الضغط
            if (anchorElem) {
                const rect = anchorElem.getBoundingClientRect();
                const midX = rect.left + rect.width/2;
                const topY = rect.top;
                // ضع الصندوق فوق أو يمين العنصر إذا يوجد مساحة، وإلا بجانبه
                let left = Math.max(10, Math.min(window.innerWidth - box.offsetWidth - 10, midX - box.offsetWidth/2));
                let top = Math.max(15, topY - box.offsetHeight - 8);
                if (top < 20) top = rect.bottom + 15;
                box.style.left = `${left}px`;
                box.style.top = `${top}px`;
            } else {
                // fallback: وسط الشاشة
                box.style.left = "50%";
                box.style.top = "22%";
                box.style.transform = "translate(-50%, 0)";
            }
        
            setTimeout(() => {
                document.body.addEventListener('mousedown', closeModal, { once: true });
            }, 300);
            function closeModal(e) {
                if (!box.contains(e.target)) box.remove();
            }
        }
        
        
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
        }
    };
}

// إنشاء 4 ساعات
createClock('clock1', 1);
createClock('clock2', 2);
createClock('clock3', 3);
createClock('clock4', 4);
