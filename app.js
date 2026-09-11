let ST = {
  user: null,
  view: "dashboard",
  reports: [],
  announcements: [],
  bathroomStatus: {},
  isWarden: false
};

function lsGet(k, f) {
  try { const v = localStorage.getItem("gs_" + k); return v ? JSON.parse(v) : f; } catch (e) { return f; }
}
function lsSet(k, v) { try { localStorage.setItem("gs_" + k, JSON.stringify(v)); } catch (e) {} }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function render() {
  const app = document.getElementById("app");
  if (!ST.user && !ST.isWarden) {
    app.innerHTML = renderLogin();
  } else {
    app.innerHTML = renderShell();
  }
}

function renderLogin() {
  return `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">GS</div>
        <div class="login-title">GS Hostel Portal</div>
        <div class="login-sub">Smart Hostel Management · SIH 2026</div>

        <label>I am a</label>
        <select id="roleSelect">
          <option value="student">Student</option>
          <option value="warden">Warden</option>
        </select>

        <div id="studentFields">
          <label>Building</label>
          <select id="loginBuilding">
            ${HOSTEL.buildings.map(b => `<option value="${b}">${b}</option>`).join("")}
          </select>
          <label>Room Number (e.g., 302)</label>
          <input id="loginRoom" placeholder="302" maxlength="3" inputmode="numeric">
          <label>Your Name</label>
          <input id="loginName" placeholder="Your full name">
          <label>Phone (optional)</label>
          <input id="loginPhone" placeholder="+91..." inputmode="tel">
        </div>

        <div id="wardenFields" style="display:none">
          <label>Warden PIN</label>
          <input id="wardenPin" type="password" placeholder="Enter PIN" inputmode="numeric">
          <p class="small mt-2">Demo PIN: 1234</p>
        </div>

        <button class="btn btn-primary mt-4" onclick="doLogin()">Enter Portal</button>
        <p class="small center mt-3">Your data is stored only on your device</p>
      </div>
    </div>
  `;
}

function doLogin() {
  const role = document.getElementById("roleSelect").value;
  if (role === "warden") {
    const pin = document.getElementById("wardenPin").value;
    if (pin !== "1234") { alert("Invalid PIN"); return; }
    ST.isWarden = true;
    ST.user = { name: "Warden", role: "warden" };
    ST.view = "warden";
  } else {
    const name = document.getElementById("loginName").value.trim();
    const room = document.getElementById("loginRoom").value.trim();
    const building = document.getElementById("loginBuilding").value;
    const phone = document.getElementById("loginPhone").value.trim();
    if (!name) { alert("Please enter your name"); return; }
    if (!room || room.length < 3) { alert("Please enter a valid room number (e.g., 302)"); return; }
    const floor = getFloorFromRoom(room);
    if (!floor) { alert("Invalid room number"); return; }
    ST.user = { name: name, room: room, building: building, floor: floor, phone: phone, role: "student" };
    ST.view = "dashboard";
    const keys = Object.keys(DEMO_STUDENTS);
    if (!DEMO_STUDENTS[building + "-F" + floor]) {
      DEMO_STUDENTS[building + "-F" + floor] = [];
    }
    if (!DEMO_STUDENTS[building + "-F" + floor].find(s => s.room === room)) {
      DEMO_STUDENTS[building + "-F" + floor].push({ name: name, room: room, phone: phone, year: "—" });
    }
  }
  ST.reports = lsGet("reports", DEMO_REPORTS);
  ST.announcements = lsGet("announcements", DEMO_ANNOUNCEMENTS);
  ST.bathroomStatus = lsGet("bathrooms", {});
  render();
}

function logout() {
  ST.user = null;
  ST.isWarden = false;
  ST.view = "dashboard";
  render();
}

function renderShell() {
  const u = ST.user;
  const isW = ST.isWarden;
  return `
    <div class="app">
      <div class="hdr">
        <div class="hdr-top">
          <div class="hdr-logo">
            <div class="hdr-mark">GS</div>
            <div>
              <div class="hdr-title">GS Hostel</div>
              <div class="hdr-sub">${isW ? "Warden Dashboard" : u.building + " · Room " + u.room}</div>
            </div>
          </div>
          <div>
            <div class="hdr-user">${esc(u.name)}</div>
            <button class="btn btn-sm btn-ghost" style="color:#fff;margin-top:4px" onclick="logout()">Logout</button>
          </div>
        </div>
      </div>
      <div class="main">
        ${isW ? renderWarden() : renderStudent()}
      </div>
      <div class="footer">GS Hostel Portal · Prototype · SIH 2026</div>
    </div>
  `;
}

