import { TaskType } from "./types";

export const getTaskPoints = (type: TaskType): number => {
  switch (type) {
    // Graphic-Motion Task Types
    case "CLIP":
      return 20; // Updated from 10
    case "PRESENTATION":
      return 10; // No change
    case "BUMPER":
      return 5; // Updated from 2
    case "BACKGROUND":
      return 2; // Updated from 1
    case "MINOR_ITEMS_ANIMATION": // Renamed from MINOR ITEM
      return 1; // Updated from 0.3

    // Graphic Only Task Types
    case "BRANDING":
      return 20;
    case "ADVERTISING":
      return 10;
    case "MICROSITE_UI_DESIGN":
      return 5;
    case "DIGITAL_MEDIA":
      return 2;
    case "PRINTED_MEDIA_MINOR_DESIGN":
      return 1;

    // Decor Task Types
    case "PRINTED_INFORMATION":
      return 10;
    case "PRINTED_DECORATION":
      return 4;
    case "CUTTING_MAL_RESIZE":
      return 1;
      
    default:
      return 0;
  }
};

export const taskTypes: TaskType[] = [
  // Graphic-Motion
  "CLIP",
  "PRESENTATION",
  "BUMPER",
  "BACKGROUND",
  "MINOR_ITEMS_ANIMATION",
  // Graphic Only
  "BRANDING",
  "ADVERTISING",
  "MICROSITE_UI_DESIGN",
  "DIGITAL_MEDIA",
  "PRINTED_MEDIA_MINOR_DESIGN",
  // Decor
  "PRINTED_INFORMATION",
  "PRINTED_DECORATION",
  "CUTTING_MAL_RESIZE",
];

export const isGraphicOnlyTaskType = (type: TaskType): boolean => {
  return [
    "BRANDING",
    "ADVERTISING",
    "MICROSITE_UI_DESIGN",
    "DIGITAL_MEDIA",
    "PRINTED_MEDIA_MINOR_DESIGN",
  ].includes(type);
};

export const isDecorTaskType = (type: TaskType): boolean => {
  return [
    "PRINTED_INFORMATION",
    "PRINTED_DECORATION",
    "CUTTING_MAL_RESIZE",
  ].includes(type);
};

export const isGraphicMotionTaskType = (type: TaskType): boolean => {
  return [
    "CLIP",
    "PRESENTATION",
    "BUMPER",
    "BACKGROUND",
    "MINOR_ITEMS_ANIMATION",
  ].includes(type);
};

export const isGraphicRelatedTaskType = (type: TaskType): boolean => {
  return isGraphicOnlyTaskType(type) || isDecorTaskType(type) || isGraphicMotionTaskType(type);
};