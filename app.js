// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Apna Firebase Config yahan zaroor paste karein
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. Toast Notification Function (Pop-up ka professional replacement)
window.showToast = (msg) => {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = "show";
    // 3 second baad toast gayab ho jayega
    setTimeout(() => { toast.className = ""; }, 3000);
};

// 2. Password Toggle Function (Eye Icon Logic)
const togglePassword = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
};

// Eye Icon Event Listeners
document.getElementById('eyeIcon').addEventListener('click', () => togglePassword('loginPassword', 'eyeIcon'));
document.getElementById('regEyeIcon').addEventListener('click', () => togglePassword('regPassword', 'regEyeIcon'));

// 3. Login Logic
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => showToast("Login Successful!"))
        .catch(err => showToast("Error: " + err.message));
});

// 4. Sign Up Logic
document.getElementById('signUpBtn').addEventListener('click', () => {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    
    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => showToast("Account Created Successfully!"))
        .catch(err => showToast("Error: " + err.message));
});

// 5. Forgot Password Logic
document.getElementById('forgotBtn').addEventListener('click', () => {
    const email = document.getElementById('forgotEmail').value;
    
    sendPasswordResetEmail(auth, email)
        .then(() => showToast("Reset link sent to your email!"))
        .catch(err => showToast("Error: " + err.message));
});

// 6. UI Navigation (Card Switching)
const showForm = (id) => {
    document.querySelectorAll('.login-container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
};

document.getElementById('goToSignUp').addEventListener('click', () => showForm('signUpCard'));
document.getElementById('goToForgot').addEventListener('click', () => showForm('forgotCard'));
document.getElementById('backToLogin').addEventListener('click', () => showForm('loginCard'));
document.getElementById('backToLoginFromForgot').addEventListener('click', () => showForm('loginCard'));
