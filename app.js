import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your verified Firebase Config
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

// FIX 1: Exporting to window scope so HTML elements can call it
window.showForm = showForm;

// Event Listeners for UI Switches
document.getElementById('goToSignUp').addEventListener('click', () => showForm('signUpCard'));
document.getElementById('goToForgot').addEventListener('click', () => showForm('forgotCard'));
document.getElementById('backToLogin').addEventListener('click', () => showForm('loginCard'));
document.getElementById('backToLoginFromForgot').addEventListener('click', () => showForm('loginCard'));

document.getElementById('taskTabHead').addEventListener('click', () => {
    document.getElementById('taskTabHead').classList.add('active');
    document.getElementById('chatTabHead').classList.remove('active');
    document.getElementById('tasksTab').classList.remove('hidden');
    document.getElementById('chatTab').classList.add('hidden');
});

document.getElementById('chatTabHead').addEventListener('click', () => {
    document.getElementById('chatTabHead').classList.add('active');
    document.getElementById('taskTabHead').classList.remove('active');
    document.getElementById('chatTab').classList.remove('hidden');
    document.getElementById('tasksTab').classList.add('hidden');
});

// Password Visibility Toggle
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.classList.remove('fa-eye-slash');
    }
}
window.togglePassword = togglePassword; // Exporting toggle to window scope

document.getElementById('eyeIcon').addEventListener('click', () => togglePassword('loginPassword', 'eyeIcon'));
document.getElementById('regEyeIcon').addEventListener('click', () => togglePassword('regPassword', 'regEyeIcon'));

// Auth State Persistence
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if(userDoc.exists()) {
                currentUserProfile = userDoc.data();
                document.getElementById('userGreeting').innerText = currentUserProfile.username;
                showForm('dashboardCard');
                listenToTasks();
            } else {
                showForm('loginCard');
            }
        } catch(e) { alert("Error loading profile: " + e.message); }
    } else {
        showForm('loginCard');
    }
});

// Create New User
document.getElementById('signUpBtn').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.toLowerCase().trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if(!name || !username || !email || !password) { alert("All fields are required!"); return; }

    try {
        const uSnap = await getDoc(doc(db, "usernames", username));
        if(uSnap.exists()) { alert("Username is already claimed!"); return; }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), { uid, name, username, email });
        await setDoc(doc(db, "usernames", username), { uid });

        alert("Account created successfully!");
    } catch (err) { alert(err.message); }
});

// Sign In
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if(!email || !password) return;
    signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
});

// Forgot Password
document.getElementById('forgotBtn').addEventListener('click', () => {
    const email = document.getElementById('forgotEmail').value.trim();
    if(!email) return;
    sendPasswordResetEmail(auth, email).then(() => alert("Reset Link Sent to your Email!")).catch(err => alert(err.message));
});

// Log Out Action
document.getElementById('logoutBtn').addEventListener('click', () => {
    if(unsubscribeTasks) unsubscribeTasks();
    if(unsubscribeChats) unsubscribeChats();
    signOut(auth);
});

// Realtime Tasks Management
document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const input = document.getElementById('taskInput');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "tasks"), {
        uid: auth.currentUser.uid,
        text: input.value.trim(),
        completed: false,
        timestamp: Date.now()
    });
    input.value = "";
});

function listenToTasks() {
    if(unsubscribeTasks) unsubscribeTasks();
    // FIX 2: Optimized Query structure to safeguard against index crashes
    const q = query(collection(db, "tasks"), where("uid", "==", auth.currentUser.uid));
    unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const list = document.getElementById('taskList');
        list.innerHTML = "";
        
        // Sorting locally to bypass required Firestore Composite Indexing steps
        const docs = [];
        snapshot.forEach(d => docs.push({id: d.id, ...d.data()}));
        docs.sort((a, b) => b.timestamp - a.timestamp);

        docs.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `<span>${task.text}</span>`;
            
            const actions = document.createElement('div');
            actions.className = 'task-actions';
            
            const chk = document.createElement('i');
            chk.className = 'fa-solid fa-check-circle';
            chk.onclick = () => updateDoc(doc(db, "tasks", task.id), { completed: !task.completed });
            
            const del = document.createElement('i');
            del.className = 'fa-solid fa-trash';
            del.onclick = () => deleteDoc(doc(db, "tasks", task.id));
            
            actions.appendChild(chk);
            actions.appendChild(del);
            li.appendChild(actions);
            list.appendChild(li);
        });
    });
}

// Realtime Chat Engine
document.getElementById('searchUser').addEventListener('change', async () => {
    const searchVal = document.getElementById('searchUser').value.toLowerCase().trim();
    if(!searchVal || searchVal === currentUserProfile.username) return;

    const uSnap = await getDoc(doc(db, "usernames", searchVal));
    if(!uSnap.exists()){ document.getElementById('chatLogs').innerText = "User not found!"; return; }

    activeChatUsername = searchVal;
    document.getElementById('chatLogs').innerHTML = `<b>Opening chat window with @${activeChatUsername}...</b>`;
    listenToMessages();
});

document.getElementById('sendChatBtn').addEventListener('click', async () => {
    const msgInput = document.getElementById('chatMsgInput');
    if(!msgInput.value.trim() || !activeChatUsername) return;

    const chatId = [currentUserProfile.username, activeChatUsername].sort().join("_");
    await addDoc(collection(db, "messages"), {
        chatId,
        sender: currentUserProfile.username,
        text: msgInput.value.trim(),
        timestamp: Date.now()
    });
    msgInput.value = "";
});

function listenToMessages() {
    if(unsubscribeChats) unsubscribeChats();
    const chatId = [currentUserProfile.username, activeChatUsername].sort().join("_");
    // FIX 3: Local Sort to avoid index rules conflict
    const q = query(collection(db, "messages"), where("chatId", "==", chatId));
    
    unsubscribeChats = onSnapshot(q, (snapshot) => {
        const logs = document.getElementById('chatLogs');
        logs.innerHTML = "";
        
        const msgs = [];
        snapshot.forEach(d => msgs.push(d.data()));
        msgs.sort((a, b) => a.timestamp - b.timestamp);

        msgs.forEach(data => {
            const div = document.createElement('div');
            div.className = `msg ${data.sender === currentUserProfile.username ? 'sent' : 'received'}`;
            div.innerText = data.text;
            logs.appendChild(div);
        });
        logs.scrollTop = logs.scrollHeight;
    });
}
