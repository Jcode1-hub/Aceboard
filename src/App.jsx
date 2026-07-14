import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { SatTestRunner, PracticeTestSelect } from './BluebookQuizScreen';
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ── FIREBASE SETUP ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCS7MVGR91AbRjMsQHJyqlRRPCs7NIAYSk",
  authDomain: "ace-board-41d96.firebaseapp.com",
  projectId: "ace-board-41d96",
  storageBucket: "ace-board-41d96.firebasestorage.app",
  messagingSenderId: "897332027586",
  appId: "1:897332027586:web:aed8c40ed3f11c93f55b5b",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();


// ── DATA ──────────────────────────────────────────────────────────────────────
const EXAMS = ["WAEC", "NECO", "JAMB", "GCE", "IGCSE", "SAT", "ACT", "IELTS"];

const QUESTIONS = [
  // WAEC – Chemistry
  { id: 1, exam: "WAEC", year: 2023, subject: "Chemistry", topic: "Organic Chemistry", difficulty: "Medium",
    question: "Which of the following is the general formula for alkenes?",
    options: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙHₙ"],
    answer: 1, explanation: "Alkenes have one C=C double bond, giving the general formula CₙH₂ₙ. Alkanes are CₙH₂ₙ₊₂ and alkynes are CₙH₂ₙ₋₂.", source: "WAEC Chemistry 2023, Paper 1 Q14" },
  { id: 2, exam: "WAEC", year: 2022, subject: "Chemistry", topic: "Stoichiometry", difficulty: "Hard",
    question: "How many moles of oxygen are required to completely combust 2 moles of propane (C₃H₈)?",
    options: ["5 moles", "8 moles", "10 moles", "12 moles"],
    answer: 2, explanation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. For 2 moles of propane: 2 × 5 = 10 moles of O₂.", source: "WAEC Chemistry 2022, Paper 2 Q3" },
  { id: 3, exam: "WAEC", year: 2023, subject: "Biology", topic: "Cell Biology", difficulty: "Easy",
    question: "Which organelle is responsible for ATP production in eukaryotic cells?",
    options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi apparatus"],
    answer: 2, explanation: "The mitochondria is the 'powerhouse of the cell' — it produces ATP via cellular respiration through oxidative phosphorylation.", source: "WAEC Biology 2023, Paper 1 Q7" },
  { id: 4, exam: "WAEC", year: 2022, subject: "Biology", topic: "Genetics", difficulty: "Medium",
    question: "In a monohybrid cross between two heterozygous parents (Aa × Aa), what is the expected phenotypic ratio?",
    options: ["1:2:1", "3:1", "1:1", "2:1"],
    answer: 1, explanation: "Aa × Aa gives AA, Aa, Aa, aa. Since A is dominant, AA and Aa show dominant phenotype. Ratio = 3 dominant : 1 recessive.", source: "WAEC Biology 2022, Paper 1 Q22" },
  { id: 5, exam: "WAEC", year: 2023, subject: "Physics", topic: "Mechanics", difficulty: "Medium",
    question: "A body of mass 5 kg moving at 10 m/s has kinetic energy of:",
    options: ["25 J", "50 J", "250 J", "500 J"],
    answer: 2, explanation: "KE = ½mv² = ½ × 5 × 10² = ½ × 5 × 100 = 250 J.", source: "WAEC Physics 2023, Paper 1 Q11" },
  { id: 6, exam: "WAEC", year: 2022, subject: "Physics", topic: "Waves", difficulty: "Easy",
    question: "The speed of light in a vacuum is approximately:",
    options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10¹² m/s"],
    answer: 1, explanation: "The speed of light in vacuum c ≈ 3 × 10⁸ m/s. This is a fundamental constant in physics.", source: "WAEC Physics 2022, Paper 1 Q5" },
  { id: 7, exam: "WAEC", year: 2023, subject: "Mathematics", topic: "Algebra", difficulty: "Medium",
    question: "Solve for x: 2x² - 5x - 3 = 0",
    options: ["x = 3 or x = -½", "x = -3 or x = ½", "x = 3 or x = ½", "x = -3 or x = -½"],
    answer: 0, explanation: "Factorising: (2x + 1)(x - 3) = 0 → x = -½ or x = 3. So x = 3 or x = -½.", source: "WAEC Maths 2023, Paper 2 Q6" },
  { id: 8, exam: "WAEC", year: 2022, subject: "English Language", topic: "Lexis & Structure", difficulty: "Medium",
    question: "Choose the word that is closest in meaning to 'EPHEMERAL':",
    options: ["Permanent", "Transient", "Ancient", "Substantial"],
    answer: 1, explanation: "'Ephemeral' means lasting for a very short time. 'Transient' is the closest synonym, also meaning short-lived or temporary.", source: "WAEC English 2022, Paper 1 Q31" },
  // JAMB
  { id: 9, exam: "JAMB", year: 2023, subject: "Chemistry", topic: "Periodic Table", difficulty: "Easy",
    question: "Which group of elements in the periodic table are known as noble gases?",
    options: ["Group I", "Group VI", "Group VII", "Group VIII/0"],
    answer: 3, explanation: "Noble gases (He, Ne, Ar, Kr, Xe, Rn) occupy Group VIII or Group 0. They have full outer electron shells and are chemically inert.", source: "JAMB Chemistry 2023 Q18" },
  { id: 10, exam: "JAMB", year: 2022, subject: "Mathematics", topic: "Statistics", difficulty: "Medium",
    question: "Find the mean of: 4, 7, 2, 9, 8, 5, 1, 6, 3, 5",
    options: ["4.5", "5", "5.5", "6"],
    answer: 1, explanation: "Sum = 4+7+2+9+8+5+1+6+3+5 = 50. Mean = 50 ÷ 10 = 5.", source: "JAMB Maths 2022 Q7" },
  { id: 11, exam: "JAMB", year: 2023, subject: "English Language", topic: "Comprehension", difficulty: "Hard",
    question: "The word 'LOQUACIOUS' most nearly means:",
    options: ["Silent", "Talkative", "Angry", "Generous"],
    answer: 1, explanation: "'Loquacious' derives from Latin loqui (to speak) and means excessively talkative. Talkative is the correct synonym.", source: "JAMB Use of English 2023 Q44" },
  { id: 12, exam: "JAMB", year: 2022, subject: "Biology", topic: "Nutrition", difficulty: "Easy",
    question: "Which vitamin is produced in the skin when exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    answer: 3, explanation: "Vitamin D (calciferol) is synthesized in the skin when UV-B rays from sunlight convert 7-dehydrocholesterol to vitamin D3.", source: "JAMB Biology 2022 Q33" },
  // IGCSE
  { id: 16, exam: "IGCSE", year: 2022, subject: "Chemistry", topic: "Acids & Bases", difficulty: "Medium",
    question: "What is the pH of a neutral solution at 25°C?",
    options: ["0", "5", "7", "14"],
    answer: 2, explanation: "A neutral solution has equal concentrations of H⁺ and OH⁻ ions. At 25°C, this corresponds to a pH of exactly 7.", source: "Cambridge IGCSE Chemistry 2022, Paper 2 Q12" },
  { id: 17, exam: "IGCSE", year: 2023, subject: "Physics", topic: "Electricity", difficulty: "Medium",
    question: "Three resistors of 2Ω, 4Ω and 6Ω are connected in series. What is the total resistance?",
    options: ["1.09Ω", "4Ω", "12Ω", "48Ω"],
    answer: 2, explanation: "In series: R_total = R₁ + R₂ + R₃ = 2 + 4 + 6 = 12Ω. In parallel you'd use the reciprocal formula.", source: "Cambridge IGCSE Physics 2023, Paper 4 Q8" },
  // NECO
  { id: 18, exam: "NECO", year: 2022, subject: "Economics", topic: "Supply & Demand", difficulty: "Medium",
    question: "When the price of a good increases and quantity demanded falls, this illustrates:",
    options: ["The law of supply", "The law of demand", "Price elasticity of supply", "Consumer surplus"],
    answer: 1, explanation: "The law of demand states: all else equal, as price rises, quantity demanded falls. This is an inverse relationship.", source: "NECO Economics 2022 Q5" },
  { id: 19, exam: "NECO", year: 2023, subject: "Biology", topic: "Ecology", difficulty: "Easy",
    question: "Which of the following correctly describes a food chain?",
    options: ["Sun → Consumer → Producer → Decomposer", "Producer → Primary Consumer → Secondary Consumer → Tertiary Consumer",
              "Decomposer → Producer → Consumer", "Consumer → Producer → Sun"],
    answer: 1, explanation: "Energy flows from producers (plants) → primary consumers (herbivores) → secondary consumers → tertiary consumers. Decomposers break down dead matter at any level.", source: "NECO Biology 2023 Q17" },
  // GCE / A-Level
  { id: 20, exam: "GCE", year: 2022, subject: "Mathematics", topic: "Calculus", difficulty: "Hard",
    question: "Differentiate y = 3x⁴ - 2x³ + 5x - 7 with respect to x:",
    options: ["12x³ - 6x² + 5", "12x³ - 6x + 5", "4x³ - 3x² + 5", "12x⁴ - 6x³ + 5"],
    answer: 0, explanation: "Using power rule: d/dx(3x⁴) = 12x³, d/dx(-2x³) = -6x², d/dx(5x) = 5, d/dx(-7) = 0. So dy/dx = 12x³ - 6x² + 5.", source: "GCE A-Level Maths 2022, Paper 1 Q3" },
  // IGCSE – Mathematics (CIE 0580/11, real verified past paper questions)
  { id: 21, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Number", difficulty: "Easy",
    question: "Work out the number of months in 5 years.",
    options: ["50", "55", "60", "65"],
    answer: 2, explanation: "There are 12 months in a year, so 5 years = 5 × 12 = 60 months.", source: "CIE IGCSE Maths 0580/11, June 2023 Q1" },
  { id: 22, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Number", difficulty: "Easy",
    question: "Write 3752 correct to the nearest 100.",
    options: ["3700", "3750", "3800", "4000"],
    answer: 2, explanation: "Looking at the tens digit (5), which rounds up, 3752 rounded to the nearest 100 is 3800.", source: "CIE IGCSE Maths 0580/11, June 2023 Q2(b)" },
  { id: 23, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Money & Ratio", difficulty: "Medium",
    question: "Magazines cost $3.40 each. Rosina has $15 to buy as many magazines as possible. How many magazines can she buy, and how much money is left over?",
    options: ["4 magazines, $1.40 left", "3 magazines, $4.80 left", "4 magazines, $0.60 left", "5 magazines, $1.00 left"],
    answer: 0, explanation: "15 ÷ 3.40 = 4.41..., so she can afford 4 magazines. 4 × $3.40 = $13.60. $15 − $13.60 = $1.40 left over.", source: "CIE IGCSE Maths 0580/11, June 2023 Q3" },
  { id: 24, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Statistics", difficulty: "Medium",
    question: "Calculate the mean of these numbers: 21, 8, 15, 32, 3, 29, 19, 45, 8",
    options: ["18", "20", "22", "24"],
    answer: 1, explanation: "Sum = 21+8+15+32+3+29+19+45+8 = 180. There are 9 numbers, so mean = 180 ÷ 9 = 20.", source: "CIE IGCSE Maths 0580/11, June 2023 Q5" },
  { id: 25, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Fractions & Percentages", difficulty: "Medium",
    question: "Write these in order, starting with the smallest: 13/213, 1/5, 0.071, 0.7, 7%",
    options: ["13/213, 7%, 0.071, 1/5, 0.7", "0.071, 7%, 13/213, 1/5, 0.7", "7%, 13/213, 0.071, 1/5, 0.7", "13/213, 0.071, 7%, 1/5, 0.7"],
    answer: 0, explanation: "Converting all to decimals: 13/213 ≈ 0.061, 7% = 0.07, 0.071, 1/5 = 0.2, 0.7 = 0.7. Ordered smallest to largest: 13/213, 7%, 0.071, 1/5, 0.7.", source: "CIE IGCSE Maths 0580/11, June 2023 Q7" },
  { id: 26, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Fractions", difficulty: "Easy",
    question: "Write the fraction 84/24 in its simplest form.",
    options: ["7/2", "5/2", "3/1", "7/3"],
    answer: 0, explanation: "84/24 — both divide by 12: 84÷12 = 7, 24÷12 = 2. Simplest form is 7/2.", source: "CIE IGCSE Maths 0580/11, June 2023 Q8" },
  { id: 27, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Geometry & Mensuration", difficulty: "Medium",
    question: "Calculate the volume of a sphere with diameter 4.8 cm. (V = 4/3 πr³)",
    options: ["46.5 cm³", "57.9 cm³", "115.8 cm³", "28.9 cm³"],
    answer: 1, explanation: "Radius = 4.8 ÷ 2 = 2.4 cm. V = 4/3 × π × 2.4³ = 4/3 × π × 13.824 ≈ 57.9 cm³.", source: "CIE IGCSE Maths 0580/11, June 2023 Q13" },
  { id: 28, exam: "IGCSE", year: 2023, subject: "Mathematics", topic: "Probability", difficulty: "Medium",
    question: "Eric has four colours of paint. The probability he uses Red is 0.3, Blue is 0.35, Green is 0.13, and Yellow is x. Find the value of x.",
    options: ["0.18", "0.20", "0.22", "0.25"],
    answer: 2, explanation: "All probabilities must sum to 1: 0.3 + 0.35 + 0.13 + x = 1, so x = 1 − 0.78 = 0.22.", source: "CIE IGCSE Maths 0580/11, June 2023 Q15" },

{ id: 1001, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "The spacecraft OSIRIS-REx briefly made contact with the asteroid 101955 Bennu in 2020. NASA scientist Daniella DellaGiustina reports that despite facing the unexpected obstacle of a surface mostly covered in boulders, OSIRIS-REx successfully _______ a sample of the surface, gathering pieces of it to bring back to Earth.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["attached", "collected", "followed", "replaced"], answerType: "mcq", answer: 1,
    explanation: "The craft gathered pieces of the surface to bring back to Earth, so it 'collected' a sample." },
  { id: 1002, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Vocabulary in Context", difficulty: "Medium",
    passage: "Research conducted by planetary scientist Katarina Miljkovic suggests that the Moon's surface may not accurately _______ early impact events. When the Moon was still forming, its surface was softer, and asteroid or meteoroid impacts would have left less of an impression; thus, evidence of early impacts may no longer be present.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["reflect", "receive", "evaluate", "mimic"], answerType: "mcq", answer: 0,
    explanation: "Because early impacts left little trace, the surface may not accurately 'reflect' (show/represent) those events." },
  { id: 1003, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Vocabulary in Context", difficulty: "Medium",
    passage: "Handedness, a preferential use of either the right or left hand, typically is easy to observe in humans. Because this trait is present but less _______ in many other animals, animal-behavior researchers often employ tasks specially designed to reveal individual animals' preferences for a certain hand or paw.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["recognizable", "intriguing", "significant", "useful"], answerType: "mcq", answer: 0,
    explanation: "Since handedness is 'easy to observe' in humans but researchers need special tasks to reveal it in animals, it must be less recognizable/observable in animals." },
  { id: 1004, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Vocabulary in Context", difficulty: "Hard",
    passage: "It is by no means _______ to recognize the influence of Dutch painter Hieronymus Bosch on Ali Banisadr's paintings; indeed, Banisadr himself cites Bosch as an inspiration. However, some scholars have suggested that the ancient Mesopotamian poem Epic of Gilgamesh may have had a far greater impact on Banisadr's work.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["substantial", "satisfying", "unimportant", "appropriate"], answerType: "mcq", answer: 2,
    explanation: "Because Banisadr confirms Bosch's influence himself, recognizing it is clearly not unimportant; 'However' then introduces a competing view about relative significance." },
  { id: 1005, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Central Ideas and Details", difficulty: "Medium",
    passage: "The following text is adapted from Susan Glaspell's 1912 short story \"'Out There.'\" An elderly shop owner is looking at a picture that he recently acquired and hopes to sell.\n\nIt did seem that the picture failed to fit in with the rest of the shop. A persuasive young fellow who claimed he was closing out his stock let the old man have it for what he called a song. It was only a little out-of-the-way store which subsisted chiefly on the framing of pictures. The old man looked around at his views of the city, his pictures of cats and dogs, his flaming bits of landscape. \"Don't belong in here,\" he fumed.\n\nAnd yet the old man was secretly proud of his acquisition. There was a hidden dignity in his scowling as he shuffled about pondering the least ridiculous place for the picture.",
    question: "Which choice best states the main purpose of the text?",
    options: ["To reveal the shop owner's conflicted feelings about the new picture", "To convey the shop owner's resentment of the person he got the new picture from", "To describe the items that the shop owner most highly prizes", "To explain differences between the new picture and other pictures in the shop"], answerType: "mcq", answer: 0,
    explanation: "The shop owner fumes that the picture doesn't belong, yet is 'secretly proud' of it, showing conflicted feelings." },
  { id: 1006, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Text Structure and Purpose", difficulty: "Medium",
    passage: "The following text is from the 1923 poem \"Black Finger\" by Angelina Weld Grimke, a Black American writer. A cypress is a type of evergreen tree.\n\nI have just seen a most beautiful thing, / Slim and still, / Against a gold, gold sky, / A straight black cypress, / Sensitive, / Exquisite, / A black finger / Pointing upwards. / Why, beautiful still finger, are you black? / And why are you pointing upwards?",
    question: "Which choice best describes the overall structure of the text?",
    options: ["The speaker assesses a natural phenomenon, then questions the accuracy of her assessment.", "The speaker describes a distinctive sight in nature, then ponders what meaning to attribute to that sight.", "The speaker presents an outdoor scene, then considers a human behavior occurring within that scene.", "The speaker examines her surroundings, then speculates about their influence on her emotional state."], answerType: "mcq", answer: 1,
    explanation: "The speaker describes the cypress in detail, then asks questions probing what its blackness and upward pointing might mean." },
  { id: 1007, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Text Structure and Purpose", difficulty: "Medium",
    passage: "The following text is from Walt Whitman's 1860 poem \"Calamus 24.\"\n\nI HEAR it is charged against me that I seek to destroy institutions; / But really I am neither for nor against institutions / (What indeed have I in common with them?-- / Or what with the destruction of them?), / Only I will establish in the Mannahatta [Manhattan] and in every city of These States, inland and seaboard, / And in the fields and woods, and above every keel [ship] little or large, that dents the water, / Without edifices, or rules, or trustees, or any argument, / The institution of the dear love of comrades.",
    question: "Which choice best describes the overall structure of the text?",
    options: ["The speaker questions an increasingly prevalent attitude, then summarizes his worldview.", "The speaker regrets his isolation from others, then predicts a profound change in society.", "The speaker concedes his personal shortcomings, then boasts of his many achievements.", "The speaker addresses a criticism leveled against him, then announces a grand ambition of his."], answerType: "mcq", answer: 3,
    explanation: "The speaker responds to the charge that he seeks to destroy institutions, then declares his ambition to establish 'the institution of the dear love of comrades.'" },
  { id: 1008, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Text Structure and Purpose", difficulty: "Medium",
    passage: "The mimosa tree evolved in East Asia, where the beetle Bruchidius terrenus preys on its seeds. In 1785, mimosa trees were introduced to North America, far from any B. terrenus. But evolutionary links between predators and their prey can persist across centuries and continents. Around 2001, B. terrenus was introduced in southeastern North America near where botanist Shu-Mei Chang and colleagues had been monitoring mimosa trees. Within a year, 93 percent of the trees had been attacked by the beetles.",
    question: "Which choice best describes the function of the third sentence in the overall structure of the text?",
    options: ["It states the hypothesis that Chang and colleagues had set out to investigate using mimosa trees and B. terrenus.", "It presents a generalization that is exemplified by the discussion of the mimosa trees and B. terrenus.", "It offers an alternative explanation for the findings of Chang and colleagues.", "It provides context that clarifies why the species mentioned spread to new locations."], answerType: "mcq", answer: 1,
    explanation: "The sentence states a general principle (evolutionary links can persist across time/distance), which the mimosa/beetle case then illustrates." },
  { id: 1009, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Cross-Text Connections", difficulty: "Medium",
    passage: "Text 1\nConventional wisdom long held that human social systems evolved in stages, beginning with hunter-gatherers forming small bands of members with roughly equal status. The shift to agriculture about 12,000 years ago sparked population growth that led to the emergence of groups with hierarchical structures: associations of clans first, then chiefdoms, and finally, bureaucratic states.\n\nText 2\nIn a 2021 book, anthropologist David Graeber and archaeologist David Wengrow maintain that humans have always been socially flexible, alternately forming systems based on hierarchy and collective ones with decentralized leadership. The authors point to evidence that as far back as 50,000 years ago some hunter-gatherers adjusted their social structures seasonally, at times dispersing in small groups but also assembling into communities that included esteemed individuals.",
    question: "Based on the texts, how would Graeber and Wengrow (Text 2) most likely respond to the \"conventional wisdom\" presented in Text 1?",
    options: ["By conceding the importance of hierarchical systems but asserting the greater significance of decentralized collective societies", "By disputing the idea that developments in social structures have followed a linear progression through distinct stages", "By acknowledging that hierarchical roles likely weren't a part of social systems before the rise of agriculture", "By challenging the assumption that groupings of hunter-gatherers were among the earliest forms of social structure"], answerType: "mcq", answer: 1,
    explanation: "Graeber and Wengrow argue humans have 'always been socially flexible,' directly disputing the staged, linear progression described in Text 1." },
  { id: 1010, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Central Ideas and Details", difficulty: "Easy",
    passage: "The following text is adapted from Frances Hodgson Burnett's 1911 novel The Secret Garden. Mary, a young girl, recently found an overgrown hidden garden.\n\nMary was an odd, determined little person, and now she had something interesting to be determined about, she was very much absorbed, indeed. She worked and dug and pulled up weeds steadily, only becoming more pleased with her work every hour instead of tiring of it. It seemed to her like a fascinating sort of play.",
    question: "Which choice best states the main idea of the text?",
    options: ["Mary hides in the garden to avoid doing her chores.", "Mary is getting bored with pulling up so many weeds in the garden.", "Mary is clearing out the garden to create a space to play.", "Mary feels very satisfied when she's taking care of the garden."], answerType: "mcq", answer: 3,
    explanation: "Mary becomes 'more pleased with her work every hour' and finds the gardening 'fascinating,' showing satisfaction." },
  { id: 1011, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Central Ideas and Details", difficulty: "Medium",
    passage: "The following text is from Ezra Pound's 1909 poem \"Hymn III,\" based on the work of Marcantonio Flaminio.\n\nAs a fragile and lovely flower unfolds its gleaming foliage on the breast of the fostering earth, if the dew and the rain draw it forth; / So doth my tender mind flourish, if it be fed with the sweet dew of the fostering spirit, / Lacking this, it beginneth straightway to languish, even as a floweret born upon dry earth, if the dew and the rain tend it not.",
    question: "Based on the text, in what way is the human mind like a flower?",
    options: ["It becomes increasingly vigorous with the passage of time.", "It draws strength from changes in the weather.", "It requires proper nourishment in order to thrive.", "It perseveres despite challenging circumstances."], answerType: "mcq", answer: 2,
    explanation: "Just as a flower needs dew and rain to flourish, the mind needs to be 'fed' by the 'fostering spirit' or it will languish." },
  { id: 1012, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Central Ideas and Details", difficulty: "Medium",
    passage: "The following text is adapted from Jack London's 1903 novel The Call of the Wild. Buck is a sled dog living with John Thornton in Yukon, Canada.\n\nThornton alone held [Buck]. The rest of mankind was as nothing. Chance travellers might praise or pet him; but he was cold under it all, and from a too demonstrative man he would get up and walk away. When Thornton's partners, Hans and Pete, arrived on the long-expected raft, Buck refused to notice them till he learned they were close to Thornton; after that he tolerated them in a passive sort of way, accepting favors from them as though he favored them by accepting.",
    question: "Which choice best states the main idea of the text?",
    options: ["Buck has become less social since he began living with Thornton.", "Buck mistrusts humans and does his best to avoid them.", "Buck has been especially well liked by most of Thornton's friends.", "Buck holds Thornton in higher regard than any other person."], answerType: "mcq", answer: 3,
    explanation: "Buck is indifferent to everyone but Thornton, only tolerating others because of their closeness to him -- Thornton alone truly matters to Buck." },
  { id: 1013, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Quantitative Evidence", difficulty: "Medium",
    passage: "Organic farming is a method of growing food that tries to reduce environmental harm by using natural forms of pest control and avoiding fertilizers made with synthetic materials. Organic farms are still a small fraction of the total farms in the United States, but they have been becoming more popular. According to the US Department of Agriculture, in 2016 California had between 2,600 and 2,800 organic farms and _______\n\n[Bar graph: US States with Greatest Number of Organic Farms in 2016 -- California ~2,700; Wisconsin ~1,300; New York ~1,050; Pennsylvania ~800; Iowa ~700; Washington ~650]",
    question: "Which choice most effectively uses data from the graph to complete the text?",
    options: ["Washington had between 600 and 800 organic farms.", "New York had fewer than 800 organic farms.", "Wisconsin and Iowa each had between 1,200 and 1,400 organic farms.", "Pennsylvania had more than 1,200 organic farms."], answerType: "mcq", answer: 0,
    explanation: "The graph shows Washington with roughly 650 organic farms, which falls in the 600-800 range; the other options misstate the graph's values." },
  { id: 1014, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Command of Evidence", difficulty: "Medium",
    passage: "Biologist Valentina Gomez-Bahamon and her team have investigated two subspecies of the fork-tailed flycatcher bird that live in the same region in Colombia, but one subspecies migrates south for part of the year, and the other doesn't. The researchers found that, due to slight differences in feather shape, the feathers of migratory fork-tailed flycatcher males make a sound during flight that is higher pitched than that made by the feathers of nonmigratory males. The researchers hypothesize that fork-tailed flycatcher females are attracted to the specific sound made by the males of their own subspecies, and that over time the females' preference will drive further genetic and anatomical divergence between the subspecies.",
    question: "Which finding, if true, would most directly support Gomez-Bahamon and her team's hypothesis?",
    options: ["The feathers located on the wings of the migratory fork-tailed flycatchers have a narrower shape than those of the nonmigratory birds, which allows them to fly long distances.", "Over several generations, the sound made by the feathers of migratory male fork-tailed flycatchers grows progressively higher pitched relative to that made by the feathers of nonmigratory males.", "Fork-tailed flycatchers communicate different messages to each other depending on whether their feathers create high-pitched or low-pitched sounds.", "The breeding habits of the migratory and nonmigratory fork-tailed flycatchers remained generally the same over several generations."], answerType: "mcq", answer: 1,
    explanation: "The hypothesis is that female preference drives increasing divergence over time; a progressively widening pitch gap between subspecies directly supports that." },
  { id: 1015, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Quantitative Evidence", difficulty: "Hard",
    passage: "Ablation Rates for Three Elements in Cosmic Dust, by Dust Source\n[Table: iron -- SPC 20%, AST 28%, HTC 90%, OCC 98%; potassium -- SPC 44%, AST 74%, HTC 97%, OCC 100%; sodium -- SPC 45%, AST 75%, HTC 99%, OCC 100%]\n\nEarth's atmosphere is bombarded by cosmic dust originating from several sources: short-period comets (SPCs), particles from the asteroid belt (ASTs), Halley-type comets (HTCs), and Oort cloud comets (OCCs). Some of the dust's material vaporizes in the atmosphere in a process called ablation, and the faster the particles move, the higher the rate of ablation. Astrophysicist Juan Diego Carrillo-Sanchez led a team that calculated average ablation rates for elements in the dust (such as iron and potassium) and showed that material in slower-moving SPC or AST dust has a lower rate than the same material in faster-moving HTC or OCC dust. For example, whereas the average ablation rate for iron from AST dust is 28%, the average rate for _______",
    question: "Which choice most effectively uses data from the table to complete the example?",
    options: ["iron from SPC dust is 20%.", "sodium from OCC dust is 100%.", "iron from HTC dust is 90%.", "sodium from AST dust is 75%."], answerType: "mcq", answer: 3,
    explanation: "The example pairs two values from slower-moving sources (SPC/AST) to show they are both comparatively low; sodium from AST dust (75%) parallels iron from AST dust (28%) as another slower-moving-source data point supporting the comparison." },
  { id: 1016, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Command of Evidence", difficulty: "Medium",
    passage: "Art collectives, like the United States- and Vietnam-based collective The Propeller Group or Cuba's Los Carpinteros, are groups of artists who agree to work together: perhaps for stylistic reasons, or to advance certain shared political ideals, or to help mitigate the costs of supplies and studio space. Regardless of the reasons, art collectives usually involve some collaboration among the artists. Based on a recent series of interviews with various art collectives, an arts journalist claims that this can be difficult for artists who are often used to having sole control over their work.",
    question: "Which quotation from the interviews best illustrates the journalist's claim?",
    options: ["\"The first collective I joined included many amazingly talented artists, and we enjoyed each other's company, but because we had a hard time sharing credit and responsibility for our work, the collective didn't last.\"", "\"We work together, but that doesn't mean that individual projects are equally the work of all of us. Many of our projects are primarily the responsibility of whoever originally proposed the work to the group.\"", "\"Having worked as a member of a collective for several years, it's sometimes hard to recall what it was like to work alone without the collective's support. But that support encourages my individual expression rather than limits it.\"", "\"Sometimes an artist from outside the collective will choose to collaborate with us on a project, but all of those projects fit within the larger themes of the work the collective does on its own.\""], answerType: "mcq", answer: 0,
    explanation: "This quotation directly describes the difficulty of sharing credit/responsibility, which caused the collective to end -- matching the journalist's claim about the difficulty of collaboration for artists used to sole control." },
  { id: 1017, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Quantitative Evidence", difficulty: "Hard",
    passage: "Effects of Mycorrhizal Fungi on 3 Plant Species\n[Table: Corn (mycorrhizal host: yes) -- 15.1g with fungi, 3.8g fungi killed; Marigold (yes) -- 10.2g with fungi, 2.4g fungi killed; Broccoli (no) -- 7.5g with fungi, 7g fungi killed]\n\nMycorrhizal fungi in soil benefits many plants, substantially increasing the mass of some. A student conducted an experiment to illustrate this effect. The student chose three plant species for the experiment, including two that are mycorrhizal hosts (species known to benefit from mycorrhizal fungi) and one nonmycorrhizal species (a species that doesn't benefit from and may even be harmed by mycorrhizal fungi). The student then grew several plants from each species both in soil containing mycorrhizal fungi and in soil that had been treated to kill mycorrhizal and other fungi. After several weeks, the student measured the plants' average mass and was surprised to discover that _______",
    question: "Which choice most effectively uses data from the table to complete the statement?",
    options: ["broccoli grown in soil containing mycorrhizal fungi had a slightly higher average mass than broccoli grown in soil that had been treated to kill fungi.", "corn grown in soil containing mycorrhizal fungi had a higher average mass than broccoli grown in soil containing mycorrhizal fungi.", "marigolds grown in soil containing mycorrhizal fungi had a much higher average mass than marigolds grown in soil that had been treated to kill fungi.", "corn had the highest average mass of all three species grown in soil that had been treated to kill fungi, while marigolds had the lowest."], answerType: "mcq", answer: 0,
    explanation: "The 'surprise' is that broccoli (a nonmycorrhizal species, expected not to benefit or even be harmed) actually had a slightly higher mass with fungi (7.5g) than without (7g) -- an unexpected result given the setup." },
  { id: 1018, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Inferences", difficulty: "Medium",
    passage: "Several artworks found among the ruins of the ancient Roman city of Pompeii depict a female figure fishing with a cupid nearby. Some scholars have asserted that the figure is the goddess Venus, since she is known to have been linked with cupids in Roman culture, but University of Leicester archaeologist Carla Brain suggests that cupids may have also been associated with fishing generally. The fact that a cupid is shown near the female figure, therefore, _______",
    question: "Which choice most logically completes the text?",
    options: ["is not conclusive evidence that the figure is Venus.", "suggests that Venus was often depicted fishing.", "eliminates the possibility that the figure is Venus.", "would be difficult to account for if the figure is not Venus."], answerType: "mcq", answer: 0,
    explanation: "Because Brain suggests cupids were linked to fishing generally (not just to Venus), the cupid's presence near the figure doesn't conclusively prove she is Venus." },
  { id: 1019, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Possessives", difficulty: "Easy",
    passage: "Literary agents estimate that more than half of all nonfiction books credited to a celebrity or other public figure are in fact written by ghostwriters, professional authors who are paid to write other _______ but whose names never appear on book covers.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["people's stories", "peoples story's", "peoples stories", "people's story's"], answerType: "mcq", answer: 0,
    explanation: "'People's' is the correct possessive plural form, and 'stories' (plural, not possessive) is needed since it's the direct object." },
  { id: 1020, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Verb Tense", difficulty: "Easy",
    passage: "Like other amphibians, the wood frog (Rana sylvatica) is unable to generate its own heat, so during periods of subfreezing temperatures, it _______ by producing large amounts of glucose, a sugar that helps prevent damaging ice from forming inside its cells.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["had survived", "survived", "would survive", "survives"], answerType: "mcq", answer: 3,
    explanation: "The passage is in the present tense throughout ('is unable'), so the verb must also be present tense: 'survives.'" },
  { id: 1021, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Punctuation", difficulty: "Hard",
    passage: "After a spate of illnesses as a child, Wilma Rudolph was told she might never walk again. Defying all odds, Rudolph didn't just walk, she _______ the 1960 Summer Olympics in Rome, she won both the 100- and 200-meter dashes and clinched first place for her team in the 4x100-meter relay, becoming the first US woman to win three gold medals in a single Olympics.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["ran--fast--during", "ran--fast during", "ran--fast, during", "ran--fast. During"], answerType: "mcq", answer: 3,
    explanation: "A period is needed to separate the two independent clauses ('she ran--fast.' and 'During the 1960 Olympics, she won...'); the dash sets off 'fast' as an emphatic interruption." },
  { id: 1022, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Subject-Verb Agreement", difficulty: "Easy",
    passage: "In many of her landscape paintings from the 1970s and 1980s, Lebanese American artist Etel Adnan worked to capture the essence of California's fog-shrouded Mount Tamalpais region through abstraction, using splotches of color to represent the area's features. Interestingly, the triangle representing the mountain itself _______ among the few defined figures in her paintings.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["are", "have been", "were", "is"], answerType: "mcq", answer: 3,
    explanation: "The subject 'the triangle' is singular, and the passage is in present tense, so the verb must be 'is.'" },
  { id: 1023, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Punctuation", difficulty: "Medium",
    passage: "Seneca sculptor Marie Watt's blanket art comes in a range of shapes and sizes. In 2004, Watt sewed strips of blankets together to craft a 10-by-13-inch _______ in 2014, she arranged folded blankets into two large stacks and then cast them in bronze, creating two curving 18-foot-tall blue-bronze pillars.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["sampler later,", "sampler;", "sampler,", "sampler, later,"], answerType: "mcq", answer: 1,
    explanation: "A semicolon is needed to join the two independent clauses describing separate events (2004 and 2014)." },
  { id: 1024, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Modifier Placement", difficulty: "Hard",
    passage: "African American Percy Julian was a scientist and entrepreneur whose work helped people around the world to see. Named in 1999 as one of the greatest achievements by a US chemist in the past hundred years, _______ led to the first mass-produced treatment for glaucoma.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["Julian synthesized the alkaloid physostigmine in 1935; it", "in 1935 Julian synthesized the alkaloid physostigmine, which", "Julian's 1935 synthesis of the alkaloid physostigmine", "the alkaloid physostigmine was synthesized by Julian in 1935 and"], answerType: "mcq", answer: 2,
    explanation: "The modifying phrase 'Named in 1999 as one of the greatest achievements' must modify a noun phrase referring to the achievement itself -- 'Julian's 1935 synthesis' -- not Julian or the alkaloid alone." },
  { id: 1025, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Punctuation/Parallelism", difficulty: "Medium",
    passage: "The Arctic-Alpine Botanic Garden in Norway and the Jardim Botanico of Rio de Janeiro in Brazil are two of many botanical gardens around the world dedicated to growing diverse plant _______ fostering scientific research; and educating the public about plant conservation.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["species, both native and nonnative,", "species, both native and nonnative;", "species; both native and nonnative,", "species both native and nonnative,"], answerType: "mcq", answer: 0,
    explanation: "The list of three parallel purposes ('growing... species,' 'fostering...,' 'educating...') requires commas, and 'both native and nonnative' is a nonessential aside set off by commas." },
  { id: 1026, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Standard English Conventions: Punctuation", difficulty: "Medium",
    passage: "Sociologist Alton Okinaka sits on the review board tasked with adding new sites to the Hawai'i Register of Historic Places, which includes Pi'ilanihale Heiau and the 'Opaeka'a Road Bridge. Okinaka doesn't make such decisions _______ all historical designations must be approved by a group of nine other experts from the fields of architecture, archaeology, history, and Hawaiian culture.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["single-handedly, however;", "single-handedly; however,", "single-handedly, however,", "single-handedly however"], answerType: "mcq", answer: 1,
    explanation: "A semicolon is needed between the two independent clauses, and 'however' (a conjunctive adverb) needs a comma after it." },
  { id: 1027, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Transitions", difficulty: "Easy",
    passage: "In 1968, US Congressman John Conyers introduced a bill to establish a national holiday in honor of Dr. Martin Luther King Jr. The bill didn't make it to a vote, but Conyers was determined. He teamed up with Shirley Chisholm, the first Black woman to be elected to Congress, and they resubmitted the bill every session for the next fifteen years. _______ in 1983, the bill passed.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["Instead,", "Likewise,", "Finally,", "Additionally,"], answerType: "mcq", answer: 2,
    explanation: "After fifteen years of resubmission, 'Finally' signals the culminating success." },
  { id: 1028, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Transitions", difficulty: "Easy",
    passage: "Geoscientists have long considered Hawaii's Mauna Loa volcano to be Earth's largest shield volcano by volume, measuring approximately 74,000 cubic kilometers. _______ according to a 2020 study by local geoscientist Michael Garcia, Hawaii's Puhahonu shield volcano is significantly larger, boasting a volume of about 148,000 cubic kilometers.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["Secondly,", "Consequently,", "Moreover,", "However,"], answerType: "mcq", answer: 3,
    explanation: "The new study contradicts the long-held belief about Mauna Loa, so a contrast transition ('However') is needed." },
  { id: 1029, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Transitions", difficulty: "Easy",
    passage: "Samuel Coleridge-Taylor was a prominent classical music composer from England who toured the US three times in the early 1900s. The child of a West African father and an English mother, Coleridge-Taylor emphasized his mixed-race ancestry. For example, he referred to himself as Anglo-African. _______ he incorporated the sounds of traditional African music into his classical music compositions.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["In addition,", "Actually,", "However,", "Regardless,"], answerType: "mcq", answer: 0,
    explanation: "This sentence adds another example of how he emphasized his mixed-race ancestry, so 'In addition' is correct." },
  { id: 1030, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Transitions", difficulty: "Medium",
    passage: "In 2019, researcher Patricia Jurado Gonzalez and food historian Nawal Nasrallah prepared a stew from a 4,000-year-old recipe found on a Mesopotamian clay tablet. When they tasted the dish, known as pasrutum (\"unwinding\"), they found that it had a mild taste and inspired a sense of calm. _______ the researchers, knowing that dishes were sometimes named after their intended effects, theorized that the dish's name, \"unwinding,\" referred to its function: to help ancient diners relax.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["Therefore,", "Alternately,", "Nevertheless,", "Likewise,"], answerType: "mcq", answer: 0,
    explanation: "Because the dish inspired calm, the researchers therefore theorized its name referred to that relaxing function -- a cause-and-effect relationship." },
  { id: 1031, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- Chemical leavening agents cause carbon dioxide to be released within a liquid batter, making the batter rise as it bakes.\n- Baking soda and baking powder are chemical leavening agents.\n- Baking soda is pure sodium bicarbonate.\n- To produce carbon dioxide, baking soda needs to be mixed with liquid and an acidic ingredient such as honey.\n- Baking powder is a mixture of sodium bicarbonate and an acid.\n- To produce carbon dioxide, baking powder needs to be mixed with liquid but not with an acidic ingredient.",
    question: "The student wants to emphasize a difference between baking soda and baking powder. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["To make batters rise, bakers use chemical leavening agents such as baking soda and baking powder.", "Baking soda and baking powder are chemical leavening agents that, when mixed with other ingredients, cause carbon dioxide to be released within a batter.", "Baking soda is pure sodium bicarbonate, and honey is a type of acidic ingredient.", "To produce carbon dioxide within a liquid batter, baking soda needs to be mixed with an acidic ingredient, whereas baking powder does not."], answerType: "mcq", answer: 3,
    explanation: "Only option D directly states the key difference (acid requirement) between the two leavening agents." },
  { id: 1032, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- Soo Sunny Park is a Korean American artist who uses light as her primary medium of expression.\n- She created her work Unwoven Light in 2013.\n- Unwoven Light featured a chain-link fence fitted with iridescent plexiglass tiles.\n- When light passed through the fence, colorful prisms formed.",
    question: "The student wants to describe Unwoven Light to an audience unfamiliar with Soo Sunny Park. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["Park's 2013 installation Unwoven Light, which included a chain-link fence and iridescent tiles made from plexiglass, featured light as its primary medium of expression.", "Korean American light artist Soo Sunny Park created Unwoven Light in 2013.", "The chain-link fence in Soo Sunny Park's Unwoven Light was fitted with tiles made from iridescent plexiglass.", "In Unwoven Light, a 2013 work by Korean American artist Soo Sunny Park, light formed colorful prisms as it passed through a fence Park had fitted with iridescent tiles."], answerType: "mcq", answer: 3,
    explanation: "This choice introduces the artist, work, date, and describes the piece's function (light forming prisms) for an unfamiliar audience, combining the most relevant notes." },
  { id: 1033, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 1", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- Cambodia's Angkor Wat was built in the 1100s to honor the Hindu god Vishnu.\n- It has been a Buddhist temple since the sixteenth century.\n- Decorrelation stretch analysis is a novel digital imaging technique that enhances the contrast between colors in a photograph.\n- Archaeologist Noel Hidalgo Tan applied decorrelation stretch analysis to photographs he had taken of Angkor Wat's plaster walls.\n- Tan's analysis revealed hundreds of images unknown to researchers.",
    question: "The student wants to present Tan's research to an audience unfamiliar with Angkor Wat. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["Tan photographed Angkor Wat's plaster walls and then applied decorrelation stretch analysis to the photographs.", "Decorrelation stretch analysis is a novel digital imaging technique that Tan used to enhance the contrast between colors in a photograph.", "Using a novel digital imaging technique, Tan revealed hundreds of images hidden on the walls of Angkor Wat, a Cambodian temple.", "Built to honor a Hindu god before becoming a Buddhist temple, Cambodia's Angkor Wat concealed hundreds of images on its plaster walls."], answerType: "mcq", answer: 2,
    explanation: "This choice identifies Angkor Wat for an unfamiliar audience ('a Cambodian temple') and presents Tan's key finding (hundreds of hidden images) and method." },
  { id: 1034, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "The fashion resale market, in which consumers purchase secondhand clothing from stores and online sellers, generated nearly $30 billion globally in 2019. Expecting to see continued growth, some analysts _______ that revenues will more than double by 2028.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["produced", "denied", "worried", "predicted"], answerType: "mcq", answer: 3,
    explanation: "Analysts expecting growth would forecast future revenue, i.e. 'predicted.'" },
  { id: 1035, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "Artificially delivering biomolecules to plant cells is an important component of protecting plants from pathogens, but it is difficult to transmit biomolecules through the layers of the plant cell wall. Markita del Carpio Landry and her colleagues have shown that it may be possible to _______ this problem by transmitting molecules through carbon nanotubes, which can cross cell walls.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["conceptualize", "neglect", "illustrate", "overcome"], answerType: "mcq", answer: 3,
    explanation: "Since nanotubes can cross cell walls, they offer a way to 'overcome' the transmission problem." },
  { id: 1036, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "Particle physicists like Ayana Holloway Arce and Aida El-Khadra spend much of their time _______ what is invisible to the naked eye: using sophisticated technology, they closely examine the behavior of subatomic particles, the smallest detectable parts of matter.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["selecting", "inspecting", "creating", "deciding"], answerType: "mcq", answer: 1,
    explanation: "They 'closely examine' particle behavior, meaning they spend time 'inspecting' what's invisible." },
  { id: 1037, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Medium",
    passage: "Anthropologist Kristian J. Carlson and colleagues examined the fossilized clavicle and shoulder bones of a 3.6-million-year-old early hominin known as \"Little Foot.\" They found that these bones were _______ the clavicle and shoulder bones of modern apes that are frequent climbers, such as gorillas and chimpanzees, suggesting that Little Foot had adapted to life in the trees.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["surpassed by", "comparable to", "independent of", "obtained from"], answerType: "mcq", answer: 1,
    explanation: "Similarity to climbing apes' bones (suggesting adaptation to trees) means the bones were 'comparable to' those of modern climbing apes." },
  { id: 1038, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Medium",
    passage: "Rydra Wong, the protagonist of Samuel R. Delany's 1966 novel Babel-17, is a poet, an occupation which, in Delany's work, is not _______: nearly a dozen of the characters that populate his novels are poets or writers.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["infallible", "atypical", "lucrative", "tedious"], answerType: "mcq", answer: 1,
    explanation: "Since nearly a dozen characters are poets/writers, being a poet is common (not 'atypical') in Delany's work." },
  { id: 1039, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "For a 2020 exhibition, photographer and neurobiologist Okunola Jeyifous _______ a series of new images based on a series of alphabet posters from the 1970s known as the \"Black ABCs,\" which featured Black children from Chicago. Jeyifous photographed the now-adult models and layered the photos over magnified images of the models' cells, resulting in what he called \"micro and macro portraiture.\"",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["validated", "created", "challenged", "restored"], answerType: "mcq", answer: 1,
    explanation: "Jeyifous made new images based on the old posters, i.e., 'created' a new series." },
  { id: 1040, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Easy",
    passage: "In addition to being an accomplished psychologist himself, Francis Cecil Sumner was a _______ increasing the opportunity for Black students to study psychology, helping to found the psychology department at Howard University, a historically Black university, in 1930.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["proponent of", "supplement to", "beneficiary of", "distraction for"], answerType: "mcq", answer: 0,
    explanation: "Founding a department to increase opportunity makes Sumner a 'proponent of' (advocate for) that increased access." },
  { id: 1041, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Vocabulary in Context", difficulty: "Hard",
    passage: "Whether the reign of a French monarch such as Hugh Capet or Henry I was historically consequential or relatively uneventful, its trajectory was shaped by questions of legitimacy and therefore cannot be understood without a corollary understanding of the factors that allowed the monarch to _______ his right to hold the throne.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["reciprocate", "annotate", "buttress", "disengage"], answerType: "mcq", answer: 2,
    explanation: "Legitimacy concerns require understanding how a monarch reinforced/supported ('buttressed') his claim to the throne." },
  { id: 1042, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Text Structure and Purpose", difficulty: "Medium",
    passage: "Some bird species don't raise their own chicks. Instead, adult females lay their eggs in other nests, next to another bird species' own eggs. Female cuckoos have been seen quickly laying eggs in the nests of other bird species when those birds are out looking for food. After the eggs hatch, the noncuckoo parents will typically raise the cuckoo chicks as if they were their own offspring, even if the cuckoos look very different from the other chicks.",
    question: "Which choice best describes the function of the underlined sentence in the text as a whole?",
    options: ["It introduces a physical feature of female cuckoos that is described later in the text.", "It describes the appearance of the cuckoo nests mentioned earlier in the text.", "It offers a detail about how female cuckoos carry out the behavior discussed in the text.", "It explains how other birds react to the female cuckoo behavior discussed in the text."], answerType: "mcq", answer: 2,
    explanation: "The underlined sentence gives a specific detail (how/when female cuckoos lay eggs in other nests) about the egg-laying behavior introduced earlier." },
  { id: 1043, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Command of Evidence", difficulty: "Easy",
    passage: "Cats can judge unseen people's positions in space by the sound of their voices and thus react with surprise when the same person calls to them from two different locations in a short span of time. Saho Takagi and colleagues reached this conclusion by measuring cats' levels of surprise based on their ear and head movements while the cats heard recordings of their owners' voices from two speakers spaced far apart. Cats exhibited a low level of surprise when owners' voices were played twice from the same speaker, but they showed a high level of surprise when the voice was played once each from the two different speakers.",
    question: "According to the text, how did the researchers determine the level of surprise displayed by the cats in the study?",
    options: ["They watched how each cat moved its ears and head.", "They examined how each cat reacted to the voice of a stranger.", "They studied how each cat physically interacted with its owner.", "They tracked how each cat moved around the room."], answerType: "mcq", answer: 0,
    explanation: "The text states researchers measured surprise 'based on their ear and head movements.'" },
  { id: 1044, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Command of Evidence", difficulty: "Medium",
    passage: "A student performs an experiment testing her hypothesis that a slightly acidic soil environment is more beneficial for the growth of the plant Brassica rapa parachinensis (a vegetable commonly known as choy sum) than a neutral soil environment. She plants sixteen seeds of choy sum in a mixture of equal amounts of coffee grounds (which are highly acidic) and potting soil and another sixteen seeds in potting soil without coffee grounds as the control for the experiment. The two groups of seeds were exposed to the same growing conditions and monitored for three weeks.",
    question: "Which finding, if true, would most directly weaken the student's hypothesis?",
    options: ["The choy sum planted in the soil without coffee grounds were significantly taller at the end of the experiment than the choy sum planted in the mixture of soil and coffee grounds.", "The choy sum grown in the soil without coffee grounds weighed significantly less at the end of the experiment than the choy sum grown in the mixture of soil and coffee grounds.", "The choy sum seeds planted in the soil without coffee grounds sprouted significantly later in the experiment than did the seeds planted in the mixture of soil and coffee grounds.", "Significantly fewer of the choy sum seeds planted in the soil without coffee grounds sprouted plants than did the seeds planted in the mixture of soil and coffee grounds."], answerType: "mcq", answer: 0,
    explanation: "If the neutral soil (no coffee grounds/acid) produced significantly taller plants than the acidic mixture, that directly contradicts the hypothesis that acidic soil is more beneficial for growth." },
  { id: 1045, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Command of Evidence", difficulty: "Medium",
    passage: "\"The Young Girl\" is a 1920 short story by Katherine Mansfield. In the story, the narrator takes an unnamed seventeen-year-old girl and her younger brother out for a meal. In describing the teenager, Mansfield frequently contrasts the character's pleasant appearance with her unpleasant attitude, as when Mansfield writes of the teenager, _______",
    question: "Which quotation from \"The Young Girl\" most effectively illustrates the claim?",
    options: ["\"I heard her murmur, 'I can't bear flowers on a table.' They had evidently been giving her intense pain, for she positively closed her eyes as I moved them away.\"", "\"While we waited she took out a little, gold powder-box with a mirror in the lid, shook the poor little puff as though she loathed it, and dabbed her lovely nose.\"", "\"I saw, after that, she couldn't stand this place a moment longer, and, indeed, she jumped up and turned away while I went through the vulgar act of paying for the tea.\"", "\"She didn't even take her gloves off. She lowered her eyes and drummed on the table. When a faint violin sounded she winced and bit her lip again. Silence.\""], answerType: "mcq", answer: 1,
    explanation: "This quotation directly contrasts her 'lovely nose' (pleasant appearance) with her petulant, disdainful attitude ('shook... as though she loathed it')." },
  { id: 1046, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Quantitative Evidence", difficulty: "Hard",
    passage: "High levels of public uncertainty about which economic policies a country will adopt can make planning difficult for businesses, but measures of such uncertainty have not tended to be very detailed. Recently, however, economist Sandile Hlatshwayo analyzed trends in news reports to derive measures not only for general economic policy uncertainty but also for uncertainty related to specific areas of economic policy, like tax or trade policy. One revelation of her work is that a general measure may not fully reflect uncertainty about specific areas of policy, as in the case of the United Kingdom, where general economic policy uncertainty _______\n\n[Bar graph: Economic Policy Uncertainty in the UK, 2005-2010, showing tax and public spending policy, trade policy, and general economic policy for each year]",
    question: "Which choice most effectively uses data from the graph to illustrate the claim?",
    options: ["aligned closely with uncertainty about tax and public spending policy in 2005 but differed from uncertainty about tax and public spending policy by a large amount in 2009.", "was substantially lower than uncertainty about tax and public spending policy each year from 2005 to 2010.", "reached its highest level between 2005 and 2010 in the same year that uncertainty about trade policy and tax and public spending policy reached their lowest levels.", "was substantially lower than uncertainty about trade policy in 2005 and substantially higher than uncertainty about trade policy in 2010."], answerType: "mcq", answer: 3,
    explanation: "This choice shows that the general measure diverged substantially from a specific measure (trade policy) in opposite directions across years, illustrating that a general measure doesn't fully reflect specific-area uncertainty." },
  { id: 1047, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Command of Evidence", difficulty: "Medium",
    passage: "Linguist Deborah Tannen has cautioned against framing contentious issues in terms of two highly competitive perspectives, such as pro versus con. According to Tannen, this debate-driven approach can strip issues of their complexity and, when used in front of an audience, can be less informative than the presentation of multiple perspectives in a noncompetitive format. To test Tannen's hypothesis, students conducted a study in which they showed participants one of three different versions of local news commentary about the same issue. Each version featured a debate between two commentators with opposing views, a panel of three commentators with various views, or a single commentator.",
    question: "Which finding from the students' study, if true, would most strongly support Tannen's hypothesis?",
    options: ["On average, participants perceived commentators in the debate as more knowledgeable about the issue than commentators in the panel.", "On average, participants perceived commentators in the panel as more knowledgeable about the issue than the single commentator.", "On average, participants who watched the panel correctly answered more questions about the issue than those who watched the debate or the single commentator did.", "On average, participants who watched the single commentator correctly answered more questions about the issue than those who watched the debate did."], answerType: "mcq", answer: 2,
    explanation: "Tannen's hypothesis is that a noncompetitive, multi-perspective format (the panel) is more informative than the debate format; participants learning more (answering more questions correctly) from the panel directly supports this." },
  { id: 1048, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Command of Evidence", difficulty: "Medium",
    passage: "King Lear is a circa 1606 play by William Shakespeare. In the play, the character of King Lear attempts to test his three daughters' devotion to him. He later expresses regret for his actions, as is evident when he _______",
    question: "Which choice most effectively uses a quotation from King Lear to illustrate the claim?",
    options: ["says of himself, \"I am a man / more sinned against than sinning.\"", "says during a growing storm, \"This tempest will not give me leave to ponder / On things would hurt me more.\"", "says to himself while striking his head, \"Beat at this gate that let thy folly in / And thy dear judgement out!\"", "says of himself, \"I will do such things-- / What they are yet, I know not; but they shall be / The terrors of the earth!\""], answerType: "mcq", answer: 2,
    explanation: "This quotation shows Lear literally berating himself for his own 'folly' (foolish judgment), directly expressing regret for his actions." },
  { id: 1049, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Inferences", difficulty: "Medium",
    passage: "Many of William Shakespeare's tragedies address broad themes that still appeal to today's audiences. For instance, Romeo and Juliet, which is set in the Italy of Shakespeare's time, tackles the themes of parents versus children and love versus hate, and the play continues to be read and produced widely around the world. But understanding Shakespeare's so-called history plays can require a knowledge of several centuries of English history. Consequently, _______",
    question: "Which choice most logically completes the text?",
    options: ["many theatergoers and readers today are likely to find Shakespeare's history plays less engaging than the tragedies.", "some of Shakespeare's tragedies are more relevant to today's audiences than twentieth-century plays.", "Romeo and Juliet is the most thematically accessible of all Shakespeare's tragedies.", "experts in English history tend to prefer Shakespeare's history plays to his other works."], answerType: "mcq", answer: 0,
    explanation: "Because history plays require specialized historical knowledge (unlike the broadly relatable tragedies), audiences would likely find them less engaging/accessible than the tragedies." },
  { id: 1050, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Inferences", difficulty: "Medium",
    passage: "Ancestral Puebloans, the civilization from which present-day Pueblo tribes descended, emerged as early as 1500 B.C.E. in an area of what is now the southwestern United States and dispersed suddenly in the late 1200s C.E., abandoning established villages with systems for farming crops and turkeys. Recent analysis comparing turkey remains at Mesa Verde, one such village in southern Colorado, to samples from modern turkey populations in the Rio Grande Valley of north central New Mexico determined that the latter birds descended in part from turkeys cultivated at Mesa Verde, with shared genetic markers appearing only after 1280. Thus, researchers concluded that _______",
    question: "Which choice most logically completes the text?",
    options: ["conditions of the terrains in the Rio Grande Valley and Mesa Verde had greater similarities in the past than they do today.", "some Ancestral Puebloans migrated to the Rio Grande Valley in the late 1200s and carried farming practices with them.", "Indigenous peoples living in the Rio Grande Valley primarily planted crops and did not cultivate turkeys before 1280.", "the Ancestral Puebloans of Mesa Verde likely adopted the farming practices of Indigenous peoples living in other regions."], answerType: "mcq", answer: 1,
    explanation: "Since Rio Grande Valley turkeys descended from Mesa Verde turkeys (with shared genetics appearing only after the 1280s dispersal), it suggests Ancestral Puebloans migrated there and brought their turkeys/farming with them." },
  { id: 1051, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Inferences", difficulty: "Medium",
    passage: "One challenge when researching whether holding elected office changes a person's behavior is the problem of ensuring that the experiment has an appropriate control group. To reveal the effect of holding office, researchers must compare people who hold elected office with people who do not hold office but who are otherwise similar to the office-holders. Since researchers are unable to control which politicians win elections, they therefore _______",
    question: "Which choice most logically completes the text?",
    options: ["struggle to find valid data about the behavior of politicians who do not currently hold office.", "can only conduct valid studies with people who have previously held office rather than people who presently hold office.", "should select a control group of people who differ from office holders in several significant ways.", "will find it difficult to identify a group of people who can function as an appropriate control group for their studies."], answerType: "mcq", answer: 3,
    explanation: "Because researchers can't control who wins elections, they can't guarantee a comparable (similar-but-for-office) control group is available -- making it difficult to identify an appropriate control group." },
  { id: 1052, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Possessives", difficulty: "Easy",
    passage: "In his groundbreaking book Bengali Harlem and the Lost Histories of South Asian America, Vivek Bald uses newspaper articles, census records, ships' logs, and memoirs to tell the _______ who made New York City their home in the early twentieth century.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["story's of the South Asian immigrants", "story's of the South Asian immigrants'", "stories of the South Asian immigrants", "stories' of the South Asian immigrant's"], answerType: "mcq", answer: 2,
    explanation: "'Stories' (plural, non-possessive) is the direct object, and 'of the South Asian immigrants' (plain plural) correctly shows whose stories they are." },
  { id: 1053, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Punctuation", difficulty: "Easy",
    passage: "In her two major series \"Memory Test\" and \"Autobiography,\" painter Howardena Pindell explored themes _______ healing, self-discovery, and memory by cutting and sewing back together pieces of canvas and inserting personal artifacts, such as postcards, into some of the paintings.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["of", "of,", "of--", "of:"], answerType: "mcq", answer: 0,
    explanation: "'Themes of healing, self-discovery, and memory' is a simple prepositional phrase requiring no punctuation after 'of.'" },
  { id: 1054, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Relative Clauses", difficulty: "Medium",
    passage: "Both Sona Charaipotra, an Indian American, and Dhonielle Clayton, an African American, grew up frustrated by the lack of diverse characters in books for young people. In 2011, these two writers joined forces to found CAKE Literary, a book packaging _______ specializes in the creation and promotion of stories told from diverse perspectives for children and young adults.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["company,", "company that", "company", "company, that"], answerType: "mcq", answer: 1,
    explanation: "'That specializes...' is a restrictive relative clause needed to identify which company, so no comma is used before 'that.'" },
  { id: 1055, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Punctuation", difficulty: "Hard",
    passage: "A study led by scientist Rebecca Kirby at the University of Wisconsin-Madison found that black bears that eat human food before hibernation have increased levels of a rare carbon isotope, _______ due to the higher 13C levels in corn and cane sugar. Bears with these elevated levels were also found to have much shorter hibernation periods on average.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["carbon-13, (13C)", "carbon-13 (13C)", "carbon-13, (13C),", "carbon-13 (13C),"], answerType: "mcq", answer: 3,
    explanation: "The parenthetical abbreviation '(13C)' immediately follows 'carbon-13' with no comma before it, but a comma is needed after the parenthetical to set off the following 'due to...' clause." },
  { id: 1056, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Punctuation", difficulty: "Medium",
    passage: "In 2010, archaeologist Noel Hidalgo Tan was visiting the twelfth-century temple of Angkor Wat in Cambodia when he noticed markings of red paint on the temple _______ the help of digital imaging techniques, he discovered the markings to be part of an elaborate mural containing over 200 paintings.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["walls, with", "walls with", "walls so with", "walls. With"], answerType: "mcq", answer: 3,
    explanation: "Two independent clauses need a period between them: 'he noticed markings... walls.' and 'With the help of digital imaging techniques, he discovered...'" },
  { id: 1057, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Verb Forms", difficulty: "Medium",
    passage: "Working from an earlier discovery of Charpentier's, chemists Emmanuelle Charpentier and Jennifer Doudna--winners of the 2020 Nobel Prize in Chemistry--re-created and then reprogrammed the so-called \"genetic scissors\" of a species of DNA-cleaving bacteria _______ a tool that is revolutionizing the field of gene technology.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["to forge", "forging", "forged", "and forging"], answerType: "mcq", answer: 0,
    explanation: "'To forge a tool' expresses purpose (they re-created/reprogrammed the scissors in order to forge a tool), which requires the infinitive 'to forge.'" },
  { id: 1058, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Modifier Placement", difficulty: "Hard",
    passage: "In 2016, engineer Vanessa Galvez oversaw the installation of 164 bioswales, vegetated channels designed to absorb and divert stormwater, along the streets of Queens, New York. By reducing the runoff flowing into city sewers, _______",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["the mitigation of both street flooding and the resulting pollution of nearby waterways has been achieved by bioswales.", "the bioswales have mitigated both street flooding and the resulting pollution of nearby waterways.", "the bioswales' mitigation of both street flooding and the resulting pollution of nearby waterways has been achieved.", "both street flooding and the resulting pollution of nearby waterways have been mitigated by bioswales."], answerType: "mcq", answer: 1,
    explanation: "The introductory modifier 'By reducing the runoff...' must modify the subject that performs the reducing -- 'the bioswales' -- avoiding a dangling modifier." },
  { id: 1059, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Standard English Conventions: Punctuation", difficulty: "Medium",
    passage: "A study published by Rice University geoscientist Ming Tang in 2019 offers a new explanation for the origin of Earth's _______ structures called arcs, towering ridges that form when a dense oceanic plate subducts under a less dense continental plate, melts in the mantle below, and then rises and bursts through the continental crust above.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["continents geological", "continents: geological", "continents; geological", "continents. Geological"], answerType: "mcq", answer: 1,
    explanation: "A colon is needed to introduce the explanation/definition of the geological structures ('arcs') being discussed." },
  { id: 1060, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Transitions", difficulty: "Easy",
    passage: "During a 2021 launch, Rocket Labs' Electron rocket experienced an unexpected failure: its second-stage booster shut down suddenly after ignition. _______ instead of downplaying the incident, Rocket Labs' CEO publicly acknowledged what happened and apologized for the loss of the rocket's payload, which had consisted of two satellites.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["Afterward,", "Additionally,", "Indeed,", "Similarly,"], answerType: "mcq", answer: 0,
    explanation: "'Afterward' logically signals that the CEO's public response came after the failure occurred." },
  { id: 1061, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Transitions", difficulty: "Easy",
    passage: "When soil becomes contaminated by toxic metals, it can be removed from the ground and disposed of in a landfill. _______ contaminated soil can be detoxified via phytoremediation: plants that can withstand high concentrations of metals absorb the pollutants and store them in their shoots, which are then cut off and safely disposed of, preserving the health of the plants.",
    question: "Which choice completes the text with the most logical transition?",
    options: ["Alternatively,", "Specifically,", "For example,", "As a result,"], answerType: "mcq", answer: 0,
    explanation: "Phytoremediation is presented as another option besides landfill disposal, so 'Alternatively' is correct." },
  { id: 1062, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- The calendar used by most of the world (the Gregorian calendar) has 365 days.\n- Because 365 days can't be divided evenly by 7 (the number of days in a week), calendar dates fall on a different day of the week each year.\n- The Hanke-Henry permanent calendar, developed as an alternative to the Gregorian calendar, has 364 days.\n- Because 364 can be divided evenly by 7, calendar dates fall on the same day of the week each year, which supports more predictable scheduling.",
    question: "The student wants to explain an advantage of the Hanke-Henry calendar. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["The Gregorian calendar has 365 days, which is one day longer than the Hanke-Henry permanent calendar.", "Adopting the Hanke-Henry permanent calendar would help solve a problem with the Gregorian calendar.", "Designed so calendar dates would occur on the same day of the week each year, the Hanke-Henry calendar supports more predictable scheduling than does the Gregorian calendar.", "The Hanke-Henry permanent calendar was developed as an alternative to the Gregorian calendar, which is currently the most-used calendar in the world."], answerType: "mcq", answer: 2,
    explanation: "This choice directly states the advantage (more predictable scheduling due to fixed weekday dates) using the relevant notes." },
  { id: 1063, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- The Haudenosaunee Confederacy is a nearly 1,000-year-old alliance of six Native nations in the northeastern US.\n- The members are bound by a centuries-old agreement known as the Great Law of Peace.\n- Historian Bruce Johansen is one of several scholars who believe that the principles of the Great Law of Peace influenced the US Constitution.\n- This theory is called the influence theory.\n- Johansen cites the fact that Benjamin Franklin and Thomas Jefferson both studied the Haudenosaunee Confederacy.",
    question: "The student wants to present the influence theory to an audience unfamiliar with the Haudenosaunee Confederacy. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["Historian Bruce Johansen believes that the Great Law of Peace was very influential.", "The influence theory is supported by the fact that Benjamin Franklin and Thomas Jefferson both studied the Haudenosaunee Confederacy.", "The influence theory holds that the principles of the Great Law of Peace, a centuries-old agreement binding six Native nations in the northeastern US, influenced the US Constitution.", "Native people, including the members of the Haudenosaunee Confederacy, influenced the founding of the US in many different ways."], answerType: "mcq", answer: 2,
    explanation: "This choice both defines the Confederacy/Great Law of Peace for an unfamiliar audience and clearly states the influence theory itself." },
  { id: 1064, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- In 1999, astronomer Todd Henry studied the differences in surface temperature between the Sun and nearby stars.\n- His team mapped all stars within 10 parsecs (approximately 200 trillion miles) of the Sun.\n- The surface temperature of the Sun is around 9,800 degrees F, which classifies it as a G star.\n- 327 of the 357 stars in the study were classified as K or M stars, with surface temperatures under 8,900 degrees F (cooler than the Sun).\n- 11 of the 357 stars in the study were classified as A or F stars, with surface temperatures greater than 10,300 degrees F (hotter than the Sun).",
    question: "The student wants to emphasize how hot the Sun is relative to nearby stars. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["At around 9,800 degrees F, which classifies it as a G star, the Sun is hotter than most but not all of the stars within 10 parsecs of it.", "Astronomer Todd Henry determined that the Sun, at around 9,800 degrees F, is a G star, and several other stars within a 10-parsec range are A or F stars.", "Of the 357 stars within ten parsecs of the Sun, 327 are classified as K or M stars, with surface temperatures under 8,900 degrees F.", "While most of the stars within 10 parsecs of the Sun are classified as K, M, A, or F stars, the Sun is classified as a G star due to its surface temperature of 9,800 degrees F."], answerType: "mcq", answer: 0,
    explanation: "This choice directly emphasizes the Sun's relative heat (hotter than most, but not all, nearby stars), which is the student's stated goal." },
  { id: 1065, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- The Atlantic Monthly magazine was first published in 1857.\n- The magazine focused on politics, art, and literature.\n- In 2019, historian Cathryn Halverson published the book Faraway Women and the \"Atlantic Monthly.\"\n- Its subject is female authors whose autobiographies appeared in the magazine in the early 1900s.\n- One of the authors discussed is Juanita Harrison.",
    question: "The student wants to introduce Cathryn Halverson's book to an audience already familiar with the Atlantic Monthly. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["Cathryn Halverson's Faraway Women and the \"Atlantic Monthly\" discusses female authors whose autobiographies appeared in the magazine in the early 1900s.", "A magazine called the Atlantic Monthly, referred to in Cathryn Halverson's book title, was first published in 1857.", "Faraway Women and the \"Atlantic Monthly\" features contributors to the Atlantic Monthly, first published in 1857 as a magazine focusing on politics, art, and literature.", "An author discussed by Cathryn Halverson is Juanita Harrison, whose autobiography appeared in the Atlantic Monthly in the early 1900s."], answerType: "mcq", answer: 0,
    explanation: "Since the audience is already familiar with the magazine, this choice appropriately skips re-explaining the magazine and directly introduces the book's subject." },
  { id: 1066, exam: "SAT", year: 2024, practiceTest: 4, subject: "Reading and Writing", module: "Module 2", topic: "Rhetorical Synthesis", difficulty: "Medium",
    passage: "Notes:\n- The magnificent frigatebird (fregata magnificens) is a species of seabird that feeds mainly on fish, tuna, squid, and other small sea animals.\n- It is unusual among seabirds in that it doesn't dive into the water for prey.\n- One way it acquires food is by using its hook-tipped bill to snatch prey from the surface of the water.\n- Another way it acquires food is by taking it from weaker birds by force.\n- This behavior is known as kleptoparasitism.",
    question: "The student wants to emphasize a similarity between the two ways a magnificent frigatebird acquires food. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: ["A magnificent frigatebird never dives into the water, instead using its hook-tipped bill to snatch prey from the surface.", "Neither of a magnificent frigatebird's two ways of acquiring food requires the bird to dive into the water.", "Of the magnificent frigatebird's two ways of acquiring food, only one is known as kleptoparasitism.", "In addition to snatching prey from the water with its hook-tipped bill, a magnificent frigatebird takes food from other birds by force."], answerType: "mcq", answer: 1,
    explanation: "This choice states the shared feature (neither method requires diving) common to both food-acquisition strategies, directly meeting the goal of emphasizing a similarity." },
  { id: 1067, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Problem Solving and Data Analysis", difficulty: "Easy",
    passage: "A group of students voted on five after-school activities. [Bar graph: Activity 1 ~30, Activity 2 ~31, Activity 3 = 39, Activity 4 ~43, Activity 5 ~48]",
    question: "How many students chose activity 3?",
    options: ["25", "39", "48", "50"], answerType: "mcq", answer: 1,
    explanation: "Reading the bar graph, the bar for Activity 3 reaches 39." },
  { id: 1068, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Problem Solving and Data Analysis", difficulty: "Easy",
    passage: null,
    question: "What percentage of 300 is 75?",
    options: ["25%", "50%", "75%", "225%"], answerType: "mcq", answer: 0,
    explanation: "75/300 = 0.25 = 25%." },
  { id: 1069, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Equations", difficulty: "Easy",
    passage: null,
    question: "x^2/25 = 36. What is a solution to the given equation?",
    options: ["6", "30", "450", "900"], answerType: "mcq", answer: 1,
    explanation: "x^2 = 36*25 = 900, so x = 30 (or -30). Only 30 is listed." },
  { id: 1070, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Modeling", difficulty: "Easy",
    passage: null,
    question: "3 more than 8 times a number x is equal to 83. Which equation represents this situation?",
    options: ["(3)(8)x = 83", "8x = 83 + 3", "3x + 8 = 83", "8x + 3 = 83"], answerType: "mcq", answer: 3,
    explanation: "'8 times x' is 8x, and '3 more than' that is 8x + 3, set equal to 83." },
  { id: 1071, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Linear Models", difficulty: "Easy",
    passage: null,
    question: "Hana deposited a fixed amount into her bank account each month. The function f(t) = 100 + 25t gives the amount, in dollars, in Hana's bank account after t monthly deposits. What is the best interpretation of 25 in this context?",
    options: ["With each monthly deposit, the amount in Hana's bank account increased by $25.", "Before Hana made any monthly deposits, the amount in her bank account was $25.", "After 1 monthly deposit, the amount in Hana's bank account was $25.", "Hana made a total of 25 monthly deposits."], answerType: "mcq", answer: 0,
    explanation: "25 is the coefficient (slope) of t, representing the fixed increase per deposit." },
  { id: 1072, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Rates", difficulty: "Easy",
    passage: null,
    question: "A customer spent $27 to purchase oranges at $3 per pound. How many pounds of oranges did the customer purchase?",
    options: null, answerType: "gridIn", answer: "9",
    explanation: "27 / 3 = 9 pounds." },
  { id: 1073, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Equations", difficulty: "Medium",
    passage: null,
    question: "Nasir bought 9 storage bins that were each the same price. He used a coupon for $63 off the entire purchase. The cost for the entire purchase after using the coupon was $27. What was the original price, in dollars, for 1 storage bin?",
    options: null, answerType: "gridIn", answer: "10",
    explanation: "9p - 63 = 27, so 9p = 90, p = 10." },
  { id: 1074, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Linear Functions", difficulty: "Easy",
    passage: "[Table: x=0, f(x)=29; x=1, f(x)=32; x=2, f(x)=35]",
    question: "For the linear function f, the table shows three values of x and their corresponding values of f(x). Which equation defines f(x)?",
    options: ["f(x) = 3x + 29", "f(x) = 29x + 32", "f(x) = 35x + 29", "f(x) = 32x + 35"], answerType: "mcq", answer: 0,
    explanation: "The values increase by 3 for each increase of 1 in x (slope 3), and f(0) = 29 (y-intercept), giving f(x) = 3x + 29." },
  { id: 1075, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Geometry: Similar Triangles", difficulty: "Medium",
    passage: "Right triangles PQR and STU are similar, where P corresponds to S. Right angles are at R and U.",
    question: "If the measure of angle Q is 18 degrees, what is the measure of angle S?",
    options: ["18 degrees", "72 degrees", "82 degrees", "162 degrees"], answerType: "mcq", answer: 1,
    explanation: "Since R and U are the right angles, Q corresponds to T, and P corresponds to S. In triangle PQR, angle P = 180 - 90 - 18 = 72 degrees, so angle S = 72 degrees." },
  { id: 1076, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Problem Solving and Data Analysis: Linear Models", difficulty: "Medium",
    passage: "[Scatterplot of x and y with points roughly at (1,9),(2,8),(3,5),(4,5),(5,3),(6,3),(7,3),(9,2),(9,1)]",
    question: "Which of the following equations is the most appropriate linear model for the data shown?",
    options: ["y = 0.9 + 9.4x", "y = 0.9 - 9.4x", "y = 9.4 + 0.9x", "y = 9.4 - 0.9x"], answerType: "mcq", answer: 3,
    explanation: "The data trend downward (negative slope) with a y-intercept near 9.4, matching y = 9.4 - 0.9x." },
  { id: 1077, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Equations", difficulty: "Medium",
    passage: null,
    question: "2.5b + 5r = 80. The given equation describes the relationship between the number of birds, b, and the number of reptiles, r, that can be cared for at a pet care business on a given day. If the business cares for 16 reptiles on a given day, how many birds can it care for on this day?",
    options: ["0", "5", "40", "80"], answerType: "mcq", answer: 0,
    explanation: "2.5b + 5(16) = 80, so 2.5b + 80 = 80, 2.5b = 0, b = 0." },
  { id: 1078, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Linear Graphs", difficulty: "Medium",
    passage: "[Graph of a line passing approximately through (-8,0) and (0,-8)]",
    question: "What is an equation of the graph shown?",
    options: ["y = -2x - 8", "y = x - 8", "y = -x - 8", "y = 2x - 8"], answerType: "mcq", answer: 2,
    explanation: "The line has a y-intercept of -8 and slope -1 (falling from upper left to lower right, passing through (-8,0)), giving y = -x - 8." },
  { id: 1079, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Ratios", difficulty: "Medium",
    passage: null,
    question: "If x/8 = 5, what is the value of 8/x?",
    options: null, answerType: "gridIn", answer: "1/5",
    explanation: "x/8 = 5 means x = 40. Then 8/x = 8/40 = 1/5 = 0.2." },
  { id: 1080, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Systems of Equations", difficulty: "Medium",
    passage: null,
    question: "24x + y = 48\n6x + y = 72\nThe solution to the given system of equations is (x, y). What is the value of y?",
    options: null, answerType: "gridIn", answer: "80",
    explanation: "Subtracting: 18x = -24, so x = -4/3. Then y = 48 - 24(-4/3) = 48 + 32 = 80." },
  { id: 1081, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Linear Equations", difficulty: "Medium",
    passage: null,
    question: "Line t in the xy-plane has a slope of -1/3 and passes through the point (9, 10). Which equation defines line t?",
    options: ["y = 13x - 1/3", "y = 9x + 10", "y = -x/3 + 10", "y = -x/3 + 13"], answerType: "mcq", answer: 3,
    explanation: "y - 10 = -1/3(x - 9) => y = -x/3 + 3 + 10 = -x/3 + 13." },
  { id: 1082, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Exponential Models", difficulty: "Medium",
    passage: null,
    question: "The function f(x) = 206(1.034)^x models the value, in dollars, of a certain bank account by the end of each year from 1957 through 1972, where x is the number of years after 1957. Which of the following is the best interpretation of \"f(5) is approximately equal to 243\" in this context?",
    options: ["The value of the bank account is estimated to be approximately 5 dollars greater in 1962 than in 1957.", "The value of the bank account is estimated to be approximately 243 dollars in 1962.", "The value, in dollars, of the bank account is estimated to be approximately 5 times greater in 1962 than in 1957.", "The value of the bank account is estimated to increase by approximately 243 dollars every 5 years between 1957 and 1972."], answerType: "mcq", answer: 1,
    explanation: "f(5) means 5 years after 1957 (i.e., 1962), and the model gives approximately $243 at that point." },
  { id: 1083, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Ratios", difficulty: "Medium",
    passage: null,
    question: "For a certain rectangular region, the ratio of its length to its width is 35 to 10. If the width of the rectangular region increases by 7 units, how must the length change to maintain this ratio?",
    options: ["It must decrease by 24.5 units.", "It must increase by 24.5 units.", "It must decrease by 7 units.", "It must increase by 7 units."], answerType: "mcq", answer: 1,
    explanation: "The ratio 35:10 simplifies to 7:2, so length increases by (7/2)*7 = 24.5 units to maintain the ratio." },
  { id: 1084, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Geometric Modeling", difficulty: "Medium",
    passage: null,
    question: "Square P has a side length of x inches. Square Q has a perimeter that is 176 inches greater than the perimeter of square P. The function f gives the area of square Q, in square inches. Which of the following defines f?",
    options: ["f(x) = (x + 44)^2", "f(x) = (x + 176)^2", "f(x) = (176x + 44)^2", "f(x) = (176x + 176)^2"], answerType: "mcq", answer: 0,
    explanation: "Perimeter of P = 4x, perimeter of Q = 4x + 176, so side of Q = x + 44. Area of Q = (x + 44)^2." },
  { id: 1085, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Algebra: Rearranging Equations", difficulty: "Hard",
    passage: null,
    question: "14x/(7y) = 2*sqrt(w + 19). The given equation relates the distinct positive real numbers w, x, and y. Which equation correctly expresses w in terms of x and y?",
    options: ["w = sqrt(x/y) - 19", "w = sqrt(28x/(14y)) - 19", "w = (x/y)^2 - 19", "w = (28x/(14y))^2 - 19"], answerType: "mcq", answer: 2,
    explanation: "14x/(7y) simplifies to 2x/y. Setting 2x/y = 2*sqrt(w+19) gives x/y = sqrt(w+19), so (x/y)^2 = w + 19, thus w = (x/y)^2 - 19." },
  { id: 1086, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Geometry: Circles", difficulty: "Easy",
    passage: null,
    question: "Point O is the center of a circle. The measure of arc RS on this circle is 100 degrees. What is the measure, in degrees, of its associated angle ROS?",
    options: null, answerType: "gridIn", answer: "100",
    explanation: "A central angle has the same measure as its intercepted arc." },
  { id: 1087, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Advanced Math: Radicals and Exponents", difficulty: "Hard",
    passage: null,
    question: "The expression 6 * fifth-root(3^5 * x^45) * eighth-root(2^8 * x) is equivalent to ax^b, where a and b are positive constants and x > 1. What is the value of a + b?",
    options: null, answerType: "gridIn", answer: "45.125",
    explanation: "Fifth-root(3^5 x^45) = 3x^9. Eighth-root(2^8 x) = 2x^(1/8). So the expression = 6*3*2 * x^(9 + 1/8) = 36x^(73/8). a = 36, b = 73/8 = 9.125, so a + b = 45.125." },
  { id: 1088, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Geometry: Right Triangles", difficulty: "Medium",
    passage: null,
    question: "A right triangle has sides of length 2*sqrt(2), 6*sqrt(2), and sqrt(80) units. What is the area of the triangle, in square units?",
    options: ["8*sqrt(2) + sqrt(80)", "12", "24*sqrt(80)", "24"], answerType: "mcq", answer: 3,
    explanation: "(2sqrt2)^2 + (6sqrt2)^2 = 8 + 72 = 80 = (sqrt80)^2, so sqrt(80) is the hypotenuse and 2sqrt2, 6sqrt2 are the legs. Area = (1/2)(2sqrt2)(6sqrt2) = (1/2)(24) = 12." },
  { id: 1089, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Advanced Math: Polynomials", difficulty: "Hard",
    passage: null,
    question: "The expression 4x^2 + bx - 45, where b is a constant, can be rewritten as (hx + k)(x + j), where h, k, and j are integer constants. Which of the following must be an integer?",
    options: ["b/h", "b/k", "45/h", "45/k"], answerType: "mcq", answer: 3,
    explanation: "Expanding (hx+k)(x+j) = hx^2 + (hj+k)x + kj, so h=4 and kj = -45. Since k and j are integers with kj=-45, j = -45/k must be an integer, meaning 45/k is always an integer." },
  { id: 1090, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Advanced Math: Quadratics", difficulty: "Hard",
    passage: null,
    question: "y = 2x^2 - 21x + 64\ny = 3x + a\nIn the given system of equations, a is a constant. The graphs of the equations in the given system intersect at exactly one point, (x, y), in the xy-plane. What is the value of x?",
    options: ["-8", "-6", "6", "8"], answerType: "mcq", answer: 2,
    explanation: "Setting equations equal: 2x^2 - 24x + (64-a) = 0. For exactly one intersection, discriminant = 0: 576 - 8(64-a) = 0, giving a = -8. Then x = -b/(2a) = 24/4 = 6." },
  { id: 1091, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Geometry: Special Right Triangles", difficulty: "Medium",
    passage: null,
    question: "An isosceles right triangle has a hypotenuse of length 58 inches. What is the perimeter, in inches, of this triangle?",
    options: ["29*sqrt(2)", "58*sqrt(2)", "58 + 58*sqrt(2)", "58 + 116*sqrt(2)"], answerType: "mcq", answer: 2,
    explanation: "Each leg = 58/sqrt(2) = 29*sqrt(2). Perimeter = 58 + 2(29*sqrt(2)) = 58 + 58*sqrt(2)." },
  { id: 1092, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Advanced Math: Quadratics", difficulty: "Hard",
    passage: null,
    question: "In the xy-plane, a parabola has vertex (9, -14) and intersects the x-axis at two points. If the equation of the parabola is written in the form y = ax^2 + bx + c, where a, b, and c are constants, which of the following could be the value of a + b + c?",
    options: ["-23", "-19", "-14", "-12"], answerType: "mcq", answer: 3,
    explanation: "a + b + c = f(1). Writing y = a(x-9)^2 - 14, f(1) = a(64) - 14 = 64a - 14. Since the parabola opens upward (two real roots with vertex below the x-axis), a > 0, so 64a - 14 > -14. Only -12 satisfies this." },
  { id: 1093, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 1", topic: "Advanced Math: Exponential Functions", difficulty: "Hard",
    passage: null,
    question: "Function f is defined by f(x) = -a^x + b, where a and b are constants. In the xy-plane, the graph of y = f(x) - 15 has a y-intercept at (0, -99/7). The product of a and b is 65/7. What is the value of a?",
    options: null, answerType: "gridIn", answer: "5",
    explanation: "f(0) = -1 + b. The y-intercept of y=f(x)-15 is f(0)-15 = b - 16 = -99/7, so b = 13/7. Then a*(13/7) = 65/7, giving a = 5." },
  { id: 1094, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis", difficulty: "Easy",
    passage: "[Line graph: estimated number of chipmunks in a state park, 1989-1999, peaking around 1994 at approximately 160]",
    question: "Based on the line graph, in which year was the estimated number of chipmunks in the state park the greatest?",
    options: ["1989", "1994", "1995", "1998"], answerType: "mcq", answer: 1,
    explanation: "The line graph peaks (highest point, ~160) in 1994." },
  { id: 1095, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis: Unit Conversion", difficulty: "Easy",
    passage: null,
    question: "A fish swam a distance of 5,104 yards. How far did the fish swim, in miles? (1 mile = 1,760 yards)",
    options: ["0.3", "2.9", "3,344", "6,864"], answerType: "mcq", answer: 1,
    explanation: "5,104 / 1,760 = 2.9 miles." },
  { id: 1096, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Polynomials", difficulty: "Easy",
    passage: null,
    question: "Which expression is equivalent to 12x^3 - 5x^3?",
    options: ["7x^6", "17x^3", "7x^3", "17x^6"], answerType: "mcq", answer: 2,
    explanation: "12x^3 - 5x^3 = 7x^3 (like terms, subtract coefficients, exponent unchanged)." },
  { id: 1097, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Systems of Equations", difficulty: "Easy",
    passage: null,
    question: "x + y = 18\n5y = x\nWhat is the solution (x, y) to the given system of equations?",
    options: ["(15, 3)", "(16, 2)", "(17, 1)", "(18, 0)"], answerType: "mcq", answer: 0,
    explanation: "Substituting x = 5y into x + y = 18: 5y + y = 18, 6y = 18, y = 3, x = 15." },
  { id: 1098, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Inequalities", difficulty: "Easy",
    passage: null,
    question: "The point (8, 2) in the xy-plane is a solution to which of the following systems of inequalities?",
    options: ["x > 0, y > 0", "x > 0, y < 0", "x < 0, y > 0", "x < 0, y < 0"], answerType: "mcq", answer: 0,
    explanation: "Both coordinates of (8,2) are positive, satisfying x > 0 and y > 0." },
  { id: 1099, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Absolute Value Equations", difficulty: "Easy",
    passage: null,
    question: "|x - 5| = 10. What is one possible solution to the given equation?",
    options: null, answerType: "gridIn", answer: "15",
    explanation: "x - 5 = 10 gives x = 15, or x - 5 = -10 gives x = -5. Either is acceptable; 15 is given here." },
  { id: 1100, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Function Evaluation", difficulty: "Easy",
    passage: null,
    question: "f(x) = 7x + 1. The function gives the total number of people on a company retreat with x managers. What is the total number of people on a company retreat with 7 managers?",
    options: null, answerType: "gridIn", answer: "50",
    explanation: "f(7) = 7(7) + 1 = 49 + 1 = 50." },
  { id: 1101, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Quadratic Functions", difficulty: "Easy",
    passage: null,
    question: "h(x) = x^2 - 3. Which table gives three values of x and their corresponding values of h(x) for the given function h?",
    options: ["x=1,2,3 -> h(x)=4,5,6", "x=1,2,3 -> h(x)=-2,1,6", "x=1,2,3 -> h(x)=-1,1,3", "x=1,2,3 -> h(x)=-2,1,3"], answerType: "mcq", answer: 1,
    explanation: "h(1) = 1-3 = -2; h(2) = 4-3 = 1; h(3) = 9-3 = 6." },
  { id: 1102, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Exponential Functions", difficulty: "Easy",
    passage: null,
    question: "The function f is defined by f(x) = 270(0.1)^x. What is the value of f(0)?",
    options: ["0", "1", "27", "270"], answerType: "mcq", answer: 3,
    explanation: "f(0) = 270(0.1)^0 = 270(1) = 270." },
  { id: 1103, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis: Margin of Error", difficulty: "Medium",
    passage: null,
    question: "To estimate the proportion of a population that has a certain characteristic, a random sample was selected from the population. Based on the sample, it is estimated that the proportion of the population that has the characteristic is 0.49, with an associated margin of error of 0.04. Based on this estimate and margin of error, which of the following is the most appropriate conclusion about the proportion of the population that has the characteristic?",
    options: ["It is plausible that the proportion is between 0.45 and 0.53.", "It is plausible that the proportion is less than 0.45.", "The proportion is exactly 0.49.", "It is plausible that the proportion is greater than 0.53."], answerType: "mcq", answer: 0,
    explanation: "The margin of error gives a plausible range of 0.49 +/- 0.04, i.e., 0.45 to 0.53." },
  { id: 1104, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Inequalities", difficulty: "Medium",
    passage: null,
    question: "A moving truck can tow a trailer if the combined weight of the trailer and the boxes it contains is no more than 4,600 pounds. What is the maximum number of boxes this truck can tow in a trailer with a weight of 500 pounds if each box weighs 120 pounds?",
    options: ["34", "35", "38", "39"], answerType: "mcq", answer: 0,
    explanation: "500 + 120n <= 4600, so 120n <= 4100, n <= 34.17, so the maximum whole number of boxes is 34." },
  { id: 1105, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Quadratic Equations", difficulty: "Medium",
    passage: null,
    question: "-4x^2 - 7x = -36. What is the positive solution to the given equation?",
    options: ["7/4", "9/4", "4", "7"], answerType: "mcq", answer: 1,
    explanation: "Rewriting: 4x^2 + 7x - 36 = 0. Discriminant = 49 + 576 = 625 = 25^2. x = (-7+25)/8 = 18/8 = 9/4 (positive solution)." },
  { id: 1106, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis: Probability", difficulty: "Easy",
    passage: "[Table: Square-Red 10, Square-Blue 20, Square-Yellow 25, Square-Total 55; Pentagon-Red 20, Pentagon-Blue 10, Pentagon-Yellow 15, Pentagon-Total 45; Total-Red 30, Total-Blue 30, Total-Yellow 40, Total 100]",
    question: "If one of these tiles is selected at random, what is the probability of selecting a red tile? (Express your answer as a decimal or fraction, not as a percent.)",
    options: null, answerType: "gridIn", answer: "0.3",
    explanation: "30 red tiles out of 100 total tiles: 30/100 = 0.3 (or 3/10)." },
  { id: 1107, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Linear Functions", difficulty: "Easy",
    passage: null,
    question: "f(x) = 2x + 3. For the given function f, the graph of y = f(x) in the xy-plane is parallel to line j. What is the slope of line j?",
    options: null, answerType: "gridIn", answer: "2",
    explanation: "Parallel lines have equal slopes; f(x) = 2x + 3 has slope 2." },
  { id: 1108, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Systems/Word Problems", difficulty: "Medium",
    passage: null,
    question: "A proposal for a new library was included on an election ballot. A radio show stated that 3 times as many people voted in favor of the proposal as people who voted against it. A social media post reported that 15,000 more people voted in favor of the proposal than voted against it. Based on these data, how many people voted against the proposal?",
    options: ["7,500", "15,000", "22,500", "45,000"], answerType: "mcq", answer: 0,
    explanation: "Let x = against, 3x = favor. 3x - x = 15,000, so 2x = 15,000, x = 7,500." },
  { id: 1109, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Geometry: Parallel Lines and Angles", difficulty: "Hard",
    passage: "[Figure: lines m and n are parallel, cut by transversal t; angle x is above the intersection with m, angle y is below it (vertical angles); angle z is at the intersection with n]",
    question: "In the figure, lines m and n are parallel. If x = 6k + 13 and y = 8k - 29, what is the value of z?",
    options: ["3", "21", "41", "139"], answerType: "mcq", answer: 3,
    explanation: "Angles x and y are vertical angles, so they're equal: 6k+13 = 8k-29, giving k=21. Then x = 6(21)+13 = 139. Since z is a corresponding angle to x (parallel lines cut by a transversal), z = 139." },
  { id: 1110, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Equations with No Solution", difficulty: "Medium",
    passage: null,
    question: "-3x + 21px = 84. In the given equation, p is a constant. The equation has no solution. What is the value of p?",
    options: ["0", "1/7", "4/3", "4"], answerType: "mcq", answer: 1,
    explanation: "x(-3 + 21p) = 84 has no solution when the coefficient of x is 0 (but the constant isn't): -3 + 21p = 0, so p = 3/21 = 1/7." },
  { id: 1111, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Advanced Math: Quadratic Functions", difficulty: "Medium",
    passage: null,
    question: "f(x) = (x - 10)(x + 13). The function f is defined by the given equation. For what value of x does f(x) reach its minimum?",
    options: ["-130", "-13", "-23/2", "-3/2"], answerType: "mcq", answer: 3,
    explanation: "The roots are x=10 and x=-13; the vertex (minimum, since the parabola opens upward) is at the midpoint: (10 + (-13))/2 = -3/2." },
  { id: 1112, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Advanced Math: Quadratic Functions", difficulty: "Medium",
    passage: null,
    question: "The function f(x) = (1/9)(x-7)^2 + 3 gives a metal ball's height above the ground f(x), in inches, x seconds after it started moving on a track, where 0 <= x <= 10. Which of the following is the best interpretation of the vertex of the graph of y = f(x) in the xy-plane?",
    options: ["The metal ball's minimum height was 3 inches above the ground.", "The metal ball's minimum height was 7 inches above the ground.", "The metal ball's height was 3 inches above the ground when it started moving.", "The metal ball's height was 7 inches above the ground when it started moving."], answerType: "mcq", answer: 0,
    explanation: "The vertex form shows the vertex at (7, 3): since the parabola opens upward, this is the minimum value, 3 inches, occurring at x = 7 seconds (not at the start)." },
  { id: 1113, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Geometry: Trigonometry", difficulty: "Medium",
    passage: null,
    question: "In triangle JKL, cos(K) = 24/51 and angle J is a right angle. What is the value of cos(L)?",
    options: null, answerType: "gridIn", answer: "15/17",
    explanation: "Since J is the right angle, K and L are complementary, so cos(L) = sin(K). sin(K) = sqrt(1 - (24/51)^2) = sqrt(2025/2601) = 45/51 = 15/17." },
  { id: 1114, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Advanced Math: Quadratics/Discriminant", difficulty: "Hard",
    passage: null,
    question: "-x^2 + bx - 676 = 0. In the given equation, b is a positive integer. The equation has no real solution. What is the greatest possible value of b?",
    options: null, answerType: "gridIn", answer: "51",
    explanation: "Rewriting as x^2 - bx + 676 = 0, discriminant = b^2 - 2704 < 0, so b^2 < 2704, |b| < 52. The greatest positive integer satisfying this is 51." },
  { id: 1115, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Algebra: Systems of Equations", difficulty: "Hard",
    passage: "[Graph of a line, and the system also includes the equation x + 4y = -16]",
    question: "If a new graph of three linear equations is created using the system of equations shown and the equation x + 4y = -16, how many solutions (x, y) will the resulting system of three equations have?",
    options: ["Zero", "Exactly one", "Exactly two", "Infinitely many"], answerType: "mcq", answer: 0,
    explanation: "The graphed line appears parallel to x + 4y = -16 (same slope, different intercept), so no point satisfies all three equations simultaneously. (Verify against the exact graphed line in the source PDF, as this reading is based on visual estimation.)" },
  { id: 1116, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Advanced Math: Exponential Growth/Decay", difficulty: "Medium",
    passage: null,
    question: "f(x) = 5,470(0.64)^(x/12). The function f gives the value, in dollars, of a certain piece of equipment after x months of use. If the value of the equipment decreases each year by p% of its value the preceding year, what is the value of p?",
    options: ["4", "5", "36", "64"], answerType: "mcq", answer: 2,
    explanation: "Since x is in months, x/12 counts years, so the annual multiplier is 0.64 (i.e., value retains 64% each year), meaning it decreases by 100-64=36% each year." },
  { id: 1117, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis: Statistics", difficulty: "Medium",
    passage: "[Dot plot of Data Set A: 15 values ranging from 22 to 26]",
    question: "The dot plot represents the 15 values in data set A. Data set B is created by adding 56 to each of the values in data set A. Which of the following correctly compares the medians and the ranges of data sets A and B?",
    options: ["The median of data set B is equal to the median of data set A, and the range of data set B is equal to the range of data set A.", "The median of data set B is equal to the median of data set A, and the range of data set B is greater than the range of data set A.", "The median of data set B is greater than the median of data set A, and the range of data set B is equal to the range of data set A.", "The median of data set B is greater than the median of data set A, and the range of data set B is greater than the range of data set A."], answerType: "mcq", answer: 2,
    explanation: "Adding a constant (56) to every value shifts the median up by 56 (greater) but does not change the range (max-min stays the same, since both increase by the same amount)." },
  { id: 1118, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Geometry: Circles", difficulty: "Medium",
    passage: null,
    question: "The equation x^2 + (y-1)^2 = 49 represents circle A. Circle B is obtained by shifting circle A down 2 units in the xy-plane. Which of the following equations represents circle B?",
    options: ["(x-2)^2 + (y-1)^2 = 49", "x^2 + (y-3)^2 = 49", "(x+2)^2 + (y-1)^2 = 49", "x^2 + (y+1)^2 = 49"], answerType: "mcq", answer: 3,
    explanation: "Circle A has center (0,1). Shifting down 2 units gives center (0,-1), so the equation becomes x^2 + (y+1)^2 = 49." },
  { id: 1119, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Geometry: Surface Area", difficulty: "Hard",
    passage: null,
    question: "Two identical rectangular prisms each have a height of 90 centimeters (cm). The base of each prism is a square, and the surface area of each prism is K cm^2. If the prisms are glued together along a square base, the resulting prism has a surface area of (92/47)K cm^2. What is the side length, in cm, of each square base?",
    options: ["4", "8", "9", "16"], answerType: "mcq", answer: 1,
    explanation: "Each prism: K = 2s^2 + 360s. Glued (height 180): surface area = 2s^2 + 720s. Setting 2s^2+720s = (92/47)(2s^2+360s) and solving gives 720s = 90s^2, so s = 8." },
  { id: 1120, exam: "SAT", year: 2024, practiceTest: 4, subject: "Math", module: "Module 2", topic: "Problem Solving and Data Analysis: Percentages", difficulty: "Medium",
    passage: null,
    question: "210 is p% greater than 30. What is the value of p?",
    options: null, answerType: "gridIn", answer: "600",
    explanation: "210 = 30(1 + p/100), so 7 = 1 + p/100, p/100 = 6, p = 600." },
];

const SUBJECTS = ["All Subjects", ...new Set(QUESTIONS.map(q => q.subject))];

// ── COLLEGES DATA ─────────────────────────────────────────────────────────────
const COLLEGES = [
  // Ivy League / US
  { id: "harvard", name: "Harvard University", country: "USA", region: "Ivy League", acceptanceRate: "3.4%", competitiveness: "Extreme",
    requirements: ["SAT 1480-1580 or ACT 33-35", "Top 1% of class rank", "3-4 AP/IB courses minimum", "Strong essays + extracurricular leadership", "2 teacher recommendations"],
    notes: "No minimum GPA but near-perfect academics expected. Holistic review — essays and impact matter as much as scores.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Harvard_University_coat_of_arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_Medical_School_HDR.jpg/1280px-Harvard_Medical_School_HDR.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/11/Sanders_theater_2009y.JPG", "https://upload.wikimedia.org/wikipedia/commons/5/51/Massachusetts_Hall%2C_Harvard_University.JPG", "https://upload.wikimedia.org/wikipedia/commons/8/89/Harvard_Medical_School_%2854954429258%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_Medical_School_HDR.jpg/1280px-Harvard_Medical_School_HDR.jpg",
    virtualTour: "https://www.commonapp.org/explore/harvard-university" },
  { id: "yale", name: "Yale University", country: "USA", region: "Ivy League", acceptanceRate: "4.5%", competitiveness: "Extreme",
    requirements: ["SAT 1460-1580 or ACT 33-35", "Rigorous course load (AP/IB)", "Compelling personal essays", "Demonstrated leadership", "2-3 recommendation letters"],
    notes: "Known for valuing intellectual curiosity. Supplemental essays carry significant weight.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/Yale_University_Shield_1.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/f0/Old_campus.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/fb/Yale_Law_School_in_the_Sterling_Law_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6a/Hopper_College_Courtyard.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Old_campus.jpg",
    virtualTour: "https://www.commonapp.org/explore/yale-university" },
  { id: "princeton", name: "Princeton University", country: "USA", region: "Ivy League", acceptanceRate: "4.0%", competitiveness: "Extreme",
    requirements: ["SAT 1470-1570 or ACT 33-35", "Top of class rank", "4 years math/science recommended", "Strong quantitative + writing skills", "Interview (for some applicants)"],
    notes: "Strong in STEM and public policy. No-loan financial aid for international students who qualify.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Princeton_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/07/Cannon_Green_and_Nassau_Hall%2C_Princeton_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/61/Princeton_University_Art_Museum_%2855144836589%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/McCosh_50_Renovated.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/07/Cannon_Green_and_Nassau_Hall%2C_Princeton_University.jpg",
    virtualTour: "https://www.commonapp.org/explore/princeton-university" },
  { id: "columbia", name: "Columbia University", country: "USA", region: "Ivy League", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong Core Curriculum fit", "Compelling essays on intellectual interests", "2 teacher recommendations", "Demonstrated leadership"],
    notes: "Located in New York City. Core Curriculum is mandatory — show genuine love for interdisciplinary learning.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Coat_of_Arms_of_Columbia_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/44/Columbia_College_Walk.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/85/Almamater.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/2c/Detroit_Photographic_Company_%280671%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/44/Columbia_College_Walk.jpg",
    virtualTour: "https://www.commonapp.org/explore/columbia-university" },
  { id: "penn", name: "University of Pennsylvania", country: "USA", region: "Ivy League", acceptanceRate: "5.4%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong Wharton/SEAS/College fit essays", "Demonstrated leadership and impact", "2 teacher recommendations", "Interview optional"],
    notes: "Home of the Wharton School — best Ivy for business + STEM combo. Strong pre-med program. ED heavily favored.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/92/UPenn_shield_with_banner.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/6/69/Penn_campus_2.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/146%2C_Memorial_Tower_and_Statue%2C_University_of_Pennsylvania_%28NBY_6566%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/6/69/Penn_campus_2.jpg",
    virtualTour: "https://www.commonapp.org/explore/university-of-pennsylvania" },
  { id: "brown", name: "Brown University", country: "USA", region: "Ivy League", acceptanceRate: "5.6%", competitiveness: "Extreme",
    requirements: ["SAT 1490-1570 or ACT 34-35", "Open Curriculum — show self-direction", "Creative and compelling essays", "Demonstrated intellectual curiosity", "2 teacher recommendations"],
    notes: "Unique Open Curriculum — no core requirements. Students design their own academic path. Essays must show genuine intellectual passion.",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/50/Shield_of_Brown_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/2f/Brown%27s_University_Hall_in_2007.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ac/John_Hay_Library_%28Brown%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/8d/Das_östliche_Eingangstor_der_Brown_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/Manning_Hall%2C_Brown_University%2C_Providence%2C_Rhode_Island_-_20091108_straighten.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Brown%27s_University_Hall_in_2007.jpg",
    virtualTour: "https://www.commonapp.org/explore/brown-university" },
  { id: "dartmouth", name: "Dartmouth College", country: "USA", region: "Ivy League", acceptanceRate: "6.0%", competitiveness: "Extreme",
    requirements: ["SAT 1480-1570 or ACT 33-35", "Strong demonstrated interest", "Compelling personal narrative", "3 recommendation letters", "Interview recommended"],
    notes: "Smallest Ivy — tight-knit community feel. Strong liberal arts + Tuck School of Business (MBA). D-Plan term system unique to Dartmouth.",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e4/Dartmouth_College_shield.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ec/Dartmouth_College_campus_2007-10-20_09.JPG", "https://upload.wikimedia.org/wikipedia/commons/0/0b/Dartmouth_Hall%2C_Dartmouth_College_-_general_view.JPG", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Dartmouth_College_campus_2007-11-06_Baker_Memorial_Library_08_-_Tower_Room.JPG", "https://upload.wikimedia.org/wikipedia/commons/f/ff/Dartmouth_College_campus_2007-06-23_Tuck_School_of_Business.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Dartmouth_College_campus_2007-10-20_09.JPG",
    virtualTour: "https://www.commonapp.org/explore/dartmouth-college" },
  { id: "cornell", name: "Cornell University", country: "USA", region: "Ivy League", acceptanceRate: "8.4%", competitiveness: "Very High",
    requirements: ["SAT 1450-1570 or ACT 33-35", "College-specific requirements vary", "Strong essays tailored to chosen college", "2 teacher recommendations", "Supplement specific to each school"],
    notes: "Most accessible Ivy by acceptance rate. Apply to a specific college (Engineering, Arts & Sciences, etc.) — each has different requirements.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/47/Cornell_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/08/Willard_Straight_Hall%2C_Cornell_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/Cornell_University_arts_quad.JPG", "https://upload.wikimedia.org/wikipedia/commons/3/34/Cornell_University%2C_Ho_Plaza_and_Sage_Hall.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/52/Cornell_West_Campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Willard_Straight_Hall%2C_Cornell_University.jpg",
    virtualTour: "https://www.commonapp.org/explore/cornell-university" },
  { id: "mit", name: "MIT", country: "USA", region: "Top US (STEM)", acceptanceRate: "4.6%", competitiveness: "Extreme",
    requirements: ["SAT Math 780+ recommended", "Calculus + Physics coursework", "Strong problem-solving essays", "Portfolio/projects recommended", "2 recommendation letters"],
    notes: "Best fit for CS/Engineering-focused students. Values demonstrated technical projects (GitHub, builds, competitions).",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/1920px-MIT_Seal.svg.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/88/Massachusetts_Institute_of_Technology_%28MIT%29_%2854960815718%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ea/Ray_and_Maria_Stata_Center_%28MIT%29.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/88/Massachusetts_Institute_of_Technology_%28MIT%29_%2854960815718%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/massachusetts-institute-of-technology" },
  { id: "stanford", name: "Stanford University", country: "USA", region: "Top US (STEM)", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong STEM + entrepreneurship signals", "Unique personal narrative", "Significant extracurricular impact", "2 recommendation letters"],
    notes: "Silicon Valley adjacent — rewards founders, builders, and self-starters heavily.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Leland_Stanford_Junior_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/b/b6/Stanford_University_Arches_with_Memorial_Church_in_the_background.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5c/Statue_of_Stanford_Family.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/24/View_Stanford.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Stanford_University_Arches_with_Memorial_Church_in_the_background.jpg",
    virtualTour: "https://www.commonapp.org/explore/stanford-university" },
  { id: "caltech", name: "California Institute of Technology", country: "USA", region: "Top US (STEM)", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT Math 800 near-required", "Physics + Calculus + Chemistry mastery", "Research experience strongly preferred", "3 recommendation letters", "Honor code commitment"],
    notes: "Smallest elite STEM school (~2,300 students). Every student does original research. Intense — not for the faint-hearted. Best for pure scientists.",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/Seal_of_the_California_Institute_of_Technology.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/cc/Caltech_Entrance.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/9c/Robert_A._Millikan_Memorial_Library_at_Caltech.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/75/Broad_center.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/27/Beckman_auditorium%2C_Caltech.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Caltech_Entrance.jpg",
    virtualTour: "https://www.commonapp.org/explore/california-institute-of-technology" },
  { id: "johns_hopkins", name: "Johns Hopkins University", country: "USA", region: "Top US (STEM)", acceptanceRate: "7.0%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong research experience", "Medical/science passion evident", "2 teacher recommendations", "Strong supplement essays"],
    notes: "#1 research university in the US. Pre-med pipeline is unmatched. Also excellent for international studies and engineering.",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/09/Johns_Hopkins_University%27s_Academic_Seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/3/3f/View_from_Levering_Plaza.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c1/George-peabody-library.jpg", "https://upload.wikimedia.org/wikipedia/en/d/d4/Hopkins_hospital.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3f/View_from_Levering_Plaza.jpg",
    virtualTour: "https://www.commonapp.org/explore/johns-hopkins-university" },
  // UK
  { id: "oxford", name: "University of Oxford", country: "UK", region: "UK (Oxbridge)", acceptanceRate: "~13%", competitiveness: "Very High",
    requirements: ["A-Levels: A*AA typical (varies by course)", "IGCSE/GCSE 9-7 in relevant subjects", "Subject-specific entrance test (e.g. TSA, MAT)", "Personal statement", "Interview (shortlisted candidates)"],
    notes: "Course-specific colleges system. Strong personal statement tailored to your subject is critical.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Coat_of_arms_of_the_University_of_Oxford.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/45/Mob_Quad_from_Chapel_Tower.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/46/Lady_Margaret_Hall_%286148510434%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/St._Hugh%27s.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/45/Mob_Quad_from_Chapel_Tower.jpg",
    virtualTour: "https://www.ox.ac.uk" },
  { id: "cambridge", name: "University of Cambridge", country: "UK", region: "UK (Oxbridge)", acceptanceRate: "~21%", competitiveness: "Very High",
    requirements: ["A-Levels: A*A*A typical (varies by course)", "Strong IGCSE results (mostly 8-9/A*)", "Subject-specific entrance assessment", "Personal statement", "Interview"],
    notes: "Highly subject-focused. STEM applicants benefit from olympiad or research experience.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/9/9c/Peterhouse_Chapel.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bd/Emmanuel_College_Front_Court%2C_Cambridge%2C_UK_-_Diliff.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ab/Queens%27_College_-_Mathematical_Bridge.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3c/Library_in_winter%2C_Faculty_of_Education%2C_University_of_Cambridge.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Peterhouse_Chapel.jpg",
    virtualTour: "https://www.cam.ac.uk" },
  { id: "imperial", name: "Imperial College London", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~14%", competitiveness: "High",
    requirements: ["A-Levels: A*A*A typical for Engineering/CS", "Strong Maths + Physics grades", "Personal statement focused on subject passion", "Some courses require entrance test"],
    notes: "Excellent for Engineering, CS, and Medicine. Less emphasis on extracurriculars vs US schools.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Shield_of_Imperial_College_London.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/a/a6/City_and_Guilds_Building_front_side%2C_Exhibiton_Road_on_a_spring_afternoon.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/68/Royal_School_of_Mines_Imperial_College_London_2020_02.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c2/Imperial_College_Business_School.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/City_and_Guilds_Building_front_side%2C_Exhibiton_Road_on_a_spring_afternoon.jpg",
    virtualTour: "https://www.imperial.ac.uk" },
  // Nigeria Federal
  { id: "unilag", name: "University of Lagos (UNILAG)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses (Medicine 280+)", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam", "O'level results uploaded on JAMB CAPS"],
    notes: "Medicine, Law, and Engineering are the most competitive. Post-UTME cutoff varies yearly by department. #1 ranked university in Nigeria (THE 2026).",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/University_of_Lagos_Main_Gate.jpg/800px-University_of_Lagos_Main_Gate.jpg",
    virtualTour: "https://unilag.edu.ng" },
  { id: "oau", name: "Obafemi Awolowo University (OAU)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Strong O'level grades (A1-B3 preferred)"],
    notes: "Known for strong Pharmacy, Medicine, and Engineering programs. Very competitive cutoffs each year. Beautiful Ile-Ife campus.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Obafemi_Awolowo_University_main_gate.jpg/800px-Obafemi_Awolowo_University_main_gate.jpg",
    virtualTour: "https://oauife.edu.ng" },
  { id: "ui", name: "University of Ibadan (UI)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam", "Premier university — high competition across all courses"],
    notes: "Nigeria's first university (est. 1948). Strong reputation across Medicine, Law, and Arts. Oldest and most storied campus in Nigeria.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/University_of_Ibadan_-_Main_Building.jpg/800px-University_of_Ibadan_-_Main_Building.jpg",
    virtualTour: "https://www.ui.edu.ng" },
  { id: "abu", name: "Ahmadu Bello University (ABU)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Strong science grades for Engineering/Medicine"],
    notes: "Largest university in Nigeria by landmass. Excellent Engineering, Agriculture, and Medicine programs.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ahmadu_Bello_University%2C_Zaria.jpg/800px-Ahmadu_Bello_University%2C_Zaria.jpg",
    virtualTour: "https://www.abu.edu.ng" },
  { id: "unn", name: "University of Nigeria, Nsukka (UNN)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Medicine and Law are most competitive"],
    notes: "First indigenous university in Nigeria (est. 1960). Strong Medicine, Law, and Engineering faculties. Historic Enugu State campus.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/University_of_Nigeria_Nsukka_gate.jpg/800px-University_of_Nigeria_Nsukka_gate.jpg",
    virtualTour: "https://www.unn.edu.ng" },
  { id: "uniben", name: "University of Benin (UNIBEN)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Medicine cutoff typically 280+"],
    notes: "Strong Medicine, Law, and Engineering. One of the largest campuses in Nigeria. High demand for Medicine annually.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/University_of_Benin_main_gate.jpg/800px-University_of_Benin_main_gate.jpg",
    virtualTour: "https://www.uniben.edu.ng" },
  { id: "lasu", name: "Lagos State University (LASU)", country: "Nigeria", region: "Nigeria (State)", acceptanceRate: "Moderate (Post-UTME based)", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "LASU Post-UTME screening", "Lagos State residency may give advantage"],
    notes: "Major state university in Lagos. Good Law, Social Sciences, and Education programs. More affordable than federal universities for Lagos residents.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lagos_State_University_Ojo_campus.jpg/800px-Lagos_State_University_Ojo_campus.jpg",
    virtualTour: "https://www.lasu.edu.ng" },
  // Nigeria Private
  { id: "covenant", name: "Covenant University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 180+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University-specific screening/interview", "Strong moral/character reference often required"],
    notes: "Top-ranked private university in Nigeria. Business, Engineering, and strong career placement. #3 ranked in Nigeria (THE 2026).",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Covenant_University_Main_Gate.jpg/800px-Covenant_University_Main_Gate.jpg",
    virtualTour: "https://covenantuniversity.edu.ng" },
  { id: "babcock", name: "Babcock University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam", "Medical certificate required"],
    notes: "Seventh-day Adventist institution. Strong Medicine, Law, and Management programs. Disciplined campus environment in Ogun State.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Babcock_University_Nigeria.jpg/800px-Babcock_University_Nigeria.jpg",
    virtualTour: "https://www.babcock.edu.ng" },
  { id: "pau", name: "Pan-Atlantic University (PAU)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University-specific entrance exam", "Interview for some programs"],
    notes: "Linked to the prestigious Lagos Business School. Strong entrepreneurship, management, and business programs.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Pan_Atlantic_University_Lagos.jpg/800px-Pan_Atlantic_University_Lagos.jpg",
    virtualTour: "https://pau.edu.ng" },
  { id: "aun", name: "American University of Nigeria (AUN)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["SAT recommended (optional)", "WAEC/NECO: minimum 5 credits incl. English & Maths", "AUN application + essays", "Interview required"],
    notes: "US-style liberal arts education in Yola. Fully English, American curriculum. Strong CS, Business, and Law. American degree recognition.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/American_University_of_Nigeria_campus.jpg/800px-American_University_of_Nigeria_campus.jpg",
    virtualTour: "https://www.aun.edu.ng" },
  // More US
  { id: "duke", name: "Duke University", country: "USA", region: "Top US (STEM)", acceptanceRate: "6.0%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong essays + leadership", "2 teacher recommendations", "Demonstrated interest in research"],
    notes: "Strong Medicine, Engineering, and Business. Beautiful Gothic campus in Durham, NC. Elite basketball culture too.",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Duke_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/81/Duke_Chapel%2C_West_Campus%2C_Duke_University%2C_Durham%2C_NC_%2848960356548%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/PerkinsLibrary.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/MedicalCenter.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/81/Duke_Chapel%2C_West_Campus%2C_Duke_University%2C_Durham%2C_NC_%2848960356548%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/duke-university" },
  { id: "georgetown", name: "Georgetown University", country: "USA", region: "Top US (STEM)", acceptanceRate: "12.0%", competitiveness: "Very High",
    requirements: ["SAT 1430-1550 or ACT 32-35", "Strong essays on intellectual interests", "2-3 recommendation letters", "Interview encouraged"],
    notes: "Best for International Relations and Foreign Service. Jesuit values. Washington DC location is a huge advantage for politics/policy students.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Georgetown_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/5c/Georgetown_University_%2853821005319%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a5/Georgetown_Jesuit_Residence.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/f9/Georgetown_University_School_of_Medicine_%26_School_of_Dentistry_%2853820913143%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Georgetown_University_%2853821005319%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/georgetown-university" },
  { id: "notre_dame", name: "University of Notre Dame", country: "USA", region: "Top US (STEM)", acceptanceRate: "12.9%", competitiveness: "Very High",
    requirements: ["SAT 1430-1550 or ACT 33-35", "Strong character/values fit", "2 recommendation letters", "Demonstrated interest"],
    notes: "Catholic university known for tight community, strong Business and Engineering, and legendary football culture.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e2/University_of_Notre_Dame_seal_%282%29.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/c9/Main_Building_at_the_University_of_Notre_Dame.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/ca/Notre_Dame_campus_view.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Main_Building_at_the_University_of_Notre_Dame.jpg",
    virtualTour: "https://www.commonapp.org/explore/university-of-notre-dame" },
  { id: "vanderbilt", name: "Vanderbilt University", country: "USA", region: "Top US (STEM)", acceptanceRate: "5.1%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong essays", "2 teacher recommendations", "Demonstrated interest"],
    notes: "Excellent Engineering, Business, and Peabody (Education). Strong financial aid. Nashville location, vibrant campus life.",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/29/Vanderbilt_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/da/E._Bronson_Ingram_College.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/ca/The_Wond%27ry.png", "https://upload.wikimedia.org/wikipedia/commons/3/3f/Bicentennial_Oak.png"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/da/E._Bronson_Ingram_College.jpg",
    virtualTour: "https://www.commonapp.org/explore/vanderbilt-university" },
  { id: "cmu", name: "Carnegie Mellon University", country: "USA", region: "Top US (STEM)", acceptanceRate: "11.3%", competitiveness: "Very High",
    requirements: ["SAT Math 780+ recommended for CS/Engineering", "Strong portfolio for arts/design programs", "2 recommendation letters", "School-specific supplement essays"],
    notes: "World-renowned Computer Science program (one of the best globally). Highly competitive CS admit rate is much lower than overall rate.",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/bb/Carnegie_Mellon_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/21/Carnegie_Mellon_University_as_seen_from_the_Cathedral_of_Learning.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/Carnegie_Mellon_Hamerschlag_Hall_and_Scott_Hall.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/9a/Cmu-africa-aerial-2021.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/21/Carnegie_Mellon_University_as_seen_from_the_Cathedral_of_Learning.jpg",
    virtualTour: "https://www.commonapp.org/explore/carnegie-mellon-university" },
  { id: "ucla", name: "UCLA", country: "USA", region: "Top US (STEM)", acceptanceRate: "8.6%", competitiveness: "Very High",
    requirements: ["UC application (not Common App)", "Strong GPA + course rigor", "4 Personal Insight Questions essays", "No letters of recommendation needed"],
    notes: "Top public university. Excellent Film, Business, Engineering, and Medicine. Uses the UC application system, not Common App.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0d/The_University_of_California_UCLA.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/a/ad/Royce_Hall_post_rain.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/67/Legally_Blonde_filming_location_at_Kerckhoff_Hall_at_UCLA.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1b/Ronald_Reagan_UCLA_Medical_Center_June_2012_001.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Royce_Hall_post_rain.jpg",
    virtualTour: "https://www.ucla.edu" },
  { id: "berkeley", name: "UC Berkeley", country: "USA", region: "Top US (STEM)", acceptanceRate: "11.6%", competitiveness: "Very High",
    requirements: ["UC application (not Common App)", "Strong GPA + course rigor", "4 Personal Insight Questions essays", "No letters of recommendation needed"],
    notes: "#1 public university globally by many rankings. World-class Engineering and CS (EECS). Highly competitive for international students.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Seal_of_University_of_California%2C_Berkeley.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/24/Berkeley_glade_afternoon.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1c/Wheeler_Hall%2C_University_of_California%2C_Berkeley.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/85/UCB_Doe_Memorial_Library_oblique_view_dllu.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/24/Berkeley_glade_afternoon.jpg",
    virtualTour: "https://www.berkeley.edu" },
  { id: "nyu", name: "New York University", country: "USA", region: "Top US (STEM)", acceptanceRate: "8.0%", competitiveness: "High",
    requirements: ["SAT 1450-1560 or ACT 33-35", "Strong essays + creative portfolio (for Tisch)", "2 recommendation letters", "Demonstrated interest"],
    notes: "No traditional campus — fully integrated into NYC. Global campuses in Abu Dhabi and Shanghai. Strong Business (Stern), Film (Tisch), and CS.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/New_York_University_Seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1d/NYC_-_Washington_Square_Park_-_Arch.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5f/Courant_Institute_of_Mathematical_Sciences_%2848072654781%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/NYUAbuDhabiSaadiyat.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/NYC_-_Washington_Square_Park_-_Arch.jpg",
    virtualTour: "https://www.commonapp.org/explore/new-york-university" },
  { id: "bu", name: "Boston University", country: "USA", region: "Top US (STEM)", acceptanceRate: "10.8%", competitiveness: "High",
    requirements: ["SAT 1420-1530 or ACT 31-34", "Strong essays", "2 recommendation letters", "Demonstrated interest"],
    notes: "Strong Communications, Business, and Medicine. Urban campus integrated into Boston. Good balance of selectivity and accessibility.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Boston_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/52/Marsh_Chapel.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/80/Aerial_Boston_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e6/Boston_at_sunset.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/52/Marsh_Chapel.jpg",
    virtualTour: "https://www.commonapp.org/explore/boston-university" },
  // More UK
  { id: "ucl", name: "University College London (UCL)", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["A-Levels: A*AA to AAA depending on course", "Strong personal statement", "Some courses require entrance test", "IGCSE 6-9 in relevant subjects"],
    notes: "London's largest university by research output. Excellent for Architecture, Medicine, Engineering, and Law. Diverse, global student body.",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/UCL_Logo%2C_plain_background.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/03/Wilkins_Building_1%2C_UCL%2C_London_-_Diliff.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/dc/The_UCL_School_of_Slavonic_and_East_European_Studies.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rockefeller_Building%2C_UCL.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/03/Wilkins_Building_1%2C_UCL%2C_London_-_Diliff.jpg",
    virtualTour: "https://www.ucl.ac.uk" },
  { id: "edinburgh", name: "University of Edinburgh", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "IGCSE 6-9 in relevant subjects"],
    notes: "One of Scotland's most prestigious universities. Strong Medicine, Informatics, and Law. Beautiful historic campus.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/University_of_Edinburgh_ceremonial_roundel.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Temple_of_Fame%2C_McEwan_Hall%2C_Edinburgh%2C_4.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3c/Informatics_Forum_Atrium_turned.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1d/Main_Library%2C_George_Square.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Temple_of_Fame%2C_McEwan_Hall%2C_Edinburgh%2C_4.jpg",
    virtualTour: "https://www.ed.ac.uk" },
  { id: "manchester", name: "University of Manchester", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~56%", competitiveness: "Moderate-High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "IGCSE 6-9 in relevant subjects"],
    notes: "Largest single-site university in the UK. Strong Engineering, Business, and Sciences. Excellent value with strong research output.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Shield_of_the_University_of_Manchester.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/42/Old_Quadrangle%2C_Manchester_1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/43/The_University_of_Manchester_%28with_snow%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Old_Quadrangle%2C_Manchester_1.jpg",
    virtualTour: "https://www.manchester.ac.uk" },
  { id: "kcl", name: "King's College London", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~25%", competitiveness: "High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "Some courses require entrance test"],
    notes: "Central London location. Excellent Medicine, Law, and War Studies. Part of the 'Golden Triangle' of UK universities.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/King%27s_College%2C_London_full_achievement.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/7/70/Strand102.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ea/Maughan_Chancery_Lane.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/21/The_Maughan_Library%2C_King%27s_College%2C_London.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/7/70/Strand102.jpg",
    virtualTour: "https://www.kcl.ac.uk" },
  { id: "lse", name: "London School of Economics (LSE)", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~9%", competitiveness: "Very High",
    requirements: ["A-Levels: A*AA typical", "Strong personal statement focused on Economics/Social Science", "IGCSE 7-9 in relevant subjects"],
    notes: "World's leading social science university. Best for Economics, Politics, and Finance. Highly competitive, very academic focus.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/42/London_School_of_Economics_Coat_of_Arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/7/79/Centre_Building%2C_LSE_from_LSE_Square.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/The_World_Turned_Upside_Down_%28sculpture_by_Mark_Wallinger%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b2/NABuilding.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/7/79/Centre_Building%2C_LSE_from_LSE_Square.jpg",
    virtualTour: "https://www.lse.ac.uk" },
  // Canada
  { id: "toronto", name: "University of Toronto", country: "Canada", region: "Canada", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["High school average 85%+ for competitive programs", "Strong supplementary essays for some programs", "WAEC/IGCSE accepted"],
    notes: "Canada's top-ranked university. Excellent Medicine, Engineering, and CS. Largest, most diverse campus in Canada.",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/04/Utoronto_coa.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/d8/UofTConvocationHall.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6f/Simcoe_Hall_%28University_of_Toronto%29_%281%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d8/UofTConvocationHall.jpg",
    virtualTour: "https://www.utoronto.ca" },
  { id: "mcgill", name: "McGill University", country: "Canada", region: "Canada", acceptanceRate: "~46%", competitiveness: "High",
    requirements: ["High school average 85%+ for competitive programs", "WAEC/IGCSE accepted", "Personal statement for some programs"],
    notes: "Canada's most internationally recognized university. Strong Medicine, Law, and Engineering. Beautiful Montreal campus.",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/29/McGill_University_CoA.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/df/Arts_Building%2C_McGill_University%2C_Aug_31_2022.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bf/Redpath_Museum_and_Lower_Field%2C_McGill_University%2C_July_18%2C_2024.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/26/Montreal_-_McGill_Physics.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/df/Arts_Building%2C_McGill_University%2C_Aug_31_2022.jpg",
    virtualTour: "https://www.mcgill.ca" },
  { id: "ubc", name: "University of British Columbia (UBC)", country: "Canada", region: "Canada", acceptanceRate: "~50%", competitiveness: "Moderate-High",
    requirements: ["High school average 80%+ for competitive programs", "Personal Profile essay required", "WAEC/IGCSE accepted"],
    notes: "Stunning Vancouver campus. Strong Sciences, Business (Sauder), and Forestry. Great quality of life and strong co-op programs.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4e/British_columbia_univ_coat_arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/b/ba/Raven-and-the-first-men.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/88/UBC_from_the_Air_8788.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/86/Irving_K._Barber_Library.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/88/UBC_from_the_Air_8788.jpg",
    virtualTour: "https://www.ubc.ca" },
  { id: "waterloo", name: "University of Waterloo", country: "Canada", region: "Canada", acceptanceRate: "~53%", competitiveness: "High",
    requirements: ["Strong Math/Science grades for CS/Engineering", "Some programs require supplementary application (CS especially)", "WAEC/IGCSE accepted"],
    notes: "Canada's #1 school for Computer Science and Engineering. Famous co-op program — students alternate study terms with paid work terms.",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/University_of_Waterloo_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/83/Panorama_MC_green_small.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b2/Dana_Porter_Library_2.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/83/Panorama_MC_green_small.jpg",
    virtualTour: "https://uwaterloo.ca" },
  { id: "queens_ca", name: "Queen's University", country: "Canada", region: "Canada", acceptanceRate: "~42%", competitiveness: "Moderate-High",
    requirements: ["High school average 85%+ for competitive programs", "Supplementary application for some programs", "WAEC/IGCSE accepted"],
    notes: "Strong Engineering, Business (Smith), and Health Sciences. Known for tight-knit campus community and school spirit in Kingston, Ontario.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/70/QueensU_Crest.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/58/Granthall.JPG", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Douglas_Library_at_Dusk%2C_Queen%27s_University%2C_Kingston%2C_Canada.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/58/Granthall.JPG",
    virtualTour: "https://www.queensu.ca" },
  // Malaysia
  { id: "um", name: "University of Malaya (UM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate-High",
    requirements: ["STPM/A-Levels/IB or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Some programs require entrance interview"],
    notes: "Malaysia's oldest and top-ranked university. Strong Medicine, Engineering, and Law. Affordable for international students compared to Western options.",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8f/University_of_Malaya_logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/9/95/University_of_Malaya_-_UM_Letters.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d4/Malaya_University_Faculty_of_Laws_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/91/Tan_Teck_Guan_Building%2C_Aug_07.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/9/95/University_of_Malaya_-_UM_Letters.jpg",
    virtualTour: "https://www.um.edu.my" },
  { id: "utm", name: "Universiti Teknologi Malaysia (UTM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate",
    requirements: ["STPM/A-Levels or equivalent with strong Maths/Science", "WAEC/NECO accepted with credit requirements", "Engineering-focused entrance criteria"],
    notes: "Malaysia's leading technical university. Excellent Engineering and Built Environment programs. Strong industry partnerships.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/UTM-LOGO.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/cb/UTM-LOGO-FULL.png"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/cb/UTM-LOGO-FULL.png",
    virtualTour: "https://www.utm.my" },
  { id: "upm", name: "Universiti Putra Malaysia (UPM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate",
    requirements: ["STPM/A-Levels or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Some programs require interview"],
    notes: "Strong Agriculture, Veterinary Medicine, and Engineering programs. Beautiful spacious campus near Kuala Lumpur.",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Coat_of_Arms_of_Universiti_Putra_Malaysia.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/d6/Anjung_Putra%2C_UPM.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/Library_of_UPMKB.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/35/Faculty_of_Engineering%2C_UPM_%28240103-0825%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Anjung_Putra%2C_UPM.jpg",
    virtualTour: "https://www.upm.edu.my" },
  { id: "taylors", name: "Taylor's University", country: "Malaysia", region: "Malaysia", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["A-Levels/IB or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Strong Hospitality/Business/Design programs entrance"],
    notes: "Top private university in Malaysia. Renowned for Hospitality, Business, and Design. Strong international partnerships with UK/Australian universities for dual degrees.",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f6/Logo_of_Taylor%27s_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/f5/Taylors_Lakeside_Campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Taylors_Lakeside_Campus.jpg",
    virtualTour: "https://university.taylors.edu.my" },
  { id: "mmu", name: "Multimedia University (MMU)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["A-Levels/STPM or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Strong Engineering/IT entrance criteria"],
    notes: "Malaysia's first private university focused on technology. Excellent for Computer Science, IT, and Engineering. Strong tech industry connections.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Multimedia_University_secondary_logo_2020.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1b/MMU_Chancellery_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5d/Melaka-Campus-mobile.jpg", "https://upload.wikimedia.org/wikipedia/en/5/5c/Multimedia_university_malaysia_mmu_new_pool.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/MMU_Chancellery_Building.jpg",
    virtualTour: "https://www.mmu.edu.my" },
  // Australia
  { id: "melbourne", name: "University of Melbourne", country: "Australia", region: "Australia", acceptanceRate: "~70%", competitiveness: "Moderate-High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's #1 ranked university. Strong Medicine, Law, and Engineering. Beautiful Parkville campus in Melbourne.",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/50/The_University_of_Melbourne_Logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/8e/Melbourne_University_grand_building.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/77/The_University_of_Melbourne.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Melbourne_University_grand_building.jpg",
    virtualTour: "https://www.unimelb.edu.au" },
  { id: "anu", name: "Australian National University (ANU)", country: "Australia", region: "Australia", acceptanceRate: "~35%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Strong essays for some programs"],
    notes: "Australia's top research university, based in Canberra. Excellent for Politics, International Relations, and Sciences.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Australian_National_University_%28emblem%29.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/ca/ANU_School_of_Art.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Homopolar_anu-MJC.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6c/AUS_Canberra%2C_Central%2C_Australian_National_University_004.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6c/AUS_Canberra%2C_Central%2C_Australian_National_University_004.jpg",
    virtualTour: "https://www.anu.edu.au" },
  { id: "sydney", name: "University of Sydney", country: "Australia", region: "Australia", acceptanceRate: "~30%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's oldest university (est. 1850). Strong Medicine, Law, and Architecture. Iconic sandstone Quadrangle.",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/37/The_University_of_Sydney_Logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ee/University_of_Sydney%27s_Main_Quadrangle.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/31/Charles_Perkins_Centre%2C_University_of_Sydney.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3f/USYD_MacLaurin_Hall_A14D_SEP2019.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ee/University_of_Sydney%27s_Main_Quadrangle.jpg",
    virtualTour: "https://www.sydney.edu.au" },
  { id: "unsw", name: "UNSW Sydney", country: "Australia", region: "Australia", acceptanceRate: "~30%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Strong Engineering/CS entrance criteria"],
    notes: "Top-ranked for Engineering and Computer Science in Australia. Strong industry connections, located in Sydney.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4d/University_of_New_South_Wales_Logo.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1c/Old_Main_Building_UNSW_2025-01-05.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d3/UNSW_library_lawn.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/35/Main_Walkway%2C_Lower_campus_UNSW.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/UNSW_lower_campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Old_Main_Building_UNSW_2025-01-05.jpg",
    virtualTour: "https://www.unsw.edu.au" },
  { id: "monash", name: "Monash University", country: "Australia", region: "Australia", acceptanceRate: "~40%", competitiveness: "Moderate-High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's largest university. Strong Medicine, Pharmacy, and Engineering. Multiple global campuses including Malaysia.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/74/Monash_University_logo-en.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1d/Clayton_-_Monash_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/66/Biomedical_Learning_and_Teaching_Building_-In_Explore-_%2847587403542%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Clayton_-_Monash_University.jpg",
    virtualTour: "https://www.monash.edu" },
  // More US
  { id: "gatech", name: "Georgia Institute of Technology", country: "USA", region: "Top US (STEM)", acceptanceRate: "16.0%", competitiveness: "Very High",
    requirements: ["SAT 1400-1540 or ACT 32-35", "Strong Maths/Science grades", "2 recommendation letters", "Engineering/CS focused essays"],
    notes: "Top 5 Engineering school in the US. Excellent CS, Robotics, and Aerospace. More accessible than Ivy League with comparable STEM quality.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Georgia_Tech_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/01/Georgia_Tech_campus_buildings.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/01/Georgia_Tech_campus_buildings.jpg",
    virtualTour: "https://www.gatech.edu" },
  { id: "purdue", name: "Purdue University", country: "USA", region: "Top US (STEM)", acceptanceRate: "57.0%", competitiveness: "Moderate-High",
    requirements: ["SAT 1240-1480 or ACT 26-33", "Strong Maths/Science for Engineering", "2 recommendation letters"],
    notes: "Famous for Aerospace Engineering — more astronauts than any other university. Great Engineering at a more accessible acceptance rate.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Purdue_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ed/Purdue_university_memorial_union.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Purdue_university_memorial_union.jpg",
    virtualTour: "https://www.purdue.edu" },
  // More Nigerian Private
  { id: "admiralty", name: "Admiralty University of Nigeria (ADUN)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Naval-affiliated private university in Delta State. Growing reputation in Engineering, Law, and Sciences. Modern facilities.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.adun.edu.ng" },
  { id: "caleb", name: "Caleb University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Christian mission university in Lagos. Strong Business, Law, and Social Sciences. Good campus environment and career support.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.calebuniversity.edu.ng" },
  { id: "veritas", name: "Veritas University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Catholic university in Abuja. Strong Philosophy, Social Sciences, and Education. Affordable private option for FCT-based students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.veritas.edu.ng" },
  { id: "redeemers", name: "Redeemer's University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "RCCG-affiliated university in Osun State. Strong Natural Sciences, Business, and Humanities. Known for discipline and strong academics.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.run.edu.ng" },
  { id: "landmark", name: "Landmark University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Faith-based university in Kwara State. Strong Agriculture, Engineering, and Business. Focus on entrepreneurship and self-reliance.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.lmu.edu.ng" },
  // More Nigerian Federal
  { id: "uniport", name: "University of Port Harcourt (UNIPORT)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam"],
    notes: "Major federal university in Rivers State. Strong Petroleum Engineering, Chemical Engineering, and Medicine. Oil-sector connections excellent for graduates.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.uniport.edu.ng" },
  { id: "futa", name: "Federal University of Technology Akure (FUTA)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "Moderate-High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Strong Maths/Science grades", "Post-UTME screening"],
    notes: "One of Nigeria's top technology-focused federal universities. Excellent Engineering, Computer Science, and Agriculture programs.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.futa.edu.ng" },
  // Asia
  { id: "utokyo", name: "University of Tokyo", country: "Japan", region: "Asia", acceptanceRate: "~35% (int'l)", competitiveness: "Very High",
    requirements: ["Strong academic transcript", "EJU or SAT/IB/A-Level scores depending on program", "English or Japanese proficiency depending on track", "Personal statement"],
    notes: "Japan's top-ranked university. Strong Engineering, Medicine, and Economics. English-taught programs (PEAK) available for international undergraduates.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.u-tokyo.ac.jp/en/" },
  { id: "tsinghua", name: "Tsinghua University", country: "China", region: "Asia", acceptanceRate: "~30% (int'l)", competitiveness: "Very High",
    requirements: ["Strong academic record", "HSK for Chinese-taught programs, TOEFL/IELTS for English-taught", "Personal statement + recommendation letters", "Interview for some programs"],
    notes: "China's top-ranked university, especially strong in Engineering, Computer Science, and Economics. International admission is holistic, separate from the Gaokao used for domestic students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.tsinghua.edu.cn/en/" },
  { id: "nus", name: "National University of Singapore (NUS)", country: "Singapore", region: "Asia", acceptanceRate: "Highly Selective", competitiveness: "Very High",
    requirements: ["Strong WAEC/IGCSE/A-Level or equivalent results", "SAT/ACT often considered", "Personal statement", "Some programs require portfolio or interview"],
    notes: "Asia's top-ranked university by several major rankings. Excellent Business, Engineering, and Computing. English-medium instruction throughout.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.nus.edu.sg" },
  { id: "aiims", name: "All India Institute of Medical Sciences (AIIMS Delhi)", country: "India", region: "Asia", acceptanceRate: "Extremely Selective", competitiveness: "Extreme",
    requirements: ["NEET entrance exam (for Indian nationals)", "Separate international student quota/process for foreign nationals", "Strong Physics, Chemistry, Biology background"],
    notes: "India's top medical institution, including renowned Neurosurgery and specialist programs. One of the most competitive medical admissions in the world.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.aiims.edu" },
  { id: "iitdelhi", name: "Indian Institute of Technology Delhi (IIT Delhi)", country: "India", region: "Asia", acceptanceRate: "Extremely Selective", competitiveness: "Extreme",
    requirements: ["JEE Advanced (for Indian nationals) or DASA scheme for international/NRI students", "Strong Maths and Physics background", "English proficiency for international applicants"],
    notes: "One of India's top engineering institutes. International students typically apply through the DASA scheme rather than JEE directly.",
    logo: "", images: [], image: "",
    virtualTour: "https://home.iitd.ac.in" },
  { id: "snu", name: "Seoul National University (SNU)", country: "South Korea", region: "Asia", acceptanceRate: "Highly Selective", competitiveness: "Very High",
    requirements: ["Strong academic transcript", "TOPIK for Korean-taught programs, TOEFL/IELTS for English-taught", "Personal statement", "Interview for some programs"],
    notes: "South Korea's top-ranked university. Strong across Engineering, Business, and Natural Sciences, with a growing number of English-taught programs for international students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.snu.ac.kr/en" },
];

