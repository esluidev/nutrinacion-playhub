export interface SceneGuide {
  goal: string
  script: string
  tips: string[]
}

export interface StoryboardScene {
  id: number
  title: string
  description: string
  objective: string
  type: 'narracion' | 'mini-juego' | 'actividad' | 'reflexion' | 'evaluacion'
  thumbnailBg: string
  guide: SceneGuide
}

export interface Storyboard {
  id: number
  title: string
  description: string
  category: string
  plan: 'Gratuito' | 'Premium' | 'Personalizado'
  targetAge: string
  duration: string
  coverBg: string
  objectives: string[]
  materials: string[]
  scenes: StoryboardScene[]
}

const COVER_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-400',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
]

const THUMB_COLORS = [
  'bg-emerald-100',
  'bg-sky-100',
  'bg-violet-100',
  'bg-amber-100',
  'bg-rose-100',
  'bg-teal-100',
]

const SCENE_TYPE_LABELS: Record<string, string> = {
  'narracion': 'Narracion',
  'mini-juego': 'Mini-juego HTML',
  'actividad': 'Actividad',
  'reflexion': 'Reflexion',
  'evaluacion': 'Evaluacion',
}

const SCENE_TYPE_COLORS: Record<string, string> = {
  'narracion': 'bg-sky-50 text-sky-600',
  'mini-juego': 'bg-violet-50 text-violet-600',
  'actividad': 'bg-amber-50 text-amber-600',
  'reflexion': 'bg-emerald-50 text-emerald-600',
  'evaluacion': 'bg-rose-50 text-rose-600',
}

