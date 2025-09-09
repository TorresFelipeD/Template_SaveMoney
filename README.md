# Aplicación Template SaveMoney

Versión: 1.0.0

## Descripción
Template SaveMoney es una aplicación web diseñada para ayudar a los usuarios a crear y gestionar plantillas de ahorro. Proporciona una interfaz intuitiva para el seguimiento de objetivos financieros y la generación de planes de ahorro en Pesos Colombianos (COP).

## Stack Tecnológico

### Frontend
- HTML5 puro
- CSS3 para estilos
- JavaScript Vanilla (ES6+)

### Librerías Externas
- html2canvas (v1.4.1) - Para capturar contenido HTML como imágenes
- jspdf (v2.5.1) - Para generar documentos PDF

### Almacenamiento
- LocalStorage para persistencia de datos
- JSON para estructura de datos

## Características
- Crear y gestionar plantillas de ahorro
- Generar exportaciones PDF de planes de ahorro
- Diseño responsivo para móvil y escritorio
- Formato de moneda en Pesos Colombianos (COP)
- Gestión de fechas con soporte de zona horaria
- Funcionalidad de Importación/Exportación usando archivos JSON

## Estructura del Proyecto
```
Template_SaveMoney/
├── css/
│   └── styles.css
├── js/
│   ├── config.js      - Configuración de la aplicación
│   ├── logic.js       - Lógica de negocio principal
│   ├── pdf.js         - Funcionalidad de generación de PDF
│   ├── storage.js     - Gestión de LocalStorage
│   ├── ui-editor.js   - Manejadores de UI del editor de plantillas
│   └── ui-home.js     - Manejadores de UI de la página principal
├── config.json        - Configuración global
├── index.html         - Entrada principal de la aplicación
└── manual.html        - Manual de usuario y documentación
```

## Compatibilidad con Navegadores
- Chrome (recomendado)
- Firefox
- Edge
- Safari

## Idioma
- Idioma de la interfaz: Español (Colombia) / es-CO

## Almacenamiento de Datos
La aplicación utiliza el LocalStorage del navegador para la persistencia de datos, con la clave "savingsTemplates" para almacenar todas las plantillas.

## Funcionalidades
1. Creación de Plantillas
   - Crear nuevas plantillas de ahorro
   - Establecer metas financieras
   - Definir períodos de tiempo

2. Gestión de Plantillas
   - Ver todas las plantillas creadas
   - Editar plantillas existentes
   - Eliminar plantillas
   - Exportar plantillas a JSON
   - Importar plantillas desde archivos JSON

3. Generación de PDF
   - Generar informes PDF de planes de ahorro
   - Representación visual de metas de ahorro

## Notas
- La aplicación utiliza una estructura modular de JavaScript
- Todos los valores monetarios se manejan en COP (Pesos Colombianos)
- Las fechas se almacenan en formato ISO con compensación de zona horaria
- Se utilizan UUIDs para la identificación única de plantillas


## Licencia
Este proyecto está bajo la licencia MIT. Para más detalles, consulta el archivo [LICENSE](LICENSE) en la raíz de este repositorio.