function renderStudent() {
  const tabs = `
    <div class="tab-bar">
      <button class="tab ${ST.view === "dashboard" ? "active" : ""}" onclick="setView('dashboard')">Home</button>
      <button class="tab ${ST.view === "floor" ? "active" : ""}" onclick="setView('floor')">My Floor</button>
      <button class="tab ${ST.view === "report" ? "active" : ""}" onclick="setView('report')">Report</button>
      <button class="tab ${ST.view === "more" ? "active" : ""}" onclick="setView('more')">More</button>
    </div>
  `;
  let content = "";
  if (ST.view === "dashboard") content = renderStudentDash();
  else if (ST.view === "floor") content = renderFloor();
  else if (ST.view === "report") content = renderReport();
  else if (ST.view === "more") content = renderMore();
  return tabs + content;
}

function setView(v) { ST.view = v; render(); }

function renderStudentDash() {
  const u = ST.user;
  const ann = ST.announcements.slice(0, 2);
  const myReports = ST.reports.filter(r => r.room === u.room).slice(0, 3);
  const floorKey = u.building + "-F" + u.floor;
  const floorCount = (DEMO_STUDENTS[floorKey] || []).length;

  return `
    <div class="card">
      <h2>📢 Announcements</h2>
      ${ann.length === 0 ? '<p class="muted">No announcements yet.</p>' :
        ann.map(a => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div>${esc(a.text)}</div><div class="small mt-2">— ${esc(a.by)} · ${timeAgo(a.time)}</div></div>`).join("")}
    </div>

    <div class="card">
      <h2>🚿 Bathroom Status (Floor ${u.floor})</h2>
      ${renderBathroomGrid("shower", "Showers")}
      <div class="mt-3"></div>
      ${renderBathroomGrid("fresh", "Fresh Rooms")}
      <p class="small mt-3">Tap a bathroom to mark it as occupied or free.</p>
    </div>

    <div class="card">
      <h2>🛠️ My Reports</h2>
      ${myReports.length === 0 ? '<p class="muted">You haven\'t reported any issues yet.</p>' :
        myReports.map(r => renderReportItem(r)).join("")}
      <button class="btn btn-secondary btn-block mt-3" onclick="setView('report')">Report a New Problem</button>
    </div>

    <div class="card">
      <h2>👥 My Floor (${floorCount} students)</h2>
      <p class="muted">${esc(u.building)} · Floor ${u.floor}</p>
      <button class="btn btn-secondary btn-block mt-3" onclick="setView('floor')">View All Students</button>
    </div>
  `;
}

function renderBathroomGrid(type, title) {
  const u = ST.user;
  const key = u.building + "-F" + u.floor;
  const items = [];
  for (let i = 1; i <= 4; i++) {
    const id = (type === "shower" ? "S" : "F") + i;
    const label = (type === "shower" ? "Bath " : "Fresh ") + i;
    const status = ST.bathroomStatus[key + "-" + id];
    const isOccupied = status && status.occupied;
    const since = isOccupied ? timeAgo(status.since) : "Free";
    items.push(`
      <button class="bath-tile ${isOccupied ? "occupied" : "free"}" onclick="toggleBath('${key}', '${id}')">
        <div class="icon">${isOccupied ? "🔴" : "🟢"}</div>
        <div class="label">${label}</div>
        <div class="status">${since}</div>
      </button>
    `);
  }
  return `<h3>${title}</h3><div class="grid-4">${items.join("")}</div>`;
}

function toggleBath(floorKey, id) {
  const key = floorKey + "-" + id;
  const cur = ST.bathroomStatus[key];
  if (cur && cur.occupied) {
    delete ST.bathroomStatus[key];
  } else {
    ST.bathroomStatus[key] = { occupied: true, since: new Date().toISOString(), by: ST.user.name, room: ST.user.room };
  }
  lsSet("bathrooms", ST.bathroomStatus);
  render();
}

function renderReportItem(r) {
  const cls = r.status === "pending" ? "pending" : r.status === "progress" ? "progress" : "resolved";
  const badge = r.status === "pending" ? "badge-pending" : r.status === "progress" ? "badge-progress" : "badge-resolved";
  return `
    <div class="report-item ${cls}">
      <div class="row-between">
        <div style="font-weight:700">${esc(r.title)}</div>
        <span class="badge ${badge}">${r.status}</span>
      </div>
      <div class="small mt-2">${esc(r.type)} · Room ${esc(r.room)} · ${timeAgo(r.time)}</div>
    </div>
    
  `;
  
function renderFloor() {
  const u = ST.user;
  const key = u.building + "-F" + u.floor;
  const students = DEMO_STUDENTS[key] || [];
  if (students.length === 0) {
    return `
      <div class="card">
        <h2>👥 Floor ${u.floor} · ${esc(u.building)}</h2>
        <div class="empty">
          <div class="empty-icon">👥</div>
          <div>No students registered on this floor yet.</div>
        </div>
      </div>
    `;
  }
  return `
    <div class="card">
      <h2>👥 Floor ${u.floor} · ${esc(u.building)}</h2>
      <p class="muted mb-3">${students.length} student${students.length > 1 ? "s" : ""} on this floor</p>
      ${students.map(s => `
        <div class="student-row">
          <div class="student-avatar">${esc(s.name.charAt(0).toUpperCase())}</div>
          <div style="flex:1;min-width:0">
            <div class="student-name">${esc(s.name)}</div>
            <div class="student-meta">Room ${esc(s.room)} · ${esc(s.year || "—")} Year</div>
          </div>
          ${s.phone ? `<div class="small">${esc(s.phone)}</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function renderReport() {
  return `
    <div class="card">
      <h2>🛠️ Report a Problem</h2>
      <p class="muted mb-3">Tell us what's wrong. It will be sent to the warden.</p>

      <label>Category</label>
      <select id="rptType">
        <option>Plumbing</option>
        <option>Electrical</option>
        <option>Cleaning</option>
        <option>Carpentry</option>
        <option>Mess / Food</option>
        <option>Water Supply</option>
        <option>WiFi / Network</option>
        <option>Other</option>
      </select>

      <label>Describe the problem</label>
      <textarea id="rptTitle" placeholder="e.g., Tap leaking in Bath 2 since morning"></textarea>

      <label>Photo (optional)</label>
      <input type="file" id="rptPhoto" accept="image/*" capture="environment">

      <button class="btn btn-primary mt-4" onclick="submitReport()">Submit Report</button>
    </div>

    <div class="card">
      <h2>📋 My Previous Reports</h2>
      ${ST.reports.filter(r => r.room === ST.user.room).length === 0
        ? '<p class="muted">No reports yet.</p>'
        : ST.reports.filter(r => r.room === ST.user.room).map(r => renderReportItem(r)).join("")}
    </div>
  `;
}

function submitReport() {
  const type = document.getElementById("rptType").value;
  const title = document.getElementById("rptTitle").value.trim();
  if (!title) { alert("Please describe the problem"); return; }
  const fileInput = document.getElementById("rptPhoto");
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;
  const u = ST.user;
  const report = {
    id: uid(),
    student: u.name,
    room: u.room,
    building: u.building,
    floor: u.floor,
    type: type,
    title: title,
    status: "pending",
    time: new Date().toISOString(),
    hasPhoto: !!file
  };
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      report.photo = ev.target.result;
      ST.reports.unshift(report);
      lsSet("reports", ST.reports);
      alert("Report submitted! The warden has been notified.");
      setView("dashboard");
    };
    reader.readAsDataURL(file);
  } else {
    ST.reports.unshift(report);
    lsSet("reports", ST.reports);
    alert("Report submitted! The warden has been notified.");
    setView("dashboard");
  }
}

