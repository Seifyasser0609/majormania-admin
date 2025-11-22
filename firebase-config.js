// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyB9ineEsa59znCU3PLbny0smhbZfKcYq50",
    authDomain: "majormania-72cf0.firebaseapp.com",
    projectId: "majormania-72cf0",
    storageBucket: "majormania-72cf0.firebasestorage.app",
    messagingSenderId: "912353390860",
    appId: "1:912353390860:web:a863ec020d6576e7b09929"

};

// Initialize Firebase (Compat)
if (!firebase.apps.length) {
firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();