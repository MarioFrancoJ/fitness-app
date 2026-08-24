export type ExerciseCategory = "Strength" | "Calisthenics" | "Cardio" | "Mobility" | "Flexibility";
export type MuscleGroup = "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms" | "Core" | "Glutes" | "Quadriceps" | "Hamstrings" | "Calves" | "Full Body";
export type Equipment = "None" | "Dumbbells" | "Barbell" | "Resistance Bands" | "Pull-Up Bar" | "Machine" | "Kettlebell";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ["Strength", "Calisthenics", "Cardio", "Mobility", "Flexibility"];
export const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Core", "Glutes", "Quadriceps", "Hamstrings", "Calves", "Full Body"];
export const EQUIPMENT_OPTIONS: Equipment[] = ["None", "Dumbbells", "Barbell", "Resistance Bands", "Pull-Up Bar", "Machine", "Kettlebell"];
export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  imageUrl: string | null;
  videoUrl: string | null;
}

export const exercises: Exercise[] = [
  // ─── Strength ──────────────────────────────────────────────────────────────
  {
    id: "1", name: "Barbell Bench Press", description: "Compound chest pressing movement using a barbell on a flat bench.",
    category: "Strength", muscleGroup: "Chest", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Lie flat on bench with feet on the floor.", "Grip barbell slightly wider than shoulder-width.", "Unrack and lower bar to mid-chest.", "Press bar up until arms are extended."],
    tips: ["Keep shoulder blades retracted.", "Drive feet into the floor for stability."],
    commonMistakes: ["Flaring elbows to 90°.", "Bouncing bar off chest.", "Lifting hips off bench."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "2", name: "Incline Dumbbell Press", description: "Upper chest focused pressing on an inclined bench with dumbbells.",
    category: "Strength", muscleGroup: "Chest", equipment: "Dumbbells", difficulty: "Intermediate",
    instructions: ["Set bench to 30-45°.", "Hold dumbbells at shoulder level.", "Press up and slightly inward.", "Lower with control."],
    tips: ["Don't set bench too high.", "Control the negative phase."],
    commonMistakes: ["Bench angle too steep.", "Not controlling descent.", "Excessive lower back arch."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "3", name: "Deadlift", description: "Full body compound lift pulling a barbell from the floor to standing position.",
    category: "Strength", muscleGroup: "Back", equipment: "Barbell", difficulty: "Advanced",
    instructions: ["Stand with feet hip-width, bar over mid-foot.", "Hinge at hips, grip bar outside knees.", "Brace core, drive through legs.", "Stand tall, lock hips at top."],
    tips: ["Keep bar close to body.", "Engage lats before pulling."],
    commonMistakes: ["Rounding lower back.", "Bar drifting forward.", "Jerking the weight off floor."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "4", name: "Barbell Squat", description: "Compound lower body exercise with barbell on upper back.",
    category: "Strength", muscleGroup: "Quadriceps", equipment: "Barbell", difficulty: "Advanced",
    instructions: ["Unrack bar on upper traps.", "Step back, feet shoulder-width.", "Squat down until thighs are parallel.", "Drive up through heels."],
    tips: ["Keep chest up throughout.", "Push knees out over toes."],
    commonMistakes: ["Knees caving inward.", "Rising on toes.", "Leaning too far forward."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "5", name: "Overhead Press", description: "Shoulder pressing a barbell from shoulders to overhead while standing.",
    category: "Strength", muscleGroup: "Shoulders", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Hold bar at shoulder height.", "Brace core, squeeze glutes.", "Press bar overhead.", "Lock out elbows at top."],
    tips: ["Move head out of the way during press.", "Stack bar over midfoot at lockout."],
    commonMistakes: ["Excessive back lean.", "Pressing in front of face.", "Not locking out."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "6", name: "Barbell Row", description: "Compound back exercise pulling a barbell toward the lower chest from a hinged position.",
    category: "Strength", muscleGroup: "Back", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Hinge forward with flat back.", "Grip bar just outside knees.", "Pull bar to lower chest.", "Lower with control."],
    tips: ["Squeeze shoulder blades at top.", "Keep torso angle consistent."],
    commonMistakes: ["Using momentum.", "Standing too upright.", "Rounding back."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "7", name: "Romanian Deadlift", description: "Hip hinge movement targeting hamstrings and glutes with barbell.",
    category: "Strength", muscleGroup: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Hold bar at hip height.", "Hinge hips back, slight knee bend.", "Lower bar along legs to mid-shin.", "Drive hips forward to stand."],
    tips: ["Feel stretch in hamstrings.", "Keep bar against legs."],
    commonMistakes: ["Rounding lower back.", "Bending knees too much.", "Looking up excessively."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "8", name: "Leg Press", description: "Machine-based quad-dominant pressing movement.",
    category: "Strength", muscleGroup: "Quadriceps", equipment: "Machine", difficulty: "Beginner",
    instructions: ["Sit in machine, feet shoulder-width on platform.", "Unlock safety, lower platform.", "Press until legs are nearly straight.", "Do not lock knees at top."],
    tips: ["Place feet higher for more glute focus.", "Keep lower back pressed against pad."],
    commonMistakes: ["Locking knees out.", "Lifting hips off pad.", "Too narrow foot placement."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "9", name: "Dumbbell Lateral Raise", description: "Isolation exercise for lateral deltoids.",
    category: "Strength", muscleGroup: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner",
    instructions: ["Stand holding dumbbells at sides.", "Raise arms to shoulder height.", "Lead with elbows, slight forward lean.", "Lower with control."],
    tips: ["Use lighter weight with strict form.", "Pause briefly at the top."],
    commonMistakes: ["Using momentum.", "Raising too high.", "Shrugging shoulders."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "10", name: "Barbell Curl", description: "Bicep isolation exercise using a straight barbell.",
    category: "Strength", muscleGroup: "Biceps", equipment: "Barbell", difficulty: "Beginner",
    instructions: ["Stand with barbell, palms forward.", "Curl bar toward shoulders.", "Squeeze biceps at top.", "Lower slowly."],
    tips: ["Keep elbows pinned to sides.", "Avoid swinging body."],
    commonMistakes: ["Swinging weight.", "Moving elbows forward.", "Incomplete range of motion."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "11", name: "Skull Crusher", description: "Tricep isolation using EZ bar or barbell lying on a bench.",
    category: "Strength", muscleGroup: "Triceps", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Lie on bench, hold bar above chest.", "Bend elbows, lower bar to forehead.", "Extend elbows to press bar up.", "Keep upper arms stationary."],
    tips: ["Angle arms slightly back for stretch.", "Use controlled tempo."],
    commonMistakes: ["Flaring elbows.", "Moving upper arms.", "Going too heavy."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "12", name: "Walking Lunge", description: "Unilateral leg exercise stepping forward with dumbbells.",
    category: "Strength", muscleGroup: "Quadriceps", equipment: "Dumbbells", difficulty: "Beginner",
    instructions: ["Hold dumbbells at sides.", "Step forward into lunge.", "Lower back knee toward floor.", "Push off front foot and step forward."],
    tips: ["Keep torso upright.", "Take large enough steps."],
    commonMistakes: ["Front knee past toes.", "Leaning forward.", "Short steps."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "13", name: "Cable Fly", description: "Chest isolation using cable machine for constant tension.",
    category: "Strength", muscleGroup: "Chest", equipment: "Machine", difficulty: "Beginner",
    instructions: ["Set cables at chest height.", "Step forward with slight lean.", "Bring handles together in hugging motion.", "Squeeze at center, return slowly."],
    tips: ["Keep slight bend in elbows.", "Focus on squeezing chest."],
    commonMistakes: ["Straightening arms.", "Using too much weight.", "Losing body position."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "14", name: "Lat Pulldown", description: "Cable back exercise pulling a wide bar to upper chest.",
    category: "Strength", muscleGroup: "Back", equipment: "Machine", difficulty: "Beginner",
    instructions: ["Grip bar wider than shoulders.", "Lean back slightly.", "Pull bar to upper chest.", "Control the return."],
    tips: ["Drive elbows toward hips.", "Imagine pulling with back, not arms."],
    commonMistakes: ["Pulling behind neck.", "Leaning too far back.", "Using momentum."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "15", name: "Face Pull", description: "Rear delt and upper back exercise using cable rope attachment.",
    category: "Strength", muscleGroup: "Shoulders", equipment: "Machine", difficulty: "Beginner",
    instructions: ["Set cable at face height.", "Pull rope toward face.", "Externally rotate at end.", "Return with control."],
    tips: ["Keep elbows high.", "Squeeze rear delts hard."],
    commonMistakes: ["Using too much weight.", "Pulling too low.", "Not externally rotating."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "16", name: "Hammer Curl", description: "Bicep and brachialis exercise with neutral grip dumbbells.",
    category: "Strength", muscleGroup: "Biceps", equipment: "Dumbbells", difficulty: "Beginner",
    instructions: ["Hold dumbbells with palms facing in.", "Curl weights to shoulders.", "Keep elbows at sides.", "Lower slowly."],
    tips: ["Alternate arms or do both together.", "Squeeze at top."],
    commonMistakes: ["Swinging body.", "Rotating wrists.", "Using momentum."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "17", name: "Wrist Curl", description: "Forearm isolation exercise curling weight with wrists.",
    category: "Strength", muscleGroup: "Forearms", equipment: "Dumbbells", difficulty: "Beginner",
    instructions: ["Sit, forearms resting on thighs.", "Hold dumbbells with palms up.", "Curl wrists up.", "Lower slowly."],
    tips: ["Use light weight, high reps.", "Full range of motion."],
    commonMistakes: ["Moving forearms.", "Going too heavy.", "Rushing reps."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "18", name: "Hip Thrust", description: "Glute-focused exercise driving hips upward against resistance.",
    category: "Strength", muscleGroup: "Glutes", equipment: "Barbell", difficulty: "Intermediate",
    instructions: ["Upper back on bench, feet flat.", "Place barbell across hips.", "Drive hips up squeezing glutes.", "Lower under control."],
    tips: ["Tuck chin at top.", "Push through heels."],
    commonMistakes: ["Hyperextending lower back.", "Feet too far forward.", "Not squeezing at top."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "19", name: "Calf Raise", description: "Isolation exercise for calves using bodyweight or machine.",
    category: "Strength", muscleGroup: "Calves", equipment: "Machine", difficulty: "Beginner",
    instructions: ["Stand on platform edge, heels hanging.", "Rise up onto toes.", "Pause at top.", "Lower until calves stretch."],
    tips: ["Full range of motion.", "Pause at top and bottom."],
    commonMistakes: ["Bouncing.", "Partial reps.", "Going too fast."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "20", name: "Kettlebell Swing", description: "Explosive hip hinge movement using a kettlebell for full body conditioning.",
    category: "Strength", muscleGroup: "Full Body", equipment: "Kettlebell", difficulty: "Intermediate",
    instructions: ["Stand over kettlebell, feet wider than shoulders.", "Hike kettlebell between legs.", "Drive hips forward explosively.", "Let kettlebell float to chest height."],
    tips: ["It's a hip hinge, not a squat.", "Arms are just hooks."],
    commonMistakes: ["Squatting instead of hinging.", "Using arms to lift.", "Rounding back."],
    imageUrl: null, videoUrl: null
  },

  // ─── Calisthenics ──────────────────────────────────────────────────────────
  {
    id: "21", name: "Push-Up", description: "Fundamental bodyweight pressing exercise for chest, shoulders, and triceps.",
    category: "Calisthenics", muscleGroup: "Chest", equipment: "None", difficulty: "Beginner",
    instructions: ["Start in high plank, hands wider than shoulders.", "Lower chest to floor.", "Keep body in straight line.", "Push back up."],
    tips: ["Engage core throughout.", "Elbows at 45° angle."],
    commonMistakes: ["Sagging hips.", "Flaring elbows.", "Not full range."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "22", name: "Pull-Up", description: "Upper body pulling exercise hanging from a bar with overhand grip.",
    category: "Calisthenics", muscleGroup: "Back", equipment: "Pull-Up Bar", difficulty: "Intermediate",
    instructions: ["Hang from bar with overhand grip.", "Pull chest toward bar.", "Squeeze back at top.", "Lower with control."],
    tips: ["Initiate with scapular retraction.", "Aim to get chin over bar."],
    commonMistakes: ["Kipping.", "Not full extension at bottom.", "Using only arms."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "23", name: "Chin-Up", description: "Underhand grip pulling exercise emphasizing biceps and back.",
    category: "Calisthenics", muscleGroup: "Back", equipment: "Pull-Up Bar", difficulty: "Intermediate",
    instructions: ["Hang with palms facing you.", "Pull chin above bar.", "Squeeze at top.", "Lower fully."],
    tips: ["Supinated grip hits biceps more.", "Control descent."],
    commonMistakes: ["Half reps.", "Excessive swinging.", "Shrugging shoulders."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "24", name: "Dip", description: "Compound pressing movement on parallel bars for chest and triceps.",
    category: "Calisthenics", muscleGroup: "Triceps", equipment: "None", difficulty: "Intermediate",
    instructions: ["Support yourself on parallel bars.", "Lower body until upper arms are parallel to floor.", "Press back up to lockout.", "Lean forward for more chest."],
    tips: ["Keep elbows close for tricep focus.", "Lean forward for chest focus."],
    commonMistakes: ["Going too deep.", "Flaring elbows.", "Shrugging shoulders."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "25", name: "Muscle-Up", description: "Advanced transition from pull-up to dip on a bar.",
    category: "Calisthenics", muscleGroup: "Full Body", equipment: "Pull-Up Bar", difficulty: "Advanced",
    instructions: ["Hang from bar with false grip.", "Pull explosively, lead with chest.", "Transition over the bar.", "Press to full extension above bar."],
    tips: ["Master pull-ups and dips first.", "Practice explosive pulling."],
    commonMistakes: ["Kipping too much.", "No false grip.", "Not pulling high enough."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "26", name: "Handstand Push-Up", description: "Inverted pressing exercise against a wall or freestanding.",
    category: "Calisthenics", muscleGroup: "Shoulders", equipment: "None", difficulty: "Advanced",
    instructions: ["Kick up to handstand against wall.", "Lower head toward floor.", "Press back up to full extension.", "Maintain tight core."],
    tips: ["Start with wall support.", "Use headstand position to build strength."],
    commonMistakes: ["Arching back.", "Elbows flaring wide.", "Not full range of motion."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "27", name: "Pistol Squat", description: "Single-leg squat to full depth without support.",
    category: "Calisthenics", muscleGroup: "Quadriceps", equipment: "None", difficulty: "Advanced",
    instructions: ["Stand on one leg.", "Extend other leg forward.", "Squat down to full depth.", "Stand back up without wobbling."],
    tips: ["Use a counterbalance initially.", "Stretch ankle mobility."],
    commonMistakes: ["Knee caving.", "Falling backward.", "Not hitting full depth."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "28", name: "Plank", description: "Core stabilization exercise holding a rigid body position.",
    category: "Calisthenics", muscleGroup: "Core", equipment: "None", difficulty: "Beginner",
    instructions: ["Forearms on ground, elbows under shoulders.", "Body in straight line from head to heels.", "Engage core, squeeze glutes.", "Hold for time."],
    tips: ["Don't hold breath.", "Tuck pelvis slightly."],
    commonMistakes: ["Hips sagging.", "Hips piking up.", "Not engaging core."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "29", name: "Hollow Hold", description: "Gymnastics core exercise maintaining a hollow body shape.",
    category: "Calisthenics", muscleGroup: "Core", equipment: "None", difficulty: "Intermediate",
    instructions: ["Lie on back, arms overhead.", "Lift arms, shoulders, and legs off floor.", "Press lower back into ground.", "Hold the hollow position."],
    tips: ["Start with bent knees if needed.", "Focus on pressing back flat."],
    commonMistakes: ["Lower back lifting off floor.", "Holding breath.", "Neck strain."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "30", name: "Front Lever", description: "Advanced static hold hanging horizontally from a bar.",
    category: "Calisthenics", muscleGroup: "Back", equipment: "Pull-Up Bar", difficulty: "Advanced",
    instructions: ["Hang from bar.", "Retract scapulae hard.", "Lift body to horizontal position.", "Maintain straight body line."],
    tips: ["Progress through tuck, advanced tuck, straddle.", "Strengthen lats with rows."],
    commonMistakes: ["Body not horizontal.", "Bent hips.", "Not enough scapular depression."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "31", name: "Back Lever", description: "Gymnastics static hold in inverted horizontal position from a bar.",
    category: "Calisthenics", muscleGroup: "Shoulders", equipment: "Pull-Up Bar", difficulty: "Advanced",
    instructions: ["Skin the cat to inverted hang.", "Slowly lower body toward horizontal.", "Keep arms straight.", "Hold when body is parallel to ground."],
    tips: ["Build shoulder flexibility first.", "Start with tuck variations."],
    commonMistakes: ["Insufficient shoulder mobility.", "Bent arms.", "Arched back."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "32", name: "L-Sit", description: "Core and hip flexor hold with legs parallel to ground while supported on hands.",
    category: "Calisthenics", muscleGroup: "Core", equipment: "None", difficulty: "Intermediate",
    instructions: ["Place hands on floor or parallettes.", "Press body up, lock elbows.", "Raise legs to parallel.", "Hold position."],
    tips: ["Start with tucked legs.", "Point toes for full expression."],
    commonMistakes: ["Bent legs.", "Rounded shoulders.", "Not pressing through hands."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "33", name: "Handstand", description: "Inverted balance hold on hands, freestanding or against wall.",
    category: "Calisthenics", muscleGroup: "Shoulders", equipment: "None", difficulty: "Advanced",
    instructions: ["Place hands shoulder-width on floor.", "Kick up to inverted position.", "Stack shoulders, hips, and ankles.", "Balance through fingertips."],
    tips: ["Practice against wall first.", "Look at hands, not behind you."],
    commonMistakes: ["Arching back.", "Hands too wide.", "Not engaging core."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "34", name: "Australian Pull-Up", description: "Inverted row using a low bar for back and biceps.",
    category: "Calisthenics", muscleGroup: "Back", equipment: "Pull-Up Bar", difficulty: "Beginner",
    instructions: ["Grip low bar, body underneath.", "Keep body straight, heels on ground.", "Pull chest to bar.", "Lower with control."],
    tips: ["Great pull-up progression.", "Elevate feet to increase difficulty."],
    commonMistakes: ["Hips sagging.", "Not pulling to chest.", "Shrugging shoulders."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "35", name: "Diamond Push-Up", description: "Close-grip push-up variation targeting triceps.",
    category: "Calisthenics", muscleGroup: "Triceps", equipment: "None", difficulty: "Intermediate",
    instructions: ["Hands together forming a diamond.", "Lower chest to hands.", "Keep elbows close to body.", "Push back up."],
    tips: ["Harder than regular push-ups.", "Focus on tricep engagement."],
    commonMistakes: ["Flaring elbows.", "Sagging hips.", "Hands too far from chest."],
    imageUrl: null, videoUrl: null
  },

  // ─── Cardio ────────────────────────────────────────────────────────────────
  {
    id: "36", name: "Burpee", description: "Full body conditioning exercise combining squat, push-up, and jump.",
    category: "Cardio", muscleGroup: "Full Body", equipment: "None", difficulty: "Intermediate",
    instructions: ["Stand, then squat down, hands on floor.", "Jump feet back to plank.", "Do a push-up.", "Jump feet forward and explode up."],
    tips: ["Move with rhythm.", "Land softly on jumps."],
    commonMistakes: ["Skipping push-up.", "Not full extension on jump.", "Sloppy plank position."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "37", name: "Mountain Climber", description: "Dynamic core and cardio exercise driving knees toward chest from plank.",
    category: "Cardio", muscleGroup: "Core", equipment: "None", difficulty: "Beginner",
    instructions: ["Start in high plank.", "Drive one knee toward chest.", "Quickly switch legs.", "Maintain plank position throughout."],
    tips: ["Keep hips level.", "Increase speed for more cardio."],
    commonMistakes: ["Hips bouncing up.", "Not driving knees fully.", "Hands ahead of shoulders."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "38", name: "Jump Squat", description: "Explosive lower body exercise combining squat with a vertical jump.",
    category: "Cardio", muscleGroup: "Quadriceps", equipment: "None", difficulty: "Beginner",
    instructions: ["Stand with feet shoulder-width.", "Squat down.", "Explode upward jumping.", "Land softly and repeat."],
    tips: ["Land with bent knees.", "Use arms for momentum."],
    commonMistakes: ["Landing with straight legs.", "Shallow squat.", "Knees caving."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "39", name: "Box Jump", description: "Plyometric exercise jumping onto an elevated platform.",
    category: "Cardio", muscleGroup: "Quadriceps", equipment: "None", difficulty: "Intermediate",
    instructions: ["Stand facing box.", "Swing arms and jump onto box.", "Land softly with both feet.", "Stand fully, then step down."],
    tips: ["Start with lower box.", "Step down rather than jump down."],
    commonMistakes: ["Landing too hard.", "Not standing fully on top.", "Jumping down repeatedly."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "40", name: "Jumping Jacks", description: "Classic full body cardio exercise alternating arms and legs.",
    category: "Cardio", muscleGroup: "Full Body", equipment: "None", difficulty: "Beginner",
    instructions: ["Stand with feet together, arms at sides.", "Jump, spreading legs wide and arms overhead.", "Jump back to start.", "Repeat rhythmically."],
    tips: ["Keep a consistent pace.", "Land on balls of feet."],
    commonMistakes: ["Not full arm extension.", "Landing flat-footed.", "Inconsistent rhythm."],
    imageUrl: null, videoUrl: null
  },

  // ─── Mobility ──────────────────────────────────────────────────────────────
  {
    id: "41", name: "World's Greatest Stretch", description: "Dynamic full body mobility drill combining lunge with rotation.",
    category: "Mobility", muscleGroup: "Full Body", equipment: "None", difficulty: "Beginner",
    instructions: ["Step into a deep lunge.", "Place opposite hand on floor inside front foot.", "Rotate torso, reaching other arm to sky.", "Return and switch sides."],
    tips: ["Move slowly and controlled.", "Breathe into each position."],
    commonMistakes: ["Rushing through positions.", "Not rotating enough.", "Back knee on floor."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "42", name: "Cat-Cow Stretch", description: "Spinal mobility exercise alternating flexion and extension on all fours.",
    category: "Mobility", muscleGroup: "Back", equipment: "None", difficulty: "Beginner",
    instructions: ["Start on all fours.", "Arch back, drop belly (cow).", "Round back, tuck chin (cat).", "Flow between positions with breath."],
    tips: ["Sync movement with breathing.", "Move through full range."],
    commonMistakes: ["Moving too fast.", "Only moving mid-back.", "Holding breath."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "43", name: "90/90 Hip Switch", description: "Hip mobility drill transitioning between internal and external rotation.",
    category: "Mobility", muscleGroup: "Glutes", equipment: "None", difficulty: "Beginner",
    instructions: ["Sit with both legs at 90° angles.", "Front shin forward, back shin to side.", "Lift and switch legs to opposite position.", "Alternate sides smoothly."],
    tips: ["Keep torso upright.", "Move slowly with control."],
    commonMistakes: ["Using hands too much.", "Leaning back.", "Not achieving full 90° angles."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "44", name: "Thoracic Spine Rotation", description: "Rotational mobility drill for the upper back.",
    category: "Mobility", muscleGroup: "Back", equipment: "None", difficulty: "Beginner",
    instructions: ["Lie on side with knees stacked at 90°.", "Top arm extended forward.", "Rotate top arm open to other side.", "Return with control."],
    tips: ["Keep knees together.", "Follow hand with eyes."],
    commonMistakes: ["Lifting knee.", "Forcing range.", "Not breathing."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "45", name: "Deep Squat Hold", description: "Bottom-position squat hold for ankle, hip, and thoracic mobility.",
    category: "Mobility", muscleGroup: "Quadriceps", equipment: "None", difficulty: "Beginner",
    instructions: ["Squat down as deep as possible.", "Keep heels on ground.", "Hold bottom position.", "Use elbows to push knees out."],
    tips: ["Hold something for balance initially.", "Aim for 1-2 minutes."],
    commonMistakes: ["Heels rising.", "Rounding back.", "Not sitting deep enough."],
    imageUrl: null, videoUrl: null
  },

  // ─── Flexibility ───────────────────────────────────────────────────────────
  {
    id: "46", name: "Standing Hamstring Stretch", description: "Static stretch for the hamstrings from standing position.",
    category: "Flexibility", muscleGroup: "Hamstrings", equipment: "None", difficulty: "Beginner",
    instructions: ["Stand tall.", "Hinge at hips, reach toward toes.", "Keep legs straight but knees not locked.", "Hold 30 seconds."],
    tips: ["Breathe deeply while holding.", "Focus on hinging, not rounding."],
    commonMistakes: ["Rounding back.", "Bouncing.", "Locking knees."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "47", name: "Pigeon Stretch", description: "Deep hip flexor and glute stretch in a pigeon pose.",
    category: "Flexibility", muscleGroup: "Glutes", equipment: "None", difficulty: "Intermediate",
    instructions: ["From plank, bring one knee forward.", "Lay front shin on ground.", "Extend back leg straight behind.", "Sink hips toward floor."],
    tips: ["Square hips to front.", "Use cushion under hip if needed."],
    commonMistakes: ["Collapsing to one side.", "Back foot not straight.", "Forcing depth."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "48", name: "Couch Stretch", description: "Intense quad and hip flexor stretch using a wall or couch.",
    category: "Flexibility", muscleGroup: "Quadriceps", equipment: "None", difficulty: "Intermediate",
    instructions: ["Kneel with back foot against wall.", "Front foot flat, 90° angle.", "Push hips forward.", "Squeeze glute of back leg."],
    tips: ["Start gently.", "Keep torso upright."],
    commonMistakes: ["Arching lower back.", "Front knee past toes.", "Not squeezing glute."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "49", name: "Chest Doorway Stretch", description: "Pec and anterior shoulder stretch using a doorframe.",
    category: "Flexibility", muscleGroup: "Chest", equipment: "None", difficulty: "Beginner",
    instructions: ["Place forearm against doorframe at 90°.", "Step through with same-side foot.", "Lean forward until stretch is felt.", "Hold 30 seconds each side."],
    tips: ["Try different arm angles for different fibers.", "Don't over-stretch."],
    commonMistakes: ["Shrugging shoulder.", "Rotating torso too much.", "Not holding long enough."],
    imageUrl: null, videoUrl: null
  },
  {
    id: "50", name: "Seated Spinal Twist", description: "Rotational flexibility exercise for the spine while seated.",
    category: "Flexibility", muscleGroup: "Core", equipment: "None", difficulty: "Beginner",
    instructions: ["Sit with legs extended.", "Cross one foot over opposite knee.", "Rotate toward bent knee.", "Use opposite elbow against knee for leverage."],
    tips: ["Sit up tall throughout.", "Breathe into the twist."],
    commonMistakes: ["Rounding back.", "Forcing the twist.", "Holding breath."],
    imageUrl: null, videoUrl: null
  },
];
