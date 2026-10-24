# Cuestionario Licencia Clase 7 · Alberta

App web para practicar las **108 preguntas** del examen teórico de la licencia Clase 7 de Alberta (en español). Funciona en el celular y en el PC, sin instalar nada ni crear cuenta.

## Qué hace

- **Tandas de 10 preguntas.** Primero salen las que todavía no has visto, hasta completar las 108.
- **Imagen en cada pregunta.** Las señales son recortes del PDF original. Las preguntas que no tienen imagen en el PDF llevan una ilustración que da contexto sin revelar la respuesta.
- **Explicación de cada respuesta.** Si fallas, ves por qué y la pregunta vuelve a salir dentro de la misma tanda.
- **Repetición espaciada.** Cada acierto alarga el tiempo hasta el próximo repaso; cada fallo lo acorta.
- **Simulacro de examen.** 30 preguntas al azar, sin ayuda; se aprueba con 25.
- **Mapa de progreso.** Las 108 preguntas en colores; tocando una ves su ficha de estudio.
- **Tema claro y oscuro**, y se puede usar sin conexión una vez instalada.

El progreso se guarda en el navegador de cada persona. No hay servidor ni datos compartidos.

## Instalarla en el celular

- **iPhone (Safari):** abrir el enlace → botón Compartir → *Añadir a pantalla de inicio*.
- **Android (Chrome):** abrir el enlace → menú ⋮ → *Añadir a pantalla de inicio* o *Instalar app*.

## Respuestas que difieren del PDF

En 5 preguntas (50, 53, 72, 79 y 95) la respuesta marcada en el PDF no coincide con el manual oficial de Alberta. La app usa la respuesta del manual y muestra un aviso explicándolo. En la 28 se mantiene la opción del PDF ($1000), con una nota de que la ley actual usa $2,000.

## Estructura

```
index.html            página y estructura
css/styles.css        diseño, temas claro/oscuro y animaciones
js/questions.js       las 108 preguntas, respuestas y explicaciones
js/scenes.js          ilustraciones SVG de las preguntas sin imagen
js/app.js             algoritmo de repaso, simulacro y mapa
img/                  señales recortadas del PDF (qNNN.jpg = pregunta NNN)
icons/, manifest.webmanifest, sw.js   instalación como app y uso sin conexión
```

## Publicación

Se publica con **GitHub Pages**: *Settings → Pages → Branch: `main` / `(root)`*. Cada cambio que se sube a `main` se publica solo en uno o dos minutos.
