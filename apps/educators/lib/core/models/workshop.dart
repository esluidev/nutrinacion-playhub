enum GameType {
  interactive,
  story,
  activity;

  String get label {
    switch (this) {
      case GameType.interactive:
        return 'Interactivo';
      case GameType.story:
        return 'Historia';
      case GameType.activity:
        return 'Actividad';
    }
  }
}

enum WorkshopType { alimentacion, cuidado, actividadFisica }

class Scene {
  final String id;
  final String title;
  final String description;
  final String image;
  final String guide;
  final GameType gameType;
  final String? riveAsset;

  const Scene({
    required this.id,
    required this.title,
    required this.description,
    required this.image,
    required this.guide,
    required this.gameType,
    this.riveAsset,
  });
}

class Workshop {
  final String id;
  final String title;
  final String description;
  final WorkshopType type;
  final String image;
  final List<Scene> scenes;
  final DateTime date;

  const Workshop({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.image,
    required this.scenes,
    required this.date,
  });

  String get typeLabel {
    switch (type) {
      case WorkshopType.alimentacion:
        return 'Alimentación';
      case WorkshopType.cuidado:
        return 'Cuidado';
      case WorkshopType.actividadFisica:
        return 'Actividad Física';
    }
  }
}
