# Contribuir

Gracias por tu interés en mejorar este proyecto.  
Las siguientes pautas te ayudarán a comenzar y asegurar un proceso de revisión fluido.

## Código de Conducta

Este proyecto sigue un [Código de Conducta](CODE_OF_CONDUCT.es.md).  
Al participar se espera que respetes estas normas.  
Por favor, reportá cualquier comportamiento inaceptable a los mantenedores.

## Primeros pasos

- Hacé un fork del repositorio y cloná tu fork de manera local.  
- Asegurate de tener instalada la versión de Node.js v20. La versión exacta está definida en `.nvmrc`. Se recomienda usar [nvm](https://github.com/nvm-sh/nvm).  
- Instalá las dependencias con `npm install`.  

## Flujo de desarrollo

- Creá una nueva rama desde `main` con un nombre descriptivo (`feat/agregar-parser`, `fix/manejar-null`, etc.).  
- Agregá tests y documentación para cualquier cambio que hagas.  
- Formateá tu código con `npm run format`.  
- Ejecutá los chequeos antes de hacer commit: `npm run lint` y `npm test`.  

## Guía de commits

- Usá [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) para los mensajes de commit (`feat:`, `fix:`, `docs:`, etc.).  
- Hacé commits pequeños y autocontenidos que sean fáciles de revisar.  

## Pull Requests

- Subí tu rama y abrí un pull request contra `main`.  
- Describí claramente la motivación y el enfoque. Incluí un archivo de ejemplo `.erdplus` cuando sea relevante.  
- Asegurate de que todos los chequeos automáticos en CI pasen correctamente.  
- Vinculá cualquier issue o discusión relacionada.  

## Reporte de issues

- Revisá los issues existentes antes de abrir uno nuevo para evitar duplicados.  
- Proporcioná una descripción clara, pasos para reproducir el problema y cualquier log o captura de pantalla relevante.  

## Licencia

Al contribuir, aceptás que tus aportes se licencien bajo la [Licencia MIT](LICENSE).  

## Agradecimiento

Tus contribuciones hacen que el proyecto mejore para todos.  
¡Apreciamos mucho tu tiempo y esfuerzo!  
