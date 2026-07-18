import 'dart:ui';
import '../models/workshop.dart';
import '../theme/app_colors.dart';

Color workshopTypeColor(WorkshopType type) {
  switch (type) {
    case WorkshopType.alimentacion:
      return AppColors.primary;
    case WorkshopType.cuidado:
      return AppColors.teal;
    case WorkshopType.actividadFisica:
      return AppColors.coral;
  }
}
