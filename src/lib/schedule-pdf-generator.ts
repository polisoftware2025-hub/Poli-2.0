
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ScheduleEntry {
    dia: string;
    hora: string;
    duracion: number;
    materiaNombre: string;
    docenteNombre: string;
    modalidad: "Presencial" | "Virtual";
    salonNombre?: string;
    grupoCodigo?: string;
}

interface UserInfo {
    nombreCompleto: string;
    carreraNombre?: string;
    sedeNombre?: string;
}

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export function generateSchedulePdf(
    schedule: ScheduleEntry[],
    userInfo: UserInfo,
    userRole: string
) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // --- Header ---
    doc.setFillColor(0, 33, 71); // Poli Blue
    doc.rect(14, 15, 40, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Poli 2.0", 22, 25);

    doc.setFontSize(18);
    doc.setTextColor(0, 33, 71);
    doc.text("Horario de Clases Semanal", 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 200, 15, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 35, 200, 35);
    
    // --- User Info ---
    let startY = 45;
    const leftMargin = 14;
    const labelX = leftMargin;
    const valueX = 40;
    const rightColumnX = 120;
    const textMaxWidth = 80;

    doc.setFontSize(11);
    doc.setTextColor(0,0,0);
    doc.text(`${userRole === 'docente' ? 'Docente' : 'Estudiante'}:`, labelX, startY);
    doc.text(userInfo.nombreCompleto, valueX, startY);

    startY += 7;

    if (userRole === 'estudiante' && userInfo.carreraNombre) {
      doc.text("Carrera:", labelX, startY);
      
      const careerLines = doc.splitTextToSize(userInfo.carreraNombre, textMaxWidth);
      doc.text(careerLines, valueX, startY);
      
      const careerTextHeight = careerLines.length * 5; // Approximate height of the text block

      doc.text("Sede:", rightColumnX, startY);
      doc.text(userInfo.sedeNombre || "N/A", rightColumnX + 12, startY);

      startY += Math.max(7, careerTextHeight);
    }
    
    // --- Table ---
    const head = [["Hora", ...daysOfWeek]];
    const body = [];
    
    for (const time of timeSlots) {
        const row = [time];
        for (const day of daysOfWeek) {
            const entry = schedule.find(s => s.dia === day && s.hora.startsWith(time));
            if (entry) {
                const location = entry.modalidad === 'Virtual' ? 'Virtual' : (entry.salonNombre || 'N/A');
                row.push(`${entry.materiaNombre}\n${entry.docenteNombre}\n(${location})`);
            } else {
                row.push("");
            }
        }
        body.push(row);
    }

    doc.autoTable({
        head: head,
        body: body,
        startY: startY, // Use dynamic startY
        theme: 'grid',
        headStyles: {
            fillColor: [0, 33, 71], // Poli Blue
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            valign: 'middle',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'center' }
        }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            'Este horario es oficial y fue generado por la plataforma académica Poli 2.0.',
            14,
            doc.internal.pageSize.height - 10
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            200,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }
    
    // --- Save File ---
    const fileName = `Horario_${userInfo.nombreCompleto.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}
