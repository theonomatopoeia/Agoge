// ═══════════════════════════════════════════════════════════════
// WORKOUT PROGRAMS (A / B / C) + ALT ACTIVITIES
// ═══════════════════════════════════════════════════════════════

export const WORKOUT_PROGRAMS = {
  A: {
    name: 'PADDLE POWER + ROTATION',
    focus: 'Upper body pull, rotational core, hip mobility',
    why: '54% of surf time is paddling. Builds lat endurance, scapular stability, and rotational trunk strength.',
    sources: 'Cris Mills (Surf Strength Coach), Cody Thompson (Surfer Mag), The Inertia',
    warmup: [
      { exercise: '90/90 Hip Switches', sets: '2×8 each', notes: 'Open tight hips. Sit tall, rotate at hips.' },
      { exercise: 'Band Pull-Aparts', sets: '2×15', notes: 'Rear delt + scapular warmup.' },
      { exercise: 'Cat-Cow + Thread the Needle', sets: '1 min each', notes: 'T-spine mobility before pulling.' },
    ],
    main: [
      { exercise: 'Cable Row (seated or standing)', sets: '4×10', notes: 'Primary paddle muscle builder.' },
      { exercise: 'Bulgarian Split Squat', sets: '3×8 each leg', notes: "Cody Thompson's #1 lower body pick." },
      { exercise: 'Half-Kneeling Cable Chop (high to low)', sets: '3×10 each side', notes: 'Rotational power for turns.' },
      { exercise: 'Single-Arm Dumbbell Row', sets: '3×10 each', notes: 'Anti-rotation + pulling strength.' },
      { exercise: 'Goblet Squat', sets: '3×10', notes: 'Front-loaded squat. Knee-friendly.' },
    ],
    finisher: [
      { exercise: 'Face Pulls', sets: '3×15', notes: 'Shoulder prehab.' },
      { exercise: 'Dead Hang', sets: '2×30sec', notes: 'Shoulder decompression + grip.' },
      { exercise: 'Supine Hip Flexor Stretch', sets: '2×45sec each', notes: 'For tight hips.' },
    ],
  },

  B: {
    name: 'EXPLOSIVE POWER + LEGS',
    focus: 'Lower body power, single-leg stability, anti-rotation core',
    why: 'Generating speed, loading off the bottom, and absorbing landings demand explosive single-leg power.',
    sources: 'Cody Thompson, Again Faster, Surf Strength Coach, Jaco Rehab',
    warmup: [
      { exercise: 'Hip CARs (Controlled Articular Rotations)', sets: '2×5 each direction', notes: 'Active hip range of motion.' },
      { exercise: 'Glute Bridges', sets: '2×12', notes: 'Glute activation for knee alignment.' },
      { exercise: 'Lunge + Reach Rotation', sets: '2×6 each', notes: 'Hip flexor + T-spine warmup.' },
    ],
    main: [
      { exercise: 'Kettlebell Swings', sets: '4×12', notes: 'Explosive hip power.' },
      { exercise: 'Single-Leg Romanian Deadlift (DB)', sets: '3×8 each', notes: 'Posterior chain + balance.' },
      { exercise: 'Box Jumps', sets: '4×5', notes: 'Lower body explosive power.' },
      { exercise: 'Pallof Press (cable)', sets: '3×10 each side', notes: 'Anti-rotation core.' },
      { exercise: 'Reverse Lunge to Knee Drive', sets: '3×8 each', notes: 'Pop-up drive pattern.' },
    ],
    finisher: [
      { exercise: 'TRX or Cable Y-T-W Raises', sets: '2×8 each position', notes: 'Shoulder endurance prehab.' },
      { exercise: 'Single-Leg Balance Reach (3-way)', sets: '2×5 each direction', notes: 'Stability in all planes.' },
      { exercise: 'Pigeon Stretch', sets: '2×45sec each', notes: 'Deep hip rotation stretch.' },
    ],
  },

  C: {
    name: 'PUSH + PADDLE ENDURANCE',
    focus: 'Upper body push, shoulder endurance, dynamic core',
    why: 'Pop-ups are explosive push-ups. Builds shoulder endurance and dynamic core for wave riding.',
    sources: 'Surf Strength Coach, Waterboyz, Cody Thompson, SurferToday',
    warmup: [
      { exercise: 'Foam Roll: T-spine + Lats', sets: '1 min each', notes: 'Tissue prep before pressing.' },
      { exercise: 'Shoulder CARs', sets: '2×5 each direction', notes: 'Full shoulder ROM.' },
      { exercise: 'Deep Squat Hold + Shift', sets: '1×60sec', notes: 'Ankle + hip mobility.' },
    ],
    main: [
      { exercise: 'Landmine Press (single arm)', sets: '3×8 each', notes: 'Shoulder-friendly pressing.' },
      { exercise: 'Front Squat (DB or Goblet)', sets: '4×8', notes: 'Anterior-loaded squat. Core + quads.' },
      { exercise: 'Push-Up to Rotation (T-Push-Up)', sets: '3×6 each side', notes: 'Pop-up + rotation pattern.' },
      { exercise: 'Cable Low-to-High Chop', sets: '3×10 each side', notes: 'Rotational power.' },
      { exercise: 'Farmer Carry', sets: '3×40m', notes: 'Grip + shoulder stability.' },
    ],
    finisher: [
      { exercise: 'Band External Rotations', sets: '2×15 each', notes: 'Rotator cuff endurance.' },
      { exercise: 'Hanging Leg Raises (or knee tucks)', sets: '3×10', notes: 'Lower abs + hip flexors.' },
      { exercise: 'Half-Kneeling Hip Flexor Stretch', sets: '2×45sec each', notes: 'Key for tight hips.' },
    ],
  },
};

export const ALT_ACTIVITIES = {
  run: {
    name: 'Trail Run',
    duration: '30-45 min',
    icon: '🏃',
    detail: 'Interval run: 5 min warmup, 8×(30s sprint/90s jog), 5 min cooldown.',
  },
  mtb: {
    name: 'MTB Ride',
    duration: '45-60 min',
    icon: '🚵',
    detail: 'Cross-training cardio without joint impact.',
  },
  yoga: {
    name: 'Yoga / Mobility',
    duration: '30-40 min',
    icon: '🧘',
    detail: 'Hip openers, T-spine rotation, shoulder stretches.',
  },
};
