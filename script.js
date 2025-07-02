const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const exportBtn = document.getElementById("exportBtn");

const nameInput = document.getElementById("nameInput");
const idInput = document.getElementById("idInput");
const birthInput = document.getElementById("birthInput");
const ageInput = document.getElementById("ageInput");
const notesInput = document.getElementById("notesInput");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const sheetUrlInput = document.getElementById("sheetUrlInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

const closeBtn = document.querySelector(".close");

imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    extractText(canvas);
  };
});

async function extractText(canvas) {
  const { data: { text } } = await Tesseract.recognize(canvas, "heb+eng");
  const lines = text.split("\n").filter(l => l.trim());
  nameInput.value = lines.find(l => l.match(/[א-ת]+\s+[א-ת]+/)) || "";
  idInput.value = lines.find(l => l.match(/\d{9}/)) || "";
  const birthMatch = lines.find(l => l.match(/\d{2}\/\d{2}\/\d{4}/));
  const ageMatch = lines.find(l => l.match(/\d{2}\s*שנה/));
  const now = new Date();
  if (birthMatch) {
    birthInput.value = birthMatch.match(/\d{2}\/\d{2}\/\d{4}/)[0];
    const birthDate = new Date(birthInput.value.split("/").reverse().join("-"));
    const age = now.getFullYear() - birthDate.getFullYear();
    ageInput.value = age;
  } else if (ageMatch) {
    const age = parseInt(ageMatch);
    ageInput.value = age;
    birthInput.value = `${now.getFullYear() - age}-01-01`;
  }
}

exportBtn.onclick = async () => {
  const sheetUrl = localStorage.getItem("sheetUrl");
  if (!sheetUrl) {
    alert("לא הוגדר קישור לגיליון. עבור להגדרות.");
    return;
  }

  const sheetId = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!sheetId) return alert("קישור לא תקין");

  const values = [
    [nameInput.value, idInput.value, birthInput.value, ageInput.value, new Date().toISOString(), notesInput.value]
  ];

  const body = {
    values: values
  };

  const apiKey = "AIzaSyDiQu_g0GsNP1YAltU70Lj6FJnsijzYwEA";
  const sheetName = "Sheet1";

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:append?valueInputOption=RAW&key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (response.ok) alert("הנתונים נשלחו!");
  else alert("אירעה שגיאה בשליחה");
};

// הגדרות
settingsBtn.onclick = () => settingsModal.style.display = "block";
closeBtn.onclick = () => settingsModal.style.display = "none";
saveSettingsBtn.onclick = () => {
  localStorage.setItem("sheetUrl", sheetUrlInput.value);
  settingsModal.style.display = "none";
};
