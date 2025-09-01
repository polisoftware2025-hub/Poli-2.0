
'use server';
/**
 * @fileOverview A Genkit flow to automatically enroll a student in subjects for their current academic cycle.
 *
 * - enrollStudentInCurrentCycleSubjects - A function that calculates the student's current cycle and enrolls them in the corresponding subjects.
 * - EnrollStudentInput - The input type for the enrollStudentInCurrentCycleSubjects function.
 * - EnrollStudentOutput - The return type for the enrollStudentInCurrentCycleSubjects function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { carreraData } from '@/lib/seed'; // Assuming seed data contains the academic structure

const EnrollStudentInputSchema = z.object({
  studentId: z.string().describe('The unique identifier for the student.'),
  enrollmentDate: z.string().datetime().describe('The initial date the student was enrolled, in ISO 8601 format.'),
});
export type EnrollStudentInput = z.infer<typeof EnrollStudentInputSchema>;

const EnrollStudentOutputSchema = z.object({
  studentId: z.string(),
  calculatedCycle: z.number().describe('The calculated academic cycle for the student.'),
  enrolledSubjects: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    creditos: z.number(),
  })).describe('List of mandatory subjects the student has been enrolled in.'),
  requiresElectiveSelection: z.boolean().describe('Whether the student needs to manually select elective subjects.'),
  message: z.string().describe('A summary message of the enrollment result.'),
});
export type EnrollStudentOutput = z.infer<typeof EnrollStudentOutputSchema>;

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

const enrollStudentFlow = ai.defineFlow(
  {
    name: 'enrollStudentFlow',
    inputSchema: EnrollStudentInputSchema,
    outputSchema: EnrollStudentOutputSchema,
  },
  async (input) => {
    const enrollmentDate = new Date(input.enrollmentDate);
    const currentDate = new Date();

    const currentCycle = calculateCurrentCycle(enrollmentDate, currentDate);

    const cycleInfo = carreraData.ciclos.find(c => c.numero === currentCycle);

    if (!cycleInfo) {
      throw new Error(`Academic cycle ${currentCycle} not found in the program structure.`);
    }

    const mandatorySubjects = cycleInfo.materias.filter(m => !m.nombre.toLowerCase().includes('electiva'));
    const hasElectives = cycleInfo.materias.some(m => m.nombre.toLowerCase().includes('electiva'));
    
    // Here would be the logic to update the student's document in Firestore with the new subjects.
    // For this example, we just return the result.
    console.log(`Enrolling student ${input.studentId} in cycle ${currentCycle}.`);
    console.log('Mandatory subjects:', mandatorySubjects.map(m => m.nombre));

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
);


export async function enrollStudentInCurrentCycleSubjects(input: EnrollStudentInput): Promise<EnrollStudentOutput> {
  return await enrollStudentFlow(input);
}
