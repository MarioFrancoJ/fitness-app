export interface ExerciseDetail {
  id: string;
  instructions: string[];
  commonMistakes: string[];
  alternatives: string[];
}

export const exerciseDetails: ExerciseDetail[] = [
  {
    id: "1",
    instructions: [
      "Lie flat on a bench with feet firmly on the floor.",
      "Grip the barbell slightly wider than shoulder-width.",
      "Unrack the bar and lower it to your mid-chest with control.",
      "Press the bar back up until arms are fully extended.",
      "Keep your shoulder blades retracted throughout the movement.",
    ],
    commonMistakes: [
      "Flaring elbows to 90 degrees — keep them at 45–75°.",
      "Bouncing the bar off the chest.",
      "Lifting hips off the bench.",
      "Using a grip that is too narrow or too wide.",
    ],
    alternatives: ["Dumbbell Bench Press", "Push-Up", "Machine Chest Press"],
  },
  {
    id: "2",
    instructions: [
      "Set the bench to 30–45 degrees.",
      "Hold dumbbells at shoulder level with palms facing forward.",
      "Press the weights up and slightly inward until arms are extended.",
      "Lower with control back to the starting position.",
    ],
    commonMistakes: [
      "Setting the bench angle too high (becomes a shoulder press).",
      "Not controlling the negative portion.",
      "Arching the lower back excessively.",
    ],
    alternatives: ["Incline Barbell Press", "Incline Cable Fly", "Landmine Press"],
  },
  {
    id: "3",
    instructions: [
      "Start in a high plank position with hands slightly wider than shoulders.",
      "Lower your body until your chest nearly touches the floor.",
      "Keep your core tight and body in a straight line.",
      "Push back up to the starting position.",
    ],
    commonMistakes: [
      "Sagging hips toward the floor.",
      "Flaring elbows directly to the sides.",
      "Not reaching full range of motion.",
    ],
    alternatives: ["Knee Push-Up", "Incline Push-Up", "Dumbbell Floor Press"],
  },
  {
    id: "4",
    instructions: [
      "Set the cables at chest height.",
      "Step forward with a slight forward lean.",
      "With a slight bend in your elbows, bring handles together in front of your chest.",
      "Slowly return to the starting position with arms wide.",
    ],
    commonMistakes: [
      "Using too much weight and bending elbows excessively.",
      "Not squeezing at the contraction point.",
      "Leaning too far forward.",
    ],
    alternatives: ["Dumbbell Fly", "Pec Deck Machine", "Push-Up"],
  },
  {
    id: "5",
    instructions: [
      "Stand with feet hip-width apart, barbell over mid-foot.",
      "Hinge at hips, grip the bar just outside your knees.",
      "Brace your core, flatten your back, and drive through your heels.",
      "Stand tall, locking hips and knees at the top.",
      "Lower the bar by hinging at the hips first, then bending knees.",
    ],
    commonMistakes: [
      "Rounding the lower back.",
      "Starting with hips too low (turning it into a squat).",
      "Jerking the bar off the floor.",
      "Letting the bar drift away from the body.",
    ],
    alternatives: ["Trap Bar Deadlift", "Romanian Deadlift", "Rack Pull"],
  },
  {
    id: "6",
    instructions: [
      "Hang from a bar with hands slightly wider than shoulder-width.",
      "Engage your lats and pull your body up until your chin clears the bar.",
      "Lower with control to a full hang.",
    ],
    commonMistakes: [
      "Kipping or swinging for momentum.",
      "Not achieving full range of motion.",
      "Shrugging shoulders instead of engaging lats.",
    ],
    alternatives: ["Lat Pulldown", "Assisted Pull-Up", "Inverted Row"],
  },
  {
    id: "7",
    instructions: [
      "Hinge forward at the hips to about 45 degrees.",
      "Grip the barbell with an overhand grip.",
      "Pull the bar to your lower chest/upper abdomen.",
      "Squeeze your shoulder blades together at the top.",
      "Lower with control.",
    ],
    commonMistakes: [
      "Using momentum by standing too upright.",
      "Rounding the lower back.",
      "Pulling the bar to the wrong position.",
    ],
    alternatives: ["Dumbbell Row", "T-Bar Row", "Seated Cable Row"],
  },
  {
    id: "8",
    instructions: [
      "Sit at the machine and grip the bar wider than shoulder-width.",
      "Pull the bar down to your upper chest.",
      "Squeeze your lats at the bottom.",
      "Slowly release back to the starting position.",
    ],
    commonMistakes: [
      "Leaning too far back.",
      "Pulling the bar behind the neck.",
      "Using biceps instead of engaging lats.",
    ],
    alternatives: ["Pull-Up", "Close-Grip Pulldown", "Straight-Arm Pulldown"],
  },
  {
    id: "9",
    instructions: [
      "Position the bar on your upper traps.",
      "Stand with feet shoulder-width apart, toes slightly out.",
      "Brace your core and descend by bending hips and knees simultaneously.",
      "Go to at least parallel (thighs parallel to the floor).",
      "Drive through your full foot to stand back up.",
    ],
    commonMistakes: [
      "Letting knees cave inward.",
      "Rising hips faster than the chest (good-morning squat).",
      "Not reaching adequate depth.",
      "Losing upper back tightness.",
    ],
    alternatives: ["Goblet Squat", "Leg Press", "Front Squat"],
  },
  {
    id: "10",
    instructions: [
      "Sit in the machine with feet shoulder-width on the platform.",
      "Release the safety and lower the platform by bending knees.",
      "Press through your full foot until legs are nearly extended (don't lock out).",
    ],
    commonMistakes: [
      "Placing feet too high or too low.",
      "Locking knees at the top.",
      "Letting lower back round off the pad.",
    ],
    alternatives: ["Barbell Squat", "Hack Squat", "Goblet Squat"],
  },
  {
    id: "11",
    instructions: [
      "Hold a barbell at hip level with an overhand grip.",
      "With a slight bend in your knees, hinge forward at the hips.",
      "Lower the bar along your legs until you feel a hamstring stretch.",
      "Drive hips forward to return to standing.",
    ],
    commonMistakes: [
      "Rounding the lower back.",
      "Bending the knees too much (turning it into a squat).",
      "Not maintaining bar contact with legs.",
    ],
    alternatives: ["Single-Leg RDL", "Stiff-Leg Deadlift", "Good Morning"],
  },
  {
    id: "12",
    instructions: [
      "Hold dumbbells at your sides.",
      "Step forward into a lunge, lowering your back knee toward the floor.",
      "Push off your front foot to step forward into the next lunge.",
      "Alternate legs with each step.",
    ],
    commonMistakes: [
      "Taking too short or too long a stride.",
      "Letting the front knee cave inward.",
      "Leaning the torso forward.",
    ],
    alternatives: ["Reverse Lunge", "Bulgarian Split Squat", "Step-Up"],
  },
  {
    id: "13",
    instructions: [
      "Hold the barbell at shoulder level with a grip slightly wider than shoulders.",
      "Brace your core and press the bar overhead.",
      "Lock out at the top with the bar over the crown of your head.",
      "Lower with control back to shoulder level.",
    ],
    commonMistakes: [
      "Excessive lower back arch.",
      "Pressing the bar forward instead of straight up.",
      "Not fully locking out at the top.",
    ],
    alternatives: ["Dumbbell Shoulder Press", "Arnold Press", "Push Press"],
  },
  {
    id: "14",
    instructions: [
      "Stand with dumbbells at your sides.",
      "With a slight bend in elbows, raise arms out to the sides.",
      "Stop when arms are parallel to the floor.",
      "Lower with control.",
    ],
    commonMistakes: [
      "Using momentum by swinging the body.",
      "Raising above shoulder height.",
      "Shrugging the traps during the lift.",
    ],
    alternatives: ["Cable Lateral Raise", "Machine Lateral Raise", "Upright Row"],
  },
  {
    id: "15",
    instructions: [
      "Set a cable at upper-chest height with a rope attachment.",
      "Pull the rope toward your face, separating the ends.",
      "Squeeze your rear delts and external rotators at the end.",
      "Slowly return to the start.",
    ],
    commonMistakes: [
      "Using too much weight and pulling with the body.",
      "Not externally rotating at the end.",
      "Pulling too low (toward chest instead of face).",
    ],
    alternatives: ["Reverse Fly", "Band Pull-Apart", "Rear Delt Fly"],
  },
  {
    id: "16",
    instructions: [
      "Stand with feet hip-width, holding a barbell with underhand grip.",
      "Curl the bar up by contracting your biceps.",
      "Keep elbows pinned to your sides throughout.",
      "Lower with control to full arm extension.",
    ],
    commonMistakes: [
      "Swinging the body for momentum.",
      "Moving elbows forward during the curl.",
      "Not reaching full extension at the bottom.",
    ],
    alternatives: ["Dumbbell Curl", "EZ-Bar Curl", "Cable Curl"],
  },
  {
    id: "17",
    instructions: [
      "Grip parallel bars and support your body with straight arms.",
      "Lower your body by bending elbows until upper arms are parallel to the floor.",
      "Press back up to the starting position.",
      "Keep a slight forward lean for chest emphasis or upright for triceps.",
    ],
    commonMistakes: [
      "Going too deep and stressing the shoulders.",
      "Flaring elbows excessively.",
      "Swinging the legs for momentum.",
    ],
    alternatives: ["Close-Grip Bench Press", "Bench Dip", "Tricep Pushdown"],
  },
  {
    id: "18",
    instructions: [
      "Stand with dumbbells at your sides, palms facing your body.",
      "Curl the weights up while keeping your palms neutral (facing each other).",
      "Squeeze at the top and lower with control.",
    ],
    commonMistakes: [
      "Using body momentum.",
      "Rotating wrists during the curl.",
      "Not controlling the eccentric.",
    ],
    alternatives: ["Cross-Body Hammer Curl", "Rope Cable Curl", "Zottman Curl"],
  },
  {
    id: "19",
    instructions: [
      "Start in a forearm plank position with elbows under shoulders.",
      "Engage your core, glutes, and quads.",
      "Maintain a straight line from head to heels.",
      "Hold for the prescribed duration without letting hips sag or pike.",
    ],
    commonMistakes: [
      "Letting hips sag toward the floor.",
      "Piking the hips too high.",
      "Holding breath instead of breathing steadily.",
    ],
    alternatives: ["Dead Bug", "Ab Rollout", "Pallof Press"],
  },
  {
    id: "20",
    instructions: [
      "Hang from a pull-up bar with a full grip.",
      "With legs straight, raise them until they are parallel to the floor (or higher).",
      "Lower with control — avoid swinging.",
    ],
    commonMistakes: [
      "Using momentum to swing legs up.",
      "Bending knees to make it easier without intention.",
      "Not achieving full range of motion.",
    ],
    alternatives: ["Knee Raise", "Lying Leg Raise", "Captain's Chair Leg Raise"],
  },
];
