# Arquitectura del Modelo de Datos - Gestión de Horarios "Poli 2.0"

Este documento describe la estructura de datos propuesta para el sistema de gestión de horarios, utilizando un enfoque NoSQL optimizado para flexibilidad y escalabilidad, similar a Firebase Firestore.

---

## 1. Visión General del Modelo

El modelo se centra en la colección `grupos` como la entidad principal que consolida la información de los horarios. En lugar de tener una colección de `horarios` separada, el horario de cada grupo se anida directamente dentro del documento del grupo. Este diseño (denormalización) es altamente eficiente para leer el horario completo de un estudiante o un grupo, ya que requiere una sola lectura de documento.

Las entidades principales son:
- **`carreras`**: Define los programas académicos y su plan de estudios (pensum).
- **`usuarios`**: Almacena a todos los usuarios, incluyendo a los docentes con sus atributos específicos.
- **`sedes`**: Representa las ubicaciones físicas y contiene las aulas.
- **`grupos`**: Es la instancia de un curso para un conjunto de estudiantes, y contiene su horario específico.

---

## 2. Estructura de las Colecciones

### 2.1. Colección `carreras`

Almacena la información de todos los programas académicos.

- **Ruta:** `/carreras/{carreraId}`
- **Descripción:** Contiene los detalles de cada carrera, incluyendo su plan de estudios completo, organizado por ciclos.

**Campos del Documento:**
```json
{
  "nombre": "Tecnología en Desarrollo de Software",
  "descripcion": "Forma profesionales capaces de diseñar, desarrollar y mantener soluciones de software...",
  "duracionCiclos": 9,
  "modalidad": "Virtual / Presencial",
  "tituloOtorgado": "Tecnólogo en Desarrollo de Software",
  "ciclos": [
    {
      "numero": 1,
      "nombre": "Ciclo de Fundamentación",
      "materias": [
        {
          "id": "M-101",
          "nombre": "Lógica de Programación",
          "codigo": "LP-01",
          "horasSemanales": 4,
          "creditos": 3,
          "modalidadRequerida": ["Presencial", "Virtual"]
        },
        {
          "id": "M-102",
          "nombre": "Matemática Básica",
          "codigo": "MAT-01",
          "horasSemanales": 3,
          "creditos": 2,
          "modalidadRequerida": ["Presencial"]
        }
      ]
    }
    // ... más ciclos
  ]
}
```

### 2.2. Colección `usuarios`

Contiene a todos los usuarios del sistema. Los docentes tienen campos adicionales para la gestión de horarios.

- **Ruta:** `/usuarios/{usuarioId}`
- **Descripción:** Un docente es un usuario con `rol.id == 'docente'`.

**Campos del Documento (Ejemplo para un Docente):**
```json
{
  "nombreCompleto": "Carlos Rivas",
  "correoInstitucional": "carlos.rivas@pi.edu.co",
  "rol": {
    "id": "docente",
    "descripcion": "Docente"
  },
  "materiasAptas": ["M-101", "M-203", "M-401"],
  "disponibilidad": {
    "Lunes": "18:00-22:00",
    "Martes": "08:00-12:00",
    "Jueves": "08:00-12:00"
  },
  "horasMaximas": 20,
  "modalidadPreferida": ["Presencial", "Virtual"]
}
```

### 2.3. Colección `sedes`

Representa las ubicaciones físicas de la institución.

- **Ruta:** `/sedes/{sedeId}`
- **Descripción:** Cada sede principal es un documento. Las aulas de esa sede son una subcolección.

**Campos del Documento:**
```json
{
  "nombre": "Sede Norte",
  "direccion": "Avenida Siempre Viva 123"
}
```

#### Subcolección `salones`

- **Ruta:** `/sedes/{sedeId}/salones/{salonId}`
- **Descripción:** Aulas o laboratorios específicos dentro de una sede.

**Campos del Documento:**
```json
{
  "nombre": "Salón 201",
  "capacidad": 30,
  "tipo": "Aula Estándar", // "Laboratorio de Sistemas", "Auditorio"
  "recursos": ["Proyector", "Pizarra Digital"]
}
```

### 2.4. Colección `grupos`

Esta es la entidad central para la gestión de horarios.

- **Ruta:** `/grupos/{grupoId}`
- **Descripción:** Representa un curso específico para un conjunto de estudiantes. El horario está anidado dentro de cada grupo para un acceso rápido y eficiente.

**Campos del Documento:**
```json
{
  "idCarrera": "desarrollo-software",
  "idSede": "sede-norte",
  "ciclo": 1,
  "codigoGrupo": "DS-C1-001", // Código único del grupo
  "capacidad": 30,
  "estudiantesInscritos": [
    "estudianteId-001",
    "estudianteId-002"
    // ... más IDs de estudiantes
  ],
  "horario": [
    {
      "id": "h-lun-1800-m101", // ID único para la entrada del horario
      "dia": "Lunes",
      "horaInicio": "18:00",
      "horaFin": "20:00",
      "duracionHoras": 2,
      "idMateria": "M-101",
      "nombreMateria": "Lógica de Programación", // Denormalizado para eficiencia
      "idDocente": "docenteId-carlos-rivas",
      "nombreDocente": "Carlos Rivas", // Denormalizado para eficiencia
      "modalidad": "Presencial",
      "idSalon": "norte-201",
      "nombreSalon": "Salón 201" // Denormalizado para eficiencia
    },
    {
      "id": "h-mie-1800-m102",
      "dia": "Miércoles",
      "horaInicio": "18:00",
      "horaFin": "21:00",
      "duracionHoras": 3,
      "idMateria": "M-102",
      "nombreMateria": "Matemática Básica",
      "idDocente": "docenteId-ana-perez",
      "nombreDocente": "Ana Pérez",
      "modalidad": "Virtual",
      "idSalon": null, // Nulo para clases virtuales
      "nombreSalon": null
    }
  ]
}
```

---

## 3. Relaciones y Flujo Lógico

1.  **Carrera a Materia:** Una `carrera` define el catálogo de `materias` disponibles en su pensum (`ciclos`).
2.  **Docente a Materia:** Un `usuario` con rol de docente tiene una lista de `materiasAptas` (IDs) que puede enseñar.
3.  **Grupo a Carrera y Sede:** Un `grupo` pertenece a una `carrera` y una `sede` a través de `idCarrera` y `idSede`.
4.  **Horario a Grupo:** El `horario` es una lista de objetos directamente dentro del documento de un `grupo`.
5.  **Entrada de Horario:** Cada objeto en la lista `horario` es la unidad atómica que conecta:
    *   Una `Materia` (a través de `idMateria`).
    *   Un `Docente` (a través de `idDocente`).
    *   Un `Salón` (a través de `idSalon`), si es presencial.
    *   Un día y un bloque de tiempo (`horaInicio`, `horaFin`).

Este modelo está optimizado para las consultas más comunes (ej. "dame el horario del grupo X") y proporciona la flexibilidad necesaria para implementar un algoritmo de asignación automática que pueda validar conflictos de docentes, salones y disponibilidad en tiempo real.