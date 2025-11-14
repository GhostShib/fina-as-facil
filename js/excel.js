// Importações do Firebase
import { auth, db } from './firebase.js';
import { 
    collection, 
    query, 
    getDocs,
    orderBy // Esta linha ainda é necessária se você re-adicionar no futuro
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Acesso à biblioteca SheetJS (XLSX) ---
// O script é carregado globalmente em home.html, então acessamos via 'window'
const XLSX = window.XLSX;

// Seleciona o botão
const btnExcel = document.getElementById('btnExcel');

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

/**
 * Coleta todos os dados e gera o arquivo Excel (XLSX).
 */
async function generateExcel() {
    if (!XLSX) {
        alert("Erro: A biblioteca de exportação (SheetJS) não foi carregada.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não autenticado.");
        return;
    }

    btnExcel.textContent = 'Gerando...';
    btnExcel.disabled = true;

    try {
        // 1. Buscar todas as transações
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

        const dataForSheet = [];

        // Adiciona cabeçalhos
        dataForSheet.push([
            "Nome",
            "Tipo",
            "Categoria",
            "Data",
            "Valor (R$)"
        ]);

        // 2. Processar dados
        transactions.forEach(tx => {
            if (tx.type === 'entrada') {
                totalEntradas += tx.value;
            } else {
                totalSaidas += tx.value;
            }

            dataForSheet.push([
                tx.name,
                tx.type === 'entrada' ? 'Entrada' : 'Saída',
                tx.category,
                formatDate(tx.date),
                tx.value // Deixa como número para facilitar somas no Excel
            ]);
        });

        const saldoFinal = totalEntradas - totalSaidas;

        // 3. Adicionar linhas de resumo
        dataForSheet.push([]); // Linha em branco
        dataForSheet.push(["RESUMO FINANCEIRO", ""]);
        dataForSheet.push(["Total Entradas", "", "", "", totalEntradas]);
        dataForSheet.push(["Total Saídas", "", "", "", totalSaidas]);
        dataForSheet.push(["Saldo Final", "", "", "", saldoFinal]);

        // 4. Criar a Planilha (Worksheet) e o Livro (Workbook)
        const ws = XLSX.utils.aoa_to_sheet(dataForSheet);

        // Ajustar largura das colunas (opcional, mas melhora a aparência)
        ws['!cols'] = [
            { wch: 30 }, // Nome
            { wch: 10 }, // Tipo
            { wch: 20 }, // Categoria
            { wch: 12 }, // Data
            { wch: 15 }  // Valor
        ];
        
        // Formata as células de valor como moeda (BRL)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = 1; R <= range.e.r; ++R) { // Começa de 1 para pular cabeçalho
            const cell_address = { c: 4, r: R }; // Coluna E (Valor)
            const cell = ws[XLSX.utils.encode_cell(cell_address)];
            if (cell && typeof cell.v === 'number') {
                cell.t = 'n';
                cell.z = 'R$ #,##0.00';
            }
        }
        // Formata as células de resumo
         const summaryStartRow = range.e.r - 2; // Linha "Total Entradas"
         for (let R = summaryStartRow; R <= range.e.r; R++) {
             const cell_address = { c: 4, r: R };
             const cell = ws[XLSX.utils.encode_cell(cell_address)];
             if (cell && typeof cell.v === 'number') {
                 cell.t = 'n';
                 cell.z = 'R$ #,##0.00';
             }
         }


        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Extrato Financeiro");

        // 5. Gerar e baixar o arquivo
        const today = new Date().toISOString().slice(0, 10);
        const fileName = `extrato_financeiro_${today}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error("Erro ao gerar Excel:", error);
        alert("Não foi possível gerar o Excel. Tente novamente.");
    } finally {
        btnExcel.textContent = 'Exportar Excel';
        btnExcel.disabled = false;
    }
}

// Adiciona o listener ao botão
btnExcel.addEventListener('click', generateExcel);