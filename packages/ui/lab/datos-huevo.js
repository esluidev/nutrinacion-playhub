/* PlayHub · player · El huevo como datos.
   Una escena es una plantilla (plantillas.js) más su contenido. Nada de esto dibuja ni decide la interfaz.
   El juego no le habla al educador: las preguntas para el grupo viven en la guía de cada escena.
   El contenido sale de storyboards/alimentacion/el-huevo/01-guia-educador.md (v1.2): afirmaciones A0, A1 y A5,
   preguntas y guía. Un valor puede ser un texto o un objeto por edición { infantil, preadolescencia, adolescencia };
   si falta una edición se usa infantil.
   Pendiente: las consignas son texto de prueba del prototipo y solo existe la guía de Infantil. */
'use strict';
window.PLAYHUB_STORYBOARD = {
  id: 'el-huevo',
  titulo: 'El huevo',
  area: 'alimentacion',
  areaLabel: 'Alimentación',
  totalEscenas: 9,
  escenas: [
    {
      id: 'bienvenida', numero: 1, nombre: 'Bienvenida', verbo: 'Situar', plantilla: 'anuncio',
      tema: 'el huevo', imagen: './assets/huevo.svg',
      guia: {
        subtitle: 'Hoy conoceremos el huevo',
        description: 'Los niños saben que el tema de hoy es el huevo y comparten lo que ya conocen. Todavía no se explica de dónde viene, qué hay dentro ni para qué sirve.',
        objective: 'Haz que el grupo espere el recorrido y que puedas escuchar sus palabras iniciales sobre el huevo.',
        pedagogy: 'Di: “Hoy vamos a conocer el huevo”. Pregunta quién ha visto uno y acepta palabras sencillas como “blanco”, “café” o “para desayunar”. No completes ni corrijas todavía. Diles que irán siguiendo al huevo desde antes de llegar a la casa hasta descubrir qué puede aportar. Cierra con: “Primero vamos a ver de dónde viene”.',
        questions: 'Puedes preguntar: “¿Quién ha visto un huevo?”, “¿Dónde lo han visto?”, “¿Qué palabra se les ocurre cuando oyen ‘huevo’?”. Pide que levanten la mano si han visto uno y que digan una palabra corta en coro: “huevo”.',
        psychology: 'Aquí manda la expectativa. Algunos van a querer contar todo lo que saben o decir cómo lo comen; recíbelo con “eso lo vamos a mirar paso a paso” para que tengan ganas de seguir.',
        notDoing: 'No enseña el origen ni identifica aves. Origen sitúa de dónde llegan los huevos; Descubrimiento permite conocer las aves y comparar sus huevos.',
        tips: 'Si alguien usa una palabra local para una comida con huevo, repítela con respeto y vuelve al tema. Si el grupo responde poco, da dos opciones cotidianas, “¿en la casa o en una tienda?”, sin convertirlo en una prueba.',
      },
    },
    {
      // A0: los huevos de este taller proceden de aves que se crían para producir huevos. Un recorrido posible,
      // nunca el único: granja, tienda y casa. Pendiente: arte de la granja (hoy, un nido con un huevo, sin especie).
      id: 'origen', numero: 2, nombre: 'Origen', verbo: 'Reconocer', plantilla: 'colocar',
      consigna: {
        infantil: 'Arma un recorrido posible del huevo',
        preadolescencia: 'Ordena un recorrido posible del huevo hasta la casa',
        adolescencia: 'Ordena un recorrido posible del huevo antes de llegar a casa',
      },
      fichas: [
        { id: 'granja', etiqueta: 'Granja', imagen: 'huevo-gallina.svg', alto: 68, nido: true, tono: 'grape' },
        { id: 'tienda', etiqueta: 'Tienda', imagen: 'tienda.svg', tono: 'rose' },
        { id: 'casa', etiqueta: 'Casa', imagen: 'casa.svg', tono: 'sky' },
      ],
      orden: ['granja', 'tienda', 'casa'],
      pista: '¿Dónde estaban antes de llegar a la tienda?',
      reintento: 'Ese orden no es. Prueba otra vez',
      completo: {
        titulo: 'Un recorrido posible',
        texto: 'Los huevos que conoceremos los ponen aves. En este ejemplo, antes de la tienda estaban en una granja.',
      },
      guia: {
        subtitle: 'Antes de llegar a casa',
        description: 'Los niños reconocen que los huevos tienen un origen anterior a la tienda o la casa. Conocen un recorrido posible: una granja donde se cuidan aves que ponen huevos, una tienda y una casa. La atención está en los lugares del recorrido.',
        objective: 'Ayuda al grupo a reconocer, en este ejemplo, la granja como el lugar de origen y la tienda como un lugar al que pueden llegar los huevos antes de la casa.',
        pedagogy: 'Empieza con lo cercano: retoma la tienda o la casa que mencionaron en Bienvenida y pregunta dónde estaban los huevos antes de llegar allí. Explica: “Los huevos que conoceremos los ponen aves. Vamos a seguir un recorrido posible: una granja donde se cuidan esas aves, una tienda y una casa”. Aclara granja como un lugar donde se cuidan animales. No presentes este camino como el de todos los huevos: también pueden llegar directamente desde donde se recogen. Invita a reconocer qué pasa en cada lugar: en la granja del ejemplo se recogen, en la tienda se venden y a la casa llegan para preparar comida. Cierra con una pregunta abierta hacia la escena siguiente: “Ya sabemos de dónde pueden llegar. ¿Se parecerán todos los huevos?”.',
        questions: 'Puedes preguntar: “¿Dónde han visto huevos?”, “¿Dónde estaban antes de llegar a la tienda?”, “En este recorrido, ¿dónde se recogen?”, “¿Qué lugar reconocen: la granja, la tienda o la casa?”. Invita a que nombren un lugar conocido y a completar juntos: “En este ejemplo, antes de la tienda estaban en…”.',
        psychology: 'Aquí importa conectar un lugar conocido con lo que ocurre antes. Haber visto huevos en una tienda ya permite participar; conocer una granja no es un requisito. La curiosidad queda abierta sobre cómo serán los huevos que van a descubrir.',
        notDoing: 'No presenta una especie como el origen de todos los huevos ni enumera aves. Identificar gallina, codorniz y pato y comparar sus huevos corresponde a Descubrimiento. Tampoco pide memorizar una cadena de producción.',
        tips: 'Si alguien menciona la gallina, acoge su aporte como un ejemplo: “Sí, es una de las aves que pone huevos; pronto conoceremos más”. Si conoce huevos que llegan de un patio o directamente de una granja, reconoce ese otro recorrido. Vuelve a la idea central: los huevos ya estaban en algún lugar antes de la tienda o la casa.',
      },
    },
    {
      // A1: los huevos que comemos pueden ser de gallina, codorniz o pato. Se ve el huevo; se descubre el ave.
      id: 'descubrimiento', numero: 3, nombre: 'Descubrimiento', verbo: 'Descubrir', plantilla: 'destapar',
      consigna: {
        infantil: 'Toca un huevo y descubre su ave',
        preadolescencia: 'Toca cada huevo y descubre qué ave lo puso',
        adolescencia: 'Observa los huevos y descubre qué ave puso cada uno',
      },
      // alto: altura relativa del huevo; la plantilla los dibuja todos a una misma escala.
      elementos: [
        { id: 'gallina', tono: 'grape', feedback: 'Este huevo es de gallina',
          seVe: { imagen: 'huevo-gallina.svg', alto: 68, descripcion: 'Un huevo' }, seDescubre: { ave: 'gallina', etiqueta: 'Gallina' } },
        { id: 'codorniz', tono: 'sky', feedback: 'Este huevo es de codorniz',
          seVe: { imagen: 'huevo-codorniz.svg', alto: 49, descripcion: 'Un huevo pequeño' }, seDescubre: { ave: 'codorniz', etiqueta: 'Codorniz' } },
        { id: 'pato', tono: 'coral', feedback: 'Este huevo es de pato',
          seVe: { imagen: 'huevo-pato.svg', alto: 80, descripcion: 'Un huevo grande' }, seDescubre: { ave: 'pata', etiqueta: 'Pato' } },
      ],
      sintesis: 'Se comen huevos de gallina, codorniz y pato.',
      guia: {
        subtitle: 'Huevos de aves que se parecen y se diferencian',
        description: 'Los niños descubren que no todos los huevos son iguales. Comparan huevos de gallina, codorniz y pato por rasgos sencillos, como el tamaño o el color.',
        objective: 'Haz que el grupo pueda nombrar al menos dos aves cuyos huevos se comen y notar una diferencia visible entre ellos.',
        pedagogy: 'Retoma la curiosidad que dejó Origen: “¿Se parecerán todos los huevos?”. Escucha qué esperan encontrar. A medida que conocen cada ejemplo, invita a observarlo y relaciona su huevo con gallina, codorniz o pato, sin anunciar toda la lista al inicio. Deja que expresen las diferencias con palabras simples: “más pequeño”, “más grande”, “con manchitas” o “sin manchitas”. Explica que son huevos de aves diferentes; no digas que uno es mejor que otro ni que el color identifica siempre a un ave. Cierra recuperando dos de las aves y una diferencia que el grupo haya observado.',
        questions: 'Puedes preguntar: “¿Se parecerán todos los huevos?”, “¿Cuál han visto?”, “¿Cuál parece más pequeño?”, “¿Cuál tiene manchitas?”, “¿De qué ave será este?”. Invita a que digan los nombres de las aves conforme las conocen y a que usen una palabra de comparación.',
        psychology: 'Aquí manda la curiosidad por las semejanzas y diferencias. Cada niño puede reconocer algo familiar o encontrar algo nuevo. El descubrimiento amplía lo que sabe el grupo sin necesitar que antes haya creído que todos los huevos eran de una sola ave.',
        notDoing: 'No abre el huevo ni nombra sus partes. Eso corresponde a Propiedades.',
        tips: 'Evita dar una lista larga de aves: tres bastan para esta edad. Si alguien dice que un huevo de color distinto “es raro”, responde que los huevos pueden verse diferentes sin convertir el color en una regla sobre lo que trae dentro.',
      },
    },
    {
      // A5: conservar los huevos refrigerados y cocinarlos hasta que clara y yema estén firmes.
      id: 'preparacion', numero: 6, nombre: 'Preparación', verbo: 'Secuenciar', plantilla: 'colocar',
      consigna: {
        infantil: 'Pon los cuidados en orden',
        preadolescencia: 'Ordena los cuidados para comer huevo seguro',
        adolescencia: 'Ordena los dos cuidados que hacen seguro el huevo',
      },
      // Pendiente: arte definitivo de las dos piezas; hoy son el huevo con un símbolo del kit.
      fichas: [
        { id: 'frio', etiqueta: 'Frío', imagen: 'huevo-gallina.svg', icono: 'snowflake', tono: 'sky' },
        { id: 'cocido', etiqueta: 'Bien cocido', imagen: 'huevo-gallina.svg', icono: 'flame-solid', tono: 'grape' },
      ],
      orden: ['frio', 'cocido'],
      pista: 'Primero se conserva frío; después se cocina',
      reintento: 'Ese orden no es. Prueba otra vez',
      completo: {
        titulo: 'Frío y bien cocido',
        texto: 'Primero se conserva frío. Después se cocina hasta que la clara y la yema estén firmes.',
      },
      guia: {
        subtitle: 'Pasos seguros antes de comer huevo',
        description: 'Los niños ordenan una idea de seguridad: el huevo se conserva frío y se cocina hasta que clara y yema estén firmes. Conocen que el huevo crudo no es la opción segura para comer.',
        objective: 'Haz que puedan decir dos cuidados: conservar el huevo refrigerado y comerlo cocido, con clara y yema firmes.',
        pedagogy: 'Di que esta escena trata de dejar el huevo listo para comer, sin preparar nada en el taller. Presenta dos pasos: primero, mantenerlo refrigerado; después, cocinarlo hasta que la clara y la yema estén firmes. Usa “frío y bien cocido” como frase corta. Pregunta qué pasaría si falta uno de los pasos y escucha respuestas sencillas. No describas recetas ni métodos de cocina. Cierra pidiendo que ordenen verbalmente “frío” y “bien cocido”.',
        questions: 'Puedes preguntar: “¿Qué va primero: dejarlo frío o comerlo?”, “¿Cómo deben quedar la clara y la yema?”, “¿Está listo si queda líquido?”, “¿Qué dos palabras nos ayudan a recordarlo?”. Pide que digan “frío y bien cocido” en coro y que repitan la secuencia con sus palabras.',
        psychology: 'Aquí importa el criterio: “yo sé el orden”. Si alguien responde con una receta, agradece la idea y vuelve a los dos cuidados que hacen seguro el huevo.',
        science: 'Refrigerar: conservar frío en el refrigerador. Cocción completa: calentar el huevo hasta que tanto la clara como la yema queden firmes; “firme” significa que ya no están líquidas. Son dos cuidados distintos y se necesitan ambos en la secuencia que enseñamos.',
        notDoing: 'No propone cocinar ni comer huevo en el taller; tampoco explica para qué sirve la proteína. Eso corresponde a Beneficio.',
        tips: 'No pidas que cuenten cómo se cocina en su casa ni corrijas prácticas familiares delante del grupo. Si mencionan huevo crudo, responde con calma: “Para comerlo seguro, recordamos frío y bien cocido”.',
      },
    },
  ],
};
