# Lógica de Asignación Automática de Horarios "Poli 2.0"

Este documento detalla la lógica de negocio y el enfoque algorítmico propuesto para la funcionalidad de generación automática de horarios. El problema de la asignación de horarios es un clásico **Problema de Satisfacción de Restricciones (Constraint Satisfaction Problem - CSP)**, donde el objetivo es encontrar una asignación que cumpla con un conjunto de reglas predefinidas.

---

## 1. Visión General del Flujo

El proceso es iniciado por un administrador y se ejecuta en el servidor. El flujo general es el siguiente:

1.  **Selección de Parámetros:** El administrador elige una `Sede`, una `Carrera` y un `Ciclo` específico para los cuales desea generar los horarios.
2.  **Recolección de Datos (Inputs):** El sistema recopila toda la información necesaria de Firestore basada en la selección del administrador.
3.  **Preparación de Estructuras:** Se inicializan estructuras de datos para llevar un control en tiempo real de la disponibilidad de los recursos (docentes y salones).
4.  **Ejecución del Algoritmo de Asignación:** Un algoritmo de backtracking con heurísticas intenta asignar cada clase, validando todas las restricciones en cada paso.
5.  **Finalización y Resultado:** Si se encuentra una solución válida para todas las clases, el sistema devuelve el horario completo. Si no es posible, informa sobre los conflictos no resueltos.

---

## 2. Algoritmo Recomendado: Backtracking con Heurísticas

Para este problema, un **algoritmo de backtracking (vuelta atrás)** es una solución robusta y completa. Aunque puede ser computacionalmente intensivo, garantiza que se explorarán todas las posibilidades hasta encontrar una solución válida.

**Concepto Básico del Backtracking:**
1.  Elige una clase sin asignar.
2.  Itera sobre todos los posibles "espacios" para esa clase (un espacio es una combinación de `día`, `hora`, `docente` y `salón`).
3.  Para cada espacio, verifica si la asignación es válida (cumple todas las restricciones).
4.  **Si es válida:**
    *   Asigna la clase a ese espacio.
    *   Llama recursivamente a la función para la siguiente clase sin asignar.
    *   Si la llamada recursiva tiene éxito, ¡perfecto! Propaga el éxito hacia arriba.
5.  **Si no es válida (o si la llamada recursiva falla):**
    *   "Retrocede" (backtrack): deshace la asignación actual y prueba el siguiente espacio disponible.
6.  Si se han probado todos los espacios para la clase actual y ninguno conduce a una solución, la función falla, lo que provoca un backtrack en el nivel superior.

**Heurísticas para Optimizar el Rendimiento:**
Para que el algoritmo sea más eficiente, lo combinamos con heurísticas que guían la toma de decisiones:

*   **Variable Ordering (Orden de Clases):** Asignar primero las clases más "difíciles".
    *   **Materias con más horas:** Las materias que requieren más horas semanales son más difíciles de ubicar.
    *   **Materias con requisitos especiales:** Aquellas que necesitan un "Laboratorio de Sistemas" en lugar de un "Aula Estándar".
*   **Value Ordering (Orden de Espacios):** Probar primero los espacios que tienen menos probabilidad de causar conflictos futuros.
    *   **Franjas horarias menos demandadas:** Intentar llenar primero las horas menos populares (ej. primera hora de la mañana) para dejar libres los bloques de alta demanda.
    *   **Docentes con menos disponibilidad:** Asignar primero a los docentes con horarios más restringidos.

---

## 3. Lógica Detallada Paso a Paso

### **Paso 1: Recolección de Datos (Inputs del Algoritmo)**

Cuando el administrador inicia el proceso para una `Sede`, `Carrera` y `Ciclo` dados, el backend debe obtener:

1.  **Grupos a Planificar:**
    *   Consulta a la colección `grupos` donde `idSede`, `idCarrera` y `ciclo` coincidan.
    *   Filtra aquellos cuyo `horario` está vacío o incompleto.
