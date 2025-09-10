
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
    
    // Config
    const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const poliBlue = [0, 33, 71];
    const lightGray = 240;

    // --- Header ---
    doc.setFillColor(poliBlue[0], poliBlue[1], poliBlue[2]);
    doc.rect(14, 15, 186, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Horario de Clases Semanal", doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    // --- User Info ---
    let startY = 42;
    const leftMargin = 14;
    const rightMargin = 115;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(poliBlue[0], poliBlue[1], poliBlue[2]);
    
    if (userRole === 'docente') {
        doc.text("Docente:", leftMargin, startY);
    } else {
        doc.text("Estudiante:", leftMargin, startY);
        if(userInfo.carreraNombre) doc.text("Carrera:", leftMargin, startY + 7);
        if(userInfo.sedeNombre) doc.text("Sede:", rightMargin, startY);
    }
    
    doc.text("Generado:", rightMargin, startY + (userRole === 'docente' ? 0 : 7));
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    doc.text(userInfo.nombreCompleto, leftMargin + 22, startY);
    
    if (userRole !== 'docente') {
        if (userInfo.carreraNombre) {
            const careerLines = doc.splitTextToSize(userInfo.carreraNombre, 70);
            doc.text(careerLines, leftMargin + 22, startY + 7);
        }
        doc.text(userInfo.sedeNombre || "N/A", rightMargin + 10, startY);
    }
    
    doc.text(new Date().toLocaleDateString('es-ES'), rightMargin + 20, startY + (userRole === 'docente' ? 0 : 7));

    startY += 20;

    // --- Table Logic ---
    const head = [daysOfWeek];
    const body: any[][] = [];

    const scheduleGrid: (ScheduleEntry | null)[][] = Array(timeSlots.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));

    schedule.forEach(entry => {
        const dayIndex = daysOfWeek.indexOf(entry.dia);
        const [startTime] = entry.hora.split(' - ');
        const [startHour] = startTime.split(':').map(Number);
        const timeIndex = timeSlots.indexOf(`${startHour.toString().padStart(2, '0')}:00`);
        
        if (dayIndex !== -1 && timeIndex !== -1) {
            const durationInHours = Math.ceil(entry.duracion);
            for (let i = 0; i < durationInHours; i++) {
                if (timeIndex + i < timeSlots.length) {
                    scheduleGrid[timeIndex + i][dayIndex] = entry;
                }
            }
        }
    });

    timeSlots.forEach((time, timeIndex) => {
        const rowData: any[] = [];
        daysOfWeek.forEach((_, dayIndex) => {
            const entry = scheduleGrid[timeIndex][dayIndex];
            const isFirstSlot = entry && entry.hora.startsWith(time.split(':')[0]);

            if (isFirstSlot) {
                const location = entry.modalidad === 'Virtual' ? 'Virtual' : (entry.salonNombre || 'N/A');
                let cellContent: any[] = [
                    { content: entry.materiaNombre, styles: { fontStyle: 'bold', fontSize: 9, textColor: poliBlue } },
                    { content: `(${entry.hora})`, styles: { fontSize: 7, textColor: 80 } },
                    { content: location, styles: { fontStyle: 'italic', fontSize: 7, textColor: 80 } }
                ];
                
                if (userRole === 'docente' && entry.grupoCodigo) {
                    cellContent.splice(1, 0, { content: `Grupo: ${entry.grupoCodigo}`, styles: { fontSize: 8, textColor: 80 } });
                } else if (userRole === 'estudiante') {
                    cellContent.splice(1, 0, { content: entry.docenteNombre, styles: { fontSize: 7, textColor: 80 } });
                }

                rowData.push({
                    content: cellContent,
                    rowSpan: Math.ceil(entry.duracion),
                    styles: { fillColor: [230, 240, 255] } // Light blue for class cells
                });
            } else if (!entry) {
                rowData.push({ content: '', styles: { fillColor: [250, 250, 250] } });
            }
        });
        body.push(rowData);
    });

    doc.autoTable({
        head: head,
        body: body,
        startY: startY,
        theme: 'grid',
        headStyles: {
            fillColor: poliBlue,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            valign: 'middle',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: 220
        },
        didParseCell: (data) => {
            // This is for multicontent cells
            if(Array.isArray(data.cell.raw?.content)){
                data.cell.text = data.cell.raw.content.map((item: any) => item.content);
                data.cell.styles.font = 'helvetica';
                
                const stylesArray: any[] = data.cell.raw.content.map((item: any) => item.styles);
                const cellStyles: { [key: number]: any } = {};
                stylesArray.forEach((style, index) => {
                    cellStyles[index] = style;
                });
                data.cell.styles.cellStyles = cellStyles;
            }
        },
        willDrawCell: (data) => {
            // For custom styling inside cells
             if (data.cell.raw?.styles?.cellStyles) {
                doc.setFont(data.cell.styles.font, data.cell.styles.fontStyle);
                doc.setFontSize(data.cell.styles.fontSize);
                const styles = data.cell.raw.styles.cellStyles;
                
                const textLines = data.cell.text as string[];
                let y = data.cell.y + 4;

                textLines.forEach((line: string, index: number) => {
                    const style = styles[index] || {};
                    doc.setFont(style.font || 'helvetica', style.fontStyle || 'normal');
                    doc.setFontSize(style.fontSize || 8);
                    doc.setTextColor(style.textColor || 50);
                    
                    doc.text(line, data.cell.x + 2, y);
                    y += style.fontSize * 0.35 + 1.5;
                })
                 return false; // Prevent default rendering
            }
        },
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

    