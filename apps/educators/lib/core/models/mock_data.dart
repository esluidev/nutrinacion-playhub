import 'workshop.dart';

final List<Workshop> mockWorkshops = [
  Workshop(
    id: 'w1',
    title: 'Los Frijoles Mágicos',
    description:
        'Descubre el poder de los frijoles y cómo nos ayudan a crecer fuertes como una planta mágica.',
    type: WorkshopType.alimentacion,
    image: 'https://picsum.photos/seed/frijoles/400/300',
    date: DateTime.now(),
    scenes: const [
      Scene(
        id: 's1',
        title: 'Descubre los frijoles',
        description: 'Conoce a los pequeños héroes de nuestra historia.',
        image: 'https://picsum.photos/seed/s1/400/300',
        guide:
            'Muestra los frijoles a los niños. Pregúntales si saben qué son y de qué color los han visto.',
        gameType: GameType.story,
        riveAsset: 'assets/animations/scene_1.riv',
      ),
      Scene(
        id: 's2',
        title: 'Crece como una planta',
        description: 'Ayuda a la semilla a convertirse en una gran planta.',
        image: 'https://picsum.photos/seed/s2/400/300',
        guide:
            'Pide a los niños que se agachen como semillitas y poco a poco se estiren hacia arriba.',
        gameType: GameType.interactive,
        riveAsset: 'assets/animations/scene_2.riv',
      ),
      Scene(
        id: 's3',
        title: '¡A cosechar!',
        description:
            'Recolecta los frijoles para preparar una comida deliciosa.',
        image: 'https://picsum.photos/seed/s3/400/300',
        guide:
            'Anima a los niños a "atrapar" los frijoles que aparecen en la pantalla.',
        gameType: GameType.activity,
        riveAsset: 'assets/animations/scene_3.riv',
      ),
      Scene(
        id: 's4',
        title: 'El poder del agua',
        description:
            'Descubre por qué el agua es esencial para que nuestro cuerpo funcione como un superhéroe.',
        image: 'https://picsum.photos/seed/s4agua/400/300',
        guide:
            'Pregunta a los niños cuánta agua toman al día. Explica que el cuerpo necesita agua para pensar, jugar y crecer.',
        gameType: GameType.interactive,
        riveAsset: 'assets/animations/scene_4.riv',
      ),
    ],
  ),
  Workshop(
    id: 'w2',
    title: 'El Huevo como Fuente de Proteína',
    description:
        'Aprende por qué el huevo es un súper alimento para tus músculos.',
    type: WorkshopType.alimentacion,
    image: 'https://picsum.photos/seed/huevo/400/300',
    date: DateTime.now(),
    scenes: const [
      Scene(
        id: 's4',
        title: 'El cascarón protector',
        description: 'Descubre qué hay dentro del huevo.',
        image: 'https://picsum.photos/seed/s4/400/300',
        guide:
            'Explica cómo el cascarón protege lo de adentro, igual que nuestra piel nos protege.',
        gameType: GameType.story,
      ),
    ],
  ),
  Workshop(
    id: 'w3',
    title: 'Cuidado del piecito diabético',
    description:
        'Aprende a cuidar tus piesitos para que siempre estén sanos y felices.',
    type: WorkshopType.cuidado,
    image: 'https://picsum.photos/seed/pies/400/300',
    date: DateTime.now().add(const Duration(days: 2)),
    scenes: const [
      Scene(
        id: 's5',
        title: 'Inspección de piecitos',
        description: 'Vamos a revisar que todo esté bien.',
        image: 'https://picsum.photos/seed/s5/400/300',
        guide:
            'Enseña a los niños a mirar entre sus deditos y mantenerlos secos.',
        gameType: GameType.interactive,
      ),
    ],
  ),
];
