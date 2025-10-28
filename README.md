# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Custom University Loaders

This project includes a set of custom, theme-aware, and accessible loaders inspired by a molecular/scientific aesthetic.

### Files

- **Component:** `src/components/ui/university-loader.tsx`
- **Styles:** `src/styles/university-loader.css`

### Components Overview

1.  **`UniversityLoaderFull`**
    - **Description:** A full-screen overlay loader, perfect for initial page loads or significant transitions. It includes a semi-transparent backdrop with a blur effect.
    - **Props:**
        - `isLoading` (boolean, required): Controls the visibility of the loader.
        - `text` (string, optional): Text to display below the animation (e.g., "Cargando...").
    - **Usage Example:**
      ```jsx
      import { UniversityLoaderFull } from '@/components/ui/university-loader';
      
      function App() {
        const [loading, setLoading] = useState(true);
        return <UniversityLoaderFull isLoading={loading} text="Iniciando aplicación..." />;
      }
      ```

2.  **`UniversityLoaderInline`**
    - **Description:** A compact version of the loader designed to be embedded within other components like buttons or cards.
    - **Props:** Inherits standard `div` attributes (`className`, etc.).
    - **Usage Example:**
      ```jsx
      import { UniversityLoaderInline } from '@/components/ui/university-loader';
      import { Button } from '@/components/ui/button';
      
      function MyButton() {
        return (
          <Button disabled>
            <UniversityLoaderInline className="mr-2" />
            Procesando
          </Button>
        );
      }
      ```

3.  **`UniversityLoaderLogo`**
    - **Description:** A loader that features the university's `GraduationCap` logo with a subtle pulsing animation. Ideal for branding-focused loading states.
    - **Props:**
        - `size` (number, optional): The overall size of the loader in pixels. Defaults to `64`.
        - `text` (string, optional): Text to display below the logo.
    - **Usage Example:**
      ```jsx
      import { UniversityLoaderLogo } from '@/components/ui/university-loader';

      function ProfileCard() {
        return <UniversityLoaderLogo size={80} text="Cargando perfil..." />;
      }
      ```

### Theming

The loaders automatically adapt to light and dark modes by using CSS variables defined in `university-loader.css`. The colors are defined for `:root` (light mode) and `.dark` selectors.

- **Light Mode Palette:** Soft blues and cyans.
- **Dark Mode Palette:** Deep blues, vibrant cyan, and violet for a futuristic feel.

### Accessibility

- **Reduced Motion:** The animations are automatically disabled if the user has `prefers-reduced-motion: reduce` enabled in their system settings. A simpler, more subtle pulse animation is used as a fallback.
- **ARIA Attributes:** `UniversityLoaderFull` uses `aria-busy="true"`, `role="alertdialog"`, and `aria-live="assertive"` to be accessible to screen readers.
