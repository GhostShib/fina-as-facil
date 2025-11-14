// Importações do Firebase
import { auth } from './firebase.js';
import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/**
 * Verifica o estado de autenticação do usuário.
 * Se o usuário NÃO estiver logado, ele é redirecionado
 * para a página de login (index.html).
 * * Este script deve ser carregado em todas as páginas protegidas.
 */
onAuthStateChanged(auth, (user) => {
    // A verificação é simples: se não houver 'user', redireciona.
    if (!user) {
        console.log("Usuário não autenticado. Redirecionando para o login...");
        // Garante que estamos na raiz do projeto para o redirecionamento
        window.location.href = 'index.html'; 
    } else {
        // Opcional: log para confirmar que o usuário está logado
        // console.log("AuthGuard: Usuário autenticado:", user.uid);
    }
});