// Short lines for the program cards. The full lines in shared/programs.ts are
// written for search and stay on each program's own page.
import type { Program } from "@shared/programs";

const CARD_LINES: Record<string, string> = {
  "water-polo-hypertrophy": "Build muscle for the pool over 4 weeks.",
  "water-polo-max-strength-and-power": "Get stronger and more powerful in 4 weeks.",
  "strength-for-runners": "Stronger legs, hips and calves for 5k to marathon training. Fits around your running week.",
  "strength-for-golfers": "Rotational power, strong hips and a back that holds up over 18 holes.",
  "strength-for-tennis-players": "Legs, shoulders and trunk for longer matches, quicker movement and fewer niggles.",
  "strength-for-boxing": "Ground force, trunk and shoulder strength for bag work and sparring.",
  "strength-for-swimmers": "Dryland lat, shoulder and trunk strength that carries over to the water.",
  "ski-and-snowboard-pre-season": "Legs, glutes and knees ready for the first day on the snow.",
  "perimenopause-strength": "Heavy, progressive lifting to build strength and keep your energy steady as your hormones start to change.",
  "menopause-strength": "Lift heavier with a plan built for life after your periods stop.",
  "strength-for-bone-health": "Heavy, progressive loading to build stronger bones. Check with your doctor before you start.",
  "women-leaders-performance": "Strength, energy and stress control for women who run teams and companies. Gym or home.",
  "leader-performance-program": "Strength, energy and sleep habits for people with too many meetings.",
  "travel-week-training": "30 minute hotel room sessions that keep your training going on the road. No gym needed.",
  "the-corporate-athlete": "Train, recover and perform at work the way an athlete prepares for a season.",
};

export function cardLine(p: Pick<Program, "slug" | "line">) {
  return CARD_LINES[p.slug] ?? p.line;
}
