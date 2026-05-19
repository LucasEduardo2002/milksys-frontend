import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function gerarPDF(registros: any[]) {
    if (!registros.length) {
        alert("Não há registros para exportar!");
        return;
    }

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const logoBase64 = "logo.jpg";

    const drawHeaderAndFooter = (_data: any) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- CABEÇALHO ---
        doc.addImage(logoBase64, "JPEG", 20, 5, 40, 18);
        doc.setFontSize(14);
        doc.text("PL 18 - REGISTRO DE CONTROLE DE QUALIDADE", 68, 15);
        doc.text("- LEITE CRU (PRODUTOR/RECEBIMENTO)", 75, 21);
        doc.setFontSize(12);
        doc.text("CÓDIGO: PAC07/PL18", 202, 12);
        doc.text(`EMISSÃO: ${dataAtual}`, 202, 18);
        doc.text("REVISÃO: 01", 202, 24);

        // --- ASSINATURA (FINAL DA PÁGINA) ---

        const assinaturaY = pageHeight - 25;
        doc.setFontSize(10);
        doc.line(pageWidth / 2 - 50, assinaturaY, pageWidth / 2 + 50, assinaturaY);
        doc.text("Veterinário Responsável", pageWidth / 2, assinaturaY + 5, { align: "center" });

        
    };

    const colunas = Object.keys(registros[0])
        .filter(campo => campo !== "id")
        .map(campo => campo.toUpperCase());

    const linhas = registros.map(reg =>
        Object.keys(reg)
            .filter(campo => campo !== "id")
            .map(campo => {
                const valor = (reg as any)[campo];
                if (campo.toLowerCase() === "data" && valor) {
                    const dataLimpa = String(valor).split('T')[0];
                    const partes = dataLimpa.split('-');
                    if (partes.length === 3) {
                        return `${partes[2]}/${partes[1]}/${partes[0]}`;
                    }

                }
                return valor;
            })
    );

    const indexLeiteBom = colunas.findIndex(c => c.toLowerCase() === "leite_bom_qnt");
    const totalLeiteBom = registros.reduce((total, reg) => total + Number(reg.leite_bom_qnt || 0), 0);

    const linhaTotal = colunas.map((_, index) => {
        if (index === indexLeiteBom) return totalLeiteBom.toFixed(2);
        if (index === 0) return "TOTAL";
        return "";
    });

    autoTable(doc, {
        head: [colunas],
        body: linhas,
        foot: [linhaTotal],
        startY: 30,
        theme: 'grid',
        styles: {
            fontSize: 7,
            halign: "center",
            valign: "middle", 
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            cellPadding: 1, 
        },
        // --- CONFIGURAÇÃO DE LARGURAS ---
        columnStyles: {
            
            15: { cellWidth: 30,  overflow: 'linebreak' }, // Observação grande
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: "bold" },
        
        didParseCell: function (dataCell) {
            // Sua lógica de acidez...
            if (dataCell.section === "body") {
                const colunaAcidezIndex = colunas.findIndex(c => c.toLowerCase() === "acidez");
                if (dataCell.column.index === colunaAcidezIndex) {
                    const valor = parseFloat(String(dataCell.cell.raw));
                    if (!isNaN(valor) && valor > 19.9) {
                        dataCell.cell.styles.textColor = [255, 0, 0];
                        dataCell.cell.styles.fontStyle = "bold";
                    }
                }
            }
        },
        didDrawPage: drawHeaderAndFooter,
        margin: { top: 30, bottom: 35 }
    });
    // --- RODAPÉ (PÁGINA) ---
    const totalPages = (doc as any).internal.getNumberOfPages();
       for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
            `Página: ${i} de ${totalPages}`,
            doc.internal.pageSize.getWidth() - 10,
            doc.internal.pageSize.getHeight() - 10,
            { align: "right" }
        );
    }

    doc.save(`Relatorio_coletas_${dataAtual.replace(/\//g, "-")}.pdf`);
}