const COLLEGE_REGIONS = ["All", ...new Set(COLLEGES.map(c => c.region))];


// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    sparkles: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6z"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    bookmark: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow_left: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    fire: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H4a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h3M17 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3"/><rect x="7" y="2" width="10" height="12" rx="2"/></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    external: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    school: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    chevron_left: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    chevron_right: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    speaker: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  };
  return icons[name] || null;
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  // Layout
  app: { minHeight: "100vh", backgroundColor: "#080D1E", color: "#F0F2FF", fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 430, margin: "0 auto", position: "relative", paddingBottom: 80 },
  screen: { padding: "0 0 16px" },

  // Nav
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, backgroundColor: "#0D1326", borderTop: "1px solid #1E2A4A", display: "flex", zIndex: 100 },
  navBtn: (active) => ({ flex: 1, padding: "12px 4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: active ? "#3B82F6" : "#4A5568", transition: "color 0.2s" }),
  navLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.05em" },

  // Header
  header: { padding: "52px 20px 16px", background: "linear-gradient(180deg, #0D1326 0%, #080D1E 100%)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#F0F2FF" },
  logoAccent: { color: "#3B82F6" },
  badge: { fontSize: 11, fontWeight: 700, backgroundColor: "#1E3A5F", color: "#3B82F6", padding: "4px 10px", borderRadius: 20, letterSpacing: "0.05em" },

  // Cards
  card: { backgroundColor: "#0D1326", borderRadius: 16, padding: 16, border: "1px solid #1E2A4A" },
  cardAlt: { backgroundColor: "#111827", borderRadius: 16, padding: 16, border: "1px solid #1E2A4A" },

  // Typography
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 },
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 },
  h3: { fontSize: 15, fontWeight: 600, margin: 0 },
  body: { fontSize: 14, color: "#94A3B8", lineHeight: 1.6 },
  label: { fontSize: 11, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.08em", textTransform: "uppercase" },
  small: { fontSize: 12, color: "#64748B" },

  // Buttons
  btnPrimary: { width: "100%", padding: "15px 20px", backgroundColor: "#3B82F6", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em" },
  btnSecondary: { width: "100%", padding: "14px 20px", backgroundColor: "transparent", color: "#3B82F6", border: "2px solid #1E3A5F", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  btnSmall: (active) => ({ padding: "8px 16px", backgroundColor: active ? "#3B82F6" : "#111827", color: active ? "#fff" : "#64748B", border: `1px solid ${active ? "#3B82F6" : "#1E2A4A"}`, borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }),

  // Misc
  divider: { height: 1, backgroundColor: "#1E2A4A", margin: "16px 0" },
  px: { padding: "0 20px" },
  gap: (n) => ({ display: "flex", flexDirection: "column", gap: n }),
  row: (gap = 8) => ({ display: "flex", alignItems: "center", gap }),
  pill: (color = "#1E3A5F", text = "#3B82F6") => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", backgroundColor: color, color: text, borderRadius: 20, fontSize: 11, fontWeight: 700 }),
  progressBar: (pct, color = "#3B82F6") => ({ height: 6, backgroundColor: "#1E2A4A", borderRadius: 3, overflow: "hidden", position: "relative" }),
  progressFill: (pct, color = "#3B82F6") => ({ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: "width 0.6s ease" }),
};

// ── WHEEL PICKER (iOS-style scroll picker) ───────────────────────────────────
function WheelPicker({ options, value, onChange, itemHeight = 44, visibleCount = 5 }) {
  const ref = useRef(null);
  const containerHeight = itemHeight * visibleCount;
  const padding = (containerHeight - itemHeight) / 2;

  useEffect(() => {
    const idx = options.indexOf(value);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * itemHeight;
  }, []);

  const handleScroll = () => {
    clearTimeout(ref.current._t);
    ref.current._t = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(options.length - 1, idx));
      ref.current.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
      onChange(options[clamped]);
    }, 120);
  };

  return (
    <div style={{ position: "relative", height: containerHeight, overflow: "hidden", flex: 1 }}>
      <div style={{ position: "absolute", top: padding, left: 0, right: 0, height: itemHeight, backgroundColor: "#1E3A5F", borderRadius: 10, pointerEvents: "none", zIndex: 1 }} />
      <div ref={ref} onScroll={handleScroll} style={{ height: containerHeight, overflowY: "scroll", scrollSnapType: "y mandatory", position: "relative", zIndex: 2 }}>
        <div style={{ height: padding }} />
        {options.map((opt, i) => (
          <div key={i} style={{ height: itemHeight, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", fontSize: opt === value ? 18 : 15, fontWeight: opt === value ? 800 : 500, color: opt === value ? "#F0F2FF" : "#64748B", transition: "all 0.15s" }}>
            {opt}
          </div>
        ))}
        <div style={{ height: padding }} />
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: padding, background: "linear-gradient(180deg, #0D1326 0%, rgba(13,19,38,0) 100%)", pointerEvents: "none", zIndex: 3 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: padding, background: "linear-gradient(0deg, #0D1326 0%, rgba(13,19,38,0) 100%)", pointerEvents: "none", zIndex: 3 }} />
    </div>
  );
}

