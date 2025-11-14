// Importações do Firebase
import { auth, db } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Selecionando elementos do DOM
const loginForm = document.getElementById('login-form');
const btnLogin = document.getElementById('btnLogin');
const btnCreateAccount = document.getElementById('btnCreateAccount');
const btnForgotPassword = document.getElementById('btnForgotPassword');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Função para formatar erros do Firebase
const formatFirebaseError = (errorCode) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'O e-mail fornecido é inválido.';
        case 'auth/user-not-found':
            return 'Nenhum usuário encontrado com este e-mail.';
        case 'auth/wrong-password':
            return 'Senha incorreta. Tente novamente.';
        case 'auth/email-already-in-use':
            return 'Este e-mail já está em uso por outra conta.';
        case 'auth/weak-password':
            return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        case 'auth/missing-password':
            return 'Por favor, digite sua senha.';
        case 'auth/missing-email':
            return 'Por favor, digite seu e-mail.';
        case 'auth/invalid-credential':
             return 'Credenciais inválidas. Verifique seu e-mail e senha.';
        default:
            return 'Ocorreu um erro. Tente novamente mais tarde.';
    }
};

// --- Event Listeners ---

// 1. Login (Entrar)
if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.textContent = '';

        if (!email || !password) {
            errorMessage.textContent = 'Por favor, preencha e-mail e senha.';
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'home.html';
        } catch (error) {
            console.error("Erro no login:", error.code);
            errorMessage.textContent = formatFirebaseError(error.code);
        }
    });
}

// 2. Criar Conta
if (btnCreateAccount) {
    btnCreateAccount.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.textContent = '';

        if (!email || !password) {
            errorMessage.textContent = 'Por favor, preencha e-mail e senha para criar a conta.';
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Criar documento do usuário no Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                name: email.split('@')[0], // Nome padrão
                email: user.email,
                saldoInicial: 0 // Conforme especificado
            });

            // Redirecionar para a home
            window.location.href = 'home.html';

        } catch (error) {
            console.error("Erro ao criar conta:", error.code);
            errorMessage.textContent = formatFirebaseError(error.code);
        }
    });
}

// 3. Esqueci a Senha
if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        errorMessage.textContent = '';

        if (!email) {
            errorMessage.textContent = 'Por favor, digite seu e-mail para redefinir a senha.';
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            errorMessage.textContent = 'Email de redefinição enviado! Verifique sua caixa de entrada.';
            errorMessage.style.color = '#27ae60'; // Sucesso
        } catch (error) {
            console.error("Erro ao redefinir senha:", error.code);
            errorMessage.textContent = formatFirebaseError(error.code);
            errorMessage.style.color = '#e74c3c'; // Erro
        }
    });
}