const HOSTEL = {
  name: "GS Hostel",
  buildings: ["GS-1", "GS-2", "GS-3", "GS-4", "GS-5"],
  floorsPerBuilding: 5,
  roomsPerFloor: 15,
  showersPerFloor: 4,
  freshPerFloor: 4
};

const EMERGENCY = {
  warden: { name: "Mr. R. Sharma", phone: "+91 98765 43210" },
  security: { name: "Night Guard", phone: "+91 98765 43211" },
  medical: { name: "Hostel Clinic", phone: "+91 98765 43212" },
  mess: { name: "Mess Manager", phone: "+91 98765 43213" },
  ambulance: { name: "Campus Ambulance", phone: "108" }
};

const MESS_MENU = {
  Monday: { breakfast: "Poha + Tea", lunch: "Roti, Dal, Rice, Sabzi", dinner: "Roti, Paneer, Rice" },
  Tuesday: { breakfast: "Idli + Sambar", lunch: "Roti, Rajma, Rice", dinner: "Roti, Mix Veg, Rice" },
  Wednesday: { breakfast: "Paratha + Curd", lunch: "Roti, Chole, Rice", dinner: "Roti, Aloo Gobi, Rice" },
  Thursday: { breakfast: "Upma + Tea", lunch: "Roti, Kadhi, Rice", dinner: "Roti, Bhindi, Rice" },
  Friday: { breakfast: "Bread + Omelette", lunch: "Roti, Dal Fry, Rice", dinner: "Roti, Egg Curry, Rice" },
  Saturday: { breakfast: "Puri + Sabzi", lunch: "Roti, Chana, Rice", dinner: "Roti, Mix Dal, Rice" },
  Sunday: { breakfast: "Dosa + Chutney", lunch: "Special Thali", dinner: "Roti, Chicken/Paneer, Rice" }
};

const DEMO_STUDENTS = {
  "GS-3-F3": [
    { name: "Ramesh Kumar", room: "301", phone: "+91 90000 00001", year: "1st" },
    { name: "Sunil Yadav", room: "302", phone: "+91 90000 00002", year: "2nd" },
    { name: "Arjun Nair", room: "303", phone: "+91 90000 00003", year: "1st" },
    { name: "Mohit Sharma", room: "304", phone: "+91 90000 00004", year: "3rd" },
    { name: "Vikram Singh", room: "305", phone: "+91 90000 00005", year: "1st" }
  ]
};

function getBuildingFromRoom(room) {
  if (!room) return null;
  const r = String(room).trim();
  if (r.length < 3) return null;
  const floor = parseInt(r.charAt(0));
  if (floor < 1 || floor > 5) return null;
  return floor;
}

function getFloorFromRoom(room) {
  return getBuildingFromRoom(room);
}

function getBathroomList() {
  const list = [];
  for (let i = 1; i <= 4; i++) {
    list.push({ type: "shower", id: "S" + i, label: "Bath " + i });
  }
  for (let i = 1; i <= 4; i++) {
    list.push({ type: "fresh", id: "F" + i, label: "Fresh " + i });
  }
  return list;
}

const DEMO_REPORTS = [
  { id: "r1", student: "Ramesh Kumar", room: "301", building: "GS-3", floor: 3, type: "Plumbing", title: "Tap leaking in Bath 2", status: "pending", time: new Date(Date.now() - 3600000).toISOString() },
  { id: "r2", student: "Sunil Yadav", room: "302", building: "GS-3", floor: 3, type: "Electrical", title: "Tube light not working", status: "progress", time: new Date(Date.now() - 7200000).toISOString() },
  { id: "r3", student: "Arjun Nair", room: "303", building: "GS-1", floor: 1, type: "Cleaning", title: "Fresh 3 needs cleaning", status: "resolved", time: new Date(Date.now() - 10800000).toISOString() }
];

const DEMO_ANNOUNCEMENTS = [
  { id: "a1", text: "Water supply will be cut tomorrow from 6 AM to 8 AM. Please store water.", by: "Warden", time: new Date(Date.now() - 1800000).toISOString() },
  { id: "a2", text: "Mess menu updated. Sunday special thali this week!", by: "Mess Manager", time: new Date(Date.now() - 86400000).toISOString() }
];