function renderMore() {
  const u = ST.user;
  const menu = MESS_MENU[new Date().toLocaleDateString("en-US", { weekday: "long" })] || MESS_MENU.Monday;
  return `
    <div class="card">
      <h2>🍽️ Today's Mess Menu</h2>
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-weight:700">Breakfast</div>
        <div class="muted">${esc(menu.breakfast)}</div>
      </div>
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-weight:700">Lunch</div>
        <div class="muted">${esc(menu.lunch)}</div>
      </div>
      <div style="padding:8px 0">
        <div style="font-weight:700">Dinner</div>
        <div class="muted">${esc(menu.dinner)}</div>
      </div>
    </div>

    <div class="card">
      <h2>🚨 Emergency Contacts</h2>
      ${Object.keys(EMERGENCY).map(k => {
        const c = EMERGENCY[k];
        return `
          <div class="student-row">
            <div class="student-avatar" style="background:#fee2e2;color:#991b1b">📞</div>
            <div style="flex:1;min-width:0">
              <div class="student-name" style="text-transform:capitalize">${esc(k)}</div>
              <div class="student-meta">${esc(c.name)}</div>
            </div>
            <a href="tel:${esc(c.phone)}" class="btn btn-sm btn-secondary">Call</a>
          </div>
        `;
      }).join("")}
    </div>

    <div class="card">
      <h2>👤 My Profile</h2>
      <div class="student-row">
        <div class="student-avatar">${esc(u.name.charAt(0).toUpperCase())}</div>
        <div>
          <div class="student-name">${esc(u.name)}</div>
          <div class="student-meta">${esc(u.building)} · Room ${esc(u.room)}</div>
          ${u.phone ? `<div class="student-meta">${esc(u.phone)}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📢 All Announcements</h2>
      ${ST.announcements.map(a => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div>${esc(a.text)}</div>
          <div class="small mt-2">— ${esc(a.by)} · ${timeAgo(a.time)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderWarden() {
  const pending = ST.reports.filter(r => r.status === "pending").length;
  const progress = ST.reports.filter(r => r.status === "progress").length;
  const resolved = ST.reports.filter(r => r.status === "resolved").length;

  return `
    <div class="card">
      <h2>📊 Overview</h2>
      <div class="grid-4">
        <div style="text-align:center;padding:10px;background:#fef3c7;border-radius:10px">
          <div style="font-size:24px;font-weight:800">${pending}</div>
          <div class="small">Pending</div>
        </div>
        <div style="text-align:center;padding:10px;background:#dbeafe;border-radius:10px">
          <div style="font-size:24px;font-weight:800">${progress}</div>
          <div class="small">In Progress</div>
        </div>
        <div style="text-align:center;padding:10px;background:#d1fae5;border-radius:10px">
          <div style="font-size:24px;font-weight:800">${resolved}</div>
          <div class="small">Resolved</div>
        </div>
        <div style="text-align:center;padding:10px;background:#e2e8f0;border-radius:10px">
          <div style="font-size:24px;font-weight:800">${ST.reports.length}</div>
          <div class="small">Total</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📢 Post Announcement</h2>
      <textarea id="annText" placeholder="Type your announcement..."></textarea>
      <button class="btn btn-primary mt-3" onclick="postAnnouncement()">Post to All Students</button>
    </div>

    <div class="card">
      <h2>🛠️ All Reports (${ST.reports.length})</h2>
      ${ST.reports.length === 0
        ? '<p class="muted">No reports yet.</p>'
        : ST.reports.map(r => `
            <div class="report-item ${r.status === "pending" ? "pending" : r.status === "progress" ? "progress" : "resolved"}">
              <div class="row-between">
                <div style="font-weight:700">${esc(r.title)}</div>
                <span class="badge ${r.status === "pending" ? "badge-pending" : r.status === "progress" ? "badge-progress" : "badge-resolved"}">${r.status}</span>
              </div>
              <div class="small mt-2">${esc(r.student)} · ${esc(r.building)} · Room ${esc(r.room)} · ${timeAgo(r.time)}</div>
              <div class="small mt-2"><b>${esc(r.type)}</b></div>
              ${r.status !== "resolved" ? `
                <div class="row mt-3">
                  ${r.status === "pending" ? `<button class="btn btn-sm btn-secondary" onclick="updateReport('${r.id}', 'progress')">Mark In Progress</button>` : ""}
                  ${r.status === "progress" ? `<button class="btn btn-sm btn-primary" onclick="updateReport('${r.id}', 'resolved')">Mark Resolved</button>` : ""}
                </div>
              ` : ""}
            </div>
          `).join("")}
    </div>
  `;
}

function postAnnouncement() {
  const text = document.getElementById("annText").value.trim();
  if (!text) { alert("Please type an announcement"); return; }
  ST.announcements.unshift({
    id: uid(),
    text: text,
    by: "Warden",
    time: new Date().toISOString()
  });
  lsSet("announcements", ST.announcements);
  alert("Announcement posted!");
  render();
}

function updateReport(id, status) {
  const r = ST.reports.find(x => x.id === id);
  if (r) {
    r.status = status;
    lsSet("reports", ST.reports);
    render();
  }
}

function toggleRoleFields() {
  const role = document.getElementById("roleSelect").value;
  document.getElementById("studentFields").style.display = role === "student" ? "block" : "none";
  document.getElementById("wardenFields").style.display = role === "warden" ? "block" : "none";
}

document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "roleSelect") toggleRoleFields();
});

render();

  
}
