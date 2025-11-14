// Importações do Firebase
import { auth, db } from './firebase.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    getDocs,
    orderBy // Esta linha ainda é necessária se você re-adicionar no futuro
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importações do jsPDF (ES Module)
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.es.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.es.min.js";

// Seleciona o botão
const btnPDF = document.getElementById('btnPDF');

// Função auxiliar para formatar data (similar à do home.js)
const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = (date.toDate) ? date.toDate() : new Date(date);
    // Corrigido para lidar com datas de input
    if (d.getTimezoneOffset() !== 0) {
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    }
    return d.toLocaleDateString('pt-BR');
};

// Função auxiliar para formatar moeda (similar à do home.js)
const formatCurrency = (value) => {
    if (typeof value !== 'number') value = 0;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BR' });
};

/**
 * Coleta todos os dados e gera o PDF.
 */
async function generatePDF() {
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não autenticado.");
        return;
    }

    btnPDF.textContent = 'Gerando...';
    btnPDF.disabled = true;

    try {
        // 1. Buscar nome do usuário
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userName = userDoc.exists() ? userDoc.data().name : 'Usuário';

        // 2. Buscar todas as transações
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        // CORREÇÃO: Removido o orderBy('date', 'desc') para evitar erro de índice.
        const q = query(transactionsRef);
        const querySnapshot = await getDocs(q);

        let totalEntradas = 0;
        let totalSaidas = 0;
        const transactions = [];

        querySnapshot.forEach(doc => {
            transactions.push(doc.data());
        });

        // Ordena no cliente (JavaScript) em vez de no servidor
        transactions.sort((a, b) => {
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });

        const tableBody = [];
        transactions.forEach(tx => {
            const isEntrada = tx.type === 'entrada';
            
            if (isEntrada) {
                totalEntradas += tx.value;
            } else {
                totalSaidas += tx.value;
            }

            tableBody.push([
                tx.name,
                isEntrada ? 'Entrada' : 'Saída',
                tx.category,
                formatDate(tx.date),
                formatCurrency(tx.value)
            ]);
        });


        const saldoFinal = totalEntradas - totalSaidas;

        // 3. Criar o documento PDF
        const docPDF = new jsPDF();

        // Título
        docPDF.setFontSize(18);
        docPDF.text("Extrato Financeiro - Finanças Fácil", 105, 20, { align: 'center' });

        // Informações do Usuário
        docPDF.setFontSize(12);
        docPDF.text(`Usuário: ${userName}`, 14, 35);
        docPDF.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 42);

        // Tabela de Transações
        docPDF.autoTable({
            startY: 50,
            head: [['Nome', 'Tipo', 'Categoria', 'Data', 'Valor']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] } // Verde
        });

        // Resumo Financeiro (após a tabela)
        const finalY = docPDF.lastAutoTable.finalY + 15;
        docPDF.setFontSize(14);
        docPDF.text("Resumo Financeiro", 14, finalY);
        
        docPDF.setFontSize(12);
        docPDF.setTextColor(46, 204, 113); // Verde (Entrada)
        docPDF.text(`Total de Entradas: ${formatCurrency(totalEntradas)}`, 14, finalY + 8);
        
        docPDF.setTextColor(231, 76, 60); // Vermelho (Saída)
        docPDF.text(`Total de Saídas: ${formatCurrency(totalSaidas)}`, 14, finalY + 16);
        
        docPDF.setFontSize(13);
        docPDF.setFont(undefined, 'bold');
        docPDF.setTextColor(44, 62, 80); // Cinza Escuro (Saldo)
        docPDF.text(`Saldo Final: ${formatCurrency(saldoFinal)}`, 14, finalY + 24);

        // 4. Salvar o PDF
        docPDF.save(`extrato_financeiro_${userName.replace(' ', '_')}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
        btnPDF.textContent = 'Baixar PDF';
        btnPDF.disabled = false;
    }
}

// Adiciona o listener ao botão
btnPDF.addEventListener('click', generatePDF);