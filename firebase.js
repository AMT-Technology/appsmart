// Configuración Firebase
var firebaseConfig = {
  apiKey: "AIzaSyCEMOAiEhDC-Z5nS4_yB-a1s3T_61PrHF4",
  authDomain: "appwebs-8b23f.firebaseapp.com",
  projectId: "appwebs-8b23f",
  storageBucket: "appwebs-8b23f.appspot.com",
  messagingSenderId: "986164552498",
  appId: "1:986164552498:web:04262bde6fa35e5efced2b"
};

// Inicializar Firebase (v8)
firebase.initializeApp(firebaseConfig);

// Servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
