
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
    const valueX = 40;
    const rightColumnX = 120;
    const textMaxWidth = 80;

    doc.setFontSize(11);
    doc.setTextColor(0,0,0);
    doc.text(`${userRole === 'docente' ? 'Docente' : 'Estudiante'}:`, leftMargin, startY);
    doc.text(userInfo.nombreCompleto, valueX, startY);

    startY += 7;

    if (userRole === 'estudiante' && userInfo.carreraNombre) {
      doc.text("Carrera:", leftMargin, startY);
      
      const careerLines = doc.splitTextToSize(userInfo.carreraNombre, textMaxWidth);
      doc.text(careerLines, valueX, startY);
      
      const careerTextHeight = careerLines.length * 5; 

      doc.text("Sede:", rightColumnX, startY);
      doc.text(userInfo.sedeNombre || "N/A", rightColumnX + 12, startY);

      startY += Math.max(7, careerTextHeight);
    }
    
    // --- Table ---
    const head = [["Hora", ...daysOfWeek]];
    const body: any[][] = [];

    const scheduleGrid: (ScheduleEntry | null)[][] = Array(timeSlots.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));

    schedule.forEach(entry => {
        const dayIndex = daysOfWeek.indexOf(entry.dia);
        const startTime = entry.hora.split(' - ')[0];
        const timeIndex = timeSlots.indexOf(startTime);
        
        if (dayIndex !== -1 && timeIndex !== -1) {
            for (let i = 0; i < entry.duracion; i++) {
                if (timeIndex + i < timeSlots.length) {
                    scheduleGrid[timeIndex + i][dayIndex] = entry;
                }
            }
        }
    });

    timeSlots.forEach((time, timeIndex) => {
        const row: any[] = [time];
        daysOfWeek.forEach((day, dayIndex) => {
            const entry = scheduleGrid[timeIndex][dayIndex];
            const isFirstSlotOfEntry = entry && entry.hora.startsWith(time);
            
            if (entry) {
                if (isFirstSlotOfEntry) {
                    const location = entry.modalidad === 'Virtual' ? 'Virtual' : (entry.salonNombre || 'N/A');
                    row.push({
                        content: `${entry.materiaNombre}\n(${entry.hora})\n${entry.docenteNombre}\n${location}`,
                        rowSpan: entry.duracion
                    });
                } 
                // Don't push anything if it's a subsequent slot (it will be spanned by the first)
            } else {
                 row.push(""); // Empty slot
            }
        });
        body.push(row);
    });

    doc.autoTable({
        head: head,
        body: body,
        startY: startY,
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
            0: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index > 0 && data.cell.raw && typeof data.cell.raw === 'object') {
                if ((data.cell.raw as any).rowSpan > 1) {
                    doc.setDrawColor(200); // Light gray for merged cell borders
                    doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                }
            }
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
