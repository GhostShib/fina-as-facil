// Importando as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração do seu app Firebase (OBRIGATÓRIA)
const firebaseConfig = {
  apiKey: "AIzaSyDnBM3hEcUt6-BNMpuwufSB1q95CBoCRVk",
  authDomain: "financeiro-facil-74dd3.firebaseapp.com",
  projectId: "financeiro-facil-74dd3",
  storageBucket: "financeiro-facil-74dd3.firebasestorage.app",
  messagingSenderId: "20360124739",
  appId: "1:20360124739:web:1bb6ab6963324fad02f7f6"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Inicializando e exportando os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);