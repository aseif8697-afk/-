import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ================= Firebase ================= */

const firebaseConfig = {
  apiKey: "AIzaSyDI0pzTUiPEbccENX9OqKbpaZXYZ9WpUT4",
  authDomain: "trade-guide-fm11.firebaseapp.com",
  projectId: "trade-guide-fm11",
  storageBucket: "trade-guide-fm11.appspot.com",
  messagingSenderId: "981768267934",
  appId: "1:981768267934:web:493adbec30e1ac1948f38f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= LOGIN ================= */

window.login = () => {
  if (
    document.getElementById("username").value === "admin" &&
    document.getElementById("password").value === "1234"
  ) {
    localStorage.setItem("auth", "true");
    location.href = "index.html";
  } else {
    document.getElementById("loginMsg").innerText = "❌ خطأ في الدخول";
  }
};

window.logout = () => {
  localStorage.clear();
  location.href = "login.html";
};

/* ================= STATIC DATA ================= */

const names = [
  "أحمد محمد علي",
  "محمود حسن إبراهيم",
  "يوسف أحمد فتحي",
  "كريم أشرف محمود"
];

const govs = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية"
];

const statusList = ["أعزب", "متزوج"];

/* ================= HELPERS ================= */

/* استخراج تاريخ الميلاد من الرقم القومي (مع تحقق) */
function birthFromNationalId(id) {
  const century = id[0] === "3" ? "20" : "19";
  const year = parseInt(century + id.slice(1, 3));
  const month = parseInt(id.slice(3, 5));
  const day = parseInt(id.slice(5, 7));

  // تحقق منطقي
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

/* توليد بيانات عشوائية */
function generateRandomData(id) {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    birth: birthFromNationalId(id),
    governorate: govs[Math.floor(Math.random() * govs.length)],
    status: statusList[Math.floor(Math.random() * statusList.length)],
    createdAt: serverTimestamp()
  };
}

/* ================= SEARCH ================= */

window.searchData = async () => {
  const id = document.getElementById("nationalId").value.trim();
  const msg = document.getElementById("message");
  const res = document.getElementById("result");

  res.innerHTML = "";

  // تحقق الرقم القومي
  if (!/^\d{14}$/.test(id)) {
    msg.innerText = "❌ الرقم القومي غير صحيح";
    msg.style.color = "red";
    return;
  }

  const birth = birthFromNationalId(id);
  if (!birth) {
    msg.innerText = "❌ الرقم القومي غير متوافق مع تاريخ ميلاد صحيح";
    msg.style.color = "red";
    return;
  }

  msg.innerText = "جاري الاستعلام...";
  msg.style.color = "#0b3c89";

  try {
    const ref = doc(db, "citizens", id);
    const snap = await getDoc(ref);

    /* ===== موجود ===== */
    if (snap.exists()) {
      const d = snap.data();
      res.innerHTML = `
        <strong>الرقم القومي:</strong> ${id}<br>
        <strong>الاسم:</strong> ${d.name}<br>
        <strong>تاريخ الميلاد:</strong> ${d.birth}<br>
        <strong>المحافظة:</strong> ${d.governorate}<br>
        <strong>الحالة الاجتماعية:</strong> ${d.status}
      `;
      msg.innerText = "✅ بيانات موجودة في قاعدة البيانات";
      return;
    }

    /* ===== غير موجود → إنشاء وحفظ ===== */
    const data = generateRandomData(id);

    await setDoc(ref, data);

    res.innerHTML = `
      <strong>الرقم القومي:</strong> ${id}<br>
      <strong>الاسم:</strong> ${data.name}<br>
      <strong>تاريخ الميلاد:</strong> ${data.birth}<br>
      <strong>المحافظة:</strong> ${data.governorate}<br>
      <strong>الحالة الاجتماعية:</strong> ${data.status}
    `;

    msg.innerText = "⚠ لم توجد بيانات — تم إنشاؤها وحفظها بنجاح";

  } catch (error) {
    console.error(error);
    msg.innerText = "❌ خطأ في الاتصال بقاعدة البيانات";
    msg.style.color = "red";
  }
};