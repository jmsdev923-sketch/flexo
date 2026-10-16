# flex_analytics (v1.5 PRO - Enterprise Visual Customization & RBAC)

> Motor y componente web de tablas dinámicas y analítica multidimensional inspirado en **Flexmonster**, construido sobre **Node.js** y **React**.
> **Ubicación del Proyecto:** `C:\DEV_JMS\flex_analytics`

---

## 🎨 Catálogo de Estilos Visuales con Permisos Basados en Roles (RBAC)

La plataforma ahora permite elegir entre **múltiples estilos visuales de tabla y gráficos**, mostrando a cada usuario **únicamente las opciones para las cuales tiene autorización**.

### 1. 🏢 Estilos de Tabla Dinámica:
* **`🏢 Cuadrícula Clásica Corporativa` (classic_grid):** Bordes completos, encabezados sobrios, estilo nativo Flexmonster.
* **`🦓 Filas Cebradas - Financiera` (striped_zebra):** Filas alternadas en blanco y gris suave para alta legibilidad en balances y estados de resultados.
* **`✨ Minimalista Moderna` (clean_minimal):** Sin bordes verticales, solo finas líneas horizontales y espaciado amplio.
* **`🔥 Mapa de Calor - Heatmap` (heatmap_intensity) [Avanzado]:** Celdas coloreadas con gradiente azul proporcional al valor numérico (intensidad de calor).
* **`🌙 Modo Oscuro Ejecutivo` (dark_contrast) [Avanzado]:** Paleta oscura en slate (#0f172a) con alto contraste e iluminación cian en subtotales.

### 2. 📊 Estilos de Gráficos Analíticos:
* **`📊 Columnas / Barras Verticales` (bar_vertical):** Comparación clásica entre categorías.
* **`📊 Barras Horizontales` (bar_horizontal):** Ideal para rankings y etiquetas largas.
* **`📈 Líneas & Tendencia` (line_curve):** Curvas de evolución con marcadores circulares.
* **`🌊 Área Sombreada` (area_stacked) [Avanzado]:** Gráfico de área con degradado translúcido.
* **`🍩 Circular / Donut` (donut_pie):** Distribución y participación porcentual (%) en tarjetas.
* **`🕸️ Radar / Spider Plot` (radar_polar) [Avanzado]:** Gráfico polar multidimensional en forma de telaraña.

---

## 🔐 Control de Permisos Visuales por Usuario

En el **`⚙️ Panel Admin`** > **`👥 Usuarios y Permisos Visuales`**, el Administrador puede:
* Activar o desactivar qué tipos de gráficos puede ver un usuario.
* Activar o desactivar qué estilos de tabla tiene permitidos (ej. reservar el *Modo Oscuro* o *Heatmap* para roles ejecutivos).
* Si un usuario no tiene permiso sobre un estilo, **este no aparecerá en su menú desplegable**.

---

## 🖥️ Lienzo Dashboard 360° con Drag & Drop

* **Mueve las tarjetas por la pantalla:** Arrastra cualquier widget desde el tirador `⠿` y reordénalos a tu gusto.
* **Tamaño Flexible:** Botones `⤡ Mitad` / `⤢ Completo` para alternar entre ancho total o tarjetas en paralelo.

---

## 🛠️ Instalación y Ejecución

```powershell
cd C:\DEV_JMS\flex_analytics

# 1. Instalar dependencias
npm run install:all

# 2. Iniciar servidor y cliente simultáneamente
npm run dev
```

* **Frontend:** Abre tu navegador en **`http://localhost:3000`**
* **Backend API:** Activo en **`http://localhost:4000`**
