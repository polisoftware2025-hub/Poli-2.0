
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface ReportConfig {
    reportType: string;
    careerId: string;
    groupId: string;
    generatedBy: string;
    careers: { id: string; nombre: string }[];
    groups: { id: string; codigoGrupo: string, estudiantes: any[] }[];
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const addHeader = (doc: jsPDFWithAutoTable, title: string, description: string, generatedBy: string) => {
    const poliBlue = [0, 33, 71]; 
    
    // Logo Placeholder
    doc.setFillColor(poliBlue[0], poliBlue[1], poliBlue[2]);
    doc.rect(14, 15, 25, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Poli", 16, 26);

    doc.setTextColor(poliBlue[0], poliBlue[1], poliBlue[2]);
    doc.setFontSize(18);
    doc.text(title, 45, 22);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(description, 45, 28);
    
    doc.setFontSize(8);
    doc.text(`Generado por: ${generatedBy}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });

    doc.setDrawColor(200);
    doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
};

const addFooter = (doc: jsPDFWithAutoTable) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            'Politécnico 2.0 - Sistema de Gestión Académica',
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

const generateEnrollmentList = async (doc: jsPDFWithAutoTable, config: ReportConfig) => {
    const head = [['#', 'Nombre Completo', 'Correo Institucional', 'Carrera', 'Grupo', 'Estado']];
    const body = [];
    let studentsToFetch = [];

    // If a specific group is selected, fetch students directly from that group's document
    if (config.groupId !== 'all') {
        const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", config.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists() && groupSnap.data().estudiantes?.length > 0) {
            studentsToFetch = groupSnap.data().estudiantes.map((s: any) => s.id);
        }
    } else { // Otherwise, fetch all students for the selected career
        const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
        let q = query(studentsRef);
        if(config.careerId !== 'all') {
            q = query(q, where("carreraId", "==", config.careerId));
        }
        const studentsSnap = await getDocs(q);
        studentsToFetch = studentsSnap.docs.map(s => s.id);
    }

    if (studentsToFetch.length === 0) {
        body.push([{ content: 'No se encontraron estudiantes para los filtros seleccionados.', colSpan: 6, styles: { halign: 'center' } }]);
    } else {
        let i = 1;
        // Fetch details for the collected student IDs
        for (const studentId of studentsToFetch) {
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", studentId);
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", studentId);

            const [studentSnap, userSnap] = await Promise.all([getDoc(studentRef), getDoc(userRef)]);
            
            if (!studentSnap.exists() || !userSnap.exists()) continue;

            const studentData = studentSnap.data();
            const userData = userSnap.data();

            const careerName = config.careers.find(c => c.id === studentData.carreraId)?.nombre || 'N/A';
            const groupCode = config.groups.find(g => g.id === studentData.grupo)?.codigoGrupo || 'N/A';
            
            body.push([
                i++,
                userData.nombreCompleto || 'N/A',
                userData.correoInstitucional || userData.correo || 'N/A',
                careerName,
                groupCode,
                studentData.estado || 'N/A'
            ]);
        }
    }

    doc.autoTable({
        head: head,
        body: body,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [0, 33, 71] },
    });
};


const generateAcademicPerformance = async (doc: jsPDFWithAutoTable, config: ReportConfig) => {
    const head = [['Carrera', 'Estudiantes', 'Promedio General', 'Tasa Aprobación']];
    const body = [];
    
    const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
    const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");

    for (const career of config.careers) {
        if(config.careerId !== 'all' && config.careerId !== career.id) continue;
        
        const studentQuery = query(studentsRef, where("carreraId", "==", career.id));
        const studentsSnapshot = await getDocs(studentQuery);
        const studentIds = studentsSnapshot.docs.map(doc => doc.id);

        if (studentIds.length > 0) {
            const gradesQuery = query(notesRef, where("estudianteId", "in", studentIds));
            const gradesSnapshot = await getDocs(gradesQuery);
            
            let totalNotes = 0;
            let noteSum = 0;
            let approvedCount = 0;

            gradesSnapshot.forEach(gradeDoc => {
                const gradeData = gradeDoc.data();
                totalNotes++;
                noteSum += gradeData.nota;
                if (gradeData.nota >= 3.0) {
                    approvedCount++;
                }
            });
            
            const average = totalNotes > 0 ? (noteSum / totalNotes).toFixed(2) : "N/A";
            const approvalRate = totalNotes > 0 ? `${((approvedCount / totalNotes) * 100).toFixed(1)}%` : "N/A";
            
            body.push([career.nombre, studentIds.length, average, approvalRate]);

        } else {
            body.push([career.nombre, 0, "N/A", "N/A"]);
        }
    }

     doc.autoTable({
        head: head,
        body: body,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [0, 33, 71] },
    });
}

const generateDropoutReport = async (doc: jsPDFWithAutoTable, config: ReportConfig) => {
     const head = [['Carrera', 'Estudiantes Totales', 'Deserciones', 'Tasa de Deserción']];
     const body = [];
     
     const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");

     for (const career of config.careers) {
         if(config.careerId !== 'all' && config.careerId !== career.id) continue;
         
         const studentsQuery = query(studentsRef, where("carreraId", "==", career.id));
         const studentsSnapshot = await getDocs(studentsQuery);
         const studentIds = studentsSnapshot.docs.map(doc => doc.id);
         const totalStudents = studentIds.length;

         if (totalStudents > 0) {
             const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
             const usersQuery = query(usersRef, where("__name__", "in", studentIds));
             const usersSnapshot = await getDocs(usersQuery);
             
             let dropouts = 0;
             usersSnapshot.forEach(userDoc => {
                 const userData = userDoc.data();
                 if (userData.estado === 'inactivo' || userData.estado === 'retirado') {
                     dropouts++;
                 }
             });

             const rate = `${((dropouts / totalStudents) * 100).toFixed(1)}%`;
             body.push([career.nombre, totalStudents, dropouts, rate]);
         } else {
             body.push([career.nombre, 0, 0, "0.0%"]);
         }
     }

      doc.autoTable({
        head: head,
        body: body,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [0, 33, 71] },
    });
}


export const generatePdfReport = async (config: ReportConfig) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  
  const reportTitles: { [key: string]: { title: string, desc: string }} = {
      "academic_performance": { title: "Reporte de Rendimiento Académico", desc: "Análisis del rendimiento general por programa académico." },
      "enrollment_list": { title: "Listado de Estudiantes Matriculados", desc: "Listado completo de estudiantes inscritos según los filtros." },
      "dropout_report": { title: "Reporte de Deserción Escolar", desc: "Análisis de la tasa de deserción por programa." }
  };
  
  const { title, desc } = reportTitles[config.reportType] || { title: "Reporte General", desc: "" };

  addHeader(doc, title, desc, config.generatedBy);

  switch(config.reportType) {
      case "enrollment_list":
          await generateEnrollmentList(doc, config);
          break;
      case "academic_performance":
          await generateAcademicPerformance(doc, config);
          break;
      case "dropout_report":
          await generateDropoutReport(doc, config);
          break;
      default:
        doc.text("Tipo de reporte no reconocido.", 14, 45);
  }

  addFooter(doc);
  doc.save(`${config.reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
};
