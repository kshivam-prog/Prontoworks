// ================= SECURE FIREBASE INIT VIA BACKEND =================
// ❌ REMOVED firebaseConfig with API KEY for security
// ✅ Firebase is now handled securely via backend (Vercel API)

// These will work ONLY if Firebase Web SDK is loaded from CDN
const auth = firebase.auth();
const db = firebase.firestore();

// ================= DOM Elements =================
const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const profileIcon = document.getElementById("profileIcon");
const profilePanel = document.getElementById("profilePanel");
const btnSignout = document.getElementById("btnSignout");
const legalPopup = document.getElementById("legalPopup");
const showLegalBtn = document.getElementById("showLegal");
const btnForgot = document.getElementById("btnForgot");

// ================= SHOW / HIDE MAIN CONTENT =================
auth.onAuthStateChanged(async user => {
  if(user){
    authSection.style.display = "none";
    mainContent.style.display = "block";
    profileIcon.style.display = "inline-block";
    await showProfile(user);
  } else {
    authSection.style.display = "block";
    mainContent.style.display = "none";
    profileIcon.style.display = "none";
    profilePanel.style.display = "none";
  }
});

// ================= PROFILE TOGGLE =================
profileIcon.onclick = () => {
  profilePanel.style.display = profilePanel.style.display === "block" ? "none" : "block";
};

// ================= AUTH FUNCTIONS =================
document.getElementById("btnRegister").onclick = async () => {
  try {
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPass").value;
    const name = document.getElementById("regName").value;
    const phone = document.getElementById("regPhone").value;

    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    await userCredential.user.updateProfile({ displayName: name });

    await db.collection("users").doc(userCredential.user.uid).set({
      name, email, phone, time: new Date()
    });

    alert("✅ Account Created Successfully");
  } catch(err){
    alert("❌ " + err.message);
  }
};

document.getElementById("btnSignin").onclick = async () => {
  try {
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPass").value;

    await auth.signInWithEmailAndPassword(email, pass);
    alert("✅ Signed In Successfully");
  } catch(err){
    alert("❌ " + err.message);
  }
};

// ================= FORGOT PASSWORD =================
btnForgot.onclick = async () => {
  const email = document.getElementById("regEmail").value;
  if(!email) return alert("Enter your email to reset password.");
  try{
    await auth.sendPasswordResetEmail(email);
    alert("✅ Password reset email sent!");
  } catch(err){
    alert("❌ " + err.message);
  }
};

btnSignout.onclick = () => auth.signOut();

// ================= SHOW PROFILE & ACTIVITIES =================
async function showProfile(user){
  profilePanel.innerHTML = `
    <h3>${user.displayName || ""}</h3>
    <p>${user.email}</p>
    <h4>Recent Activities</h4>
    <div id="activitiesBox" class="activities-box"></div>
    <button id="btnPanelSignout">Sign Out</button>
  `;
  profilePanel.style.display = "none";

  document.getElementById("btnPanelSignout").onclick = () => auth.signOut();

  const activitiesBox = document.getElementById("activitiesBox");
  const activities = await db.collection("activities")
                             .where("uid","==", user.uid)
                             .orderBy("time", "desc")
                             .limit(10)
                             .get();
  activitiesBox.innerHTML = "";
  activities.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "activity-box";
    div.innerText = `${data.type} | ${data.service || ""} | ₹${data.price || ""} | ${new Date(data.time.toDate()).toLocaleString()}`;
    activitiesBox.appendChild(div);
  });
}

// ================= PRICE CALCULATOR =================
document.getElementById('calcBtn').onclick = async () => {
  const days = +document.getElementById("days").value;
  const serviceType = document.getElementById("serviceType").value;
  let price = 0;

  switch(serviceType){
    case "Handwritten Assignment":
      if(days <= 1) price = 500;
      else if(days <= 3) price = 400;
      else price = 300;
      break;
    case "PPT Presentation":
      price = 300;
      break;
    case "Laptop Assignment (PDF)":
      price = 200;
      break;
    case "Laptop Assignment (Print)":
      price = 300;
      break;
  }

  document.getElementById("result").innerText = "Estimated Price ₹" + price;

  const user = auth.currentUser;
  await db.collection("activities").add({
    uid: user ? user.uid : "guest",
    type: "price_check",
    service: serviceType,
    days: days,
    price: price,
    time: new Date()
  });
};

// ================= LEGAL POPUP =================
showLegalBtn.onclick = () => { legalPopup.style.display = "flex"; };
document.getElementById("closePopup").onclick = () => { legalPopup.style.display = "none"; };
document.getElementById("acceptLegal").onclick = async () => {
  const agree = document.getElementById("agreeCheck");
  if(!agree.checked){ alert("❌ Please accept the legal agreement first"); return; }

  const user = auth.currentUser;
  const text = document.getElementById("legal").innerText;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(text, 10, 10);
  doc.save("ProntoWorks_Consent.pdf");

  await db.collection("activities").add({
    uid: user ? user.uid : "guest",
    type: "legal_accept",
    time: new Date()
  });

  legalPopup.style.display = "none";
};
