
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

    // Esta es una simulación, en un caso real se calcularían estos datos.
    for (const career of config.careers) {
        if(config.careerId !== 'all' && config.careerId !== career.id) continue;
        
        const students = Math.floor(Math.random() * (150 - 50 + 1) + 50);
        const average = (3.5 + Math.random() * 1.4).toFixed(2);
        const approval = `${(75 + Math.random() * 20).toFixed(1)}%`;
        
        body.push([career.nombre, students, average, approval]);
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
     const head = [['Carrera', 'Estudiantes Iniciales', 'Deserciones', 'Tasa de Deserción']];
     const body = [];
     
     // Simulación
     for (const career of config.careers) {
         if(config.careerId !== 'all' && config.careerId !== career.id) continue;

         const initial = Math.floor(Math.random() * (120 - 80 + 1) + 80);
         const dropouts = Math.floor(initial * (0.05 + Math.random() * 0.1));
         const rate = `${((dropouts / initial) * 100).toFixed(1)}%`;

         body.push([career.nombre, initial, dropouts, rate]);
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
      "dropout_report": { title: "Reporte de Deserción Escolar", desc: "Análisis simulado de la tasa de deserción por programa." }
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
