
'use server';
/**
 * @fileOverview A system to automatically enroll a student in subjects for their current academic cycle.
 *
 * - enrollStudentInCurrentCycleSubjects - A function that calculates the student's current cycle and enrolls them in the corresponding subjects.
 * - EnrollStudentInput - The input type for the enrollStudentInCurrentCycleSubjects function.
 * - EnrollStudentOutput - The return type for the enrollStudentInCurrentCycleSubjects function.
 */

import { carreraData } from '@/lib/seed'; // Assuming seed data contains the academic structure

// Input and Output types defined using TypeScript interfaces
export interface EnrollStudentInput {
  studentId: string;
  enrollmentDate: string; // ISO 8601 datetime string
}

export interface EnrollStudentOutput {
  studentId: string;
  calculatedCycle: number;
  enrolledSubjects: Array<{
    id: string;
    nombre: string;
    creditos: number;
  }>;
  requiresElectiveSelection: boolean;
  message: string;
}

/**
 * Calculates the student's current academic cycle based on their enrollment date.
 * @param enrollmentDate The student's initial enrollment date.
 * @param currentDate The current date to calculate against.
 * @returns The current academic cycle number.
 */
function calculateCurrentCycle(enrollmentDate: Date, currentDate: Date): number {
  const enrollmentYear = enrollmentDate.getFullYear();
  const currentYear = currentDate.getFullYear();
  
  // Semester definition: Feb-Jun is 1st, Aug-Nov is 2nd.
  // Months are 0-indexed (Jan=0, Jun=5, Jul=6, Nov=10)
  const enrollmentMonth = enrollmentDate.getMonth();
  const currentMonth = currentDate.getMonth();

  const getSemester = (month: number): number => {
    // Before August (i.e., Feb-Jun period, plus Jan)
    if (month < 7) { 
        return 1;
    }
    // August-November period, plus Dec
    return 2; 
  };

  const enrollmentSemester = getSemester(enrollmentMonth);
  const currentSemester = getSemester(currentMonth);

  const yearDifference = currentYear - enrollmentYear;
  
  let semestersPassed = yearDifference * 2;

  if (currentSemester > enrollmentSemester) {
    semestersPassed += 1;
  } else if (currentSemester < enrollmentSemester) {
    semestersPassed -= 1;
  }

  // The cycle is the number of semesters passed + 1 (for the initial cycle)
  const currentCycle = semestersPassed + 1;

  // The maximum cycle is defined by the academic program.
  const maxCycle = carreraData.ciclos.length;

  return Math.max(1, Math.min(currentCycle, maxCycle));
}

/**
 * Main function to handle the automatic enrollment logic without using Genkit.
 * @param input The student and enrollment date information.
 * @returns The result of the enrollment process.
 */
export async function enrollStudentInCurrentCycleSubjects(input: EnrollStudentInput): Promise<EnrollStudentOutput> {
    const enrollmentDate = new Date(input.enrollmentDate);
    const currentDate = new Date();

    const currentCycle = calculateCurrentCycle(enrollmentDate, currentDate);

    const cycleInfo = carreraData.ciclos.find(c => c.numero === currentCycle);

    if (!cycleInfo) {
      throw new Error(`El ciclo académico ${currentCycle} no fue encontrado en la estructura del programa.`);
    }

    const mandatorySubjects = cycleInfo.materias.filter(m => !m.nombre.toLowerCase().includes('electiva'));
    const hasElectives = cycleInfo.materias.some(m => m.nombre.toLowerCase().includes('electiva'));
    
    // In a real application, this is where you would update the student's document in Firestore.
    // For this example, we just return the result.
    console.log(`Inscribiendo al estudiante ${input.studentId} en el ciclo ${currentCycle}.`);
    console.log('Materias obligatorias:', mandatorySubjects.map(m => m.nombre));

    let message = `El estudiante ha sido inscrito en ${mandatorySubjects.length} materias obligatorias del ciclo ${currentCycle}.`;
    if (hasElectives) {
        message += ' Se requiere selección manual de materias electivas.';
    }

    return {
      studentId: input.studentId,
      calculatedCycle: currentCycle,
      enrolledSubjects: mandatorySubjects,
      requiresElectiveSelection: hasElectives,
      message: message,
    };
}
