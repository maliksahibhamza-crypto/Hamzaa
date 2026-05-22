import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCF9uylO1mc_W23Nw-j2aP-HJ6m8IU4_MA",
    authDomain: "project-78323.firebaseapp.com",
    projectId: "project-78323",
    storageBucket: "project-78323.firebasestorage.app",
    messagingSenderId: "303040619412",
    appId: "1:303040619412:web:bd53c80637997198c0e581"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserProfile = null;
let activeChatUsername = null;
let unsubscribeTasks = null;
let unsubscribeChats = null;

// UI Switcher
function showForm(cardId) {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('signUpCard').classList.add('hidden');
    document.getElementById('forgotCard').classList.add('hidden');
    document.getElementById('dashboardCard').classList.add('hidden');
    document.getElementById(cardId).classList.remove('hidden');
}

// Event Listeners for UI
document.getElementById('goToSignUp').addEventListener('click', () => showForm('signUpCard'));
document.getElementById('goToForgot').addEventListener('click', () => showForm('forgotCard'));
document.getElementById('backToLogin').addEventListener('click', () => showForm('loginCard'));
document.getElementById('backToLoginFromForgot').addEventListener('click', () => showForm('loginCard'));

// LOGIN LOGIC
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    signInWithEmailAndPassword(auth, email, password).catch(err => {
        document.getElementById('login-error').innerText = "Ghalat email ya password!";
    });
});

// SIGN UP LOGIC
document.getElementById('signUpBtn').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.toLowerCase().trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    try {
        const uSnap = await getDoc(doc(db, "usernames", username));
        if(uSnap.exists()) { document.getElementById('signup-error').innerText = "Username already taken!"; return; }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { uid: userCredential.user.uid, name, username, email });
        await setDoc(doc(db, "usernames", username), { uid: userCredential.user.uid });
    } catch (err) { document.getElementById('signup-error').innerText = err.message; }
});

// FORGOT PASSWORD
document.getElementById('forgotBtn').addEventListener('click', () => {
    const email = document.getElementById('forgotEmail').value.trim();
    sendPasswordResetEmail(auth, email).then(() => alert("Reset link sent!")).catch(err => alert(err.message));
});

// AUTH STATE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if(userDoc.exists()) {
            currentUserProfile = userDoc.data();
            document.getElementById('userGreeting').innerText = currentUserProfile.username;
            showForm('dashboardCard');
            listenToTasks();
        }
    } else { showForm('loginCard'); }
});

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', () => {
    if(unsubscribeTasks) unsubscribeTasks();
    if(unsubscribeChats) unsubscribeChats();
    signOut(auth);
});

// TASKS & CHAT FUNCTIONS
document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const input = document.getElementById('taskInput');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "tasks"), { uid: auth.currentUser.uid, text: input.value.trim(), completed: false, timestamp: Date.now() });
    input.value = "";
});

function listenToTasks() {
    if(unsubscribeTasks) unsubscribeTasks();
    const q = query(collection(db, "tasks"), where("uid", "==", auth.currentUser.uid));
    unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const list = document.getElementById('taskList');
        list.innerHTML = "";
        const docs = [];
        snapshot.forEach(d => docs.push({id: d.id, ...d.data()}));
        docs.sort((a, b) => b.timestamp - a.timestamp);
        docs.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${task.text}</span> <i class="fa-solid fa-trash" style="cursor:pointer" onclick="deleteDoc(doc(db, 'tasks', '${task.id}'))"></i>`;
            list.appendChild(li);
        });
    });
}

document.getElementById('sendChatBtn').addEventListener('click', async () => {
    const msgInput = document.getElementById('chatMsgInput');
    if(!msgInput.value.trim() || !activeChatUsername) return;
    const chatId = [currentUserProfile.username, activeChatUsername].sort().join("_");
    await addDoc(collection(db, "messages"), { chatId, sender: currentUserProfile.username, text: msgInput.value.trim(), timestamp: Date.now() });
    msgInput.value = "";
});
    