const STORYBOARDS_DATA: Storyboard[] = [
  {
    id: 1,
    title: 'Los Frijoles Magicos',
    description: 'Descubre el poder de los frijoles y como nos ayudan a crecer fuertes como una planta magica. A traves de una historia interactiva, los ninos aprenden sobre las leguminosas, su valor nutricional y como se cultivan, desde la semilla hasta el plato.',
    category: 'Alimentacion',
    plan: 'Gratuito',
    targetAge: '4-8 anos',
    duration: '30 min',
    coverBg: COVER_COLORS[0],
    objectives: [
      'Conocer el origen y crecimiento de los frijoles',
      'Entender el valor nutricional de las leguminosas',
      'Identificar diferentes tipos de frijoles y sus colores',
      'Aprender a incluir leguminosas en la alimentacion diaria',
    ],
    materials: ['Frijoles secos de varios colores', 'Vasos transparentes', 'Tierra y semillas', 'Laminas ilustradas'],
    scenes: [
      { id: 1, title: 'Descubre los frijoles', description: 'Conoce a los pequenos heroes de nuestra historia: los frijoles magicos que esconden superpoderes nutritivos.', objective: 'Captar la atencion y generar curiosidad sobre las leguminosas.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Crear conexion emocional con el tema a traves de personajes animados de frijoles.', script: 'Muestre frijoles reales a los ninos. Pregunteles si saben que son y de que color los han visto. Reproduzca la escena mientras los ninos sostienen frijoles.', tips: ['Lleve frijoles de distintos colores: negros, rojos, blancos', 'Permita que los ninos los toquen y observen', 'Pregunte si los han comido y como los preparan en casa'] } },
      { id: 2, title: 'Crece como una planta', description: 'Ayuda a la semilla de frijol a convertirse en una gran planta. Una aventura interactiva del ciclo de vida vegetal.', objective: 'Comprender el ciclo de crecimiento de las leguminosas.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Ensenar el ciclo de vida de una planta de frijol de forma interactiva y participativa.', script: 'Pida a los ninos que se agachen como semillitas y poco a poco se estiren hacia arriba simulando el crecimiento. Luego interactuen con la escena.', tips: ['Haga pausas para que los ninos imiten cada etapa', 'Conecte con la actividad de siembra que haran despues', 'Explique que el sol y el agua ayudan a crecer, igual que a ellos'] } },
      { id: 3, title: 'A cosechar!', description: 'Recolecta los frijoles maduros para preparar una comida deliciosa. Actividad de coordinacion y conteo.', objective: 'Practicar coordinacion motriz mientras aprenden sobre la cosecha.', type: 'actividad', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Reforzar el concepto de cosecha y preparacion de alimentos de forma ludica.', script: 'Anime a los ninos a atrapar los frijoles que aparecen en la pantalla. Cuente en voz alta con ellos cada frijol recolectado.', tips: ['Fomente la participacion grupal con conteo en voz alta', 'Relacione con la gratitud por los alimentos', 'Pregunte que platillos conocen con frijoles'] } },
      { id: 4, title: 'El poder del agua', description: 'Descubre por que el agua es esencial para que nuestro cuerpo funcione como un superheroe. Escena de hidratacion.', objective: 'Entender la importancia de la hidratacion en la nutricion.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Conectar la hidratacion con la nutricion y el bienestar general del cuerpo.', script: 'Pregunte a los ninos cuanta agua toman al dia. Explique que el cuerpo necesita agua para pensar, jugar y crecer. Interactuen con la escena.', tips: ['Use vasos transparentes para mostrar la cantidad recomendada', 'Conecte con la planta de frijol: ella tambien necesita agua', 'Anime a los ninos a tomar agua durante el taller'] } },
    ],
  },
  {
    id: 2,
    title: 'El Huevo Alimento Diario',
    description: 'Aprende por que el huevo es un super alimento para tus musculos y tu cerebro. Los ninos descubren la anatomia del huevo, su valor proteico y las multiples formas de prepararlo de manera saludable.',
    category: 'Alimentacion',
    plan: 'Gratuito',
    targetAge: '4-8 anos',
    duration: '25 min',
    coverBg: COVER_COLORS[7],
    objectives: [
      'Conocer las partes del huevo y su valor nutricional',
      'Entender la importancia de las proteinas para el crecimiento',
      'Identificar formas saludables de preparar huevos',
      'Apreciar el huevo como alimento accesible y nutritivo',
    ],
    materials: ['Huevos cocidos', 'Laminas anatomicas del huevo', 'Platos y servilletas', 'Hojas de actividad'],
    scenes: [
      { id: 1, title: 'El cascaron protector', description: 'Descubre que hay dentro del huevo y por que el cascaron es como una armadura magica que protege un tesoro nutritivo.', objective: 'Conocer la estructura del huevo y generar curiosidad sobre su contenido.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Generar curiosidad y respeto por el huevo como alimento completo.', script: 'Explique como el cascaron protege lo de adentro, igual que nuestra piel nos protege. Muestre un huevo real y sus partes.', tips: ['Lleve un huevo cocido partido a la mitad para mostrar', 'Pregunte si saben de donde vienen los huevos', 'Explique la funcion de cada parte: cascaron, clara, yema'] } },
      { id: 2, title: 'Proteinas: los constructores', description: 'Las proteinas del huevo son como pequenos obreros que construyen musculos, huesos y todo tu cuerpo.', objective: 'Entender que son las proteinas y por que son importantes.', type: 'narracion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Ensenar el concepto de proteinas de forma visual y comprensible para ninos pequenos.', script: 'Use la analogia de bloques de construccion: las proteinas construyen tu cuerpo como los ladrillos construyen una casa.', tips: ['Conecte con el crecimiento: necesitas proteinas para crecer', 'Mencione que un huevo tiene 6 gramos de proteina', 'Pregunte que cosas de su cuerpo necesitan proteinas: musculos, pelo, unas'] } },
      { id: 3, title: 'Cocina con huevos', description: 'Mini-juego donde los ninos descubren las distintas formas saludables de cocinar huevos: hervido, revuelto, pochado.', objective: 'Conocer preparaciones saludables y fomentar habitos de cocina.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Ampliar el repertorio de preparaciones de huevo de forma divertida e interactiva.', script: 'Los ninos interactuan con diferentes formas de cocinar huevos. Pregunte cual es su forma favorita y si han ayudado a cocinar en casa.', tips: ['Enfatice la seguridad en la cocina: siempre con un adulto', 'Mencione que el huevo hervido es la opcion mas sencilla', 'Conecte con desayunos saludables que pueden preparar'] } },
      { id: 4, title: 'El huevo en mi plato', description: 'Reflexion sobre como incluir el huevo en las comidas diarias y su combinacion con otros alimentos.', objective: 'Aplicar lo aprendido en la planificacion de comidas.', type: 'reflexion', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Motivar la inclusion del huevo como alimento cotidiano de forma consciente.', script: 'Pregunte en que comidas pueden incluir huevo: desayuno, comida, cena. Cada nino dice su receta favorita con huevo.', tips: ['Respete las preferencias y restricciones alimentarias', 'Mencione que se puede comer un huevo al dia', 'Anime a los ninos a pedir huevo en casa y ayudar a prepararlo'] } },
    ],
  },
  {
    id: 3,
    title: 'El Plato Saludable',
    description: 'Los participantes aprenden a armar un plato balanceado identificando los grupos alimenticios y sus proporciones ideales para cada comida del dia. A traves de escenas interactivas y actividades practicas, los ninos descubren como combinar alimentos de forma equilibrada.',
    category: 'Alimentacion',
    plan: 'Gratuito',
    targetAge: '6-10 anos',
    duration: '30 min',
    coverBg: COVER_COLORS[0],
    objectives: [
      'Identificar los 5 grupos alimenticios principales',
      'Comprender las proporciones ideales en un plato saludable',
      'Crear combinaciones equilibradas para desayuno, comida y cena',
      'Reconocer alimentos procesados vs naturales',
    ],
    materials: ['Platos de carton', 'Recortes de alimentos', 'Pegamento', 'Hojas de actividad'],
    scenes: [
      { id: 1, title: 'Bienvenida al mundo de los alimentos', description: 'Introduccion animada que presenta a los personajes guia y explica el objetivo del taller.', objective: 'Captar la atencion y establecer el contexto del tema.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Captar la atencion mediante una secuencia visual que genera anticipacion. Preparar mentalmente al grupo para iniciar el aprendizaje con disposicion activa.', script: 'Los personajes guia aparecen y presentan el tema del dia. Pregunte a los ninos que desayunaron hoy para generar conexion con el tema antes de reproducir la escena.', tips: ['Permita que los ninos respondan libremente antes de iniciar', 'Use un tono entusiasta para generar expectativa', 'Conecte las respuestas de los ninos con lo que veran en la escena'] } },
      { id: 2, title: 'Los 5 grupos alimenticios', description: 'Narracion visual donde cada grupo alimenticio se presenta con ejemplos coloridos y datos curiosos.', objective: 'Que los ninos identifiquen los 5 grupos y ejemplos de cada uno.', type: 'narracion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Introducir vocabulario nutricional basico y establecer conexiones entre alimentos cotidianos y sus grupos.', script: 'Cada grupo alimenticio se presenta con animaciones. Pause entre cada grupo y pregunte a los ninos si pueden nombrar mas alimentos de esa categoria.', tips: ['Haga pausas entre cada grupo para reforzar', 'Use alimentos que los ninos consuman regularmente como ejemplos', 'Pregunte cual es su alimento favorito de cada grupo', 'Puede mostrar alimentos reales si los tiene disponibles'] } },
      { id: 3, title: 'Arma tu plato ideal', description: 'Mini-juego interactivo en HTML donde los ninos arrastran alimentos al plato y ven si lograron una combinacion equilibrada.', objective: 'Practicar la seleccion de alimentos balanceados de forma ludica.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Reforzar el aprendizaje mediante practica interactiva de seleccion y asociacion de alimentos.', script: 'Los ninos arrastran alimentos al plato. Permita que trabajen en parejas para fomentar la colaboracion y discusion sobre las elecciones.', tips: ['Deje que los ninos intenten sin ayuda primero', 'Fomente la discusion entre parejas', 'Celebre tanto los aciertos como los intentos', 'Si un nino se equivoca, pregunte por que eligio ese alimento'] } },
      { id: 4, title: 'Construyendo mi plato real', description: 'Actividad grupal donde cada equipo construye un plato fisico con recortes de alimentos sobre un plato de carton.', objective: 'Aplicar lo aprendido en una actividad tangible y colaborativa.', type: 'actividad', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Transferir el conocimiento digital a una actividad fisica y tangible que refuerce la memoria motora.', script: 'Entregue los materiales a cada equipo. Guie paso a paso: primero seleccionar, luego ubicar en el plato, verificar proporciones y finalmente pegar.', tips: ['Tenga los materiales listos antes de iniciar', 'Divida en equipos de 3-4 ninos', 'Circule entre los equipos para orientar', 'Pida que expliquen sus elecciones al terminar'] } },
      { id: 5, title: 'Desayuno, comida y cena', description: 'Escena que muestra ejemplos de platos equilibrados para cada momento del dia, con variaciones por temporada.', objective: 'Entender que el equilibrio se aplica a todas las comidas del dia.', type: 'narracion', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Extender el concepto de plato equilibrado a las tres comidas principales del dia.', script: 'Se muestran ejemplos para cada comida. Pregunte a los ninos que cambios harian en sus comidas habituales despues de ver estos ejemplos.', tips: ['Relacione con alimentos tipicos de la region', 'Mencione que las colaciones tambien importan', 'Adapte los ejemplos a la cultura alimentaria local'] } },
      { id: 6, title: 'Detecta el impostor', description: 'Mini-juego donde aparecen alimentos y los ninos deben identificar cuales son ultra-procesados disfrazados de saludables.', objective: 'Desarrollar pensamiento critico sobre alimentos procesados.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Desarrollar habilidades de analisis critico sobre la publicidad y el empaque de alimentos procesados.', script: 'Los ninos identifican alimentos ultra-procesados entre opciones. Despues del juego, analice por que ciertos productos parecen saludables pero no lo son.', tips: ['No demonice los alimentos, explique que son opciones menos frecuentes', 'Ensenar a leer etiquetas basicas', 'Use ejemplos de productos que los ninos conozcan', 'Enfoque en la frecuencia, no en prohibir'] } },
      { id: 7, title: 'Mi compromiso saludable', description: 'Los ninos reflexionan sobre lo aprendido y eligen un alimento nuevo que quieren incorporar a su dieta.', objective: 'Generar compromiso personal con una alimentacion mas equilibrada.', type: 'reflexion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Generar compromiso personal y emocional con los cambios alimentarios, reforzando la autonomia del nino.', script: 'Cada nino elige un alimento nuevo que quiere probar. Pregunte que alimentos nuevos les gustaria incorporar y por que.', tips: ['Respete las elecciones de cada nino', 'No presione ni juzgue las respuestas', 'Anime a compartir su compromiso con la familia', 'Sugiera que lo escriban o dibujen para recordar'] } },
      { id: 8, title: 'Quiz: Maestro del plato', description: 'Evaluacion final con preguntas interactivas sobre los grupos alimenticios y las proporciones del plato.', objective: 'Verificar la comprension de los conceptos principales.', type: 'evaluacion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Evaluar la retencion de conceptos clave de forma ludica y sin presion.', script: 'Preguntas interactivas sobre el taller. Permita intentos multiples y celebre cada respuesta correcta.', tips: ['No genere ansiedad por las respuestas incorrectas', 'Use el quiz como refuerzo, no como examen', 'Celebre el esfuerzo, no solo los aciertos', 'Repase brevemente los conceptos que generaron mas dudas'] } },
    ],
  },
  {
    id: 4,
    title: 'Agua: El Superheroe Invisible',
    description: 'Historia interactiva que ensena la importancia de la hidratacion diaria a traves de un superheroe que obtiene sus poderes del agua. Los ninos descubren como el agua afecta cada parte de su cuerpo.',
    category: 'Hidratacion',
    plan: 'Gratuito',
    targetAge: '4-8 anos',
    duration: '20 min',
    coverBg: COVER_COLORS[1],
    objectives: [
      'Entender por que el cuerpo necesita agua',
      'Conocer la cantidad de agua recomendada por dia',
      'Identificar senales de deshidratacion',
      'Preferir el agua sobre bebidas azucaradas',
    ],
    materials: ['Vasos transparentes', 'Colorantes naturales', 'Botellas reutilizables', 'Stickers'],
    scenes: [
      { id: 1, title: 'Conoce a Aquaman Jr.', description: 'Presentacion del personaje superheroe que pierde sus poderes cuando no se hidrata correctamente.', objective: 'Conectar emocionalmente con el tema a traves del personaje.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Crear conexion emocional con el tema a traves de un personaje con el que los ninos se identifiquen.', script: 'Presente al superheroe y su problema. Antes de iniciar, pregunte a los ninos cuanta agua creen que tomaron hoy.', tips: ['Use un tono narrativo y emocionante', 'Permita que los ninos reaccionen al personaje', 'Haga preguntas sobre superheroes para conectar'] } },
      { id: 2, title: 'El viaje del agua en tu cuerpo', description: 'Recorrido visual animado que muestra como el agua llega a cada parte del cuerpo y que funcion cumple.', objective: 'Comprender el recorrido y la importancia del agua en el organismo.', type: 'narracion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Ensenar el recorrido del agua en el cuerpo de forma visual y comprensible para ninos pequenos.', script: 'La animacion muestra el viaje del agua. Haga pausas para preguntar que pasaria si el superheroe no tomara agua.', tips: ['Senale las partes del cuerpo en la pantalla', 'Use lenguaje sencillo para organos complejos', 'Relacione con sensaciones que los ninos conocen: sed, cansancio'] } },
      { id: 3, title: 'Llena el medidor de energia', description: 'Mini-juego donde los ninos deben elegir la cantidad correcta de vasos de agua para recargar la energia del superheroe.', objective: 'Aprender la cantidad recomendada de agua diaria de forma interactiva.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Reforzar el concepto de cantidad diaria recomendada de agua de forma practica y visual.', script: 'Los ninos eligen cuantos vasos necesita el superheroe. Deje que cada nino intente al menos una vez antes de pasar.', tips: ['Adapte la cantidad recomendada a la edad del grupo', 'Use vasos reales como referencia visual', 'Relacione con momentos del dia: al despertar, en recreo, etc.'] } },
      { id: 4, title: 'Agua vs bebidas azucaradas', description: 'Actividad comparativa donde los ninos analizan el contenido de azucar en diferentes bebidas comunes.', objective: 'Reconocer por que el agua es la mejor opcion de hidratacion.', type: 'actividad', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Desarrollar pensamiento critico sobre las opciones de bebidas disponibles en su entorno.', script: 'Utilice los vasos transparentes para mostrar visualmente cuanta azucar contienen las bebidas comunes vs el agua.', tips: ['Prepare la demostracion con anticipacion', 'Use azucar real para impactar visualmente', 'No prohiba, ensenar a elegir con informacion', 'Incluya jugos naturales en la comparacion'] } },
      { id: 5, title: 'Senales de alerta', description: 'Los ninos aprenden a reconocer cuando su cuerpo les pide agua a traves de senales como sed, cansancio y dolor de cabeza.', objective: 'Identificar senales de deshidratacion en el cuerpo.', type: 'reflexion', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Desarrollar conciencia corporal para que los ninos reconozcan las senales de deshidratacion.', script: 'Pregunte a los ninos si alguna vez se han sentido cansados, con dolor de cabeza o con mucha sed. Conecte esas experiencias con la falta de agua.', tips: ['Use ejemplos de situaciones cotidianas', 'Enseneles a revisar el color de su orina como indicador', 'Refuerce que no hay que esperar a tener sed para tomar agua'] } },
      { id: 6, title: 'Mi botella de superheroe', description: 'Evaluacion ludica y cierre donde cada nino decora su botella y se compromete a tomar agua suficiente.', objective: 'Reforzar el habito de hidratacion con un objeto personal.', type: 'evaluacion', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Crear un recordatorio fisico y personal del compromiso de hidratacion.', script: 'Entregue las botellas y stickers. Los ninos decoran su botella mientras responden preguntas de repaso sobre lo aprendido.', tips: ['Tenga los materiales listos y organizados', 'Entregue stickers como refuerzo positivo', 'Pida que se comprometan a llenar su botella cada dia', 'Sugiera que la lleven a la escuela como recordatorio'] } },
    ],
  },
  {
    id: 5,
    title: 'Detectives de Nutrientes: Vitaminas y Minerales',
    description: 'Los ninos se convierten en detectives que deben encontrar las vitaminas y minerales escondidos en diferentes alimentos para resolver el caso de la energia perdida.',
    category: 'Nutricion',
    plan: 'Premium',
    targetAge: '8-12 anos',
    duration: '45 min',
    coverBg: COVER_COLORS[2],
    objectives: [
      'Conocer las principales vitaminas y sus funciones',
      'Identificar minerales esenciales en alimentos cotidianos',
      'Relacionar nutrientes con funciones corporales',
      'Crear un menu semanal rico en nutrientes',
    ],
    materials: ['Lupas de juguete', 'Tarjetas de alimentos', 'Mapa de nutrientes', 'Cuaderno de detective'],
    scenes: [
      { id: 1, title: 'El caso de la energia perdida', description: 'Introduccion al misterio: alguien robo la energia de la ciudad y los detectives deben encontrar los nutrientes escondidos.', objective: 'Crear una narrativa envolvente que motive la investigacion.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Crear una narrativa envolvente que motive la investigacion activa por parte de los participantes.', script: 'Entregue las lupas de juguete al inicio para generar expectativa. Presente el caso como un misterio real que deben resolver juntos.', tips: ['Cree ambiente de misterio con la voz y el entorno', 'Las lupas generan identificacion con el rol de detective', 'Divida al grupo en equipos de 3-4 detectives'] } },
      { id: 2, title: 'Pista 1: Las vitaminas', description: 'Narracion sobre las principales vitaminas (A, B, C, D) y en que alimentos se encuentran.', objective: 'Identificar las vitaminas principales y sus fuentes alimenticias.', type: 'narracion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Introducir las vitaminas principales de forma accesible, asociandolas con beneficios que los ninos puedan entender.', script: 'Cada vitamina se presenta como una pista del caso. Pause entre cada una y pregunte a los equipos si conocen alimentos con esa vitamina.', tips: ['Asocie cada vitamina con un superpoder: C = escudo, D = energia solar', 'Use el mapa de nutrientes como referencia visual', 'Permita que los equipos discutan antes de dar respuestas'] } },
      { id: 3, title: 'Busca la vitamina C', description: 'Mini-juego interactivo donde los ninos deben encontrar alimentos ricos en vitamina C entre diversas opciones.', objective: 'Reforzar el reconocimiento de fuentes de vitamina C.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Reforzar el reconocimiento de fuentes de vitamina C mediante practica activa de identificacion.', script: 'Los ninos buscan alimentos con vitamina C. Haga que cada equipo compita amistosamente por encontrar mas fuentes.', tips: ['Incluya alimentos sorpresa como pimiento o guayaba', 'Conecte con alimentos locales disponibles', 'Celebre los descubrimientos inesperados'] } },
      { id: 4, title: 'Pista 2: Los minerales', description: 'Descubrimiento de minerales esenciales como hierro, calcio y zinc en alimentos del dia a dia.', objective: 'Conocer los minerales esenciales y sus funciones.', type: 'narracion', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Ampliar la investigacion a los minerales, conectandolos con funciones corporales que los ninos experimentan.', script: 'Presente los minerales como la segunda pista del caso. Hierro = fuerza, calcio = huesos fuertes, zinc = defensa.', tips: ['Relacione el hierro con la energia para jugar', 'Calcio con crecer mas alto', 'Zinc con no enfermarse seguido'] } },
      { id: 5, title: 'Laboratorio de minerales', description: 'Actividad practica donde los equipos clasifican tarjetas de alimentos segun el mineral principal que contienen.', objective: 'Clasificar alimentos por su contenido mineral predominante.', type: 'actividad', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Aplicar conocimiento de minerales en una actividad de clasificacion colaborativa.', script: 'Entregue las tarjetas de alimentos a cada equipo. Deben clasificarlos segun el mineral principal. Use el mapa como referencia.', tips: ['Prepare las tarjetas ordenadas por equipo', 'Permita consultar el mapa de nutrientes', 'Revise las clasificaciones en grupo al final', 'Algunos alimentos tienen multiples minerales, discutalo'] } },
      { id: 6, title: 'El mapa del cuerpo', description: 'Mini-juego donde los ninos conectan cada nutriente con la parte del cuerpo que mas lo necesita.', objective: 'Relacionar nutrientes con funciones corporales especificas.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Consolidar la relacion entre nutrientes y partes del cuerpo de forma interactiva.', script: 'Los ninos conectan nutrientes con organos en el mini-juego. Refuerce con preguntas: que necesitan tus ojos? Y tus huesos?', tips: ['Senale las partes del cuerpo para reforzar visualmente', 'Conecte con dolencias comunes: cansancio = hierro, resfriados = vitamina C', 'Haga que los equipos compitan amistosamente'] } },
      { id: 7, title: 'Pista 3: Combinaciones poderosas', description: 'Narracion sobre como ciertos alimentos combinados potencian la absorcion de nutrientes.', objective: 'Entender la sinergia entre nutrientes.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Introducir el concepto de sinergia nutricional de forma sencilla y practica.', script: 'Explique que algunos alimentos se ayudan mutuamente: vitamina C + hierro, calcio + vitamina D. Use ejemplos de combinaciones comunes.', tips: ['Use ejemplos cotidianos: limon con lentejas, sol + leche', 'Este concepto es avanzado, simplificelo como amigos que se ayudan', 'No se extienda demasiado, lo importante es la idea general'] } },
      { id: 8, title: 'Crea tu menu detective', description: 'Cada equipo disena un menu semanal equilibrado usando las pistas recolectadas durante la investigacion.', objective: 'Aplicar todo lo aprendido en un plan alimenticio semanal.', type: 'actividad', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Aplicar todos los conocimientos adquiridos en un proyecto practico y creativo.', script: 'Cada equipo disena un menu de una semana usando las pistas recolectadas. El cuaderno de detective tiene la plantilla.', tips: ['De al menos 10 minutos para esta actividad', 'Circule entre equipos para orientar', 'Pida que incluyan al menos un alimento de cada mineral', 'Los equipos presentaran sus menus al final'] } },
      { id: 9, title: 'Reflexion: caso resuelto', description: 'Los equipos presentan sus hallazgos y discuten que nutrientes eran los mas dificiles de encontrar.', objective: 'Consolidar el aprendizaje a traves de la discusion grupal.', type: 'reflexion', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Consolidar el aprendizaje mediante la presentacion y discusion grupal de hallazgos.', script: 'Cada equipo presenta su menu y explica sus elecciones. Pregunte que nutrientes fueron mas dificiles de encontrar.', tips: ['De tiempo a cada equipo para presentar', 'Fomente preguntas entre equipos', 'Destaque las elecciones mas creativas', 'Conecte con la narrativa: el caso esta resuelto'] } },
      { id: 10, title: 'Examen del detective', description: 'Quiz interactivo con preguntas sobre vitaminas, minerales y sus fuentes alimenticias.', objective: 'Evaluar la comprension del tema.', type: 'evaluacion', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Evaluar la retencion de conceptos sobre vitaminas y minerales de forma ludica.', script: 'Quiz por equipos. Cada pregunta correcta suma puntos. Permita que los equipos discutan antes de responder.', tips: ['Mantenga el formato de competencia amistosa', 'Use preguntas de diferentes niveles de dificultad', 'Repase los conceptos que generaron mas errores'] } },
      { id: 11, title: 'Pista bonus: Superalimentos', description: 'Escena extra que revela alimentos con concentraciones excepcionales de multiples nutrientes.', objective: 'Ampliar el conocimiento con datos interesantes.', type: 'narracion', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Ampliar el conocimiento con informacion interesante sobre alimentos con propiedades excepcionales.', script: 'Presente los superalimentos como una pista bonus. Incluya alimentos locales y accesibles, no solo exoticos.', tips: ['Incluya alimentos accesibles como moringa, amaranto o quinoa local', 'Evite presentar superalimentos como obligatorios', 'Conecte con la disponibilidad en mercados locales'] } },
      { id: 12, title: 'Diploma de detective', description: 'Cierre ceremonial donde cada participante recibe su reconocimiento como Detective de Nutrientes.', objective: 'Celebrar el logro y reforzar la motivacion.', type: 'reflexion', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Celebrar el logro colectivo y reforzar la identidad de detective de nutrientes.', script: 'Entregue los diplomas o reconocimientos. Haga una ceremonia breve pero significativa. El cuaderno de detective sirve como repaso en casa.', tips: ['Prepare los diplomas con anticipacion', 'Mencione un logro especifico de cada equipo', 'Anime a seguir investigando en casa', 'El cuaderno es material de repaso para llevar'] } },
    ],
  },
  {
    id: 6,
    title: 'La Huerta Magica: Del Campo a la Mesa',
    description: 'Recorrido visual por el ciclo de produccion sostenible de alimentos, desde la semilla hasta el plato, fomentando el respeto por el medio ambiente y la valoracion de los alimentos locales.',
    category: 'Sostenibilidad',
    plan: 'Premium',
    targetAge: '6-12 anos',
    duration: '40 min',
    coverBg: COVER_COLORS[3],
    objectives: [
      'Comprender el ciclo de vida de los alimentos',
      'Valorar el trabajo de los productores locales',
      'Aprender tecnicas basicas de siembra',
      'Fomentar el consumo de alimentos de temporada',
    ],
    materials: ['Semillas variadas', 'Macetas pequenas', 'Tierra para siembra', 'Regaderas'],
    scenes: [
      { id: 1, title: 'La semilla dormida', description: 'Historia animada de una semilla que despierta y comienza su viaje hasta convertirse en alimento.', objective: 'Introducir el ciclo de vida de las plantas de forma narrativa.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Introducir el ciclo de vida vegetal mediante una narrativa emocional que despierte curiosidad.', script: 'La semilla despierta y comienza su viaje. Si es posible, realice la sesion al aire libre o cerca de un espacio verde.', tips: ['Permita que los ninos manipulen semillas reales durante la narracion', 'Pregunte si alguna vez han sembrado algo', 'Conecte con la experiencia de ver crecer una planta'] } },
      { id: 2, title: 'De la tierra al sol', description: 'Narracion sobre los elementos que una planta necesita para crecer: agua, sol, tierra y nutrientes.', objective: 'Comprender los factores necesarios para el crecimiento vegetal.', type: 'narracion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Ensenar los factores basicos de crecimiento vegetal de forma comprensible y visual.', script: 'La animacion muestra cada factor de crecimiento. Pause para preguntar que pasa si falta alguno de estos elementos.', tips: ['Use analogias con necesidades humanas: nosotros tambien necesitamos agua y sol', 'Conecte con el clima local y las estaciones', 'Mencione que los nutrientes de la tierra son los mismos que luego comemos'] } },
      { id: 3, title: 'Cultiva tu planta', description: 'Mini-juego donde los ninos simulan el cuidado de una planta virtual eligiendo cuando regar, abonar y proteger del clima.', objective: 'Practicar las decisiones de cuidado agricola de forma ludica.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Practicar la toma de decisiones sobre cuidado vegetal en un entorno seguro y ludico.', script: 'Los ninos cuidan una planta virtual. Enfatice que cada decision tiene consecuencias, igual que en la vida real.', tips: ['Relacione las decisiones del juego con el cuidado real de plantas', 'Si la planta virtual muere, discuta que salio mal', 'Fomente multiples intentos para experimentar diferentes resultados'] } },
      { id: 4, title: 'Manos a la tierra', description: 'Actividad practica donde cada nino siembra una semilla en su maceta personal.', objective: 'Experimentar el proceso de siembra de forma directa.', type: 'actividad', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Transferir el conocimiento teorico a la experiencia directa de siembra.', script: 'Prepare las macetas y tierra antes de iniciar. Guie paso a paso: llenar maceta, hacer hoyo, colocar semilla, cubrir y regar.', tips: ['Tenga todos los materiales organizados por estacion', 'Use semillas de rapido crecimiento como frijol o lenteja', 'Asigne el cuidado de las macetas como tarea continua', 'Envie instrucciones de cuidado a casa'] } },
      { id: 5, title: 'El mercado local', description: 'Recorrido virtual por un mercado mostrando la diversidad de productos locales y de temporada.', objective: 'Valorar la variedad y frescura de los alimentos locales.', type: 'narracion', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Valorar la diversidad y frescura de los alimentos producidos localmente.', script: 'Recorrido virtual por un mercado. Conecte con mercados locales que los ninos conozcan y mencione productos de la region.', tips: ['Mencione mercados locales por nombre si es posible', 'Explique la diferencia entre alimentos locales y transportados', 'Conecte con tradiciones alimentarias de la comunidad'] } },
      { id: 6, title: 'Elige lo de temporada', description: 'Mini-juego donde los ninos deben seleccionar las frutas y verduras correctas segun la estacion del ano.', objective: 'Aprender que alimentos estan disponibles en cada temporada.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Ensenar el concepto de estacionalidad alimentaria de forma practica e interactiva.', script: 'Los ninos seleccionan alimentos por temporada. Adapte los ejemplos a las estaciones y productos de su region.', tips: ['Adapte las temporadas al hemisferio y clima local', 'Incluya alimentos que los ninos vean en su mercado', 'Explique por que los alimentos de temporada son mas sabrosos y baratos'] } },
      { id: 7, title: 'Del campo a mi plato', description: 'Narracion que conecta todo el recorrido: siembra, cosecha, transporte, preparacion y consumo.', objective: 'Comprender la cadena completa de produccion alimentaria.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Conectar todas las etapas del proceso alimentario para generar una vision integral.', script: 'La narracion recorre todo el camino. Enfatice el trabajo de las personas en cada etapa y el valor del alimento que llega a la mesa.', tips: ['Mencione las profesiones involucradas: agricultor, transportista, cocinero', 'Conecte con la gratitud por los alimentos', 'Pregunte si conocen a alguien que trabaje en el campo'] } },
      { id: 8, title: 'Reducir el desperdicio', description: 'Reflexion sobre como reducir el desperdicio de alimentos en casa y en la escuela.', objective: 'Generar conciencia sobre el desperdicio alimentario.', type: 'reflexion', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Sensibilizar sobre el desperdicio alimentario y generar acciones concretas para reducirlo.', script: 'Presente datos sencillos sobre desperdicio alimentario. Pregunte a los ninos si alguna vez han tirado comida y por que.', tips: ['Use datos locales si los tiene disponibles', 'No genere culpa, enfoque en soluciones', 'Proponga acciones concretas: porciones adecuadas, reutilizar sobras'] } },
      { id: 9, title: 'Mi compromiso verde', description: 'Los ninos eligen una accion concreta para cuidar el medio ambiente relacionada con los alimentos.', objective: 'Fomentar la responsabilidad ambiental personal.', type: 'reflexion', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Transformar la reflexion en un compromiso personal y concreto con el medio ambiente.', script: 'Cada nino elige una accion concreta: cuidar su planta, no desperdiciar, comprar en el mercado, etc.', tips: ['Ofrezca opciones concretas y alcanzables', 'Pida que compartan su compromiso con la familia', 'Conecte con el cuidado de la maceta que sembraron'] } },
      { id: 10, title: 'Quiz de la huerta', description: 'Evaluacion interactiva sobre el ciclo de produccion, temporadas y practicas sostenibles.', objective: 'Verificar los conocimientos adquiridos.', type: 'evaluacion', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Evaluar la comprension del ciclo de produccion y las practicas sostenibles.', script: 'Quiz interactivo sobre los temas del taller. Incluya preguntas sobre el ciclo de vida, temporadas y cuidado ambiental.', tips: ['Mezcle preguntas faciles y desafiantes', 'Celebre las respuestas correctas con entusiasmo', 'Use las preguntas erroneas como oportunidad de repaso'] } },
    ],
  },
  {
    id: 7,
    title: 'Desayuno de Campeones',
    description: 'Taller que muestra como preparar desayunos nutritivos y rapidos, con recetas faciles que los ninos pueden replicar en casa con supervision de un adulto.',
    category: 'Alimentacion',
    plan: 'Gratuito',
    targetAge: '5-9 anos',
    duration: '25 min',
    coverBg: COVER_COLORS[4],
    objectives: [
      'Entender la importancia del desayuno',
      'Aprender 3 recetas rapidas y nutritivas',
      'Identificar desayunos saludables vs no saludables',
      'Planificar desayunos para una semana',
    ],
    materials: ['Recetarios ilustrados', 'Ingredientes para demo', 'Platos y cubiertos', 'Delantales'],
    scenes: [
      { id: 1, title: 'El desayuno de los campeones', description: 'Narracion sobre deportistas y cientificos que atribuyen su energia al desayuno.', objective: 'Motivar a los ninos a valorar el desayuno.', type: 'narracion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Motivar el interes por el desayuno asociandolo con personas admirables y sus logros.', script: 'Inicie con la pregunta: Quien desayuno hoy? Que desayunaron? Luego muestre la escena de campeones que valoran el desayuno.', tips: ['Use ejemplos de figuras que los ninos admiren', 'Enfatice que un buen desayuno ayuda a concentrarse en la escuela', 'No juzgue a quienes no desayunaron, motive el cambio'] } },
      { id: 2, title: 'Saludable o no?', description: 'Mini-juego donde los ninos clasifican diferentes desayunos como saludables o no saludables.', objective: 'Desarrollar criterio para elegir desayunos nutritivos.', type: 'mini-juego', thumbnailBg: THUMB_COLORS[1], guide: { goal: 'Desarrollar criterio de seleccion alimentaria aplicada al desayuno de forma interactiva.', script: 'Los ninos clasifican desayunos. Despues de cada eleccion, explique brevemente por que es saludable o no.', tips: ['Incluya desayunos tipicos de la region', 'Explique que no se trata de bueno vs malo sino de frecuencia', 'Use los delantales para crear ambiente de cocina'] } },
      { id: 3, title: 'Receta 1: Bowl de frutas', description: 'Paso a paso visual de como preparar un bowl de frutas con yogurt y granola.', objective: 'Aprender una receta rapida y equilibrada.', type: 'actividad', thumbnailBg: THUMB_COLORS[2], guide: { goal: 'Ensenar una receta sencilla y replicable que combine frutas, lacteos y cereales.', script: 'Siga el paso a paso de la escena. Si tiene ingredientes disponibles, haga la demostracion en vivo mientras los ninos ven la animacion.', tips: ['Adapte las frutas a lo disponible localmente', 'Muestre que se puede preparar en menos de 5 minutos', 'Las recetas deben ser simples y seguras para replicar en casa'] } },
      { id: 4, title: 'Receta 2: Tostadas creativas', description: 'Demostracion de combinaciones nutritivas sobre pan integral con diferentes toppings.', objective: 'Descubrir opciones variadas de tostadas saludables.', type: 'actividad', thumbnailBg: THUMB_COLORS[3], guide: { goal: 'Ampliar las opciones de desayuno rapido con variaciones nutritivas sobre pan.', script: 'Muestre diferentes combinaciones: aguacate, huevo, crema de cacahuate con platano, queso con tomate, etc.', tips: ['Adapte los toppings a alimentos locales y accesibles', 'Enfatice la creatividad en las combinaciones', 'Pregunte a los ninos que combinacion les gustaria probar'] } },
      { id: 5, title: 'Receta 3: Smoothie express', description: 'Preparacion de un smoothie con frutas, leche y semillas en menos de 5 minutos.', objective: 'Aprender una opcion rapida para mananas apresuradas.', type: 'actividad', thumbnailBg: THUMB_COLORS[4], guide: { goal: 'Ofrecer una alternativa liquida y rapida para mananas con poco tiempo.', script: 'Muestre la preparacion del smoothie. Enfatice que es la opcion perfecta cuando hay prisa por salir a la escuela.', tips: ['Si tiene licuadora disponible, haga la demo en vivo', 'Sugiera preparar los ingredientes la noche anterior', 'Adapte la receta a frutas de temporada'] } },
      { id: 6, title: 'Planifica tu semana', description: 'Reflexion donde cada nino elige que desayunar cada dia de la semana usando lo aprendido.', objective: 'Aplicar los conocimientos en un plan semanal personal.', type: 'reflexion', thumbnailBg: THUMB_COLORS[5], guide: { goal: 'Convertir el conocimiento en un plan concreto y personalizado para la semana.', script: 'Cada nino completa un plan de desayunos para la semana usando las recetas aprendidas y sus propias ideas.', tips: ['Proporcione una plantilla semanal para llenar', 'Anime a variar los desayunos cada dia', 'Sugiera compartir el plan con la familia', 'Envie el recetario ilustrado a casa como refuerzo'] } },
      { id: 7, title: 'Quiz del campeon', description: 'Preguntas rapidas sobre nutricion en el desayuno y las recetas aprendidas.', objective: 'Evaluar la retencion de los conceptos clave.', type: 'evaluacion', thumbnailBg: THUMB_COLORS[0], guide: { goal: 'Verificar la retencion de conceptos clave sobre desayunos saludables.', script: 'Preguntas rapidas sobre las recetas y conceptos del taller. Celebre cada respuesta correcta.', tips: ['Use formato de respuesta rapida para mantener la energia', 'Incluya preguntas sobre las tres recetas', 'Cierre con felicitaciones y el titulo de Campeon del Desayuno'] } },
    ],
  },
]

export function useStoryboards() {
  const storyboards = useState('storyboards', () => [...STORYBOARDS_DATA])

  function getStoryboard(id: number) {
    return storyboards.value.find(sb => sb.id === id)
  }

  function planBadgeClass(plan: string): string {
    const map: Record<string, string> = {
      Gratuito: 'bg-white/90 text-gray-700',
      Premium: 'bg-brand-coral-500 text-white',
      Personalizado: 'bg-brand-purple text-white',
    }
    return map[plan] || 'bg-white/90 text-gray-700'
  }

  return {
    storyboards,
    getStoryboard,
    planBadgeClass,
    coverColors: COVER_COLORS,
    sceneTypeLabels: SCENE_TYPE_LABELS,
    sceneTypeColors: SCENE_TYPE_COLORS,
  }
}
