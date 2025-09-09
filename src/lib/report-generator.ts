
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
    groups: { id: string; codigoGrupo: string }[];
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

    const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
    let q = query(studentsRef);
    if(config.careerId !== 'all') {
        q = query(q, where("carreraId", "==", config.careerId));
    }
     if(config.groupId !== 'all') {
        q = query(q, where("grupo", "==", config.groupId));
    }

    const studentsSnap = await getDocs(q);
    
    let i = 1;
    for (const studentDoc of studentsSnap.docs) {
        const data = studentDoc.data();
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", studentDoc.id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        const careerName = config.careers.find(c => c.id === data.carreraId)?.nombre || 'N/A';
        const groupCode = config.groups.find(g => g.id === data.grupo)?.codigoGrupo || 'N/A';

        body.push([
            i++,
            data.nombreCompleto || 'N/A',
            data.correoInstitucional || userData?.correo || 'N/A',
            careerName,
            groupCode,
            data.estado || 'N/A'
        ]);
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
    
    // 1. Fetch all grades and students
    const gradesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas"));
    const studentsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes"));
    
    const studentCareerMap = new Map<string, string>();
    studentsSnapshot.forEach(doc => {
        studentCareerMap.set(doc.id, doc.data().carreraId);
    });

    // 2. Process grades and group by career
    const careerStats: { [careerId: string]: { totalNotes: number; noteSum: number; approvedCount: number, studentIds: Set<string>} } = {};

    gradesSnapshot.forEach(gradeDoc => {
        const gradeData = gradeDoc.data();
        const studentId = gradeData.estudianteId;
        const careerId = studentCareerMap.get(studentId);
        
        if (careerId) {
            if (!careerStats[careerId]) {
                careerStats[careerId] = { totalNotes: 0, noteSum: 0, approvedCount: 0, studentIds: new Set() };
            }
            careerStats[careerId].studentIds.add(studentId);
            careerStats[careerId].totalNotes++;
            careerStats[careerId].noteSum += gradeData.nota;
            if (gradeData.nota >= 3.0) {
                careerStats[careerId].approvedCount++;
            }
        }
    });

    // 3. Build table body
    for (const career of config.careers) {
        if(config.careerId !== 'all' && config.careerId !== career.id) continue;
        
        const stats = careerStats[career.id];
        if (stats) {
            const average = (stats.noteSum / stats.totalNotes).toFixed(2);
            const approvalRate = `${((stats.approvedCount / stats.totalNotes) * 100).toFixed(1)}%`;
            body.push([career.nombre, stats.studentIds.size, average, approvalRate]);
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
     
     // 1. Get all students and their careers
     const studentsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes"));
     const allUsersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"));
     
     const userStatusMap = new Map<string, string>();
     allUsersSnapshot.forEach(doc => userStatusMap.set(doc.id, doc.data().estado));

     // 2. Group by career
     const careerStudents: { [careerId: string]: string[] } = {};
     studentsSnapshot.forEach(doc => {
         const data = doc.data();
         if (!careerStudents[data.carreraId]) {
             careerStudents[data.carreraId] = [];
         }
         careerStudents[data.carreraId].push(doc.id);
     });

     // 3. Calculate stats
     for (const career of config.careers) {
         if(config.careerId !== 'all' && config.careerId !== career.id) continue;
         
         const studentIds = careerStudents[career.id] || [];
         const totalStudents = studentIds.length;
         
         if (totalStudents > 0) {
             const dropouts = studentIds.filter(id => userStatusMap.get(id) === 'inactivo' || userStatusMap.get(id) === 'retirado').length;
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
