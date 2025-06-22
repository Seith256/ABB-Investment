// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyChcHhsQV8RF1EMngrKRSxMbzRnAGU6eRQ",
    authDomain: "demopro-c09d3.firebaseapp.com",
    projectId: "demopro-c09d3",
    storageBucket: "demopro-c09d3.firebasestorage.app",
    messagingSenderId: "845595579495",
    appId: "1:845595579495:web:44735d3723d6ada8ea30c2",
    measurementId: "G-P4KMZH1CDS"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
