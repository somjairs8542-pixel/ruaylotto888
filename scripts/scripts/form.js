let entries = [];

function addEntry() {
  const type = document.getElementById('type').value.trim();
  const number = document.getElementById('number').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!type || !number || isNaN(amount)) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  entries.push({ type, number, amount });
  renderEntries();

  // ล้างค่า input
  document.getElementById('type').value = '';
  document.getElementById('number').value = '';
  document.getElementById('amount').value = '';
}

function renderEntries() {
  const list = document.getElementById('entryList');
  list.innerHTML = '';
  entries.forEach((entry, i) => {
    const div = document.createElement('div');
    div.textContent = `${entry.type} - ${entry.number} - ${entry.amount} บาท`;
    list.appendChild(div);
  });
}

function submitLotto() {
  const drawDate = document.getElementById('drawDate').value;
  if (!drawDate) {
    alert("กรุณาเลือกงวดวันที่");
    return;
  }

  const user = firebase.auth().currentUser;
  const name = user ? user.email : prompt("ใส่ชื่อของคุณ");

  const payload = {
    name,
    drawDate,
    entries,
    timestamp: new Date().toISOString()
  };

  firebase.database().ref(`lotto/${drawDate}`).push(payload, () => {
    alert("ส่งโพยแล้ว!");
    entries = [];
    renderEntries();
  });
}

// แอดมินล็อกอิน
function login() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'block';
      loadDrawDates();
    })
    .catch(err => alert("เข้าสู่ระบบไม่สำเร็จ"));
}

function logout() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
}

// โหลดงวดที่มีในระบบ
function loadDrawDates() {
  const select = document.getElementById('drawDates');
  firebase.database().ref('lotto').once('value', snapshot => {
    const data = snapshot.val();
    const dates = data ? Object.keys(data) : [];
    select.innerHTML = dates.map(date => `<option>${date}</option>`).join('');
    if (dates.length > 0) loadEntriesByDate();
  });
}

// โหลดโพยตามงวด
function loadEntriesByDate() {
  const drawDate = document.getElementById('drawDates').value;
  const entriesDiv = document.getElementById('entries');
  firebase.database().ref(`lotto/${drawDate}`).once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return entriesDiv.innerHTML = 'ไม่มีโพย';

    const all = Object.values(data);
    window.allEntries = all; // สำหรับค้นหา
    entriesDiv.innerHTML = all.map(e => {
      const list = e.entries.map(en => `${en.type}-${en.number}-${en.amount}฿`).join(', ');
      return `<div><strong>${e.name}</strong>: ${list}</div>`;
    }).join('');
  });
}

// ระบบค้นหา
function filterEntries() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const entriesDiv = document.getElementById('entries');

  const filtered = window.allEntries.filter(e =>
    e.name.toLowerCase().includes(query) ||
    e.entries.some(en => en.number.includes(query))
  );

  entriesDiv.innerHTML = filtered.map(e => {
    const list = e.entries.map(en => `${en.type}-${en.number}-${en.amount}฿`).join(', ');
    return `<div><strong>${e.name}</strong>: ${list}</div>`;
  }).join('');
}