2.  **Materias del Ciclo:**
    *   Del documento de la `carrera` seleccionada, obtiene la lista de materias para el `ciclo` correspondiente, incluyendo `id`, `nombre` y `horasSemanales`.
3.  **Docentes Disponibles:**
    *   Consulta a la colección `usuarios` donde `rol.id == 'docente'`.
    *   Para cada docente, carga su `materiasAptas`, `disponibilidad`, `horasMaximas` y `modalidadPreferida`.
4.  **Salones Disponibles:**
    *   De la subcolección `salones` dentro de la `sede` seleccionada, obtiene todos los salones con su `capacidad` y `tipo`.

### **Paso 2: Preparación de Estructuras de Disponibilidad**

Para evitar consultas repetitivas a la base de datos, creamos mapas de ocupación en memoria:

*   `ocupacionDocentes`: Un mapa donde la clave es `docenteId` y el valor es un objeto que mapea días y horas (ej. `{ "Lunes": [18, 19, 20, 21] }`).
*   `ocupacionSalones`: Similar al anterior, pero con `salonId` como clave.
*   `cargaHorariaDocentes`: Un mapa para rastrear las horas ya asignadas a cada docente y no exceder `horasMaximas`.

### **Paso 3: Función Principal de Asignación (Pseudocódigo)**

```
function generarHorarios(grupos, materias, docentes, salones):
    // Divide las materias en bloques de clase (ej. 4 horas -> 2 bloques de 2h)
    clases_a_asignar = preprocesarClases(grupos, materias)

    // Llama a la función recursiva de backtracking
    solucion_encontrada = resolver(clases_a_asignar)

    if solucion_encontrada:
        // Construye el objeto final de horario y guárdalo en Firestore
        actualizarGruposEnFirestore(grupos)
        return "Horario generado con éxito"
    else:
        return "No se pudo generar un horario sin conflictos"

end function
```

### **Paso 4: Función Recursiva `resolver` y Validaciones (El Corazón del Algoritmo)**

```
function resolver(clases_restantes):
    if not clases_restantes:
        return true // ¡Éxito! Todas las clases fueron asignadas.

    // Heurística: Elige la siguiente clase más difícil de asignar
    clase_actual = seleccionarSiguienteClase(clases_restantes)

    // Itera sobre todos los posibles recursos para esta clase
    for docente in docentes_aptos_para(clase_actual.materia):
        for bloque_horario in disponibilidad_del(docente):
            for salon in salones_adecuados_para(clase_actual.grupo):

                // --- VALIDACIÓN DE RESTRICCIONES ---
                if esAsignacionValida(clase_actual, docente, bloque_horario, salon):
                    
                    // 1. Asigna (marca como ocupado)
                    asignarRecursos(clase_actual, docente, bloque_horario, salon)

                    // 2. Llamada Recursiva
                    if resolver(clases_restantes_sin(clase_actual)):
                        return true // ¡Se encontró una solución!

                    // 3. Backtrack (deshace la asignación)
                    liberarRecursos(clase_actual, docente, bloque_horario, salon)

    // Si el bucle termina, no se encontró un espacio válido para esta clase
    return false

end function
```

La función `esAsignacionValida` es donde se concentran todas las reglas de negocio:
1.  **Conflicto de Grupo:** ¿El `grupo` de la `clase_actual` ya tiene otra clase en ese `bloque_horario`?
2.  **Conflicto de Docente:** ¿El `docente` ya está en `ocupacionDocentes` para ese `bloque_horario`?
3.  **Conflicto de Salón:** ¿El `salon` ya está en `ocupacionSalones` para ese `bloque_horario`? (Solo si la modalidad es presencial).
4.  **Capacidad del Salón:** ¿`salon.capacidad` >= `grupo.capacidad`?
5.  **Carga Máxima del Docente:** ¿`cargaHorariaDocentes[docente.id]` + `clase_actual.duracion` <= `docente.horasMaximas`?

Este enfoque estructurado asegura que cada horario generado sea matemáticamente válido y respete todas las reglas de negocio, sentando las bases para un sistema de gestión académica robusto y automatizado.
```