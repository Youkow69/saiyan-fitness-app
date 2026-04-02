import type { ProgramTemplate } from '../types'

export const specializedPrograms: ProgramTemplate[] = [
  // ──────────────────────────────────────────
  // 1. Specialisation Dos — Saga Bardock
  // ──────────────────────────────────────────
  {
    id: 'spec_back_bardock',
    name: 'Specialisation Dos - Saga Bardock',
    saga: 'Bardock',
    split: 'Push/Pull/Legs + Dos extra',
    goalTags: ['muscle_gain'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description:
      'Programme de specialisation dos avec 2 séances dos par semaine. Volume eleve sur les tirages verticaux et horizontaux pour un dos massif digne du pere de Goku.',
    sessions: [
      {
        id: 'bardock_back_heavy',
        name: 'Dos Lourd - Force de Bardock',
        focus: 'Dos epaisseur & force',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, repMin: 4, repMax: 6, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'barbell_row', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 },
          { exerciseId: 't_bar_row', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'pull_ups', sets: 3, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'bardock_push',
        name: 'Push - Assaut Saiyan',
        focus: 'Pectoraux, épaules, triceps',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'db_incliné_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'cable_fly', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'bardock_legs',
        name: 'Jambes - Puissance Kanassienne',
        focus: 'Quadriceps, ischios, fessiers',
        exercises: [
          { exerciseId: 'back_squat', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'standing_calf_raise', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'bardock_back_volume',
        name: 'Dos Volume - L\'Heritage',
        focus: 'Dos largeur & volume',
        exercises: [
          { exerciseId: 'lat_pulldown_wide', sets: 4, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'chest_supported_row', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'straight_arm_pulldown', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'chin_ups', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'hammer_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'reverse_fly_cable', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 2. Specialisation Épaules — Saga Broly
  // ──────────────────────────────────────────
  {
    id: 'spec_shoulders_broly',
    name: 'Specialisation Épaules - Saga Broly',
    saga: 'Broly',
    split: 'Épaules x2 / Upper / Lower',
    goalTags: ['muscle_gain'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description:
      'Épaules massives comme Broly le Legendaire. 2 séances épaules par semaine avec emphase sur les 3 faisceaux pour un look de guerrier Saiyan.',
    sessions: [
      {
        id: 'broly_shoulders_heavy',
        name: 'Épaules Force - Rage de Broly',
        focus: 'Épaules force & masse',
        exercises: [
          { exerciseId: 'overhead_press', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'db_shoulder_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'reverse_fly_db', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'upright_row', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_shrug', sets: 4, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'broly_upper',
        name: 'Upper - Puissance Legendaire',
        focus: 'Pecs, dos, bras',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'barbell_row', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'db_incliné_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'ez_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'skullcrusher', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'broly_lower',
        name: 'Lower - Assise Titanesque',
        focus: 'Quadriceps, ischios, fessiers',
        exercises: [
          { exerciseId: 'back_squat', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'bulgarian_split_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'standing_calf_raise', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'broly_shoulders_volume',
        name: 'Épaules Volume - Forme Legendaire',
        focus: 'Épaules volume & details',
        exercises: [
          { exerciseId: 'arnold_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_lateral_raise', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'machine_lateral_raise', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'reverse_fly_cable', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'front_raise', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'landmine_press_shoulder', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 3. Specialisation Jambes — Saga Hit
  // ──────────────────────────────────────────
  {
    id: 'spec_legs_hit',
    name: 'Specialisation Jambes - Saga Hit',
    saga: 'Hit',
    split: 'Upper / Legs x2 / Full',
    goalTags: ['muscle_gain', 'strength'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description:
      'Programme specialise jambes avec 2 séances dediees. Vitesse et puissance comme l\'assassin Hit. Quadriceps, ischios et fessiers au maximum.',
    sessions: [
      {
        id: 'hit_legs_quad',
        name: 'Jambes Quadri - Time Skip',
        focus: 'Quadriceps dominant',
        exercises: [
          { exerciseId: 'back_squat', sets: 5, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'hack_squat', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_extension', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'walking_lunges', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'standing_calf_raise', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'hit_upper',
        name: 'Upper - Precision Mortelle',
        focus: 'Haut du corps maintenance',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'barbell_row', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lateral_raise_db', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 2, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'hit_legs_posterior',
        name: 'Jambes Posterior - Flash Fist Crush',
        focus: 'Ischios, fessiers',
        exercises: [
          { exerciseId: 'romanian_deadlift', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'barbell_hip_thrust', sets: 4, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'bulgarian_split_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'good_morning', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'seated_calf_raise', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
        ],
      },
      {
        id: 'hit_full',
        name: 'Full Body - Pure Progress',
        focus: 'Full body equilibre',
        exercises: [
          { exerciseId: 'front_squat', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'db_bench_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_shoulder_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_curl', sets: 2, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'bar_pushdown', sets: 2, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 4. Home Gym Halteres uniquement — Saga Goku Black
  // ──────────────────────────────────────────
  {
    id: 'home_db_goku_black',
    name: 'Home Gym Halteres - Saga Goku Black',
    saga: 'Goku Black',
    split: 'Full Body A/B/C',
    goalTags: ['muscle_gain', 'recomp'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['home_gym'],
    daysPerWeek: 3,
    description:
      'Programme 100% halteres pour s\'entrainer a domicile. 3 séances full body differentes, inspirees de la determination sombre de Goku Black. Aucune machine necessaire.',
    sessions: [
      {
        id: 'gblack_full_a',
        name: 'Full A - Zero Mortels (Pecs/Dos)',
        focus: 'Pectoraux, dos, bras',
        exercises: [
          { exerciseId: 'db_bench_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_row', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_incliné_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_fly', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'db_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'db_overhead_extension', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'gblack_full_b',
        name: 'Full B - Rose (Jambes/Épaules)',
        focus: 'Jambes, épaules',
        exercises: [
          { exerciseId: 'goblet_squat', sets: 4, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_shoulder_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_rdl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'walking_lunges', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'reverse_fly_db', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'gblack_full_c',
        name: 'Full C - Divin (Mix complet)',
        focus: 'Full body equilibre',
        exercises: [
          { exerciseId: 'bulgarian_split_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_bench_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_row', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'arnold_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'hammer_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'single_leg_rdl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'db_pullover', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 5. Machines uniquement — Saga Androide 17 & 18
  // ──────────────────────────────────────────
  {
    id: 'machines_only_android',
    name: 'Machines Only - Saga Androide 17 & 18',
    saga: 'Androide 17 & 18',
    split: 'Push/Pull/Legs machines',
    goalTags: ['muscle_gain'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 3,
    description:
      'Programme 100% machines, parfait pour les débutants ou ceux qui preferent la securite guidee. Precision mecanique comme les Androides du Dr Gero.',
    sessions: [
      {
        id: 'android_push',
        name: 'Push - Systeme 18',
        focus: 'Pectoraux, épaules, triceps',
        exercises: [
          { exerciseId: 'machine_chest_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'smith_incliné_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'pec_deck', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'machine_shoulder_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'machine_lateral_raise', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'bar_pushdown', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'android_pull',
        name: 'Pull - Systeme 17',
        focus: 'Dos, biceps',
        exercises: [
          { exerciseId: 'lat_pulldown_wide', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'seated_row_machine', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lat_pulldown_close', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'straight_arm_pulldown', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'machine_preacher_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'cable_curl', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'android_legs',
        name: 'Legs - Puissance Infinie',
        focus: 'Quadriceps, ischios, mollets',
        exercises: [
          { exerciseId: 'leg_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'hack_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'seated_leg_curl', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'hip_abduction_machine', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'leg_press_calf_raise', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 6. Perte de gras (circuits) — Saga Buu
  // ──────────────────────────────────────────
  {
    id: 'fat_loss_buu',
    name: 'Perte de Gras Circuits - Saga Buu',
    saga: 'Buu',
    split: 'Circuits Full Body x3',
    goalTags: ['fat_loss'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 3,
    description:
      'Circuits a haute intensite pour maximiser la depense calorique. Temps de repos courts, tempo eleve. Transforme la graisse comme Buu absorbe l\'energie !',
    sessions: [
      {
        id: 'buu_circuit_a',
        name: 'Circuit A - Absorption',
        focus: 'Full body circuit',
        exercises: [
          { exerciseId: 'goblet_squat', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'push_ups', sets: 3, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'db_row', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'walking_lunges', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'mountain_climber', sets: 3, repMin: 15, repMax: 20, targetRir: 0, restSeconds: 30 },
          { exerciseId: 'plank', sets: 3, repMin: 30, repMax: 45, targetRir: 0, restSeconds: 30, note: 'Tenir en secondes' },
        ],
      },
      {
        id: 'buu_circuit_b',
        name: 'Circuit B - Transformation',
        focus: 'Full body circuit',
        exercises: [
          { exerciseId: 'kettlebell_swing', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'db_bench_press', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'step_ups', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'lateral_raise_db', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'russian_twist', sets: 3, repMin: 15, repMax: 20, targetRir: 0, restSeconds: 30 },
          { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 30 },
        ],
      },
      {
        id: 'buu_circuit_c',
        name: 'Circuit C - Annihilation',
        focus: 'Full body circuit',
        exercises: [
          { exerciseId: 'front_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'dips_chest', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'face_pull', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 30 },
          { exerciseId: 'v_ups', sets: 3, repMin: 12, repMax: 15, targetRir: 0, restSeconds: 30 },
          { exerciseId: 'farmers_walk', sets: 3, repMin: 30, repMax: 40, targetRir: 0, restSeconds: 45, note: 'Distance en metres' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 7. Reprise apres pause (3 semaines) — Saga Resurrection F
  // ──────────────────────────────────────────
  {
    id: 'comeback_resurrection_f',
    name: 'Reprise Progressive - Saga Resurrection F',
    saga: 'Resurrection F',
    split: 'Full Body progressif 3J',
    goalTags: ['muscle_gain', 'recomp'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 3,
    description:
      'Programme de reprise apres une pause prolongee. Volume et intensite progressifs sur 3 semaines. Comme Freezer qui revient plus fort, reprends l\'entraînement en douceur.',
    sessions: [
      {
        id: 'resf_week1',
        name: 'Semaine 1 - Reveil du Guerrier',
        focus: 'Full body leger, technique',
        exercises: [
          { exerciseId: 'leg_press', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 120 },
          { exerciseId: 'machine_chest_press', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 90 },
          { exerciseId: 'lat_pulldown_wide', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 90 },
          { exerciseId: 'machine_shoulder_press', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 90 },
          { exerciseId: 'lying_leg_curl', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 60 },
          { exerciseId: 'cable_curl', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 2, repMin: 12, repMax: 15, targetRir: 4, restSeconds: 60 },
        ],
      },
      {
        id: 'resf_week2',
        name: 'Semaine 2 - Montee en Puissance',
        focus: 'Full body modere',
        exercises: [
          { exerciseId: 'back_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 120 },
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 120 },
          { exerciseId: 'barbell_row', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'ez_curl', sets: 2, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 60 },
          { exerciseId: 'skullcrusher', sets: 2, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 60 },
        ],
      },
      {
        id: 'resf_week3',
        name: 'Semaine 3 - Forme Doree',
        focus: 'Full body intensite normale',
        exercises: [
          { exerciseId: 'back_squat', sets: 4, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'barbell_bench_press', sets: 4, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'barbell_row', sets: 4, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lateral_raise_db', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 8. Débutant total (2J tres simple) — Saga Saiyan
  // ──────────────────────────────────────────
  {
    id: 'beginner_saiyan_saga',
    name: 'Débutant Total - Saga Saiyan',
    saga: 'Saiyan',
    split: 'Full Body A/B',
    goalTags: ['muscle_gain', 'recomp'],
    levelTags: ['beginner'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 2,
    description:
      'Le tout premier programme pour ceux qui n\'ont jamais touche une barre. 2 jours par semaine, exercices simples, progression lineaire. Le debut de ton aventure comme Goku enfant.',
    sessions: [
      {
        id: 'saiyan_full_a',
        name: 'Full Body A - Premier Combat',
        focus: 'Mouvements de base',
        exercises: [
          { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 120 },
          { exerciseId: 'machine_chest_press', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'machine_shoulder_press', sets: 2, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'lying_leg_curl', sets: 2, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 60 },
          { exerciseId: 'plank', sets: 2, repMin: 20, repMax: 30, targetRir: 2, restSeconds: 60, note: 'Tenir en secondes' },
        ],
      },
      {
        id: 'saiyan_full_b',
        name: 'Full Body B - Kamehameha Débutant',
        focus: 'Mouvements de base bis',
        exercises: [
          { exerciseId: 'goblet_squat', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'db_bench_press', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'db_shoulder_press', sets: 2, repMin: 10, repMax: 12, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'leg_extension', sets: 2, repMin: 12, repMax: 15, targetRir: 3, restSeconds: 60 },
          { exerciseId: 'dead_bug', sets: 2, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 9. Athlete fonctionnel (3J compound + core) — Saga Tournament of Power
  // ──────────────────────────────────────────
  {
    id: 'functional_top',
    name: 'Athlete Fonctionnel - Tournoi du Pouvoir',
    saga: 'Tournoi du Pouvoir',
    split: 'Compound + Core 3J',
    goalTags: ['strength', 'endurance'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 3,
    description:
      'Programme axe sur les mouvements composes et le gainage fonctionnel. Performance athletique globale pour survivre au Tournoi du Pouvoir. Force, stabilite, endurance.',
    sessions: [
      {
        id: 'top_day_a',
        name: 'Jour A - Ultra Instinct',
        focus: 'Squat, press, core',
        exercises: [
          { exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'overhead_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'chin_ups', sets: 3, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'turkish_get_up', sets: 3, repMin: 3, repMax: 5, targetRir: 2, restSeconds: 90, note: 'Par cote' },
          { exerciseId: 'pallof_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'top_day_b',
        name: 'Jour B - Elimination',
        focus: 'Deadlift, bench, core',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, repMin: 4, repMax: 6, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'barbell_bench_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'barbell_row', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'farmers_walk', sets: 3, repMin: 30, repMax: 40, targetRir: 1, restSeconds: 90, note: 'Distance en metres' },
          { exerciseId: 'ab_wheel', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'woodchop', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'top_day_c',
        name: 'Jour C - Survie',
        focus: 'Olympique, puissance, core',
        exercises: [
          { exerciseId: 'front_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'clean_and_press', sets: 4, repMin: 3, repMax: 5, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'pull_ups', sets: 3, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'kettlebell_swing', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'bird_dog', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'side_plank', sets: 3, repMin: 20, repMax: 30, targetRir: 1, restSeconds: 45, note: 'Secondes par cote' },
          { exerciseId: 'dragon_flag', sets: 2, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 60 },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // 10. Powerlifting competition — Saga Cell
  // ──────────────────────────────────────────
  {
    id: 'powerlifting_cell',
    name: 'Powerlifting Competition - Saga Cell',
    saga: 'Cell',
    split: 'Squat / Bench / Deadlift / Accessoires',
    goalTags: ['strength'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description:
      'Programme de powerlifting axe sur les 3 mouvements de competition : squat, développé couche, souleve de terre. Recherche de la perfection comme Cell dans sa forme parfaite.',
    sessions: [
      {
        id: 'cell_squat',
        name: 'Squat Day - Premiere Forme',
        focus: 'Back squat & accessoires squat',
        exercises: [
          { exerciseId: 'back_squat', sets: 5, repMin: 3, repMax: 5, targetRir: 2, restSeconds: 240 },
          { exerciseId: 'front_squat', sets: 3, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'leg_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'good_morning', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'ab_wheel', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'cell_bench',
        name: 'Bench Day - Deuxieme Forme',
        focus: 'Développé couche & accessoires poussee',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 5, repMin: 3, repMax: 5, targetRir: 2, restSeconds: 240 },
          { exerciseId: 'close_grip_bench', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'db_incliné_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'dips_triceps', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'skullcrusher', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'cell_deadlift',
        name: 'Deadlift Day - Forme Semi-Parfaite',
        focus: 'Souleve de terre & chaine posterieure',
        exercises: [
          { exerciseId: 'deadlift', sets: 5, repMin: 2, repMax: 5, targetRir: 2, restSeconds: 240 },
          { exerciseId: 'deficit_deadlift', sets: 3, repMin: 4, repMax: 6, targetRir: 2, restSeconds: 180 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'barbell_row', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'hyperextension', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'barbell_shrug', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 },
        ],
      },
      {
        id: 'cell_accessories',
        name: 'Accessoires - Forme Parfaite',
        focus: 'Points faibles & volume',
        exercises: [
          { exerciseId: 'smith_squat', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'floor_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'rack_pull', sets: 3, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'glute_ham_raise', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },
,
  // ──────────────────────────────────────────
  // Starting Strength 3J - Saga Saiyan : Les debuts de Goku
  // ──────────────────────────────────────────
  {
    id: 'starting_strength_goku',
    name: 'Starting Strength - Les debuts de Goku',
    saga: 'Saiyan',
    split: 'Full Body A/B alterne',
    goalTags: ['strength'],
    levelTags: ['beginner'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 3,
    description: 'Le programme de Mark Rippetoe pour les debutants. 3 seances/semaine, progression lineaire sur les mouvements de base. Comme Goku qui apprend les fondamentaux du combat.',
    sessions: [
      {
        id: 'ss_workout_a',
        name: 'Workout A - Kamehameha basique',
        focus: 'Squat, Bench, Deadlift',
        exercises: [
          { exerciseId: 'back_squat', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'deadlift', sets: 1, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 240 },
        ],
      },
      {
        id: 'ss_workout_b',
        name: 'Workout B - Kaio-Ken debutant',
        focus: 'Squat, OHP, Power Clean',
        exercises: [
          { exerciseId: 'back_squat', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'power_clean', sets: 5, repMin: 3, repMax: 3, targetRir: 2, restSeconds: 150 },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────
  // PPL Reddit 6J - Saga Cell : Preparation au tournoi
  // ──────────────────────────────────────────
  {
    id: 'ppl_reddit_cell',
    name: 'PPL Reddit - Saga Cell',
    saga: 'Cell',
    split: 'Push/Pull/Legs x2',
    goalTags: ['muscle_gain'],
    levelTags: ['intermediate'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 6,
    description: 'Le celebre programme PPL de Reddit r/Fitness. 6 jours, volume eleve, ideal pour la prise de masse. Comme la preparation intense avant le Cell Games.',
    sessions: [
      {
        id: 'ppl_push_a',
        name: 'Push A - Kamehameha',
        focus: 'Pecs, epaules, triceps (force)',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 5, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_incliné_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'overhead_tricep_extension', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'ppl_pull_a',
        name: 'Pull A - Gravite x10',
        focus: 'Dos, biceps (force)',
        exercises: [
          { exerciseId: 'barbell_row', sets: 5, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'pull_ups', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 5, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'hammer_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'ppl_legs_a',
        name: 'Legs A - Power Oozaru',
        focus: 'Quadriceps, ischio, mollets',
        exercises: [
          { exerciseId: 'back_squat', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'romanian_deadlift', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'standing_calf_raise', sets: 5, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'ppl_push_b',
        name: 'Push B - Final Flash',
        focus: 'Pecs, epaules, triceps (volume)',
        exercises: [
          { exerciseId: 'overhead_press', sets: 5, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'db_bench_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_fly', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'skullcrusher', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'single_arm_pushdown', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'ppl_pull_b',
        name: 'Pull B - Spirit Bomb',
        focus: 'Dos, biceps (volume)',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, repMin: 5, repMax: 5, targetRir: 1, restSeconds: 240 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'chest_supported_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 5, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'ez_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'concentration_curl', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'ppl_legs_b',
        name: 'Legs B - Great Ape Fury',
        focus: 'Quadriceps, ischio, fessiers',
        exercises: [
          { exerciseId: 'front_squat', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'barbell_hip_thrust', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'bulgarian_split_squat', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'seated_leg_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'seated_calf_raise', sets: 5, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────
  // GZCLP 3-4J - Saga Ginyu : Maitrise du Ki
  // ──────────────────────────────────────────
  {
    id: 'gzclp_ginyu',
    name: 'GZCLP - Saga Ginyu',
    saga: 'Ginyu',
    split: 'Upper/Lower alterne',
    goalTags: ['strength', 'muscle_gain'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description: 'Le programme GZCLP de Cody Lefever. Structure T1/T2/T3 avec progression lineaire. Comme les forces Ginyu : technique, puissance et strategie.',
    sessions: [
      {
        id: 'gzclp_a1',
        name: 'A1 - Ginyu Force Pose',
        focus: 'T1 Squat, T2 Bench, T3 Accessoires',
        exercises: [
          { exerciseId: 'back_squat', sets: 5, repMin: 3, repMax: 3, targetRir: 1, restSeconds: 210 },
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 10, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 15, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'face_pull', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'gzclp_b1',
        name: 'B1 - Recoome Boom',
        focus: 'T1 OHP, T2 Deadlift, T3 Accessoires',
        exercises: [
          { exerciseId: 'overhead_press', sets: 5, repMin: 3, repMax: 3, targetRir: 1, restSeconds: 210 },
          { exerciseId: 'deadlift', sets: 3, repMin: 10, repMax: 10, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'db_row', sets: 3, repMin: 15, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lateral_raise_db', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'gzclp_a2',
        name: 'A2 - Jeice Red Magma',
        focus: 'T1 Bench, T2 Squat, T3 Accessoires',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 5, repMin: 3, repMax: 3, targetRir: 1, restSeconds: 210 },
          { exerciseId: 'back_squat', sets: 3, repMin: 10, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'chin_ups', sets: 3, repMin: 15, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'cable_fly', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: 'gzclp_b2',
        name: 'B2 - Burter Blue Hurricane',
        focus: 'T1 Deadlift, T2 OHP, T3 Accessoires',
        exercises: [
          { exerciseId: 'deadlift', sets: 5, repMin: 3, repMax: 3, targetRir: 1, restSeconds: 240 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 10, repMax: 10, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'cable_row_seated', sets: 3, repMin: 15, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────
  // PHUL 4J - Saga Buu : Power + Hypertrophie
  // ──────────────────────────────────────────
  {
    id: 'phul_buu',
    name: 'PHUL - Saga Buu',
    saga: 'Buu',
    split: 'Upper Power/Lower Power/Upper Hyper/Lower Hyper',
    goalTags: ['muscle_gain', 'strength'],
    levelTags: ['intermediate'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description: 'Power Hypertrophy Upper Lower. 2 jours force + 2 jours volume. Comme Buu qui combine puissance brute et regeneration massive.',
    sessions: [
      {
        id: 'phul_upper_power',
        name: 'Upper Power - Super Buu',
        focus: 'Haut du corps force',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 4, repMin: 3, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'barbell_row', sets: 4, repMin: 3, repMax: 5, targetRir: 1, restSeconds: 180 },
          { exerciseId: 'overhead_press', sets: 3, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 },
          { exerciseId: 'pull_ups', sets: 3, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'barbell_curl', sets: 2, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'skullcrusher', sets: 2, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'phul_lower_power',
        name: 'Lower Power - Kid Buu',
        focus: 'Bas du corps force',
        exercises: [
          { exerciseId: 'back_squat', sets: 4, repMin: 3, repMax: 5, targetRir: 1, restSeconds: 210 },
          { exerciseId: 'deadlift', sets: 3, repMin: 3, repMax: 5, targetRir: 1, restSeconds: 240 },
          { exerciseId: 'leg_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'standing_calf_raise', sets: 4, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'phul_upper_hyper',
        name: 'Upper Hypertrophie - Buu Gohan Absorbe',
        focus: 'Haut du corps volume',
        exercises: [
          { exerciseId: 'db_incliné_press', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'cable_row_seated', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'db_shoulder_press', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'cable_fly', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'ez_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'phul_lower_hyper',
        name: 'Lower Hypertrophie - Majin Vegeta Rage',
        focus: 'Bas du corps volume',
        exercises: [
          { exerciseId: 'front_squat', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'romanian_deadlift', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 120 },
          { exerciseId: 'bulgarian_split_squat', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'seated_leg_curl', sets: 3, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'seated_calf_raise', sets: 4, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 45 },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────
  // 5/3/1 BBB 4J - Saga DBS : Entrainement de Whis
  // ──────────────────────────────────────────
  {
    id: '531_bbb_whis',
    name: '5/3/1 BBB - Saga DBS',
    saga: 'DBS',
    split: '4 jours (Squat/Bench/Dead/OHP)',
    goalTags: ['strength', 'muscle_gain'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 4,
    description: 'Le classique 5/3/1 de Jim Wendler avec Boring But Big. Progression lente mais sure. La patience de Whis appliquee a la musculation.',
    sessions: [
      {
        id: '531_squat',
        name: 'Squat Day - Ultra Instinct Sign',
        focus: 'T1 Squat + BBB Squat + Accessoires',
        exercises: [
          { exerciseId: 'back_squat', sets: 3, repMin: 3, repMax: 5, targetRir: 0, restSeconds: 210 },
          { exerciseId: 'back_squat', sets: 5, repMin: 10, repMax: 10, targetRir: 3, restSeconds: 120 },
          { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: '531_bench',
        name: 'Bench Day - Hakai',
        focus: 'T1 Bench + BBB Bench + Accessoires',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 3, repMin: 3, repMax: 5, targetRir: 0, restSeconds: 180 },
          { exerciseId: 'barbell_bench_press', sets: 5, repMin: 10, repMax: 10, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'db_row', sets: 5, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'face_pull', sets: 3, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: '531_deadlift',
        name: 'Deadlift Day - Vegeta Royal Blue',
        focus: 'T1 Deadlift + BBB Deadlift + Accessoires',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, repMin: 3, repMax: 5, targetRir: 0, restSeconds: 240 },
          { exerciseId: 'deadlift', sets: 5, repMin: 10, repMax: 10, targetRir: 3, restSeconds: 150 },
          { exerciseId: 'barbell_hip_thrust', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'hyperextension', sets: 3, repMin: 12, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'plank', sets: 3, repMin: 30, repMax: 60, targetRir: 1, restSeconds: 60 },
        ],
      },
      {
        id: '531_ohp',
        name: 'OHP Day - Beerus Destruction',
        focus: 'T1 OHP + BBB OHP + Accessoires',
        exercises: [
          { exerciseId: 'overhead_press', sets: 3, repMin: 3, repMax: 5, targetRir: 0, restSeconds: 180 },
          { exerciseId: 'overhead_press', sets: 5, repMin: 10, repMax: 10, targetRir: 3, restSeconds: 90 },
          { exerciseId: 'chin_ups', sets: 5, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────
  // nSuns 5/3/1 LP 5J - Saga Namek : Gravite x100
  // ──────────────────────────────────────────
  {
    id: 'nsuns_namek',
    name: 'nSuns 5/3/1 LP - Saga Namek',
    saga: 'Namek',
    split: '5 jours haute intensite',
    goalTags: ['strength'],
    levelTags: ['intermediate'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 5,
    description: 'nSuns 531 LP : volume intense et progression rapide. 9 sets par exercice principal. La gravite x100 de la salle de Goku sur Namek.',
    sessions: [
      {
        id: 'nsuns_bench_ohp',
        name: 'Jour 1 - Bench/OHP',
        focus: 'T1 Bench Press + T2 OHP',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 9, repMin: 1, repMax: 8, targetRir: 0, restSeconds: 150 },
          { exerciseId: 'overhead_press', sets: 8, repMin: 3, repMax: 8, targetRir: 1, restSeconds: 120 },
          { exerciseId: 'db_row', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 15, targetRir: 1, restSeconds: 45 },
        ],
      },
      {
        id: 'nsuns_squat_sumo',
        name: 'Jour 2 - Squat/Sumo',
        focus: 'T1 Squat + T2 Sumo Deadlift',
        exercises: [
          { exerciseId: 'back_squat', sets: 9, repMin: 1, repMax: 8, targetRir: 0, restSeconds: 180 },
          { exerciseId: 'sumo_deadlift', sets: 8, repMin: 3, repMax: 8, targetRir: 1, restSeconds: 150 },
          { exerciseId: 'leg_extension', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'lying_leg_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'nsuns_ohp_incline',
        name: 'Jour 3 - OHP/Incline',
        focus: 'T1 OHP + T2 Incline Bench',
        exercises: [
          { exerciseId: 'overhead_press', sets: 9, repMin: 1, repMax: 8, targetRir: 0, restSeconds: 150 },
          { exerciseId: 'incliné_barbell_bench', sets: 8, repMin: 3, repMax: 8, targetRir: 1, restSeconds: 120 },
          { exerciseId: 'pull_ups', sets: 4, repMin: 6, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'face_pull', sets: 4, repMin: 15, repMax: 20, targetRir: 1, restSeconds: 45 },
        ],
      },
      {
        id: 'nsuns_dead_front',
        name: 'Jour 4 - Deadlift/Front Squat',
        focus: 'T1 Deadlift + T2 Front Squat',
        exercises: [
          { exerciseId: 'deadlift', sets: 9, repMin: 1, repMax: 8, targetRir: 0, restSeconds: 210 },
          { exerciseId: 'front_squat', sets: 8, repMin: 3, repMax: 8, targetRir: 1, restSeconds: 150 },
          { exerciseId: 'barbell_row', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 },
          { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
      {
        id: 'nsuns_bench_cg',
        name: 'Jour 5 - Bench/Close Grip',
        focus: 'T1 Bench Press + T2 Close Grip Bench',
        exercises: [
          { exerciseId: 'barbell_bench_press', sets: 9, repMin: 1, repMax: 8, targetRir: 0, restSeconds: 150 },
          { exerciseId: 'close_grip_bench', sets: 8, repMin: 3, repMax: 8, targetRir: 1, restSeconds: 120 },
          { exerciseId: 'cable_fly', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
          { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 2, restSeconds: 60 },
        ],
      },
    ],
  }
]
