import type { Food } from '../types'

export const allFoods: Food[] = [
  // ========================
  // PROTEINS (22 foods)
  // ========================
  {
    id: 'chicken_breast',
    name: 'Blanc de poulet',
    servingGrams: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    servings: [{ name: '1 filet', grams: 150 }, { name: '1/2 filet', grams: 75 }],
    tags: ['protein', 'viande', 'volaille']
  },
  {
    id: 'turkey_breast',
    name: 'Blanc de dinde',
    servingGrams: 100,
    calories: 135,
    protein: 30,
    carbs: 0,
    fats: 1,
    servings: [{ name: '1 filet', grams: 120 }, { name: '2 tranches', grams: 60 }],
    tags: ['protein', 'viande', 'volaille']
  },
  {
    id: 'beef_steak',
    name: 'Steak de boeuf',
    servingGrams: 100,
    calories: 271,
    protein: 26,
    carbs: 0,
    fats: 18,
    servings: [{ name: '1 steak', grams: 150 }, { name: '1 pavé', grams: 200 }],
    tags: ['protein', 'viande', 'boeuf']
  },
  {
    id: 'ground_beef_5',
    name: 'Boeuf hache 5% MG',
    servingGrams: 100,
    calories: 137,
    protein: 21,
    carbs: 0,
    fats: 5,
    tags: ['protein', 'viande', 'boeuf']
  },
  {
    id: 'ground_beef_15',
    name: 'Boeuf hache 15% MG',
    servingGrams: 100,
    calories: 218,
    protein: 19,
    carbs: 0,
    fats: 15,
    tags: ['protein', 'viande', 'boeuf']
  },
  {
    id: 'salmon',
    name: 'Saumon',
    servingGrams: 100,
    calories: 208,
    protein: 20,
    carbs: 0,
    fats: 13,
    tags: ['protein', 'poisson', 'omega3']
  },
  {
    id: 'tuna',
    name: 'Thon (en boite, nature)',
    servingGrams: 100,
    calories: 116,
    protein: 26,
    carbs: 0,
    fats: 1,
    tags: ['protein', 'poisson']
  },
  {
    id: 'shrimp',
    name: 'Crevettes',
    servingGrams: 100,
    calories: 99,
    protein: 24,
    carbs: 0.2,
    fats: 0.3,
    tags: ['protein', 'fruits_de_mer']
  },
  {
    id: 'pork_loin',
    name: 'Filet mignon de porc',
    servingGrams: 100,
    calories: 143,
    protein: 26,
    carbs: 0,
    fats: 3.5,
    tags: ['protein', 'viande', 'porc']
  },
  {
    id: 'whole_egg',
    name: 'Oeuf entier',
    servingGrams: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fats: 11,
    tags: ['protein', 'oeuf']
  },
  {
    id: 'egg_whites',
    name: 'Blancs d\'oeuf',
    servingGrams: 100,
    calories: 52,
    protein: 11,
    carbs: 0.7,
    fats: 0.2,
    tags: ['protein', 'oeuf']
  },
  {
    id: 'whey_protein',
    name: 'Whey protéine',
    servingGrams: 30,
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1.5,
    tags: ['protein', 'supplement']
  },
  {
    id: 'casein_protein',
    name: 'Caseine',
    servingGrams: 30,
    calories: 115,
    protein: 24,
    carbs: 3,
    fats: 1,
    tags: ['protein', 'supplement']
  },
  {
    id: 'tofu',
    name: 'Tofu ferme',
    servingGrams: 100,
    calories: 144,
    protein: 17,
    carbs: 3,
    fats: 8,
    tags: ['protein', 'vegetal', 'soja']
  },
  {
    id: 'tempeh',
    name: 'Tempeh',
    servingGrams: 100,
    calories: 192,
    protein: 20,
    carbs: 8,
    fats: 11,
    tags: ['protein', 'vegetal', 'soja']
  },
  {
    id: 'seitan',
    name: 'Seitan',
    servingGrams: 100,
    calories: 370,
    protein: 75,
    carbs: 14,
    fats: 2,
    tags: ['protein', 'vegetal']
  },
  {
    id: 'cod',
    name: 'Cabillaud (morue)',
    servingGrams: 100,
    calories: 82,
    protein: 18,
    carbs: 0,
    fats: 0.7,
    tags: ['protein', 'poisson']
  },
  {
    id: 'sardines',
    name: 'Sardines (en boite)',
    servingGrams: 100,
    calories: 208,
    protein: 25,
    carbs: 0,
    fats: 11,
    tags: ['protein', 'poisson', 'omega3']
  },
  {
    id: 'duck_breast',
    name: 'Magret de canard (sans peau)',
    servingGrams: 100,
    calories: 133,
    protein: 22,
    carbs: 0,
    fats: 4.5,
    tags: ['protein', 'viande', 'volaille']
  },
  {
    id: 'veal',
    name: 'Escalope de veau',
    servingGrams: 100,
    calories: 172,
    protein: 24,
    carbs: 0,
    fats: 8,
    tags: ['protein', 'viande']
  },
  {
    id: 'lamb',
    name: 'Gigot d\'agneau',
    servingGrams: 100,
    calories: 258,
    protein: 25,
    carbs: 0,
    fats: 17,
    tags: ['protein', 'viande']
  },
  {
    id: 'chicken_thigh',
    name: 'Cuisse de poulet (sans peau)',
    servingGrams: 100,
    calories: 177,
    protein: 24,
    carbs: 0,
    fats: 8,
    tags: ['protein', 'viande', 'volaille']
  },

  // ========================
  // CARBS / GRAINS (16 foods)
  // ========================
  {
    id: 'white_rice',
    name: 'Riz blanc (cuit)',
    servingGrams: 100,
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fats: 0.3,
    tags: ['carb', 'cereale']
  },
  {
    id: 'brown_rice',
    name: 'Riz complet (cuit)',
    servingGrams: 100,
    calories: 123,
    protein: 2.6,
    carbs: 26,
    fats: 0.9,
    tags: ['carb', 'cereale', 'complet']
  },
  {
    id: 'pasta',
    name: 'Pâtes (cuites)',
    servingGrams: 100,
    calories: 131,
    protein: 5,
    carbs: 25,
    fats: 1.1,
    tags: ['carb', 'cereale']
  },
  {
    id: 'oats',
    name: 'Flocons d\'avoine (secs)',
    servingGrams: 100,
    calories: 389,
    protein: 17,
    carbs: 66,
    fats: 7,
    tags: ['carb', 'cereale', 'complet']
  },
  {
    id: 'quinoa',
    name: 'Quinoa (cuit)',
    servingGrams: 100,
    calories: 120,
    protein: 4.4,
    carbs: 21,
    fats: 1.9,
    tags: ['carb', 'cereale', 'complet']
  },
  {
    id: 'sweet_potato',
    name: 'Patate douce (cuite)',
    servingGrams: 100,
    calories: 90,
    protein: 2,
    carbs: 21,
    fats: 0.1,
    tags: ['carb', 'tubercule']
  },
  {
    id: 'potato',
    name: 'Pomme de terre (cuite)',
    servingGrams: 100,
    calories: 87,
    protein: 1.9,
    carbs: 20,
    fats: 0.1,
    tags: ['carb', 'tubercule']
  },
  {
    id: 'bread_white',
    name: 'Pain blanc',
    servingGrams: 100,
    calories: 265,
    protein: 9,
    carbs: 49,
    fats: 3.2,
    tags: ['carb', 'cereale']
  },
  {
    id: 'bread_whole',
    name: 'Pain complet',
    servingGrams: 100,
    calories: 247,
    protein: 13,
    carbs: 41,
    fats: 3.4,
    tags: ['carb', 'cereale', 'complet']
  },
  {
    id: 'bagel',
    name: 'Bagel',
    servingGrams: 100,
    calories: 270,
    protein: 10,
    carbs: 53,
    fats: 1.6,
    tags: ['carb', 'cereale']
  },
  {
    id: 'couscous',
    name: 'Semoule de couscous (cuite)',
    servingGrams: 100,
    calories: 112,
    protein: 3.8,
    carbs: 23,
    fats: 0.2,
    tags: ['carb', 'cereale']
  },
  {
    id: 'bulgur',
    name: 'Boulgour (cuit)',
    servingGrams: 100,
    calories: 83,
    protein: 3.1,
    carbs: 19,
    fats: 0.2,
    tags: ['carb', 'cereale', 'complet']
  },
  {
    id: 'corn',
    name: 'Mais (en conserve)',
    servingGrams: 100,
    calories: 86,
    protein: 3.2,
    carbs: 19,
    fats: 1.2,
    tags: ['carb', 'legume']
  },
  {
    id: 'rice_cakes',
    name: 'Galettes de riz',
    servingGrams: 100,
    calories: 387,
    protein: 8,
    carbs: 82,
    fats: 2.8,
    tags: ['carb', 'snack']
  },
  {
    id: 'tortilla',
    name: 'Tortilla de ble',
    servingGrams: 100,
    calories: 312,
    protein: 8.3,
    carbs: 52,
    fats: 8,
    tags: ['carb', 'cereale']
  },
  {
    id: 'pita',
    name: 'Pain pita',
    servingGrams: 100,
    calories: 275,
    protein: 9.1,
    carbs: 56,
    fats: 1.2,
    tags: ['carb', 'cereale']
  },

  // ========================
  // FRUITS (13 foods)
  // ========================
  {
    id: 'banana',
    name: 'Banane',
    servingGrams: 100,
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fats: 0.3,
    servings: [{ name: '1 banane', grams: 120 }],
    tags: ['fruit', 'carb']
  },
  {
    id: 'apple',
    name: 'Pomme',
    servingGrams: 100,
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fats: 0.2,
    servings: [{ name: '1 pomme', grams: 180 }],
    tags: ['fruit']
  },
  {
    id: 'orange',
    name: 'Orange',
    servingGrams: 100,
    calories: 47,
    protein: 0.9,
    carbs: 12,
    fats: 0.1,
    tags: ['fruit']
  },
  {
    id: 'strawberry',
    name: 'Fraises',
    servingGrams: 100,
    calories: 32,
    protein: 0.7,
    carbs: 7.7,
    fats: 0.3,
    tags: ['fruit']
  },
  {
    id: 'blueberry',
    name: 'Myrtilles',
    servingGrams: 100,
    calories: 57,
    protein: 0.7,
    carbs: 14,
    fats: 0.3,
    tags: ['fruit']
  },
  {
    id: 'mango',
    name: 'Mangue',
    servingGrams: 100,
    calories: 60,
    protein: 0.8,
    carbs: 15,
    fats: 0.4,
    tags: ['fruit']
  },
  {
    id: 'grapes',
    name: 'Raisins',
    servingGrams: 100,
    calories: 69,
    protein: 0.7,
    carbs: 18,
    fats: 0.2,
    tags: ['fruit']
  },
  {
    id: 'watermelon',
    name: 'Pasteque',
    servingGrams: 100,
    calories: 30,
    protein: 0.6,
    carbs: 7.6,
    fats: 0.2,
    tags: ['fruit']
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    servingGrams: 100,
    calories: 61,
    protein: 1.1,
    carbs: 15,
    fats: 0.5,
    tags: ['fruit']
  },
  {
    id: 'pineapple',
    name: 'Ananas',
    servingGrams: 100,
    calories: 50,
    protein: 0.5,
    carbs: 13,
    fats: 0.1,
    tags: ['fruit']
  },
  {
    id: 'peach',
    name: 'Peche',
    servingGrams: 100,
    calories: 39,
    protein: 0.9,
    carbs: 10,
    fats: 0.3,
    tags: ['fruit']
  },
  {
    id: 'avocado',
    name: 'Avocat',
    servingGrams: 100,
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fats: 15,
    servings: [{ name: '1 avocat', grams: 200 }, { name: '1/2 avocat', grams: 100 }],
    tags: ['fruit', 'lipide', 'bon_gras']
  },
  {
    id: 'dates',
    name: 'Dattes',
    servingGrams: 100,
    calories: 277,
    protein: 1.8,
    carbs: 75,
    fats: 0.2,
    tags: ['fruit', 'fruits_secs']
  },

  // ========================
  // VEGETABLES (16 foods)
  // ========================
  {
    id: 'broccoli',
    name: 'Brocoli',
    servingGrams: 100,
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fats: 0.4,
    servings: [{ name: '1 portion', grams: 150 }],
    tags: ['legume']
  },
  {
    id: 'spinach',
    name: 'Epinards',
    servingGrams: 100,
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fats: 0.4,
    tags: ['legume']
  },
  {
    id: 'asparagus',
    name: 'Asperges',
    servingGrams: 100,
    calories: 20,
    protein: 2.2,
    carbs: 3.9,
    fats: 0.1,
    tags: ['legume']
  },
  {
    id: 'zucchini',
    name: 'Courgette',
    servingGrams: 100,
    calories: 17,
    protein: 1.2,
    carbs: 3.1,
    fats: 0.3,
    tags: ['legume']
  },
  {
    id: 'tomato',
    name: 'Tomate',
    servingGrams: 100,
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fats: 0.2,
    tags: ['legume']
  },
  {
    id: 'carrot',
    name: 'Carotte',
    servingGrams: 100,
    calories: 41,
    protein: 0.9,
    carbs: 10,
    fats: 0.2,
    tags: ['legume']
  },
  {
    id: 'bell_pepper',
    name: 'Poivron',
    servingGrams: 100,
    calories: 31,
    protein: 1,
    carbs: 6,
    fats: 0.3,
    tags: ['legume']
  },
  {
    id: 'cucumber',
    name: 'Concombre',
    servingGrams: 100,
    calories: 15,
    protein: 0.7,
    carbs: 3.6,
    fats: 0.1,
    tags: ['legume']
  },
  {
    id: 'green_beans',
    name: 'Haricots verts',
    servingGrams: 100,
    calories: 31,
    protein: 1.8,
    carbs: 7,
    fats: 0.2,
    tags: ['legume']
  },
  {
    id: 'mushroom',
    name: 'Champignons',
    servingGrams: 100,
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fats: 0.3,
    tags: ['legume']
  },
  {
    id: 'onion',
    name: 'Oignon',
    servingGrams: 100,
    calories: 40,
    protein: 1.1,
    carbs: 9.3,
    fats: 0.1,
    tags: ['legume', 'condiment']
  },
  {
    id: 'garlic',
    name: 'Ail',
    servingGrams: 100,
    calories: 149,
    protein: 6.4,
    carbs: 33,
    fats: 0.5,
    tags: ['legume', 'condiment']
  },
  {
    id: 'kale',
    name: 'Chou frise (kale)',
    servingGrams: 100,
    calories: 49,
    protein: 4.3,
    carbs: 9,
    fats: 0.9,
    tags: ['legume']
  },
  {
    id: 'cauliflower',
    name: 'Chou-fleur',
    servingGrams: 100,
    calories: 25,
    protein: 1.9,
    carbs: 5,
    fats: 0.3,
    tags: ['legume']
  },
  {
    id: 'eggplant',
    name: 'Aubergine',
    servingGrams: 100,
    calories: 25,
    protein: 1,
    carbs: 6,
    fats: 0.2,
    tags: ['legume']
  },
  {
    id: 'lettuce',
    name: 'Laitue',
    servingGrams: 100,
    calories: 15,
    protein: 1.4,
    carbs: 2.9,
    fats: 0.2,
    tags: ['legume']
  },

  // ========================
  // DAIRY (9 foods)
  // ========================
  {
    id: 'greek_yogurt',
    name: 'Yaourt grec nature',
    servingGrams: 100,
    calories: 97,
    protein: 9,
    carbs: 3.6,
    fats: 5,
    tags: ['produit_laitier', 'protein']
  },
  {
    id: 'skyr',
    name: 'Skyr nature',
    servingGrams: 100,
    calories: 63,
    protein: 11,
    carbs: 4,
    fats: 0.2,
    tags: ['produit_laitier', 'protein']
  },
  {
    id: 'whole_milk',
    name: 'Lait entier',
    servingGrams: 100,
    calories: 64,
    protein: 3.3,
    carbs: 4.8,
    fats: 3.6,
    tags: ['produit_laitier']
  },
  {
    id: 'cottage_cheese',
    name: 'Fromage blanc / cottage cheese',
    servingGrams: 100,
    calories: 98,
    protein: 11,
    carbs: 3.4,
    fats: 4.3,
    tags: ['produit_laitier', 'protein']
  },
  {
    id: 'mozzarella',
    name: 'Mozzarella',
    servingGrams: 100,
    calories: 280,
    protein: 22,
    carbs: 2.2,
    fats: 17,
    tags: ['produit_laitier', 'fromage']
  },
  {
    id: 'cheddar',
    name: 'Cheddar',
    servingGrams: 100,
    calories: 403,
    protein: 25,
    carbs: 1.3,
    fats: 33,
    tags: ['produit_laitier', 'fromage']
  },
  {
    id: 'cream_cheese',
    name: 'Fromage frais a tartiner (cream cheese)',
    servingGrams: 100,
    calories: 342,
    protein: 6,
    carbs: 4,
    fats: 34,
    tags: ['produit_laitier', 'fromage']
  },
  {
    id: 'butter',
    name: 'Beurre',
    servingGrams: 100,
    calories: 717,
    protein: 0.9,
    carbs: 0.1,
    fats: 81,
    tags: ['produit_laitier', 'lipide']
  },
  {
    id: 'cream',
    name: 'Crème fraiche epaisse',
    servingGrams: 100,
    calories: 292,
    protein: 2.1,
    carbs: 2.8,
    fats: 30,
    tags: ['produit_laitier', 'lipide']
  },

  // ========================
  // LEGUMES (7 foods)
  // ========================
  {
    id: 'lentils',
    name: 'Lentilles (cuites)',
    servingGrams: 100,
    calories: 116,
    protein: 9,
    carbs: 20,
    fats: 0.4,
    tags: ['legumineuse', 'protein', 'carb']
  },
  {
    id: 'chickpeas',
    name: 'Pois chiches (cuits)',
    servingGrams: 100,
    calories: 164,
    protein: 9,
    carbs: 27,
    fats: 2.6,
    tags: ['legumineuse', 'protein', 'carb']
  },
  {
    id: 'black_beans',
    name: 'Haricots noirs (cuits)',
    servingGrams: 100,
    calories: 132,
    protein: 9,
    carbs: 24,
    fats: 0.5,
    tags: ['legumineuse', 'protein', 'carb']
  },
  {
    id: 'red_beans',
    name: 'Haricots rouges (cuits)',
    servingGrams: 100,
    calories: 127,
    protein: 9,
    carbs: 22,
    fats: 0.5,
    tags: ['legumineuse', 'protein', 'carb']
  },
  {
    id: 'edamame',
    name: 'Edamame',
    servingGrams: 100,
    calories: 121,
    protein: 12,
    carbs: 9,
    fats: 5,
    tags: ['legumineuse', 'protein', 'soja']
  },
  {
    id: 'green_peas',
    name: 'Petits pois',
    servingGrams: 100,
    calories: 81,
    protein: 5.4,
    carbs: 14,
    fats: 0.4,
    tags: ['legumineuse', 'legume']
  },
  {
    id: 'white_beans',
    name: 'Haricots blancs (cuits)',
    servingGrams: 100,
    calories: 139,
    protein: 10,
    carbs: 25,
    fats: 0.5,
    tags: ['legumineuse', 'protein', 'carb']
  },

  // ========================
  // NUTS & SEEDS (9 foods)
  // ========================
  {
    id: 'almonds',
    name: 'Amandes',
    servingGrams: 100,
    calories: 579,
    protein: 21,
    carbs: 22,
    fats: 50,
    servings: [{ name: '1 poignée', grams: 30 }],
    tags: ['noix', 'lipide', 'snack']
  },
  {
    id: 'walnuts',
    name: 'Noix',
    servingGrams: 100,
    calories: 654,
    protein: 15,
    carbs: 14,
    fats: 65,
    servings: [{ name: '1 poignée', grams: 30 }],
    tags: ['noix', 'lipide', 'omega3']
  },
  {
    id: 'peanuts',
    name: 'Cacahuetes',
    servingGrams: 100,
    calories: 567,
    protein: 26,
    carbs: 16,
    fats: 49,
    tags: ['noix', 'lipide', 'protein']
  },
  {
    id: 'cashews',
    name: 'Noix de cajou',
    servingGrams: 100,
    calories: 553,
    protein: 18,
    carbs: 30,
    fats: 44,
    tags: ['noix', 'lipide']
  },
  {
    id: 'peanut_butter',
    name: 'Beurre de cacahuete',
    servingGrams: 100,
    calories: 588,
    protein: 25,
    carbs: 20,
    fats: 50,
    tags: ['noix', 'lipide', 'protein']
  },
  {
    id: 'almond_butter',
    name: 'Puree d\'amandes',
    servingGrams: 100,
    calories: 614,
    protein: 21,
    carbs: 19,
    fats: 56,
    tags: ['noix', 'lipide']
  },
  {
    id: 'chia_seeds',
    name: 'Graines de chia',
    servingGrams: 100,
    calories: 486,
    protein: 17,
    carbs: 42,
    fats: 31,
    tags: ['graine', 'omega3', 'fibre']
  },
  {
    id: 'flax_seeds',
    name: 'Graines de lin',
    servingGrams: 100,
    calories: 534,
    protein: 18,
    carbs: 29,
    fats: 42,
    tags: ['graine', 'omega3', 'fibre']
  },
  {
    id: 'sunflower_seeds',
    name: 'Graines de tournesol',
    servingGrams: 100,
    calories: 584,
    protein: 21,
    carbs: 20,
    fats: 51,
    tags: ['graine', 'lipide']
  },

  // ========================
  // OILS & FATS (5 foods)
  // ========================
  {
    id: 'olive_oil',
    name: 'Huile d\'olive',
    servingGrams: 100,
    calories: 884,
    protein: 0,
    carbs: 0,
    fats: 100,
    tags: ['lipide', 'huile', 'bon_gras']
  },
  {
    id: 'coconut_oil',
    name: 'Huile de coco',
    servingGrams: 100,
    calories: 862,
    protein: 0,
    carbs: 0,
    fats: 100,
    tags: ['lipide', 'huile']
  },
  {
    id: 'ghee',
    name: 'Ghee (beurre clarifie)',
    servingGrams: 100,
    calories: 876,
    protein: 0,
    carbs: 0,
    fats: 99.5,
    tags: ['lipide', 'produit_laitier']
  },
  {
    id: 'sesame_oil',
    name: 'Huile de sesame',
    servingGrams: 100,
    calories: 884,
    protein: 0,
    carbs: 0,
    fats: 100,
    tags: ['lipide', 'huile']
  },
  {
    id: 'canola_oil',
    name: 'Huile de colza',
    servingGrams: 100,
    calories: 884,
    protein: 0,
    carbs: 0,
    fats: 100,
    tags: ['lipide', 'huile', 'omega3']
  },

  // ========================
  // SNACKS & OTHER (10 foods)
  // ========================
  {
    id: 'dark_chocolate',
    name: 'Chocolat noir 70%',
    servingGrams: 100,
    calories: 598,
    protein: 7.8,
    carbs: 46,
    fats: 43,
    tags: ['snack', 'sucre']
  },
  {
    id: 'honey',
    name: 'Miel',
    servingGrams: 100,
    calories: 304,
    protein: 0.3,
    carbs: 82,
    fats: 0,
    tags: ['sucre', 'condiment']
  },
  {
    id: 'maple_syrup',
    name: 'Sirop d\'erable',
    servingGrams: 100,
    calories: 260,
    protein: 0,
    carbs: 67,
    fats: 0.1,
    tags: ['sucre', 'condiment']
  },
  {
    id: 'protein_bar',
    name: 'Barre protéinee',
    servingGrams: 60,
    calories: 220,
    protein: 20,
    carbs: 22,
    fats: 7,
    tags: ['snack', 'protein', 'supplement']
  },
  {
    id: 'granola',
    name: 'Granola',
    servingGrams: 100,
    calories: 471,
    protein: 10,
    carbs: 64,
    fats: 20,
    tags: ['snack', 'carb', 'cereale']
  },
  {
    id: 'rice_pudding',
    name: 'Riz au lait',
    servingGrams: 100,
    calories: 130,
    protein: 3.5,
    carbs: 20,
    fats: 4,
    tags: ['snack', 'produit_laitier', 'carb']
  },
  {
    id: 'dried_fruits_mix',
    name: 'Fruits secs (melange)',
    servingGrams: 100,
    calories: 359,
    protein: 3,
    carbs: 79,
    fats: 0.9,
    tags: ['snack', 'fruit', 'fruits_secs']
  },
  {
    id: 'coconut_flakes',
    name: 'Noix de coco rapee',
    servingGrams: 100,
    calories: 660,
    protein: 6.9,
    carbs: 24,
    fats: 62,
    tags: ['snack', 'lipide']
  },
  {
    id: 'hummus',
    name: 'Houmous',
    servingGrams: 100,
    calories: 166,
    protein: 8,
    carbs: 14,
    fats: 10,
    tags: ['snack', 'legumineuse']
  },
  {
    id: 'jam',
    name: 'Confiture',
    servingGrams: 100,
    calories: 250,
    protein: 0.4,
    carbs: 65,
    fats: 0.1,
    tags: ['sucre', 'condiment']
  }
]