function PickerModal({ title, children, onClose, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480, boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        </div>
        {children}
        <button onClick={onConfirm} style={{ ...S.btnPrimary, marginTop: 16 }}>Done</button>
      </div>
    </div>
  );
}

// ── STREAK DATA ───────────────────────────────────────────────────────────────
const days = ["M", "T", "W", "T", "F", "S", "S"];
const streakDays = [true, true, true, false, true, true, false];

// ── HEATMAP DATA (GitHub-style contribution graph) ──────────────────────────────
// Generates a deterministic pseudo-random activity grid for the last ~6 months.
function generateHeatmapData(weeksBack = 26) {
  const today = new Date();
  const cells = [];
  // seed based on current date so pattern updates daily
  let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let w = weeksBack - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      const r = rand();
      // intensity: 0 = none, 1-4 = increasing activity
      let level = 0;
      if (r > 0.85) level = 4;
      else if (r > 0.7) level = 3;
      else if (r > 0.5) level = 2;
      else if (r > 0.3) level = 1;
      cells.push({ date, level, questions: level === 0 ? 0 : level * 4 + Math.floor(r * 5) });
    }
  }
  return cells;
}

const HEATMAP_DATA = generateHeatmapData(26);
const HEATMAP_COLORS = ["#111827", "#1E3A5F", "#2C5A8F", "#3B82F6", "#60A5FA"];

