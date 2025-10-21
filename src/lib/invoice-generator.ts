
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Timestamp } from 'firebase/firestore';

interface Invoice {
    id: string;
    ciclo: number;
    monto: number;
    fechaPago: Timestamp;
}

interface StudentInfo {
    nombreCompleto: string;
    identificacion: string;
    carreraNombre: string;
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const addHeaderAndFooter = (doc: jsPDFWithAutoTable, invoiceId: string) => {
    const pageCount = doc.internal.getNumberOfPages();
    const poliBlue = [0, 33, 71];

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Header
        doc.setFillColor(poliBlue[0], poliBlue[1], poliBlue[2]);
        doc.rect(14, 15, 25, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Poli", 16, 26);

        doc.setFontSize(22);
        doc.setTextColor(poliBlue[0], poliBlue[1], poliBlue[2]);
        doc.text("Factura de Pago", 45, 25);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`ID Factura: ${invoiceId}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });

        doc.setDrawColor(200);
        doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            'Politécnico 2.0 - Gracias por tu pago.',
            14,
            doc.internal.pageSize.height - 10
        );
         doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 14,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }
}


export const generateInvoicePdf = (invoice: Invoice, studentInfo: StudentInfo) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const startY = 45;

    // --- Student Info ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Facturado a:", 14, startY);

    doc.setFont("helvetica", "normal");
    doc.text(studentInfo.nombreCompleto, 14, startY + 6);
    doc.text(`Doc. Identidad: ${studentInfo.identificacion}`, 14, startY + 12);
    doc.text(`Carrera: ${studentInfo.carreraNombre}`, 14, startY + 18);

    // --- Payment Info ---
    doc.setFont("helvetica", "bold");
    doc.text("Detalles del Pago:", 110, startY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Pago: ${invoice.fechaPago.toDate().toLocaleString('es-ES')}`, 110, startY + 6);
    doc.text(`Estado:`, 110, startY + 12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 0); // Green color for "Pagado"
    doc.text("Pagado", 125, startY + 12);
    doc.setTextColor(0, 0, 0); // Reset color


    // --- Invoice Table ---
    const head = [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']];
    const body = [
        [
            `Matrícula Académica - Ciclo ${invoice.ciclo}`, 
            '1', 
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.monto),
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.monto)
        ]
    ];
    
    doc.autoTable({
        startY: startY + 30,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [0, 33, 71] }, // Poli Blue
        didDrawPage: (data) => {
            // Add header and footer to each page
            addHeaderAndFooter(doc, invoice.id);
        }
    });
    
    // --- Total ---
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total Pagado:", 140, finalY + 15, { align: 'right' });
    doc.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.monto), 195, finalY + 15, { align: 'right' });


    // --- Watermark ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(70);
        doc.setTextColor(0, 150, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PAGADO", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2, {
            angle: -45,
            align: 'center',
            // @ts-ignore
            renderingMode: 'stroke',
            // @ts-ignore
            strokeOpacity: 0.2
        });
    }

    doc.save(`Factura_${invoice.id}.pdf`);
}
