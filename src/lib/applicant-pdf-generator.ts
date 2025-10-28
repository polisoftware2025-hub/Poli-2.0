
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ApplicantData {
    id: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    direccion: string;
    tipoIdentificacion: string;
    identificacion: string;
    fechaNacimiento: Date;
    carreraId: string;
    grupo: string;
    sedeId: string;
    fechaRegistro: Date;
    estado: string;
    carreraNombre?: string;
    sedeNombre?: string;
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const addHeaderAndFooter = (doc: jsPDFWithAutoTable) => {
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
        doc.text("Ficha de Aspirante", 45, 25);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });

        doc.setDrawColor(200);
        doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Politécnico 2.0 - Documento de Pre-Inscripción.', 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    }
}

export const generateApplicantPdf = (applicant: ApplicantData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    addHeaderAndFooter(doc);

    const tableBody = (data: [string, string][]) => {
      return data.map(([label, value]) => {
        const formattedLabel = { content: label, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }};
        const formattedValue = { content: value || 'N/A' };
        return [formattedLabel, formattedValue];
      });
    };
    
    // --- Personal Information ---
    doc.autoTable({
        startY: 45,
        head: [[{ content: 'Información Personal', colSpan: 2, styles: { fillColor: [0, 33, 71] } }]],
        body: tableBody([
          ['Nombre Completo', applicant.nombreCompleto],
          ['Tipo de Documento', applicant.tipoIdentificacion],
          ['Número de Documento', applicant.identificacion],
          ['Fecha de Nacimiento', applicant.fechaNacimiento.toLocaleDateString('es-ES')],
        ]),
        theme: 'grid',
    });

    // --- Contact Information ---
    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [[{ content: 'Datos de Contacto', colSpan: 2, styles: { fillColor: [0, 33, 71] } }]],
        body: tableBody([
          ['Correo Personal', applicant.correo],
          ['Teléfono', applicant.telefono],
          ['Dirección', applicant.direccion],
        ]),
        theme: 'grid',
    });

    // --- Academic Application ---
    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [[{ content: 'Información de la Solicitud Académica', colSpan: 2, styles: { fillColor: [0, 33, 71] } }]],
        body: tableBody([
          ['Fecha de Solicitud', applicant.fechaRegistro.toLocaleDateString('es-ES')],
          ['Estado Actual', applicant.estado.charAt(0).toUpperCase() + applicant.estado.slice(1)],
          ['Carrera de Interés', applicant.carreraNombre || 'N/A'],
          ['Sede', applicant.sedeNombre || 'N/A'],
          ['Grupo Seleccionado', applicant.grupo],
        ]),
        theme: 'grid',
    });

    // --- Final Signature area ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setDrawColor(150);
    doc.line(14, finalY, 80, finalY);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Firma del Aspirante", 14, finalY + 5);

    doc.save(`Ficha_${applicant.nombreCompleto.replace(/\s/g, '_')}.pdf`);
}