function getMonthLabels(cells, weeksBack) {
  const labels = [];
  let lastMonth = -1;
  for (let w = 0; w < weeksBack; w++) {
    const cell = cells[w * 7];
    const month = cell.date.getMonth();
    if (month !== lastMonth) {
      labels.push({ weekIndex: w, label: cell.date.toLocaleDateString("en-US", { month: "short" }) });
      lastMonth = month;
    }
  }
  return labels;
}

// ── EXAM LOGOS ────────────────────────────────────────────────────────────────
const EXAM_LOGOS = {
  SAT: "https://upload.wikimedia.org/wikipedia/commons/5/5a/SAT_logo_%282017%29.svg",
  ACT: "https://upload.wikimedia.org/wikipedia/commons/d/d9/ACT_logo.svg",
  WAEC: "https://upload.wikimedia.org/wikipedia/en/d/d9/Waec_logo.png",
  NECO: "https://upload.wikimedia.org/wikipedia/en/b/bd/Neco_official_banner.jpg",
  JAMB: "https://upload.wikimedia.org/wikipedia/en/2/2e/Official_JAMB_logo.png",
  IGCSE: "https://upload.wikimedia.org/wikipedia/commons/c/c3/IGCSE_cover.jpg",
};

function ExamLogo({ exam, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const url = EXAM_LOGOS[exam];
  const showImg = url && !failed;
  return (
    <div style={{ width: size, height: size, borderRadius: size > 32 ? 12 : 10, backgroundColor: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {showImg ? (
        <img src={url} alt={exam} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3, boxSizing: "border-box" }} />
      ) : (
        <span style={{ fontSize: size > 32 ? 14 : 11, fontWeight: 900, color: "#0D1326" }}>{exam.slice(0, 2)}</span>
      )}
    </div>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ onStart, onSearch, onNotes, bookmarks, stats, profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null); // "news" | "faq" | null
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const totalQ = stats.total;

  useEffect(() => {
    setNewsLoading(true);
    const fetchNews = async () => {
      try {
        const snap = await getDocs(collection(db, "news"));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNewsItems(items.slice(0, 20));
      } catch (err) {
        console.error("Failed to load news:", err);
        setNewsItems([]);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);
  const correctQ = stats.correct;
  const pct = totalQ ? Math.round((correctQ / totalQ) * 100) : 0;
  const myExams = profile?.exams?.length ? profile.exams : EXAMS;
  const badgeText = profile?.exams?.length ? profile.exams.slice(0, 3).join(" · ") : "WAEC · SAT · IGCSE";

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerRow}>
          <div style={S.logo}>Ace<span style={S.logoAccent}>Board</span></div>
          <div style={S.row(8)}>
            <div style={S.badge}>{badgeText}</div>
            <button onClick={() => setMenuOpen(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
              <Icon name="menu" size={20} color="#94A3B8" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ position: "absolute", top: 90, right: 20, backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 14, overflow: "hidden", zIndex: 200, minWidth: 200, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            {[
              { label: "News & Updates", action: () => { setModalContent("news"); setMenuOpen(false); } },
              { label: "FAQ", action: () => { setModalContent("faq"); setMenuOpen(false); } },
              { label: "Contact Us", action: () => { window.open("https://instagram.com/aceboardhq", "_blank"); setMenuOpen(false); } },
              { label: "Support Us", action: () => { setModalContent("support"); setMenuOpen(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid #1E2A4A", color: "#F0F2FF", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {modalContent && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setModalContent(null)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "70vh", overflowY: "auto" }}>
              {modalContent === "news" && (<>
                <h2 style={{ ...S.h2, marginBottom: 16 }}>News & Updates</h2>
                {newsLoading ? (
                  <p style={{ ...S.body, fontSize: 13 }}>Loading...</p>
                ) : newsItems.length === 0 ? (
                  <div style={S.card}>
                    <p style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 4 }}>Welcome to AceBoard</p>
                    <p style={{ ...S.body, fontSize: 13 }}>Thanks for being here early. New questions, colleges, and features are added regularly — check back here for updates.</p>
                  </div>
                ) : (
                  <div style={S.gap(14)}>
                    {newsItems.map(item => (
                      <div key={item.id} style={S.card}>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
                        )}
                        <p style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
                        <p style={{ ...S.body, fontSize: 13 }}>{item.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>)}
              {modalContent === "faq" && (<>
                <h2 style={{ ...S.h2, marginBottom: 16 }}>FAQ</h2>
                <div style={S.gap(14)}>
                  <div>
                    <p style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 4 }}>Are the questions real past questions?</p>
                    <p style={{ ...S.body, fontSize: 13 }}>Yes, where marked as sourced. We're continuously adding more verified past questions across all exam boards.</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 4 }}>Is AceBoard free?</p>
                    <p style={{ ...S.body, fontSize: 13 }}>Yes, AceBoard is free to use.</p>
                  </div>
                </div>
              </>)}
              {modalContent === "support" && (<>
                <h2 style={{ ...S.h2, marginBottom: 16 }}>Support AceBoard</h2>
                <p style={{ ...S.body, fontSize: 13 }}>AceBoard is built by a student, for students. If you'd like to support the project, sharing it with a friend who's preparing for WAEC, JAMB, or any exam helps a lot. Thank you!</p>
              </>)}
              <button onClick={() => setModalContent(null)} style={{ ...S.btnPrimary, marginTop: 20 }}>Close</button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <p style={{ ...S.small, marginBottom: 4 }}>Good day, {profile?.name || "student"} 👋</p>
          <h1 style={S.h1}>Ready to lock<br />in today?</h1>
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(12) }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Answered", val: totalQ, icon: "book" },
            { label: "Correct", val: correctQ, icon: "check" },
            { label: "Accuracy", val: `${pct}%`, icon: "star" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: "14px 8px" }}>
              <Icon name={icon} size={16} color="#3B82F6" />
              <div style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>{val}</div>
              <div style={S.small}>{label}</div>
            </div>
          ))}
        </div>

        {/* Latest update teaser */}
        {newsItems.length > 0 && (
          <button onClick={() => setModalContent("news")} style={{ ...S.card, textAlign: "left", cursor: "pointer", border: "1px solid #1E2A4A", display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
            {newsItems[0].imageUrl && (
              <img src={newsItems[0].imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", textTransform: "uppercase" }}>Latest Update</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{newsItems[0].title}</div>
            </div>
          </button>
        )}

        {/* Streak */}
        <div style={S.card}>
          <div style={S.row()}>
            <Icon name="fire" size={16} color="#F97316" />
            <span style={{ ...S.label, color: "#F97316" }}>{totalQ > 0 ? "Day 1 Streak" : "Start Your Streak"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            {days.map((d, i) => {
              const active = totalQ > 0 && i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: active ? "#3B82F6" : "#1E2A4A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {active && <Icon name="check" size={14} color="#fff" />}
                  </div>
                  <span style={S.small}>{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick start */}
        <div>
          <p style={{ ...S.label, marginBottom: 12 }}>Quick Start</p>
          <div style={S.gap(10)}>
            <button style={S.btnPrimary} onClick={() => onStart()}>
              <div style={S.row(8)}>
                <Icon name="zap" size={18} color="#fff" />
                <span>Practice Questions</span>
              </div>
            </button>
            <button style={S.btnSecondary} onClick={onSearch}>
              <div style={S.row(8)}>
                <Icon name="search" size={18} color="#3B82F6" />
                <span>Search Questions</span>
              </div>
            </button>
            <button style={S.btnSecondary} onClick={onNotes}>
              <div style={S.row(8)}>
                <Icon name="book" size={18} color="#3B82F6" />
                <span>Notes & Books</span>
              </div>
            </button>
          </div>
        </div>

        {/* Exam tiles */}
        <div>
          <p style={{ ...S.label, marginBottom: 12 }}>{profile?.exams?.length ? "Your Exams" : "Select Exam"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {myExams.map(exam => (
              <button key={exam} onClick={() => onStart(exam)} style={{ ...S.cardAlt, border: "1px solid #1E2A4A", cursor: "pointer", textAlign: "left", padding: "14px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <ExamLogo exam={exam} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2FF", marginBottom: 2 }}>{exam}</div>
                  <div style={S.small}>{QUESTIONS.filter(q => q.exam === exam).length} questions</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bookmarks teaser */}
        {bookmarks.length > 0 && (
          <div style={{ ...S.card, ...S.row(12) }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="bookmark" size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={S.h3}>{bookmarks.length} bookmarked</div>
              <div style={S.small}>Questions saved for review</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── QUIZ CONFIG SCREEN ─────────────────────────────────────────────────────────
const MOCK_ELIGIBLE = ["WAEC", "JAMB", "NECO"];

function PracticeSetup({ profile, defaultExam, defaultSubject, defaultTopic, onBegin, onBack }) {
  const myExams = profile?.exams?.length ? profile.exams : EXAMS;
  const [exam, setExam] = useState(defaultExam || myExams[0] || "WAEC");
  const [subjects, setSubjects] = useState(defaultSubject ? [defaultSubject] : []);
  const [topic, setTopic] = useState(defaultTopic || "All Topics");
  const [year, setYear] = useState("All Years");
  const [count, setCount] = useState(10);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState("practice");
  const [openPicker, setOpenPicker] = useState(null); // "topic" | "year" | "count" | "time" | null
  const [tempTime, setTempTime] = useState({ h: 0, m: 30, s: 0 });

  const subjectsForExam = [...new Set(QUESTIONS.filter(q => q.exam === exam).map(q => q.subject))];
  const singleSubject = subjects.length === 1 ? subjects[0] : null;
  const topicsForSubject = singleSubject ? ["All Topics", ...new Set(QUESTIONS.filter(q => q.exam === exam && q.subject === singleSubject).map(q => q.topic))] : ["All Topics"];
  const yearsAvailable = ["All Years", ...new Set(QUESTIONS.filter(q =>
    q.exam === exam &&
    (subjects.length === 0 || subjects.includes(q.subject)) &&
    (!singleSubject || topic === "All Topics" || q.topic === topic)
  ).map(q => q.year))].sort((a, b) => (a === "All Years" ? -1 : b === "All Years" ? 1 : b - a));

  const available = QUESTIONS.filter(q =>
    q.exam === exam &&
    (subjects.length === 0 || subjects.includes(q.subject)) &&
    (!singleSubject || topic === "All Topics" || q.topic === topic) &&
    (year === "All Years" || q.year === year)
  );

  const countOptions = [5, 10, 15, 20, 25, 30, 40, 50].filter(n => n <= Math.max(available.length, 5));
  if (countOptions.length === 0) countOptions.push(Math.max(available.length, 1));

  const showMock = MOCK_ELIGIBLE.includes(exam);
  const modeLabel = mode === "exam" ? "Exam Mode" : mode === "mock" ? "Mock Mode" : "Practice Mode";
  const ctaLabel = mode === "exam" ? "Start Timed Exam →" : mode === "mock" ? "Start Mock Test →" : "Start Practice →";
  const timerSeconds = hours * 3600 + minutes * 60 + seconds;
  const timeLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const toggleSubject = (s) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setTopic("All Topics"); setYear("All Years");
  };

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Practice Questions</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>Configure your<br />session</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {/* Exam - only shows student's selected exams */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Exam Body</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {myExams.map(e => (
              <button key={e} style={S.btnSmall(exam === e)} onClick={() => { setExam(e); setSubjects([]); setTopic("All Topics"); setYear("All Years"); if (!MOCK_ELIGIBLE.includes(e) && mode === "mock") setMode("practice"); }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Subject - multi-select checklist */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Subjects <span style={{ color: "#64748B", fontWeight: 500 }}>(none checked = all)</span></p>
          <div style={S.gap(8)}>
            {subjectsForExam.map(s => (
              <button key={s} onClick={() => toggleSubject(s)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: subjects.includes(s) ? "#1E3A5F" : "#111827", border: `1px solid ${subjects.includes(s) ? "#3B82F6" : "#1E2A4A"}`, borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${subjects.includes(s) ? "#3B82F6" : "#4A5568"}`, backgroundColor: subjects.includes(s) ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {subjects.includes(s) && <Icon name="check" size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Topic</p>
          {!singleSubject ? (
            <p style={{ ...S.small }}>Check exactly one subject to filter by topic.</p>
          ) : (
            <button onClick={() => setOpenPicker("topic")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{topic}</span>
              <Icon name="chevron_right" size={16} color="#3B82F6" />
            </button>
          )}
        </div>

        {/* Year - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Year</p>
          <button onClick={() => setOpenPicker("year")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{year}</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Count - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>No. of Questions</p>
          <button onClick={() => setOpenPicker("count")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{count} questions</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Time - HH:MM:SS wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Time Limit</p>
          <button onClick={() => { setTempTime({ h: hours, m: minutes, s: seconds }); setOpenPicker("time"); }} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{timeLabel}</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Mode */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Mode</p>
          <div style={S.row(8)}>
            <button style={S.btnSmall(mode === "practice")} onClick={() => setMode("practice")}>Practice</button>
            <button style={S.btnSmall(mode === "exam")} onClick={() => setMode("exam")}>Exam</button>
            {showMock && <button style={S.btnSmall(mode === "mock")} onClick={() => setMode("mock")}>Mock</button>}
          </div>
          {!showMock && (
            <p style={{ ...S.small, marginTop: 8 }}>Mock mode is only available for WAEC, JAMB, and NECO.</p>
          )}
        </div>

        <div style={S.card}>
          <div style={S.row(8)}>
            <Icon name="info" size={16} color="#3B82F6" />
            <span style={{ ...S.body, fontSize: 13 }}><b style={{ color: "#F0F2FF" }}>{available.length}</b> questions match your filters · {modeLabel} · {timeLabel}</span>
          </div>
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: available.length === 0 ? 0.4 : 1 }}
          disabled={available.length === 0}
          onClick={() => onBegin({ exam, subjects, topic, year, count: Math.min(count, available.length), mode, timerSeconds })}
        >
          {ctaLabel}
        </button>
      </div>

      {openPicker === "topic" && (
        <PickerModal title="Select Topic" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={topicsForSubject} value={topic} onChange={setTopic} />
        </PickerModal>
      )}

      {openPicker === "year" && (
        <PickerModal title="Select Year" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={yearsAvailable} value={year} onChange={setYear} />
        </PickerModal>
      )}

      {openPicker === "count" && (
        <PickerModal title="No. of Questions" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={countOptions} value={count} onChange={setCount} />
        </PickerModal>
      )}

      {openPicker === "time" && (
        <PickerModal title="Time Limit" onClose={() => setOpenPicker(null)} onConfirm={() => { setHours(tempTime.h); setMinutes(tempTime.m); setSeconds(tempTime.s); setOpenPicker(null); }}>
          <div style={{ display: "flex", gap: 4 }}>
            <WheelPicker options={[0, 1, 2, 3]} value={tempTime.h} onChange={(v) => setTempTime(t => ({ ...t, h: v }))} />
            <WheelPicker options={Array.from({ length: 60 }, (_, i) => i)} value={tempTime.m} onChange={(v) => setTempTime(t => ({ ...t, m: v }))} />
            <WheelPicker options={Array.from({ length: 60 }, (_, i) => i)} value={tempTime.s} onChange={(v) => setTempTime(t => ({ ...t, s: v }))} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 6 }}>
            <span style={{ ...S.small }}>hrs</span><span style={{ ...S.small }}>min</span><span style={{ ...S.small }}>sec</span>
          </div>
        </PickerModal>
      )}
    </div>
  );
}

// ── TIMER RING (draining circular countdown, TestDriller-style) ─────────────
function TimerRing({ timeLeft, totalSeconds, size = 44 }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalSeconds)) : 0;
  const arcLength = circumference * pct;
  const low = timeLeft < 60;
  const color = low ? "#EF4444" : "#F97316";
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1E2A4A" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={0} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: low ? "#EF4444" : "#F0F2FF" }}>
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

// ── QUIZ SCREEN ───────────────────────────────────────────────────────────────
function QuizScreen({ config, bookmarks, onToggleBookmark, onFinish, onBack }) {
  const pool = QUESTIONS.filter(q =>
    q.exam === config.exam &&
    (!config.subjects || config.subjects.length === 0 || config.subjects.includes(q.subject)) &&
    (!config.topic || config.topic === "All Topics" || q.topic === config.topic) &&
    (!config.year || config.year === "All Years" || q.year === config.year)
  ).slice(0, config.count);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLog, setTimeLog] = useState([]);
  const questionStartRef = useRef(Date.now());
  const [timeLeft, setTimeLeft] = useState(config.mode === "exam" || config.mode === "mock" ? (config.timerSeconds || config.count * 90) : null);
  const totalSeconds = config.timerSeconds || config.count * 90;
  const timerRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [aiTutorInput, setAiTutorInput] = useState("");
  const [aiTutorReply, setAiTutorReply] = useState("");
  const [aiTutorLoading, setAiTutorLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    if ((config.mode === "exam" || config.mode === "mock") && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); finish(); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, []);

  const q = pool[idx];
  const isBookmarked = bookmarks.includes(q.id);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const toggleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = q.question + ". " + q.options.map((o, i) => `Option ${["A","B","C","D"][i]}: ${o}`).join(". ");
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const askAiTutor = async () => {
    if (!aiTutorInput.trim()) return;
    setAiTutorLoading(true);
    setAiTutorReply("");
    try {
      const resp = await fetch("https://us-central1-ace-board-41d96.cloudfunctions.net/aiStudyCoach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `A student is working on this ${q.exam} ${q.subject} question and needs help understanding it (not just the answer): "${q.question}" Options: ${q.options.join(", ")}. Correct answer: ${q.options[q.answer]}. Student's question: ${aiTutorInput}`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setAiTutorReply(data.text || "Sorry, I couldn't process that.");
    } catch {
      setAiTutorReply("The AI Tutor is being connected to a secure backend right now — full functionality is coming very soon!");
    } finally {
      setAiTutorLoading(false);
    }
  };

  const submitReport = async () => {
    if (!reportText.trim()) return;
    try {
      await addDoc(collection(db, "questionReports"), {
        questionId: q.id,
        exam: q.exam,
        subject: q.subject,
        topic: q.topic,
        question: q.question,
        reportText: reportText.trim(),
        createdAt: serverTimestamp(),
      });
      setReportSent(true);
      setReportText("");
      setTimeout(() => { setReportOpen(false); setReportSent(false); }, 1500);
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  const choose = (i) => {
    if (revealed) return;
    setSelected(i);
    if (config.mode === "practice" || config.mode === "mock") setRevealed(true);
  };

  const next = () => {
    const elapsed = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
    const logEntry = { qNum: idx + 1, subject: q.subject, seconds: elapsed };
    const updatedLog = [...timeLog, logEntry];
    setTimeLog(updatedLog);
    questionStartRef.current = Date.now();
    const newAnswers = [...answers, { qid: q.id, selected, correct: selected === q.answer }];
    if (idx + 1 >= pool.length) { finish(newAnswers, updatedLog); return; }
    setAnswers(newAnswers);
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(false);
  };

  const finish = (finalAnswers, finalTimeLog) => {
    clearInterval(timerRef.current);
    const ans = finalAnswers || [...answers, { qid: q.id, selected, correct: selected === q.answer }];
    const log = finalTimeLog || timeLog;
    const timeInfo = {
      timeLog: log,
      timeLeft: (config.mode === "exam" || config.mode === "mock") ? timeLeft : null,
      totalSeconds: (config.mode === "exam" || config.mode === "mock") ? totalSeconds : null,
    };
    onFinish(ans, pool, timeInfo);
  };

  const optionStyle = (i) => {
    const base = { padding: "14px 16px", borderRadius: 12, border: "1.5px solid", cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" };
    if (!revealed && selected !== i) return { ...base, backgroundColor: "#0D1326", borderColor: "#1E2A4A", color: "#E2E8F0" };
    if (!revealed && selected === i) return { ...base, backgroundColor: "#1E3A5F", borderColor: "#3B82F6", color: "#fff" };
    if (i === q.answer) return { ...base, backgroundColor: "#052E16", borderColor: "#22C55E", color: "#86EFAC" };
    if (i === selected && i !== q.answer) return { ...base, backgroundColor: "#2D1515", borderColor: "#EF4444", color: "#FCA5A5" };
    return { ...base, backgroundColor: "#0D1326", borderColor: "#1E2A4A", color: "#4A5568" };
  };

  const optLabel = ["A", "B", "C", "D"];
  const progress = ((idx) / pool.length) * 100;

  return (
    <div style={S.screen}>
      {/* Top bar */}
      <div style={{ ...S.header, paddingBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
            <Icon name="x" size={22} color="#64748B" />
          </button>
          <div style={{ ...S.row(8) }}>
            {(config.mode === "exam" || config.mode === "mock") && (
              <TimerRing timeLeft={timeLeft} totalSeconds={totalSeconds} />
            )}
            <button onClick={() => setAiTutorOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="sparkles" size={20} color="#8B5CF6" />
            </button>
            <button onClick={() => setReportOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="alert" size={20} color="#4A5568" />
            </button>
            <button onClick={() => onToggleBookmark(q.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="bookmark" size={20} color={isBookmarked ? "#3B82F6" : "#4A5568"} />
            </button>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={S.row(6)}>
            <span style={S.small}>{idx + 1} of {pool.length}</span>
            <button onClick={toggleSpeak} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Icon name="speaker" size={14} color={speaking ? "#3B82F6" : "#4A5568"} />
            </button>
          </div>
          <span style={S.small}>{q.exam} · {q.year}</span>
        </div>
        <div style={S.progressBar(progress)}>
          <div style={S.progressFill(progress)} />
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {/* Tags */}
        <div style={S.row(6)}>
          <span style={S.pill()}>{q.subject}</span>
          <span style={S.pill("#1A1A2E", "#8B5CF6")}>{q.topic}</span>
          <span style={S.pill(q.difficulty === "Easy" ? "#052E16" : q.difficulty === "Medium" ? "#1A2E1A" : "#2D1515", q.difficulty === "Easy" ? "#22C55E" : q.difficulty === "Medium" ? "#86EFAC" : "#EF4444")}>{q.difficulty}</span>
        </div>

        {/* Question */}
        <div style={{ ...S.card, padding: "18px" }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={S.gap(8)}>
          {q.options.map((opt, i) => (
            <button key={i} style={optionStyle(i)} onClick={() => choose(i)}>
              <span style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#1E2A4A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{optLabel[i]}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {revealed && (
          <div style={{ backgroundColor: "#051A0F", border: "1px solid #14532D", borderRadius: 14, padding: 16 }}>
            <div style={{ ...S.row(8), marginBottom: 8 }}>
              <Icon name="check" size={16} color="#22C55E" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>Explanation</span>
            </div>
            <p style={{ ...S.body, fontSize: 13, margin: "0 0 10px" }}>{q.explanation}</p>
            <p style={{ fontSize: 11, color: "#374151" }}>📚 {q.source}</p>
          </div>
        )}

        {aiTutorOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setAiTutorOpen(false)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>🤖 AI Tutor</span>
                <button onClick={() => setAiTutorOpen(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>Close</button>
              </div>
              <p style={{ ...S.small, marginBottom: 12 }}>Ask about this specific question — I know what it is and what the correct answer is.</p>
              {aiTutorReply && (
                <div style={{ ...S.card, marginBottom: 12, whiteSpace: "pre-wrap", fontSize: 13, color: "#E2E8F0" }}>{aiTutorReply}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={aiTutorInput} onChange={e => setAiTutorInput(e.target.value)} placeholder="e.g. why is the answer B and not C?"
                  style={{ flex: 1, backgroundColor: "#161D33", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }} />
                <button onClick={askAiTutor} disabled={aiTutorLoading} style={{ backgroundColor: "#8B5CF6", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: aiTutorLoading ? 0.6 : 1 }}>
                  {aiTutorLoading ? "..." : "Ask"}
                </button>
              </div>
            </div>
          </div>
        )}

        {reportOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setReportOpen(false)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>⚠️ Report an Error</span>
                <button onClick={() => setReportOpen(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>Close</button>
              </div>
              {reportSent ? (
                <p style={{ fontSize: 14, color: "#22C55E", fontWeight: 600 }}>✓ Thanks — your report was submitted.</p>
              ) : (<>
                <p style={{ ...S.small, marginBottom: 12 }}>What's wrong with this question? (wrong answer, typo, unclear wording, etc.)</p>
                <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={4}
                  style={{ width: "100%", backgroundColor: "#161D33", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }} />
                <button onClick={submitReport} style={{ ...S.btnPrimary, marginTop: 12 }}>Submit Report</button>
              </>)}
            </div>
          </div>
        )}

        {/* Action */}
        {config.mode === "exam" ? (
          selected !== null && (
            <button style={S.btnPrimary} onClick={next}>
              {idx + 1 >= pool.length ? "Finish Exam" : "Next Question →"}
            </button>
          )
        ) : (
          revealed && (
            <button style={S.btnPrimary} onClick={next}>
              {idx + 1 >= pool.length ? "See Results" : "Next Question →"}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── STAT RING (static percentage donut) ──────────────────────────────────────
function StatRing({ pct, label, raw, color = "#3B82F6", size = 84 }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * Math.max(0, Math.min(1, pct / 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {raw && <span style={{ fontSize: 12, color: "#F0F2FF", fontWeight: 700 }}>{raw}</span>}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1E2A4A" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#F0F2FF" }}>{pct}%</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ── TIME TREND CHART (per-question time, hand-rolled SVG) ────────────────────
function TimeTrendChart({ timeLog }) {
  if (!timeLog || timeLog.length === 0) return null;
  const subjects = [...new Set(timeLog.map(t => t.subject))];
  const palette = ["#3B82F6", "#F97316", "#22C55E", "#8B5CF6", "#EF4444", "#F59E0B"];
  const rawMax = Math.max(...timeLog.map(t => t.seconds), 10);
  const maxSeconds = Math.ceil(rawMax / 10) * 10;
  const maxQ = Math.max(...timeLog.map(t => t.qNum), 1);
  const w = 320, h = 190, padL = 38, padB = 28, padT = 10, padR = 12;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const xScale = (q) => padL + (plotW * (q - 1)) / Math.max(maxQ - 1, 1);
  const yScale = (s) => padT + plotH - (plotH * s) / maxSeconds;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxSeconds * f));
  const xTickCount = Math.min(6, maxQ);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => Math.round(1 + (i * (maxQ - 1)) / Math.max(xTickCount - 1, 1)));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} y1={yScale(t)} x2={w - padR} y2={yScale(t)} stroke="#1E2A4A" strokeWidth="1" />
            <text x={padL - 6} y={yScale(t) + 3} textAnchor="end" fontSize="8" fill="#64748B">{t}</text>
          </g>
        ))}
        {xTicks.map(q => (
          <text key={q} x={xScale(q)} y={h - padB + 14} textAnchor="middle" fontSize="8" fill="#64748B">{q}</text>
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#334155" strokeWidth="1.5" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#334155" strokeWidth="1.5" />
        <text x={-(h / 2)} y={12} textAnchor="middle" fontSize="8" fill="#94A3B8" transform="rotate(-90)">Time Spent (sec)</text>
        <text x={padL + plotW / 2} y={h - 2} textAnchor="middle" fontSize="8" fill="#94A3B8">Question Number</text>
        {subjects.map((subj, si) => {
          const pts = timeLog.filter(t => t.subject === subj);
          const path = pts.map((t, i) => `${i === 0 ? "M" : "L"} ${xScale(t.qNum)} ${yScale(t.seconds)}`).join(" ");
          return (
            <g key={subj}>
              <path d={path} fill="none" stroke={palette[si % palette.length]} strokeWidth="1.5" />
              {pts.map((t, i) => (
                <circle key={i} cx={xScale(t.qNum)} cy={yScale(t.seconds)} r="2" fill={palette[si % palette.length]} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, justifyContent: "center" }}>
        {subjects.map((subj, si) => (
          <div key={subj} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: palette[si % palette.length] }} />
            <span style={{ fontSize: 11, color: "#94A3B8" }}>{subj}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RESULTS SCREEN ────────────────────────────────────────────────────────────
function ResultsScreen({ answers, questions, mode, timeInfo, profile, onRetry, onHome, onReview }) {
  const correct = answers.filter(a => a.correct).length;
  const total = answers.length;
  const pct = Math.round((correct / total) * 100);

  const grade = pct >= 75 ? { label: "A1 🏆", color: "#22C55E", remark: "Excellent" } :
                pct >= 70 ? { label: "B2 ⭐", color: "#22C55E", remark: "Very Good" } :
                pct >= 65 ? { label: "B3 ⭐", color: "#3B82F6", remark: "Good" } :
                pct >= 60 ? { label: "C4 👍", color: "#3B82F6", remark: "Credit" } :
                pct >= 55 ? { label: "C5 👍", color: "#F59E0B", remark: "Credit" } :
                pct >= 50 ? { label: "C6 📖", color: "#F59E0B", remark: "Credit" } :
                pct >= 45 ? { label: "D7 📖", color: "#F97316", remark: "Pass" } :
                pct >= 40 ? { label: "E8 ⚠️", color: "#F97316", remark: "Pass" } :
                            { label: "F9 💪", color: "#EF4444", remark: "Fail" };

  const bySubject = {};
  answers.forEach((a, i) => {
    const q = questions[i];
    if (!bySubject[q.subject]) bySubject[q.subject] = { correct: 0, total: 0, topics: {} };
    bySubject[q.subject].total++;
    if (a.correct) bySubject[q.subject].correct++;
    if (!bySubject[q.subject].topics[q.topic]) bySubject[q.subject].topics[q.topic] = { correct: 0, total: 0 };
    bySubject[q.subject].topics[q.topic].total++;
    if (a.correct) bySubject[q.subject].topics[q.topic].correct++;
  });

  const timeUsedPct = timeInfo && timeInfo.totalSeconds ? Math.round(((timeInfo.totalSeconds - timeInfo.timeLeft) / timeInfo.totalSeconds) * 100) : null;
  const avgActual = timeInfo && timeInfo.timeLog && timeInfo.timeLog.length > 0 ? timeInfo.timeLog.reduce((a, b) => a + b.seconds, 0) / timeInfo.timeLog.length : null;
  const idealPerQ = timeInfo && timeInfo.totalSeconds ? timeInfo.totalSeconds / total : 90;
  const speedPct = avgActual ? Math.max(0, Math.min(100, Math.round((idealPerQ / avgActual) * 100))) : null;

  return (
    <div style={S.screen}>
      <div style={{ ...S.header, textAlign: "center", paddingBottom: 24 }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>{pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: grade.color, letterSpacing: "-0.04em" }}>{pct}%</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: grade.color, marginTop: 4 }}>{grade.label}</div>
        <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>{grade.remark}</div>
        <div style={{ ...S.body, marginTop: 8 }}>{correct} of {total} correct</div>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {/* Performance breakdown - rings + time trend */}
        {timeInfo && timeInfo.timeLog && timeInfo.timeLog.length > 0 && (
          <div style={S.card}>
            <p style={{ ...S.label, marginBottom: 16 }}>Performance Breakdown</p>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <StatRing pct={pct} raw={`${correct}/${total}`} label="Score" color={pct >= 70 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444"} />
              {timeUsedPct !== null && <StatRing pct={timeUsedPct} raw={`${String(Math.floor((timeInfo.totalSeconds - timeInfo.timeLeft) / 60)).padStart(2, "0")}:${String(Math.floor((timeInfo.totalSeconds - timeInfo.timeLeft) % 60)).padStart(2, "0")}`} label="Time Used" color={timeUsedPct >= 90 ? "#EF4444" : "#3B82F6"} />}
              {speedPct !== null && <StatRing pct={speedPct} raw={avgActual.toFixed(2) + "s/q"} label="Speed" color="#8B5CF6" />}
            </div>
            <p style={{ ...S.label, marginBottom: 8 }}>Time Spent Trend</p>
            <TimeTrendChart timeLog={timeInfo.timeLog} />
          </div>
        )}

        {/* By subject + topic breakdown */}
        {Object.keys(bySubject).length > 0 && (
          <div style={S.card}>
            <p style={{ ...S.label, marginBottom: 12 }}>Performance by Subject & Topic</p>
            <div style={S.gap(16)}>
              {Object.entries(bySubject).map(([subj, data]) => {
                const p = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={subj}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{subj}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: p >= 70 ? "#22C55E" : p >= 50 ? "#F59E0B" : "#EF4444" }}>{data.correct}/{data.total} ({p}%)</span>
                    </div>
                    <div style={S.progressBar(p)}>
                      <div style={S.progressFill(p, p >= 70 ? "#22C55E" : p >= 50 ? "#F59E0B" : "#EF4444")} />
                    </div>
                    <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #1E2A4A", display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(data.topics).map(([topicName, tData]) => {
                        const tp = Math.round((tData.correct / tData.total) * 100);
                        return (
                          <div key={topicName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>{topicName}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: tp >= 70 ? "#22C55E" : tp >= 50 ? "#F59E0B" : "#EF4444" }}>{tData.correct}/{tData.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result slip */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>{questions[0]?.exam} Result Slip</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Username</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600 }}>{profile?.name || "Student"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Subject(s)</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600, textAlign: "right" }}>{[...new Set(questions.map(q => q.subject))].join(", ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Exam Body</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600 }}>{questions[0]?.exam}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Date</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600 }}>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Result slip */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Result Slip</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Subject(s)</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600, textAlign: "right" }}>{[...new Set(questions.map(q => q.subject))].join(", ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Exam Body</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600 }}>{questions[0]?.exam}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.small}>Date</span>
              <span style={{ fontSize: 13, color: "#F0F2FF", fontWeight: 600 }}>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Weak area tip */}
        {pct < 70 && (
          <div style={{ backgroundColor: "#1A1A0A", border: "1px solid #3D3000", borderRadius: 14, padding: 16 }}>
            <div style={{ ...S.row(8), marginBottom: 6 }}>
              <Icon name="zap" size={16} color="#F59E0B" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>Study Tip</span>
            </div>
            <p style={{ ...S.body, fontSize: 13, margin: 0 }}>
              You scored {pct}%. Review the explanations for missed questions and retry. Aim for 75%+ (A1 level) before exam day.
            </p>
          </div>
        )}

        {mode === "practice" && (
          <button style={S.btnSecondary} onClick={onReview}>Review Answers</button>
        )}
        <button style={S.btnPrimary} onClick={onRetry}>Try Again</button>
        <button style={S.btnSecondary} onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
}

// ── REVIEW SCREEN (Practice mode only) ───────────────────────────────────────
function ReviewScreen({ answers, questions, onBack }) {
  const [idx, setIdx] = useState(0);
  const q = questions[idx];
  const a = answers[idx];
  const optLabel = ["A", "B", "C", "D"];

  const optionStyle = (i) => {
    const base = { padding: "14px 16px", borderRadius: 12, border: "1.5px solid", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 12 };
    if (i === q.answer) return { ...base, backgroundColor: "#052E16", borderColor: "#22C55E", color: "#86EFAC" };
    if (i === a.selected && i !== q.answer) return { ...base, backgroundColor: "#2D1515", borderColor: "#EF4444", color: "#FCA5A5" };
    return { ...base, backgroundColor: "#0D1326", borderColor: "#1E2A4A", color: "#4A5568" };
  };

  return (
    <div style={S.screen}>
      <div style={{ ...S.header, paddingBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0 }}>
            <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Results</span></div>
          </button>
          <span style={{ ...S.small }}>{idx + 1} of {questions.length}</span>
        </div>
        <div style={S.progressBar(((idx + 1) / questions.length) * 100)}>
          <div style={S.progressFill(((idx + 1) / questions.length) * 100, a.correct ? "#22C55E" : "#EF4444")} />
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        <div style={S.row(6)}>
          <span style={S.pill()}>{q.subject}</span>
          <span style={S.pill("#1A1A2E", "#8B5CF6")}>{q.topic}</span>
          <span style={a.correct ? S.pill("#052E16", "#22C55E") : S.pill("#2D1515", "#EF4444")}>{a.correct ? "Correct" : "Incorrect"}</span>
        </div>

        <div style={{ ...S.card, padding: "18px" }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{q.question}</p>
        </div>

        <div style={S.gap(8)}>
          {q.options.map((opt, i) => (
            <div key={i} style={optionStyle(i)}>
              <span style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#1E2A4A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{optLabel[i]}</span>
              <span>{opt}</span>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#051A0F", border: "1px solid #14532D", borderRadius: 14, padding: 16 }}>
          <div style={{ ...S.row(8), marginBottom: 8 }}>
            <Icon name="check" size={16} color="#22C55E" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>Explanation</span>
          </div>
          <p style={{ ...S.body, fontSize: 13, margin: "0 0 10px" }}>{q.explanation}</p>
          <p style={{ fontSize: 11, color: "#374151" }}>📚 {q.source}</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}
            style={{ flex: 1, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: "12px", color: "#94A3B8", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>
            ← Prev
          </button>
          <button onClick={() => setIdx(i => Math.min(i + 1, questions.length - 1))} disabled={idx === questions.length - 1}
            style={{ flex: 1, backgroundColor: "#3B82F6", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === questions.length - 1 ? 0.3 : 1 }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CONTRIBUTION HEATMAP ──────────────────────────────────────────────────────
function ContributionHeatmap() {
  const weeksBack = 26;
  const cells = HEATMAP_DATA;
  const monthLabels = getMonthLabels(cells, weeksBack);
  const totalQuestions = cells.reduce((sum, c) => sum + c.questions, 0);

  // group into columns (weeks)
  const weeks = [];
  for (let w = 0; w < weeksBack; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  const cellSize = 9;
  const cellGap = 3;

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <p style={{ ...S.label, margin: 0 }}>Practice Activity</p>
        <span style={S.small}>{totalQuestions} questions · 6 months</span>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14, paddingBottom: 4 }}>
        <div style={{ minWidth: weeksBack * (cellSize + cellGap) }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 14, marginBottom: 4 }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <span key={weekIndex} style={{ position: "absolute", left: weekIndex * (cellSize + cellGap), fontSize: 10, color: "#64748B" }}>
                {label}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: "flex", gap: cellGap }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${cell.date.toDateString()}: ${cell.questions} questions`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      backgroundColor: HEATMAP_COLORS[cell.level],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 12 }}>
        <span style={{ fontSize: 10, color: "#64748B", marginRight: 2 }}>Less</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: c }} />
        ))}
        <span style={{ fontSize: 10, color: "#64748B", marginLeft: 2 }}>More</span>
      </div>
    </div>
  );
}


function AnalyticsScreen({ stats, allHistory, profile }) {
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const hasActivity = stats.total > 0;
  const weekData = hasActivity ? [0, 0, 0, 0, 0, 0, pct] : [0, 0, 0, 0, 0, 0, 0];
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const maxVal = Math.max(...weekData, 1);
  const rankTitle = !hasActivity ? "New Scholar" : pct >= 80 ? "Top Scholar" : pct >= 60 ? "Rising Scholar" : "Dedicated Scholar";

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <span style={S.label}>Your Progress</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Analytics</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {/* Rank card */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #1E3A5F 0%, #0D1326 100%)" }}>
          <div style={S.row(12)}>
            <div style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
              🎓
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>{rankTitle}</span>
              </div>
              <div style={S.small}>Rank rises as your streak and accuracy grow</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {[
            { label: "Total Answered", val: stats.total, icon: "book", color: "#3B82F6" },
            { label: "Correct", val: stats.correct, icon: "check", color: "#22C55E" },
            { label: "Accuracy", val: `${pct}%`, icon: "star", color: "#F59E0B" },
            { label: "Streak", val: hasActivity ? "1 day 🔥" : "0 days", icon: "fire", color: "#F97316" },
          ].map(({ label, val, icon, color }) => (
            <div key={label} style={{ ...S.card, padding: "14px" }}>
              <Icon name={icon} size={16} color={color} />
              <div style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 2px", color, letterSpacing: "-0.02em" }}>{val}</div>
              <div style={S.small}>{label}</div>
            </div>
          ))}
        </div>

        {/* Contribution heatmap */}
        <ContributionHeatmap />

        {/* Weekly chart */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 14 }}>This Week's Accuracy</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {weekData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{v}%</span>
                <div style={{ width: "100%", height: `${(v / maxVal) * 70}px`, backgroundColor: i === 6 ? "#3B82F6" : "#1E2A4A", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
                <span style={{ fontSize: 10, color: "#64748B" }}>{weekDays[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Focus Areas</p>
          {hasActivity ? (
            <div style={S.gap(12)}>
              {/* Populated once real per-topic data exists from completed quizzes */}
              <p style={{ ...S.body, fontSize: 13 }}>Keep practicing — focus areas appear here once you've answered questions across a few different topics.</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 8px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <p style={{ ...S.body, fontSize: 13, margin: 0 }}>Take your first practice session to see which topics need more attention.</p>
            </div>
          )}
        </div>

        {/* Target */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #1E3A5F 0%, #0D1326 100%)" }}>
          <div style={S.row(10)}>
            <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="trophy" size={22} color="#3B82F6" />
            </div>
            <div>
              <div style={S.h3}>Target: {profile?.targetGrade || "Set a goal"} 🎯</div>
              <div style={S.small}>{hasActivity ? "Keep your accuracy climbing toward your goal" : "Start practicing to track progress toward your target"}</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={S.small}>Overall progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6" }}>{pct}%</span>
            </div>
            <div style={S.progressBar(pct)}>
              <div style={S.progressFill(pct)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BOOKMARKS SCREEN ──────────────────────────────────────────────────────────
function BookmarksScreen({ bookmarks, onToggleBookmark, onStartBookmarkQuiz }) {
  const saved = QUESTIONS.filter(q => bookmarks.includes(q.id));

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <span style={S.label}>Saved Questions</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Bookmarks</h1>
      </div>
      <div style={{ ...S.px, ...S.gap(12) }}>
        {saved.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔖</div>
            <h3 style={{ ...S.h2, marginBottom: 8 }}>No bookmarks yet</h3>
            <p style={S.body}>Tap the bookmark icon during a quiz to save questions for review.</p>
          </div>
        ) : (
          <>
            {saved.length >= 3 && (
              <button style={S.btnPrimary} onClick={onStartBookmarkQuiz}>
                Practice Bookmarked Questions ({saved.length})
              </button>
            )}
            {saved.map(q => (
              <div key={q.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...S.row(6), marginBottom: 8 }}>
                      <span style={S.pill()}>{q.exam}</span>
                      <span style={S.pill("#1A1A2E", "#8B5CF6")}>{q.subject}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#E2E8F0", lineHeight: 1.5, margin: "0 0 8px" }}>{q.question}</p>
                    <p style={S.small}>{q.source}</p>
                  </div>
                  <button onClick={() => onToggleBookmark(q.id)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                    <Icon name="bookmark" size={20} color="#3B82F6" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── ABOUT SCREEN ──────────────────────────────────────────────────────────────
// ── COLLEGES SCREEN ───────────────────────────────────────────────────────────
function CollegeSlideshow({ colleges, onSelect }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % colleges.length), 4000);
    return () => clearInterval(t);
  }, [colleges.length]);

  const c = colleges[idx];

  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 180, cursor: "pointer" }} onClick={() => onSelect(c)}>
      {c.image ? (
        <img src={c.image} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1E3A5F 0%, #0D1326 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#3B82F6", opacity: 0.5 }}>{c.name.charAt(0)}</span>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,13,30,0) 0%, rgba(8,13,30,0.95) 100%)" }} />
      <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
        <span style={S.pill("rgba(59,130,246,0.25)", "#93C5FD")}>{c.region}</span>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", marginTop: 8, letterSpacing: "-0.01em" }}>{c.name}</div>
        <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 2 }}>{c.country} · {c.acceptanceRate} acceptance</div>
      </div>
      {/* Dots */}
      <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 5 }}>
        {colleges.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, backgroundColor: i === idx ? "#3B82F6" : "rgba(255,255,255,0.4)", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

function CollegeDetail({ college, onBack }) {
  const [imgIdx, setImgIdx] = useState(0);
  const compColor = { Extreme: "#EF4444", "Very High": "#F97316", High: "#F59E0B", Moderate: "#22C55E" }[college.competitiveness] || "#3B82F6";
  const imgs = college.images || [college.image];

  return (
    <div style={S.screen}>
      <div style={{ position: "relative", height: 220 }}>
        {imgs[imgIdx] ? (
          <img src={imgs[imgIdx]} alt={college.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1E3A5F 0%, #0D1326 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: "#3B82F6", opacity: 0.5 }}>{college.name.charAt(0)}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,13,30,0.3) 0%, #080D1E 100%)" }} />
        <button onClick={onBack} style={{ position: "absolute", top: 52, left: 20, background: "rgba(13,19,38,0.8)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}>
          <Icon name="arrow_left" size={18} color="#fff" />
        </button>
        {/* Image dots */}
        {imgs.length > 1 && (
          <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 5 }}>
            {imgs.map((_, i) => (
              <div key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 16 : 5, height: 5, borderRadius: 3, backgroundColor: i === imgIdx ? "#3B82F6" : "rgba(255,255,255,0.4)", transition: "all 0.3s", cursor: "pointer" }} />
            ))}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <CollegeLogo college={college} size={48} imgSize={36} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{college.name}</div>
            <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 2 }}>{college.country}</div>
          </div>
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(14), marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.small}>Acceptance Rate</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{college.acceptanceRate}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.small}>Competitiveness</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, color: compColor }}>{college.competitiveness}</div>
          </div>
        </div>

        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Entry Requirements</p>
          <div style={S.gap(10)}>
            {college.requirements.map((r, i) => (
              <div key={i} style={S.row(10)}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3B82F6", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: "#0D1E3D", border: "1px solid #1E3A5F", borderRadius: 14, padding: 16 }}>
          <div style={{ ...S.row(8), marginBottom: 6 }}>
            <Icon name="info" size={15} color="#3B82F6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6" }}>Insider Note</span>
          </div>
          <p style={{ ...S.body, fontSize: 13, margin: 0 }}>{college.notes}</p>
        </div>

        {college.virtualTour && (
          <a href={college.virtualTour} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                     backgroundColor: "#0D1326", border: "1.5px solid #3B82F6", borderRadius: 14,
                     padding: "14px 20px", textDecoration: "none", cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>🎓</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#3B82F6" }}>Explore Campus</span>
          </a>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

function CollegeLogo({ college, size = 56, imgSize = 44 }) {
  const [failed, setFailed] = useState(false);
  const showImg = college.logo && !failed;
  return (
    <div style={{ width: size, height: size, borderRadius: size > 48 ? 14 : 12, backgroundColor: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {showImg ? (
        <img src={college.logo} alt={college.name} onError={() => setFailed(true)} style={{ width: imgSize, height: imgSize, objectFit: "contain" }} />
      ) : (
        <div style={{ fontSize: size > 48 ? 24 : 20, fontWeight: 900, color: "#0D1326" }}>{college.name.charAt(0)}</div>
      )}
    </div>
  );
}
function CollegesScreen() {
  const [region, setRegion] = useState("All");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = COLLEGES.filter(c =>
    (region === "All" || c.region === region) &&
    (search.trim() === "" || c.name.toLowerCase().includes(search.trim().toLowerCase()) || c.country.toLowerCase().includes(search.trim().toLowerCase()))
  );

  if (selected) return <CollegeDetail college={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <span style={S.label}>Plan Ahead</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Colleges</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        <CollegeSlideshow colleges={COLLEGES.slice(0, 5)} onSelect={setSelected} />

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color="#64748B" />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for a school..."
            style={{ width: "100%", padding: "12px 14px 12px 40px", backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Nigerian Admissions Portals */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>🇳🇬 Nigerian Admissions Portals</p>
          <div style={S.gap(8)}>
            {[
              { name: "JAMB CAPS / Admission Status", url: "https://efacility.jamb.gov.ng", note: "Check admission status, accept offers, print letter" },
              { name: "WAEC Result Checker", url: "https://www.waecdirect.org", note: "Official WASSCE result checking portal" },
              { name: "NECO Result Portal", url: "https://results.neco.gov.ng", note: "Official NECO SSCE result checking portal" },
            ].map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", padding: "12px 14px", backgroundColor: "#111827", borderRadius: 12, border: "1px solid #1E2A4A" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2FF" }}>{p.name}</div>
                  <div style={{ ...S.small, marginTop: 2 }}>{p.note}</div>
                </div>
                <Icon name="external" size={16} color="#3B82F6" />
              </a>
            ))}
          </div>
          <p style={{ ...S.small, marginTop: 10 }}>These take you to the official government portals — AceBoard doesn't process admissions itself, just gets you there faster.</p>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {COLLEGE_REGIONS.map(r => (
            <button key={r} style={{ ...S.btnSmall(region === r), flexShrink: 0 }} onClick={() => setRegion(r)}>{r}</button>
          ))}
        </div>

        <div style={S.gap(10)}>
          {filtered.map(c => {
            const compColor = { Extreme: "#EF4444", "Very High": "#F97316", High: "#F59E0B", Moderate: "#22C55E" }[c.competitiveness] || "#3B82F6";
            return (
              <button key={c.id} onClick={() => setSelected(c)} style={{ ...S.cardAlt, display: "flex", gap: 12, cursor: "pointer", textAlign: "left", padding: 12, alignItems: "center" }}>
                <CollegeLogo college={c} size={56} imgSize={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>{c.name}</div>
                  <div style={{ ...S.small, marginTop: 2 }}>{c.country} · {c.acceptanceRate}</div>
                </div>
                <span style={{ ...S.pill(`${compColor}22`, compColor), flexShrink: 0 }}>{c.competitiveness}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ── QUESTION SEARCH ───────────────────────────────────────────────────────────
function QuestionSearchScreen({ onBack }) {
  const [examFilter, setExamFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);

  const examOptions = ["All", ...new Set(QUESTIONS.map(q => q.exam))];
  const subjectOptions = ["All Subjects", ...new Set(QUESTIONS.filter(q => examFilter === "All" || q.exam === examFilter).map(q => q.subject))];

  const filtered = QUESTIONS.filter(q =>
    (examFilter === "All" || q.exam === examFilter) &&
    (subjectFilter === "All Subjects" || q.subject === subjectFilter) &&
    (keyword.trim() === "" ||
      q.question.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      q.topic.toLowerCase().includes(keyword.trim().toLowerCase()))
  );

  if (selected) {
    const optLabel = ["A", "B", "C", "D"];
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
            <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back to results</span></div>
          </button>
          <span style={S.label}>{selected.exam} · {selected.subject}</span>
        </div>
        <div style={{ ...S.px, ...S.gap(14) }}>
          <div style={S.row(6)}>
            <span style={S.pill()}>{selected.topic}</span>
            <span style={S.pill("#1A1A2E", "#8B5CF6")}>{selected.difficulty}</span>
            <span style={S.pill("#111827", "#64748B")}>{selected.year}</span>
          </div>
          <div style={{ ...S.card, padding: "18px" }}>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{selected.question}</p>
          </div>
          <div style={S.gap(8)}>
            {selected.options.map((opt, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid", display: "flex", alignItems: "center", gap: 12,
                backgroundColor: i === selected.answer ? "#052E16" : "#0D1326", borderColor: i === selected.answer ? "#22C55E" : "#1E2A4A", color: i === selected.answer ? "#86EFAC" : "#E2E8F0" }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#1E2A4A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{optLabel[i]}</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#051A0F", border: "1px solid #14532D", borderRadius: 14, padding: 16 }}>
            <div style={{ ...S.row(8), marginBottom: 8 }}>
              <Icon name="check" size={16} color="#22C55E" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>Explanation</span>
            </div>
            <p style={{ ...S.body, fontSize: 13, margin: "0 0 10px" }}>{selected.explanation}</p>
            <p style={{ fontSize: 11, color: "#374151" }}>📚 {selected.source}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Question Search</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>Find any question</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setSubjectFilter("All Subjects"); }}
            style={{ flex: 1, backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13 }}>
            {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            style={{ flex: 1, backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13 }}>
            {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color="#64748B" />
          </div>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search by keyword or topic..."
            style={{ width: "100%", padding: "12px 14px 12px 40px", backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <p style={{ ...S.small }}>{filtered.length} question{filtered.length !== 1 ? "s" : ""} found</p>

        <div style={S.gap(10)}>
          {filtered.map((q, i) => (
            <button key={q.id} onClick={() => setSelected(q)} style={{ ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 14, border: "1px solid #1E2A4A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>#{i + 1}</span>
                <span style={S.pill(q.difficulty === "Easy" ? "#052E16" : q.difficulty === "Medium" ? "#1A2E1A" : "#2D1515", q.difficulty === "Easy" ? "#22C55E" : q.difficulty === "Medium" ? "#86EFAC" : "#EF4444")}>{q.difficulty}</span>
              </div>
              <p style={{ fontSize: 13, color: "#E2E8F0", margin: "0 0 8px", lineHeight: 1.5 }}>{q.question.slice(0, 90)}{q.question.length > 90 ? "..." : ""}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={S.small}>{q.exam} / {q.subject}</span>
                <span style={S.small}>{q.year}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ ...S.body }}>No questions match your search yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NOTES DATA ────────────────────────────────────────────────────────────────
// Seed set — proof of the full flow (notes + video + test + flashcards).
// Scaling this to cover every topic across every exam board is an ongoing content project,
// same as the question bank — not something to fake with placeholder text.
const NOTES = [
  {
    id: "n1", exam: "IGCSE", subject: "Mathematics", topic: "Probability",
    content: "Probability measures how likely an event is to happen, on a scale from 0 (impossible) to 1 (certain).\n\nP(event) = number of favourable outcomes ÷ total number of possible outcomes.\n\nFor independent events (one doesn't affect the other), multiply their probabilities: P(A and B) = P(A) × P(B).\n\nFor combined events, probability tree diagrams help organise outcomes across multiple stages — multiply along branches, add between separate branches leading to the same result.\n\nMutually exclusive events (can't both happen at once) follow: P(A or B) = P(A) + P(B).\n\nAlways check your probabilities for a full sample space sum to 1.",
    videoTitle: "All of Probability in 30 Minutes — GCSE Maths Tutor",
    videoUrl: "https://www.youtube.com/watch?v=h78FV6dRETI",
    flashcards: [
      { q: "What is the probability scale range?", a: "0 (impossible) to 1 (certain)" },
      { q: "How do you find P(A and B) for independent events?", a: "Multiply: P(A) × P(B)" },
      { q: "What's the rule for mutually exclusive events?", a: "P(A or B) = P(A) + P(B)" },
      { q: "On a probability tree, what do you do along a branch vs between branches?", a: "Multiply along a branch, add between separate branches" },
    ],
  },
  {
    id: "n2", exam: "IGCSE", subject: "Chemistry", topic: "Acids & Bases",
    content: "Acids release H+ ions in aqueous solution; bases (or alkalis, when soluble) release OH- ions.\n\npH scale runs 0–14: below 7 is acidic, 7 is neutral, above 7 is alkaline/basic.\n\nNeutralisation: acid + base → salt + water. This is why antacids (bases) treat excess stomach acid.\n\nStrong acids/bases fully ionise in water (e.g. HCl); weak acids/bases only partially ionise (e.g. ethanoic acid) — strength is about ionisation, not concentration.\n\nIndicators like litmus (red in acid, blue in alkali) or universal indicator (full colour range matching pH) are used to test pH practically.",
    videoTitle: "Acids and Bases - Basic Introduction — The Organic Chemistry Tutor",
    videoUrl: "https://www.youtube.com/watch?v=owVZiKnnPME",
    flashcards: [
      { q: "What ion do acids release in water?", a: "H+ (hydrogen ions)" },
      { q: "What pH value is neutral?", a: "7" },
      { q: "What's the general equation for neutralisation?", a: "Acid + Base → Salt + Water" },
      { q: "What's the difference between a strong and weak acid?", a: "Strong acids fully ionise in water; weak acids only partially ionise" },
    ],
  },
  {
    id: "n3", exam: "WAEC", subject: "Biology", topic: "Cell Biology",
    content: "The cell is the basic structural and functional unit of all living organisms.\n\nAnimal cells contain: nucleus (controls activities, holds DNA), cytoplasm (site of reactions), cell membrane (controls what enters/exits), mitochondria (respiration/ATP production), ribosomes (protein synthesis).\n\nPlant cells have all of the above, plus: cell wall (made of cellulose, gives structural support), chloroplasts (site of photosynthesis, contain chlorophyll), and a large permanent vacuole (maintains turgor pressure, stores cell sap).\n\nProkaryotic cells (bacteria) lack a nucleus and membrane-bound organelles — their DNA floats freely in the cytoplasm.\n\nUnderstanding these differences is a common WAEC exam focus: comparing plant vs animal cells, and identifying organelles from labelled diagrams.",
    videoTitle: "GCSE Biology - Cell Types and Cell Structure — Cognito",
    videoUrl: "https://www.youtube.com/watch?v=qHkUOlC8Nbo",
    flashcards: [
      { q: "What are three structures found in plant cells but NOT animal cells?", a: "Cell wall, chloroplasts, and a large permanent vacuole" },
      { q: "What is the function of the mitochondria?", a: "Site of respiration — produces ATP (energy) for the cell" },
      { q: "What is the function of ribosomes?", a: "Protein synthesis" },
      { q: "What's the key difference between prokaryotic and eukaryotic cells?", a: "Prokaryotic cells (like bacteria) lack a nucleus and membrane-bound organelles" },
    ],
  },
];

const BOOKS = [
  { exam: "WAEC", title: "WAEC Syllabus (Official)", note: "Free official syllabus per subject — the authoritative source for exactly what's examinable.", url: "https://www.waecnigeria.org" },
  { exam: "JAMB", title: "JAMB UTME Syllabus (Official)", note: "Official JAMB brochure and subject syllabus, updated yearly.", url: "https://www.jamb.gov.ng" },
  { exam: "NECO", title: "NECO Syllabus (Official)", note: "Official NECO subject syllabus documents.", url: "https://www.neco.gov.ng" },
  { exam: "IGCSE", title: "Cambridge IGCSE Syllabus (Official)", note: "Free official syllabus documents for every Cambridge IGCSE subject.", url: "https://www.cambridgeinternational.org" },
];

// ── FLASHCARD VIEWER (for Notes topics) ──────────────────────────────────────
function NoteFlashcards({ cards, onBack }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Flashcards</span>
      </div>
      <div style={{ ...S.px, ...S.gap(16) }}>
        <div style={{ textAlign: "center", fontSize: 13, color: "#94A3B8" }}>Card {idx + 1} of {cards.length} — tap to flip</div>
        <button onClick={() => setFlipped(f => !f)}
          style={{ backgroundColor: flipped ? "#0D1E3D" : "#161D33", border: `1.5px solid ${flipped ? "#3B82F6" : "#1E2A4A"}`, borderRadius: 18, padding: "32px 20px", cursor: "pointer", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: flipped ? "#3B82F6" : "#94A3B8" }}>{flipped ? "ANSWER" : "QUESTION"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#F0F2FF", lineHeight: 1.6, textAlign: "center" }}>{flipped ? cards[idx].a : cards[idx].q}</div>
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setIdx(i => Math.max(i - 1, 0)); setFlipped(false); }} disabled={idx === 0}
            style={{ flex: 1, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: "12px", color: "#94A3B8", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>← Prev</button>
          <button onClick={() => { setIdx(i => Math.min(i + 1, cards.length - 1)); setFlipped(false); }} disabled={idx === cards.length - 1}
            style={{ flex: 1, backgroundColor: "#3B82F6", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === cards.length - 1 ? 0.3 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// ── NOTES SCREEN ──────────────────────────────────────────────────────────────
function NotesScreen({ onBack, onTestTopic }) {
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topicNote, setTopicNote] = useState(null);
  const [showFlashcards, setShowFlashcards] = useState(false);

  const examOptions = [...new Set(NOTES.map(n => n.exam))];
  const subjectOptions = exam ? [...new Set(NOTES.filter(n => n.exam === exam).map(n => n.subject))] : [];
  const topicOptions = exam && subject ? NOTES.filter(n => n.exam === exam && n.subject === subject) : [];

  if (showFlashcards && topicNote) {
    return <NoteFlashcards cards={topicNote.flashcards} onBack={() => setShowFlashcards(false)} />;
  }

  if (topicNote) {
    const videoId = topicNote.videoUrl.split("v=")[1];
    return (
      <div style={{ ...S.screen, overflowY: "auto" }}>
        <div style={S.header}>
          <button onClick={() => setTopicNote(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
            <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
          </button>
          <span style={S.label}>{topicNote.exam} · {topicNote.subject}</span>
          <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>{topicNote.topic}</h1>
        </div>
        <div style={{ ...S.px, ...S.gap(16) }}>
          <div style={{ ...S.card, whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "#E2E8F0" }}>{topicNote.content}</div>

          <div>
            <p style={{ ...S.label, marginBottom: 10 }}>Watch: {topicNote.videoTitle}</p>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 14, overflow: "hidden" }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={topicNote.videoTitle}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allowFullScreen
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowFlashcards(true)} style={{ ...S.btnSecondary, flex: 1 }}>🃏 Flashcards</button>
            <button onClick={() => onTestTopic(topicNote.exam, topicNote.subject, topicNote.topic)} style={{ ...S.btnPrimary, flex: 1 }}>✅ Test Yourself</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Notes & Books</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>{!exam ? "Choose an exam" : !subject ? "Choose a subject" : "Choose a topic"}</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {!exam && (<>
          {examOptions.map(e => (
            <button key={e} onClick={() => setExam(e)} style={{ ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <ExamLogo exam={e} size={36} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{e}</span>
            </button>
          ))}
          <div style={{ height: 8 }} />
          <p style={{ ...S.label, marginBottom: 4 }}>📚 Recommended Reading</p>
          {BOOKS.map(b => (
            <a key={b.title} href={b.url} target="_blank" rel="noopener noreferrer" style={{ ...S.cardAlt, textDecoration: "none", display: "block", padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2FF" }}>{b.title}</div>
              <div style={{ ...S.small, marginTop: 4 }}>{b.note}</div>
            </a>
          ))}
        </>)}

        {exam && !subject && (<>
          <button onClick={() => setExam(null)} style={{ ...S.btnSecondary, marginBottom: 8 }}>← All Exams</button>
          {subjectOptions.map(s => (
            <button key={s} onClick={() => setSubject(s)} style={{ ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{s}</span>
            </button>
          ))}
          {subjectOptions.length === 0 && <p style={{ ...S.body }}>No notes yet for {exam} — check back soon.</p>}
        </>)}

        {exam && subject && (<>
          <button onClick={() => setSubject(null)} style={{ ...S.btnSecondary, marginBottom: 8 }}>← All Subjects</button>
          {topicOptions.map(t => (
            <button key={t.id} onClick={() => setTopicNote(t)} style={{ ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{t.topic}</span>
            </button>
          ))}
        </>)}
      </div>
    </div>
  );
}

// ── AI STUDY COACH ────────────────────────────────────────────────────────────
// ── AI HUB ────────────────────────────────────────────────────────────────────
function AIHub({ onBack }) {
  const [screen, setScreen] = useState("hub"); // hub | planner | flashcards | coach

  if (screen === "planner") return <AIStudyPlanner onBack={() => setScreen("hub")} />;
  if (screen === "flashcards") return <AIFlashcards onBack={() => setScreen("hub")} />;
  if (screen === "coach") return <AIStudyCoach onBack={() => setScreen("hub")} />;

  const tools = [
    { id: "planner", emoji: "📅", title: "Study Planner", desc: "Enter your exam, date & subjects — get a full weekly schedule automatically.", color: "#3B82F6" },
    { id: "flashcards", emoji: "🃏", title: "AI Flashcards", desc: "Paste any notes or text — instantly turn them into tap-to-flip flashcards.", color: "#8B5CF6" },
    { id: "coach", emoji: "🤖", title: "Study Coach", desc: "Tell the coach what you're struggling with — get a personalized strategy.", color: "#10B981" },
  ];

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <div>
          <div style={S.h1}>AI Tools</div>
          <div style={S.small}>Powered by Claude AI</div>
        </div>
      </div>
      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...S.card, backgroundColor: "#0D1E3D", border: "1px solid #1E3A5F", marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
            AceBoard's AI features are designed specifically for students writing WAEC, JAMB, SAT, IGCSE and more. Pick a tool below to get started.
          </div>
        </div>
        {tools.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)}
            style={{ ...S.card, display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer", textAlign: "left", border: "1.5px solid #1E2A4A" }}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>{t.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.color, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AI STUDY PLANNER ──────────────────────────────────────────────────────────
function AIStudyPlanner({ onBack }) {
  const [step, setStep] = useState("form"); // form | loading | result
  const [exam, setExam] = useState("WAEC");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");

  const exams = ["WAEC", "JAMB", "NECO", "GCE", "IGCSE", "SAT", "ACT", "IELTS"];

  const generatePlan = async () => {
    if (!examDate || !subjects.trim()) {
      setError("Please fill in your exam date and subjects.");
      return;
    }
    setError("");
    setStep("loading");
    try {
      const today = new Date();
      const target = new Date(examDate);
      const daysLeft = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
      const resp = await fetch("https://us-central1-ace-board-41d96.cloudfunctions.net/aiStudyCoach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Create a detailed ${daysLeft}-day study plan for a student preparing for ${exam}. Subjects: ${subjects}. Available study time: ${hoursPerDay} hours per day. Format as a weekly schedule (Week 1, Week 2, etc.) showing which subjects to study each day with approximate time allocation. Include a tip for each week. Keep it practical, specific, and encouraging. Max 300 words.`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setPlan(data.text || "Could not generate plan. Try again.");
      setStep("result");
    } catch {
      setPlan("The planner is being set up — check back soon!");
      setStep("result");
    }
  };

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Icon name="arrow_left" size={20} color="#fff" />
        </button>
        <div>
          <div style={S.h1}>AI Study Planner</div>
          <div style={S.small}>Your personalized exam schedule</div>
        </div>
      </div>

      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step === "form" && (<>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>SELECT EXAM</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {exams.map(e => (
                <button key={e} onClick={() => setExam(e)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    backgroundColor: exam === e ? "#3B82F6" : "transparent",
                    borderColor: exam === e ? "#3B82F6" : "#1E2A4A",
                    color: exam === e ? "#fff" : "#94A3B8" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>EXAM DATE</div>
            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
              style={{ width: "100%", backgroundColor: "#0D1326", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>SUBJECTS</div>
            <input value={subjects} onChange={e => setSubjects(e.target.value)}
              placeholder="e.g. Maths, Physics, Chemistry, English"
              style={{ width: "100%", backgroundColor: "#0D1326", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>HOURS AVAILABLE PER DAY</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6"].map(h => (
                <button key={h} onClick={() => setHoursPerDay(h)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1.5px solid", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    backgroundColor: hoursPerDay === h ? "#3B82F6" : "transparent",
                    borderColor: hoursPerDay === h ? "#3B82F6" : "#1E2A4A",
                    color: hoursPerDay === h ? "#fff" : "#94A3B8" }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</div>}

          <button onClick={generatePlan}
            style={{ backgroundColor: "#3B82F6", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            ✨ Generate My Study Plan
          </button>
        </>)}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
            <div style={{ color: "#94A3B8", fontSize: 15 }}>Building your personalized plan...</div>
          </div>
        )}

        {step === "result" && (<>
          <div style={{ ...S.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#E2E8F0" }}>{plan}</div>
          <button onClick={() => { setStep("form"); setPlan(""); }}
            style={{ backgroundColor: "transparent", border: "1.5px solid #3B82F6", borderRadius: 14, padding: "14px", color: "#3B82F6", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Generate New Plan
          </button>
        </>)}
      </div>
    </div>
  );
}

// ── AI FLASHCARDS ─────────────────────────────────────────────────────────────
function AIFlashcards({ onBack }) {
  const [inputText, setInputText] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [step, setStep] = useState("input"); // input | studying
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const fileInputRef = useRef(null);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(" ") + "\n";
      }
      setInputText(fullText.slice(0, 4000)); // keep prompt size reasonable
    } catch (err) {
      console.error("PDF parse failed:", err);
      setPdfName("");
    } finally {
      setPdfLoading(false);
      e.target.value = ""; // allow re-uploading the same file
    }
  };

  const generate = async () => {
    if (!inputText.trim() || inputText.length < 20) return;
    setLoading(true);
    try {
      const resp = await fetch("https://us-central1-ace-board-41d96.cloudfunctions.net/aiStudyCoach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `From the following study notes or text, generate exactly 8 flashcards. Each flashcard should have a clear question on one side and a concise answer on the other. Format your response as valid JSON only — an array of objects with "q" and "a" fields. Example: [{"q":"What is...","a":"It is..."}]. No other text, just the JSON array. Notes: ${inputText.slice(0, 1000)}`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const raw = data.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCards(parsed);
        setCardIdx(0);
        setFlipped(false);
        setStep("studying");
      } else throw new Error("Bad format");
    } catch {
      setCards([{ q: "Flashcard generation is coming soon!", a: "The AI backend is being configured. Paste your notes and try again shortly." }]);
      setCardIdx(0);
      setFlipped(false);
      setStep("studying");
    } finally {
      setLoading(false);
    }
  };

  const next = () => { setCardIdx(i => Math.min(i + 1, cards.length - 1)); setFlipped(false); };
  const prev = () => { setCardIdx(i => Math.max(i - 1, 0)); setFlipped(false); };

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Icon name="arrow_left" size={20} color="#fff" />
        </button>
        <div>
          <div style={S.h1}>AI Flashcards</div>
          <div style={S.small}>Paste notes → instant flashcards</div>
        </div>
      </div>

      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step === "input" && (<>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>PASTE YOUR NOTES OR TEXT</div>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="Paste any study notes, a paragraph from your textbook, or type a topic you want flashcards on..."
              rows={8}
              style={{ width: "100%", backgroundColor: "#0D1326", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{inputText.length} characters{pdfName && ` · from ${pdfName}`}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={pdfLoading}
                style={{ flex: 1, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 10, padding: "10px", color: "#94A3B8", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: pdfLoading ? 0.5 : 1 }}>
                {pdfLoading ? "Reading PDF…" : "📄 Upload PDF instead"}
              </button>
            </div>
          </div>
          <button onClick={generate} disabled={loading || inputText.length < 20}
            style={{ backgroundColor: "#3B82F6", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", opacity: loading || inputText.length < 20 ? 0.5 : 1 }}>
            {loading ? "Generating..." : "✨ Generate Flashcards"}
          </button>
        </>)}

        {step === "studying" && cards.length > 0 && (<>
          <div style={{ textAlign: "center", fontSize: 13, color: "#94A3B8" }}>Card {cardIdx + 1} of {cards.length} — tap to flip</div>

          <button onClick={() => setFlipped(f => !f)}
            style={{ backgroundColor: flipped ? "#0D1E3D" : "#161D33", border: `1.5px solid ${flipped ? "#3B82F6" : "#1E2A4A"}`, borderRadius: 18, padding: "32px 20px", cursor: "pointer", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: flipped ? "#3B82F6" : "#94A3B8" }}>
              {flipped ? "ANSWER" : "QUESTION"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#F0F2FF", lineHeight: 1.6, textAlign: "center" }}>
              {flipped ? cards[cardIdx].a : cards[cardIdx].q}
            </div>
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={prev} disabled={cardIdx === 0}
              style={{ flex: 1, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: "12px", color: "#94A3B8", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: cardIdx === 0 ? 0.3 : 1 }}>
              ← Prev
            </button>
            <button onClick={next} disabled={cardIdx === cards.length - 1}
              style={{ flex: 1, backgroundColor: "#3B82F6", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: cardIdx === cards.length - 1 ? 0.3 : 1 }}>
              Next →
            </button>
          </div>

          <button onClick={() => { setStep("input"); setCards([]); setInputText(""); }}
            style={{ backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: "12px", color: "#94A3B8", fontSize: 14, cursor: "pointer" }}>
            Start Over
          </button>
        </>)}
      </div>
    </div>
  );
}

function AIStudyCoach({ onBack }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AceBoard study coach. Tell me what subject or topic you're struggling with, and I'll help you figure out why — and how to fix it." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      // Calls a Firebase Cloud Function that securely holds the Anthropic API key server-side.
      // Replace the URL below with your deployed function URL after running `firebase deploy --only functions`.
      const resp = await fetch("https://us-central1-ace-board-41d96.cloudfunctions.net/aiStudyCoach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (!resp.ok) throw new Error("Coach unavailable");
      const data = await resp.json();
      const text = data.text || "Sorry, I couldn't process that. Try again?";
      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "The AI Coach is being connected to a secure backend right now — full functionality is coming very soon! In the meantime, check out Practice Mode for instant explanations on every question." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.screen, display: "flex", flexDirection: "column" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Icon name="arrow_left" size={20} color="#fff" />
        </button>
        <div>
          <div style={S.h1}>AI Study Coach</div>
          <div style={S.small}>Personalized help, not generic answers</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
                                  backgroundColor: m.role === "user" ? "#3B82F6" : "#161D33",
                                  color: m.role === "user" ? "#fff" : "#E2E8F0",
                                  borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#94A3B8", fontSize: 13, padding: "10px 14px" }}>Coach is thinking...</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 20, borderTop: "1px solid #1E2A4A" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What are you struggling with?"
          style={{ flex: 1, backgroundColor: "#161D33", border: "1px solid #1E2A4A", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
        />
        <button onClick={send} disabled={loading} style={{ backgroundColor: "#3B82F6", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          Send
        </button>
      </div>
    </div>
  );
}
// ── ABOUT SCREEN ──────────────────────────────────────────────────────────────
function AboutScreen({ user, onSignOut }) {
  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.logo}>Ace<span style={S.logoAccent}>Board</span></div>
        <p style={{ ...S.body, marginTop: 8, fontSize: 13 }}>v1.0.0 MVP — Built for students, everywhere</p>
      </div>
      <div style={{ ...S.px, ...S.gap(14) }}>
        {user && (
          <div style={{ ...S.card, ...S.row(12) }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 700 }}>
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>{user.displayName || "Account"}</div>
              <div style={{ ...S.small, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            </div>
            <button onClick={onSignOut} style={{ background: "none", border: "1px solid #1E2A4A", borderRadius: 10, padding: "8px 12px", color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              Sign out
            </button>
          </div>
        )}

        <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1628 0%, #0D1E3D 100%)", borderColor: "#1E3A5F" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨🏾‍💻</div>
          <h2 style={{ ...S.h2, marginBottom: 8 }}>Built by Judah Kayode</h2>
          <p style={{ ...S.body, fontSize: 13, marginBottom: 16 }}>
            Nigerian secondary school student, CS aspirant & developer. AceBoard was built to solve a real gap in accessible, structured exam prep for students everywhere.
          </p>
          <div style={S.divider} />
          <p style={{ ...S.body, fontSize: 12, fontStyle: "italic" }}>
            "Millions of students prepare for major exams yearly with no structured digital resource. AceBoard changes that."
          </p>
        </div>

        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Supported Exams</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXAMS.map(e => <span key={e} style={S.pill()}>{e}</span>)}
          </div>
        </div>

        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Tech Stack</p>
          <div style={S.gap(8)}>
            {["React (Frontend)", "Firebase Firestore (Database)", "Firebase Auth (Google Sign-in)", "Node.js + Express (Backend)", "Vercel (Hosting)"].map(t => (
              <div key={t} style={{ ...S.row(10) }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3B82F6", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>About the Builder</p>
          <div style={S.gap(10)}>
            {[
              { label: "Get to know more about Judah", url: "https://judahkayode.netlify.app", icon: "external" },
            ].map(({ label, url, icon }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{ ...S.row(10), textDecoration: "none", padding: "12px 14px", backgroundColor: "#111827", borderRadius: 12, border: "1px solid #1E2A4A" }}>
                <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600, flex: 1 }}>{label}</span>
                <Icon name={icon} size={16} color="#3B82F6" />
              </a>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          <p style={{ fontSize: 12, color: "#1E2A4A" }}>AceBoard © 2025 · Judah Kayode · judahkayode.netlify.app</p>
        </div>
      </div>
    </div>
  );
}

// ── SPLASH SCREEN ─────────────────────────────────────────────────────────────
function SignInScreen({ onSignedIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSignedIn(result.user);
    } catch (err) {
      console.error(err);
      setError("Sign-in didn't go through. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh", padding: "0 28px", backgroundColor: "#080D1E" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img src="/icon.png" style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 18px", display: "block" }} alt="AceBoard" />
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#F0F2FF" }}>Ace<span style={{ color: "#3B82F6" }}>Board</span></div>
        <p style={{ fontSize: 13, marginTop: 8, color: "#94A3B8" }}>Sign in to save your progress, streaks, and bookmarks across sessions.</p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{ width: "100%", padding: "15px 20px", backgroundColor: "#fff", color: "#1F2937", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.6 : 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? "Signing in…" : "Continue with Google"}
      </button>

      {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginTop: 14 }}>{error}</p>}

      <p style={{ ...S.small, textAlign: "center", marginTop: 24 }}>
        By continuing, your name and email are used to personalize your AceBoard account.
      </p>
    </div>
  );
}
// ── SPLASH SCREEN ─────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#080D1E" }}>
      <img src="/icon.png" style={{ width: 100, height: 100, marginBottom: 16, borderRadius: 22 }} alt="AceBoard" />
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#F0F2FF" }}>Ace<span style={{ color: "#3B82F6" }}>Board</span></div>
      <p style={{ fontSize: 13, marginTop: 6, color: "#94A3B8" }}>Built for students, everywhere</p>
    </div>
  );
}

// ── ONBOARDING SCREEN ─────────────────────────────────────────────────────────
const TARGET_GRADES = {
  WAEC: ["A1 (Excellent)", "B2-B3 (Very Good)", "C4-C6 (Credit)"],
  NECO: ["A1 (Excellent)", "B2-B3 (Very Good)", "C4-C6 (Credit)"],
  GCE: ["A1 (Excellent)", "B2-B3 (Very Good)", "C4-C6 (Credit)"],
  JAMB: ["320+ (Elite)", "280-319 (Strong)", "200-279 (Competitive)"],
  IGCSE: ["9 (Top grade)", "7-8 (Strong)", "5-6 (Pass with credit)"],
  SAT: ["1500+ (Elite)", "1350-1499 (Strong)", "1200-1349 (Competitive)"],
  ACT: ["33+ (Elite)", "28-32 (Strong)", "22-27 (Competitive)"],
  IELTS: ["Band 8-9 (Expert)", "Band 7 (Good)", "Band 6 (Competent)"],
};

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedExams, setSelectedExams] = useState([]);
  const [targetGrade, setTargetGrade] = useState(null);

  const toggleExam = (exam) => {
    setSelectedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  const primaryExam = selectedExams[0];
  const gradeOptions = primaryExam ? TARGET_GRADES[primaryExam] || [] : [];

  const canContinue = step === 0 ? true : step === 1 ? selectedExams.length > 0 : step === 2 ? !!targetGrade : true;

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onComplete({ name: name.trim() || "Student", exams: selectedExams, targetGrade });
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.logo}>Ace<span style={S.logoAccent}>Board</span></div>
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? "#3B82F6" : "#1E2A4A" }} />
          ))}
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {step === 0 && (
          <>
            <div>
              <p style={S.label}>Step 1 of 3</p>
              <h1 style={{ ...S.h1, marginTop: 8 }}>What's your name?</h1>
              <p style={{ ...S.body, marginTop: 6 }}>We'll use this to personalize your experience.</p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{ width: "100%", padding: "16px 18px", backgroundColor: "#0D1326", border: "1.5px solid #1E2A4A", borderRadius: 14, color: "#F0F2FF", fontSize: 16, outline: "none" }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <p style={S.label}>Step 2 of 3</p>
              <h1 style={{ ...S.h1, marginTop: 8 }}>Which exams are<br />you taking?</h1>
              <p style={{ ...S.body, marginTop: 6 }}>Select all that apply — you can change this later.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {EXAMS.map(exam => (
                <button
                  key={exam}
                  onClick={() => toggleExam(exam)}
                  style={{
                    ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 16,
                    border: `1.5px solid ${selectedExams.includes(exam) ? "#3B82F6" : "#1E2A4A"}`,
                    backgroundColor: selectedExams.includes(exam) ? "#1E3A5F" : "#111827",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ExamLogo exam={exam} size={30} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>{exam}</span>
                    </div>
                    {selectedExams.includes(exam) && <Icon name="check" size={16} color="#3B82F6" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p style={S.label}>Step 3 of 3</p>
              <h1 style={{ ...S.h1, marginTop: 8 }}>What's your<br />target grade?</h1>
              <p style={{ ...S.body, marginTop: 6 }}>Based on {primaryExam}'s grading system.</p>
            </div>
            <div style={S.gap(10)}>
              {gradeOptions.map(grade => (
                <button
                  key={grade}
                  onClick={() => setTargetGrade(grade)}
                  style={{
                    ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 16,
                    border: `1.5px solid ${targetGrade === grade ? "#3B82F6" : "#1E2A4A"}`,
                    backgroundColor: targetGrade === grade ? "#1E3A5F" : "#111827",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#F0F2FF" }}>{grade}</span>
                    {targetGrade === grade && <Icon name="check" size={16} color="#3B82F6" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <button style={{ ...S.btnPrimary, opacity: canContinue ? 1 : 0.4 }} disabled={!canContinue} onClick={next}>
          {step === 2 ? "Start Practicing →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}


export default function AceBoard() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("home"); // home | config | quiz | results
  const [quizMode, setQuizMode] = useState(null);
  const [defaultExam, setDefaultExam] = useState(null);
  const [defaultSubject, setDefaultSubject] = useState(null);
  const [defaultTopic, setDefaultTopic] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [quizTimeInfo, setQuizTimeInfo] = useState(null);
  const [quizPool, setQuizPool] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 430);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);

  const shellMaxWidth = viewportWidth; // full edge-to-edge, no cap
  const shellStyle = { ...S.app, maxWidth: shellMaxWidth };

  // Splash timer
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // Listen for Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Try loading existing AceBoard profile from Firestore
        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data.profile || null);
            setBookmarks(data.bookmarks || []);
            setStats(data.stats || { total: 0, correct: 0 });
            setOnboarded(!!data.profile);
          } else {
            setOnboarded(false);
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      } else {
        setUser(null);
        setOnboarded(false);
        setProfile(null);
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Persist to Firestore whenever profile/bookmarks/stats change (once signed in)
  useEffect(() => {
    if (!user || !profile) return;
    const ref = doc(db, "users", user.uid);
    setDoc(ref, { profile, bookmarks, stats, email: user.email, name: user.displayName }, { merge: true }).catch(err => console.error("Save failed:", err));
  }, [user, profile, bookmarks, stats]);

  const handleSignedIn = (firebaseUser) => {
    setUser(firebaseUser);
  };

  const handleOnboardingComplete = (data) => {
    setProfile(data);
    setOnboarded(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleStart = (exam = null) => {
  alert("handleStart called with exam: " + exam);
  const chosenExam = exam || profile?.exams?.[0] || null;
  setDefaultExam(chosenExam);
  setDefaultSubject(null);
  setDefaultTopic(null);
  if (chosenExam === "SAT") {
    setScreen("selectSatTest");
  } else {
    setScreen("config");
  }
}
  const handleTestTopic = (exam, subject, topic) => {
    setDefaultExam(exam);
    setDefaultSubject(subject);
    setDefaultTopic(topic);
    setScreen("config");
  };

  const handleBegin = (config) => {
    setQuizConfig(config);
    setScreen("quiz");
  };

  const handleFinish = (answers, pool, timeInfo) => {
    setQuizAnswers(answers);
    setQuizPool(pool);
    setQuizTimeInfo(timeInfo || null);
    const correct = answers.filter(a => a.correct).length;
    setStats(prev => ({ total: prev.total + answers.length, correct: prev.correct + correct }));
    setScreen("results");
  };

  const handleToggleBookmark = (id) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handleRetry = () => {
    setQuizAnswers(null);
    setScreen("quiz");
  };

  const handleHome = () => {
    setScreen("home");
    setTab("home");
    setQuizAnswers(null);
    setQuizConfig(null);
  };

  if (booting || !authChecked) return <SplashScreen />;
if (!user) return (
  <div style={shellStyle}>
    <SignInScreen onSignedIn={handleSignedIn} />
  </div>
);

if (!onboarded) return (
  <div style={shellStyle}>
    <OnboardingScreen onComplete={handleOnboardingComplete} />
  </div>
);
if (!onboarded) return (
    <div style={shellStyle}>
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    </div>
  );

  // If in quiz flow, render quiz screens ignoring tabs
  if (screen === "config") return (
    <div style={shellStyle}>
      <PracticeSetup profile={profile} defaultExam={defaultExam} defaultSubject={defaultSubject} defaultTopic={defaultTopic} onBegin={handleBegin} onBack={() => setScreen("home")} />
    </div>
  );

  if (screen === "quiz") return (
  <div style={shellStyle}>
    {quizConfig.exam === "SAT" ? (
      <SatTestRunner
        allQuestions={QUESTIONS}
        practiceTest={quizConfig.practiceTest}
        isPracticeTest={quizConfig.mode === "practice"}
        onFinish={(payload) => {
          const satPool = QUESTIONS.filter(
            q => q.exam === "SAT" && q.practiceTest === quizConfig.practiceTest
          );
          const { ans, pool, timeInfo } = bridgeSatFinish(payload, satPool);
          handleFinish(ans, pool, timeInfo);
        }}
        onExit={() => setScreen("home")}
      />
    ) : (
      <QuizScreen
        config={quizConfig}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmark}
        onFinish={handleFinish}
        onBack={() => setScreen("home")}
      />
    )}
  </div>
);



  if (screen === "results") return (
    <div style={shellStyle}>
      <ResultsScreen answers={quizAnswers} questions={quizPool} mode={quizConfig?.mode} timeInfo={quizTimeInfo} profile={profile} onRetry={handleRetry} onHome={handleHome} onReview={() => setScreen("review")} />
    </div>
  )

  if (screen === "review") return (
    <div style={shellStyle}>
      <ReviewScreen answers={quizAnswers} questions={quizPool} onBack={() => setScreen("results")} />
    </div>
  );

  if (screen === "search") return (
    <div style={shellStyle}>
      <QuestionSearchScreen onBack={() => setScreen("home")} />
    </div>
  );

  if (screen === "notes") return (
    <div style={shellStyle}>
      <NotesScreen onBack={() => setScreen("home")} onTestTopic={handleTestTopic} />
    </div>
  );

  const navItems = [
    { id: "home", label: "Home", icon: "home" },
    { id: "analytics", label: "Progress", icon: "chart" },
    { id: "coach", label: "AI Coach", icon: "sparkles" },
    { id: "colleges", label: "Colleges", icon: "school" },
    { id: "bookmarks", label: "Saved", icon: "bookmark" },
    { id: "about", label: "About", icon: "user" },
  ];

  return (
    <div style={shellStyle}>
      {tab === "home" && <HomeScreen onStart={handleStart} onSearch={() => setScreen("search")} onNotes={() => setScreen("notes")} bookmarks={bookmarks} stats={stats} profile={profile} />}
      {tab === "analytics" && <AnalyticsScreen stats={stats} profile={profile} />}
      {tab === "coach" && <AIHub onBack={() => setTab("home")} />}
      {tab === "colleges" && <CollegesScreen />}
      {tab === "bookmarks" && <BookmarksScreen bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} onStartBookmarkQuiz={() => handleStart("practice")} />}
      {tab === "about" && <AboutScreen user={user} onSignOut={handleSignOut} />}

      <nav style={{ ...S.nav, maxWidth: Math.min(shellMaxWidth, 600) }}>
        {navItems.map(({ id, label, icon }) => (
          <button key={id} style={S.navBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon name={icon} size={20} color={tab === id ? "#3B82F6" : "#4A5568"} />
            <span style={S.navLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
  if (screen === "selectSatTest") return (
  <div style={shellStyle}>
    <PracticeTestSelect
      allQuestions={QUESTIONS}
      onSelect={(practiceTestNumber) => {
        handleBegin({
          exam: "SAT",
          practiceTest: practiceTestNumber,
          mode: "practice",
        });
      }}
      onBack={() => setScreen("home")}
    />
  </div>
);

if (screen === "quiz") return (
  <div style={shellStyle}>
    {quizConfig.exam === "SAT" ? (
      <SatTestRunner
        allQuestions={QUESTIONS}
        practiceTest={quizConfig.practiceTest}
        isPracticeTest={quizConfig.mode === "practice"}
        onFinish={(payload) => {
          const satPool = QUESTIONS.filter(
            q => q.exam === "SAT" && q.practiceTest === quizConfig.practiceTest
          );
          const { ans, pool, timeInfo } = bridgeSatFinish(payload, satPool);
          handleFinish(ans, pool, timeInfo);
        }}
        onExit={() => setScreen("home")}
      />
    ) : (
      <QuizScreen
        config={quizConfig}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmark}
        onFinish={handleFinish}
        onBack={() => setScreen("home")}
      />
    )}
  </div>
);
}
// bridge — already confirmed shape
function bridgeSatFinish({ results, answers }, satPool) {
  const ans = [];
  Object.values(answers).forEach(moduleAnswers => {
    Object.entries(moduleAnswers).forEach(([qid, selected]) => {
      const q = satPool.find(q => String(q.id) === String(qid));
      if (!q) return;
      ans.push({ qid: q.id, selected, correct: selected === q.answer });
    });
  });
  const totalSeconds = results.reduce((sum, r) => sum + (r.timeSpentSeconds || 0), 0);
  return { ans, pool: satPool, timeInfo: { timeLog: null, timeLeft: null, totalSeconds } };
}
