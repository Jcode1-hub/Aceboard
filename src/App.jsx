import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
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
  // SAT
  { id: 13, exam: "SAT", year: 2023, subject: "Mathematics", topic: "Linear Equations", difficulty: "Medium",
    question: "If 3x + 7 = 22, what is the value of 6x - 4?",
    options: ["26", "30", "34", "38"],
    answer: 0, explanation: "3x + 7 = 22 → 3x = 15 → x = 5. So 6x - 4 = 6(5) - 4 = 30 - 4 = 26.", source: "SAT Math 2023, Section 3 Q8" },
  { id: 14, exam: "SAT", year: 2022, subject: "Evidence-Based Reading", topic: "Inference", difficulty: "Hard",
    question: "In the context of the passage, the author's tone can best be described as:",
    options: ["Dismissive and condescending", "Analytical and measured", "Enthusiastic and promotional", "Sorrowful and regretful"],
    answer: 1, explanation: "SAT reading passages about scientific or social topics typically feature measured, analytical prose. Look for evidence in word choice and sentence structure.", source: "SAT Reading 2022, Passage 2 Q14" },
  { id: 15, exam: "SAT", year: 2023, subject: "Mathematics", topic: "Quadratics", difficulty: "Hard",
    question: "Which of the following is equivalent to (x² - 9)/(x - 3) for x ≠ 3?",
    options: ["x - 3", "x + 3", "x² + 3", "x(x-3)"],
    answer: 1, explanation: "x² - 9 = (x+3)(x-3). Dividing by (x-3) gives (x+3) for x ≠ 3.", source: "SAT Math 2023, Section 4 Q19" },
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
function HomeScreen({ onStart, onSearch, bookmarks, stats, profile }) {
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

function PracticeSetup({ profile, defaultExam, onBegin, onBack }) {
  const myExams = profile?.exams?.length ? profile.exams : EXAMS;
  const [exam, setExam] = useState(defaultExam || myExams[0] || "WAEC");
  const [subjects, setSubjects] = useState([]); // empty = all subjects
  const [topic, setTopic] = useState("All Topics");
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
function StatRing({ pct, label, color = "#3B82F6", size = 84 }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * Math.max(0, Math.min(1, pct / 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
  const maxSeconds = Math.max(...timeLog.map(t => t.seconds), 10);
  const maxQ = Math.max(...timeLog.map(t => t.qNum), 1);
  const w = 300, h = 140, padL = 30, padB = 20, padT = 10, padR = 10;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const xScale = (q) => padL + (plotW * (q - 1)) / Math.max(maxQ - 1, 1);
  const yScale = (s) => padT + plotH - (plotH * s) / maxSeconds;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#1E2A4A" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#1E2A4A" />
        {subjects.map((subj, si) => {
          const pts = timeLog.filter(t => t.subject === subj);
          const path = pts.map((t, i) => `${i === 0 ? "M" : "L"} ${xScale(t.qNum)} ${yScale(t.seconds)}`).join(" ");
          return <path key={subj} d={path} fill="none" stroke={palette[si % palette.length]} strokeWidth="1.5" />;
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
function ResultsScreen({ answers, questions, mode, timeInfo, onRetry, onHome, onReview }) {
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
              <StatRing pct={pct} label="Score" color={pct >= 70 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444"} />
              {timeUsedPct !== null && <StatRing pct={timeUsedPct} label="Time Used" color={timeUsedPct >= 90 ? "#EF4444" : "#3B82F6"} />}
              {speedPct !== null && <StatRing pct={speedPct} label="Speed" color="#8B5CF6" />}
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
    setDefaultExam(exam || profile?.exams?.[0] || null);
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

  // If in quiz flow, render quiz screens ignoring tabs
  if (screen === "config") return (
    <div style={shellStyle}>
      <PracticeSetup profile={profile} defaultExam={defaultExam} onBegin={handleBegin} onBack={() => setScreen("home")} />
    </div>
  );

  if (screen === "quiz") return (
    <div style={shellStyle}>
      <QuizScreen config={quizConfig} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} onFinish={handleFinish} onBack={() => setScreen("config")} />
    </div>
  );

  if (screen === "results") return (
    <div style={shellStyle}>
      <ResultsScreen answers={quizAnswers} questions={quizPool} mode={quizConfig?.mode} timeInfo={quizTimeInfo} onRetry={handleRetry} onHome={handleHome} onReview={() => setScreen("review")} />
    </div>
  );

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
      {tab === "home" && <HomeScreen onStart={handleStart} onSearch={() => setScreen("search")} bookmarks={bookmarks} stats={stats} profile={profile} />}
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
}
