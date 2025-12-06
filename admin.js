// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCuVEsUqRbooi5Teujp8jmogKNAwHfKp5w",
  authDomain: "prontowork-5f3a9.firebaseapp.com",
  projectId: "prontowork-5f3a9",
  storageBucket: "prontowork-5f3a9.appspot.com",
  messagingSenderId: "61326620076",
  appId: "1:61326620076:web:850ba508b344cdfb337609"
};

// ✅ Prevent double initialization error
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Firestore + Auth
const db = firebase.firestore();
const auth = firebase.auth();


// ================= ADMIN AUTH PROTECTION =================
auth.onAuthStateChanged(user => {
  const adminEmail = "youremail@example.com"; // set your admin email here
  if (!user || user.email !== adminEmail) {
    alert("Admin login required!");
    window.location.href = "index.html";
  }
});



// ================= LOAD USERS =================
const usersDiv = document.getElementById("users");

db.collection("users").onSnapshot(snapshot => {
  usersDiv.innerHTML = "";

  if (snapshot.empty) {
    usersDiv.innerHTML = "<p>No users found.</p>";
    return;
  }

  snapshot.forEach(doc => {
    const d = doc.data();
    usersDiv.innerHTML += `
      <div class="box">
        <strong>Name:</strong> ${d.name || "N/A"} <br>
        <strong>Email:</strong> ${d.email || "N/A"} <br>
        <strong>Phone:</strong> ${d.phone || "N/A"}
      </div>
    `;
  });
});


// ================= LOAD ACTIVITY LOGS =================
const logsDiv = document.getElementById("logs");

db.collection("activities")
  .orderBy("time", "desc")
  .onSnapshot(snapshot => {

    logsDiv.innerHTML = "";

    if (snapshot.empty) {
      logsDiv.innerHTML = "<p>No activity yet.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const d = doc.data();
      const time = d.time?.toDate ? d.time.toDate().toLocaleString() : d.time;

      logsDiv.innerHTML += `
        <div class="box">
          <strong>User ID:</strong> ${d.uid || "Guest"} <br>
          <strong>Activity:</strong> ${d.type || "Unknown"} <br>
          <strong>Time:</strong> ${time}
        </div>
      `;
    });
  });


// ================= LOGOUT BUTTON SUPPORT =================
const logoutBtn = document.getElementById("adminLogout");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    auth.signOut();
    alert("Admin logged out");
    window.location.href = "index.html";
  };
}
