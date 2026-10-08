import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { SatTestRunner, PracticeTestSelect } from './BluebookQuizScreen';
import { QUESTIONS, getQuestionType, getQuestionText, normalizeQuestionSearchText, buildQuestionSearchText, QUESTION_SEARCH_TEXT_BY_ID } from './content';
import StudentWorkspace from './platform/StudentWorkspace.jsx';
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
const functionsClient = getFunctions(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const callChallengeFunction = async (name, data) => (await httpsCallable(functionsClient, name)(data)).data;


// ── DATA ──────────────────────────────────────────────────────────────────────
const EXAMS = ["WAEC", "NECO", "JAMB", "GCE", "IGCSE", "SAT", "ACT", "IELTS"];
const NG_EXAMS = ["WAEC", "NECO", "JAMB", "GCE"];
const INTL_EXAMS = ["SAT", "ACT", "IELTS", "IGCSE"];



const SUBJECTS = ["All Subjects", ...new Set(QUESTIONS.map(q => q.subject))];

// ── COLLEGES DATA ─────────────────────────────────────────────────────────────
const COLLEGES = [
  // Ivy League / US
  {
    id: "harvard", name: "Harvard University", country: "USA", region: "Ivy League", acceptanceRate: "3.4%", competitiveness: "Extreme",
    requirements: ["SAT 1480-1580 or ACT 33-35", "Top 1% of class rank", "3-4 AP/IB courses minimum", "Strong essays + extracurricular leadership", "2 teacher recommendations"],
    notes: "No minimum GPA but near-perfect academics expected. Holistic review — essays and impact matter as much as scores.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Harvard_University_coat_of_arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_Medical_School_HDR.jpg/1280px-Harvard_Medical_School_HDR.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/11/Sanders_theater_2009y.JPG", "https://upload.wikimedia.org/wikipedia/commons/5/51/Massachusetts_Hall%2C_Harvard_University.JPG", "https://upload.wikimedia.org/wikipedia/commons/8/89/Harvard_Medical_School_%2854954429258%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_Medical_School_HDR.jpg/1280px-Harvard_Medical_School_HDR.jpg",
    virtualTour: "https://www.commonapp.org/explore/harvard-university"
  },
  {
    id: "yale", name: "Yale University", country: "USA", region: "Ivy League", acceptanceRate: "4.5%", competitiveness: "Extreme",
    requirements: ["SAT 1460-1580 or ACT 33-35", "Rigorous course load (AP/IB)", "Compelling personal essays", "Demonstrated leadership", "2-3 recommendation letters"],
    notes: "Known for valuing intellectual curiosity. Supplemental essays carry significant weight.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/Yale_University_Shield_1.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/f0/Old_campus.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/fb/Yale_Law_School_in_the_Sterling_Law_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6a/Hopper_College_Courtyard.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Old_campus.jpg",
    virtualTour: "https://www.commonapp.org/explore/yale-university"
  },
  {
    id: "princeton", name: "Princeton University", country: "USA", region: "Ivy League", acceptanceRate: "4.0%", competitiveness: "Extreme",
    requirements: ["SAT 1470-1570 or ACT 33-35", "Top of class rank", "4 years math/science recommended", "Strong quantitative + writing skills", "Interview (for some applicants)"],
    notes: "Strong in STEM and public policy. No-loan financial aid for international students who qualify.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Princeton_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/07/Cannon_Green_and_Nassau_Hall%2C_Princeton_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/61/Princeton_University_Art_Museum_%2855144836589%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/McCosh_50_Renovated.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/07/Cannon_Green_and_Nassau_Hall%2C_Princeton_University.jpg",
    virtualTour: "https://www.commonapp.org/explore/princeton-university"
  },
  {
    id: "columbia", name: "Columbia University", country: "USA", region: "Ivy League", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong Core Curriculum fit", "Compelling essays on intellectual interests", "2 teacher recommendations", "Demonstrated leadership"],
    notes: "Located in New York City. Core Curriculum is mandatory — show genuine love for interdisciplinary learning.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Coat_of_Arms_of_Columbia_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/44/Columbia_College_Walk.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/85/Almamater.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/2c/Detroit_Photographic_Company_%280671%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/44/Columbia_College_Walk.jpg",
    virtualTour: "https://www.commonapp.org/explore/columbia-university"
  },
  {
    id: "penn", name: "University of Pennsylvania", country: "USA", region: "Ivy League", acceptanceRate: "5.4%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong Wharton/SEAS/College fit essays", "Demonstrated leadership and impact", "2 teacher recommendations", "Interview optional"],
    notes: "Home of the Wharton School — best Ivy for business + STEM combo. Strong pre-med program. ED heavily favored.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/92/UPenn_shield_with_banner.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/6/69/Penn_campus_2.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/146%2C_Memorial_Tower_and_Statue%2C_University_of_Pennsylvania_%28NBY_6566%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/6/69/Penn_campus_2.jpg",
    virtualTour: "https://www.commonapp.org/explore/university-of-pennsylvania"
  },
  {
    id: "brown", name: "Brown University", country: "USA", region: "Ivy League", acceptanceRate: "5.6%", competitiveness: "Extreme",
    requirements: ["SAT 1490-1570 or ACT 34-35", "Open Curriculum — show self-direction", "Creative and compelling essays", "Demonstrated intellectual curiosity", "2 teacher recommendations"],
    notes: "Unique Open Curriculum — no core requirements. Students design their own academic path. Essays must show genuine intellectual passion.",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/50/Shield_of_Brown_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/2f/Brown%27s_University_Hall_in_2007.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ac/John_Hay_Library_%28Brown%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/8d/Das_östliche_Eingangstor_der_Brown_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/Manning_Hall%2C_Brown_University%2C_Providence%2C_Rhode_Island_-_20091108_straighten.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Brown%27s_University_Hall_in_2007.jpg",
    virtualTour: "https://www.commonapp.org/explore/brown-university"
  },
  {
    id: "dartmouth", name: "Dartmouth College", country: "USA", region: "Ivy League", acceptanceRate: "6.0%", competitiveness: "Extreme",
    requirements: ["SAT 1480-1570 or ACT 33-35", "Strong demonstrated interest", "Compelling personal narrative", "3 recommendation letters", "Interview recommended"],
    notes: "Smallest Ivy — tight-knit community feel. Strong liberal arts + Tuck School of Business (MBA). D-Plan term system unique to Dartmouth.",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e4/Dartmouth_College_shield.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ec/Dartmouth_College_campus_2007-10-20_09.JPG", "https://upload.wikimedia.org/wikipedia/commons/0/0b/Dartmouth_Hall%2C_Dartmouth_College_-_general_view.JPG", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Dartmouth_College_campus_2007-11-06_Baker_Memorial_Library_08_-_Tower_Room.JPG", "https://upload.wikimedia.org/wikipedia/commons/f/ff/Dartmouth_College_campus_2007-06-23_Tuck_School_of_Business.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Dartmouth_College_campus_2007-10-20_09.JPG",
    virtualTour: "https://www.commonapp.org/explore/dartmouth-college"
  },
  {
    id: "cornell", name: "Cornell University", country: "USA", region: "Ivy League", acceptanceRate: "8.4%", competitiveness: "Very High",
    requirements: ["SAT 1450-1570 or ACT 33-35", "College-specific requirements vary", "Strong essays tailored to chosen college", "2 teacher recommendations", "Supplement specific to each school"],
    notes: "Most accessible Ivy by acceptance rate. Apply to a specific college (Engineering, Arts & Sciences, etc.) — each has different requirements.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/47/Cornell_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/08/Willard_Straight_Hall%2C_Cornell_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/Cornell_University_arts_quad.JPG", "https://upload.wikimedia.org/wikipedia/commons/3/34/Cornell_University%2C_Ho_Plaza_and_Sage_Hall.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/52/Cornell_West_Campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Willard_Straight_Hall%2C_Cornell_University.jpg",
    virtualTour: "https://www.commonapp.org/explore/cornell-university"
  },
  {
    id: "mit", name: "MIT", country: "USA", region: "Top US (STEM)", acceptanceRate: "4.6%", competitiveness: "Extreme",
    requirements: ["SAT Math 780+ recommended", "Calculus + Physics coursework", "Strong problem-solving essays", "Portfolio/projects recommended", "2 recommendation letters"],
    notes: "Best fit for CS/Engineering-focused students. Values demonstrated technical projects (GitHub, builds, competitions).",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/1920px-MIT_Seal.svg.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/88/Massachusetts_Institute_of_Technology_%28MIT%29_%2854960815718%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ea/Ray_and_Maria_Stata_Center_%28MIT%29.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/88/Massachusetts_Institute_of_Technology_%28MIT%29_%2854960815718%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/massachusetts-institute-of-technology"
  },
  {
    id: "stanford", name: "Stanford University", country: "USA", region: "Top US (STEM)", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong STEM + entrepreneurship signals", "Unique personal narrative", "Significant extracurricular impact", "2 recommendation letters"],
    notes: "Silicon Valley adjacent — rewards founders, builders, and self-starters heavily.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Leland_Stanford_Junior_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/b/b6/Stanford_University_Arches_with_Memorial_Church_in_the_background.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5c/Statue_of_Stanford_Family.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/24/View_Stanford.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Stanford_University_Arches_with_Memorial_Church_in_the_background.jpg",
    virtualTour: "https://www.commonapp.org/explore/stanford-university"
  },
  {
    id: "caltech", name: "California Institute of Technology", country: "USA", region: "Top US (STEM)", acceptanceRate: "3.9%", competitiveness: "Extreme",
    requirements: ["SAT Math 800 near-required", "Physics + Calculus + Chemistry mastery", "Research experience strongly preferred", "3 recommendation letters", "Honor code commitment"],
    notes: "Smallest elite STEM school (~2,300 students). Every student does original research. Intense — not for the faint-hearted. Best for pure scientists.",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/Seal_of_the_California_Institute_of_Technology.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/cc/Caltech_Entrance.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/9c/Robert_A._Millikan_Memorial_Library_at_Caltech.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/75/Broad_center.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/27/Beckman_auditorium%2C_Caltech.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Caltech_Entrance.jpg",
    virtualTour: "https://www.commonapp.org/explore/california-institute-of-technology"
  },
  {
    id: "johns_hopkins", name: "Johns Hopkins University", country: "USA", region: "Top US (STEM)", acceptanceRate: "7.0%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong research experience", "Medical/science passion evident", "2 teacher recommendations", "Strong supplement essays"],
    notes: "#1 research university in the US. Pre-med pipeline is unmatched. Also excellent for international studies and engineering.",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/09/Johns_Hopkins_University%27s_Academic_Seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/3/3f/View_from_Levering_Plaza.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c1/George-peabody-library.jpg", "https://upload.wikimedia.org/wikipedia/en/d/d4/Hopkins_hospital.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3f/View_from_Levering_Plaza.jpg",
    virtualTour: "https://www.commonapp.org/explore/johns-hopkins-university"
  },
  // UK
  {
    id: "oxford", name: "University of Oxford", country: "UK", region: "UK (Oxbridge)", acceptanceRate: "~13%", competitiveness: "Very High",
    requirements: ["A-Levels: A*AA typical (varies by course)", "IGCSE/GCSE 9-7 in relevant subjects", "Subject-specific entrance test (e.g. TSA, MAT)", "Personal statement", "Interview (shortlisted candidates)"],
    notes: "Course-specific colleges system. Strong personal statement tailored to your subject is critical.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Coat_of_arms_of_the_University_of_Oxford.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/45/Mob_Quad_from_Chapel_Tower.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/46/Lady_Margaret_Hall_%286148510434%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/St._Hugh%27s.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/45/Mob_Quad_from_Chapel_Tower.jpg",
    virtualTour: "https://www.ox.ac.uk"
  },
  {
    id: "cambridge", name: "University of Cambridge", country: "UK", region: "UK (Oxbridge)", acceptanceRate: "~21%", competitiveness: "Very High",
    requirements: ["A-Levels: A*A*A typical (varies by course)", "Strong IGCSE results (mostly 8-9/A*)", "Subject-specific entrance assessment", "Personal statement", "Interview"],
    notes: "Highly subject-focused. STEM applicants benefit from olympiad or research experience.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/9/9c/Peterhouse_Chapel.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bd/Emmanuel_College_Front_Court%2C_Cambridge%2C_UK_-_Diliff.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ab/Queens%27_College_-_Mathematical_Bridge.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3c/Library_in_winter%2C_Faculty_of_Education%2C_University_of_Cambridge.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Peterhouse_Chapel.jpg",
    virtualTour: "https://www.cam.ac.uk"
  },
  {
    id: "imperial", name: "Imperial College London", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~14%", competitiveness: "High",
    requirements: ["A-Levels: A*A*A typical for Engineering/CS", "Strong Maths + Physics grades", "Personal statement focused on subject passion", "Some courses require entrance test"],
    notes: "Excellent for Engineering, CS, and Medicine. Less emphasis on extracurriculars vs US schools.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Shield_of_Imperial_College_London.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/a/a6/City_and_Guilds_Building_front_side%2C_Exhibiton_Road_on_a_spring_afternoon.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/68/Royal_School_of_Mines_Imperial_College_London_2020_02.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c2/Imperial_College_Business_School.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/City_and_Guilds_Building_front_side%2C_Exhibiton_Road_on_a_spring_afternoon.jpg",
    virtualTour: "https://www.imperial.ac.uk"
  },
  // Nigeria Federal
  {
    id: "unilag", name: "University of Lagos (UNILAG)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses (Medicine 280+)", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam", "O'level results uploaded on JAMB CAPS"],
    notes: "Medicine, Law, and Engineering are the most competitive. Post-UTME cutoff varies yearly by department. #1 ranked university in Nigeria (THE 2026).",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/University_of_Lagos_Main_Gate.jpg/800px-University_of_Lagos_Main_Gate.jpg",
    virtualTour: "https://unilag.edu.ng"
  },
  {
    id: "oau", name: "Obafemi Awolowo University (OAU)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Strong O'level grades (A1-B3 preferred)"],
    notes: "Known for strong Pharmacy, Medicine, and Engineering programs. Very competitive cutoffs each year. Beautiful Ile-Ife campus.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Obafemi_Awolowo_University_main_gate.jpg/800px-Obafemi_Awolowo_University_main_gate.jpg",
    virtualTour: "https://oauife.edu.ng"
  },
  {
    id: "ui", name: "University of Ibadan (UI)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 200+ for competitive courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam", "Premier university — high competition across all courses"],
    notes: "Nigeria's first university (est. 1948). Strong reputation across Medicine, Law, and Arts. Oldest and most storied campus in Nigeria.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/University_of_Ibadan_-_Main_Building.jpg/800px-University_of_Ibadan_-_Main_Building.jpg",
    virtualTour: "https://www.ui.edu.ng"
  },
  {
    id: "abu", name: "Ahmadu Bello University (ABU)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Strong science grades for Engineering/Medicine"],
    notes: "Largest university in Nigeria by landmass. Excellent Engineering, Agriculture, and Medicine programs.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ahmadu_Bello_University%2C_Zaria.jpg/800px-Ahmadu_Bello_University%2C_Zaria.jpg",
    virtualTour: "https://www.abu.edu.ng"
  },
  {
    id: "unn", name: "University of Nigeria, Nsukka (UNN)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Medicine and Law are most competitive"],
    notes: "First indigenous university in Nigeria (est. 1960). Strong Medicine, Law, and Engineering faculties. Historic Enugu State campus.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/University_of_Nigeria_Nsukka_gate.jpg/800px-University_of_Nigeria_Nsukka_gate.jpg",
    virtualTour: "https://www.unn.edu.ng"
  },
  {
    id: "uniben", name: "University of Benin (UNIBEN)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening", "Medicine cutoff typically 280+"],
    notes: "Strong Medicine, Law, and Engineering. One of the largest campuses in Nigeria. High demand for Medicine annually.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/University_of_Benin_main_gate.jpg/800px-University_of_Benin_main_gate.jpg",
    virtualTour: "https://www.uniben.edu.ng"
  },
  {
    id: "lasu", name: "Lagos State University (LASU)", country: "Nigeria", region: "Nigeria (State)", acceptanceRate: "Moderate (Post-UTME based)", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "LASU Post-UTME screening", "Lagos State residency may give advantage"],
    notes: "Major state university in Lagos. Good Law, Social Sciences, and Education programs. More affordable than federal universities for Lagos residents.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lagos_State_University_Ojo_campus.jpg/800px-Lagos_State_University_Ojo_campus.jpg",
    virtualTour: "https://www.lasu.edu.ng"
  },
  // Nigeria Private
  {
    id: "covenant", name: "Covenant University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 180+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University-specific screening/interview", "Strong moral/character reference often required"],
    notes: "Top-ranked private university in Nigeria. Business, Engineering, and strong career placement. #3 ranked in Nigeria (THE 2026).",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Covenant_University_Main_Gate.jpg/800px-Covenant_University_Main_Gate.jpg",
    virtualTour: "https://covenantuniversity.edu.ng"
  },
  {
    id: "babcock", name: "Babcock University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam", "Medical certificate required"],
    notes: "Seventh-day Adventist institution. Strong Medicine, Law, and Management programs. Disciplined campus environment in Ogun State.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Babcock_University_Nigeria.jpg/800px-Babcock_University_Nigeria.jpg",
    virtualTour: "https://www.babcock.edu.ng"
  },
  {
    id: "pau", name: "Pan-Atlantic University (PAU)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University-specific entrance exam", "Interview for some programs"],
    notes: "Linked to the prestigious Lagos Business School. Strong entrepreneurship, management, and business programs.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Pan_Atlantic_University_Lagos.jpg/800px-Pan_Atlantic_University_Lagos.jpg",
    virtualTour: "https://pau.edu.ng"
  },
  {
    id: "aun", name: "American University of Nigeria (AUN)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["SAT recommended (optional)", "WAEC/NECO: minimum 5 credits incl. English & Maths", "AUN application + essays", "Interview required"],
    notes: "US-style liberal arts education in Yola. Fully English, American curriculum. Strong CS, Business, and Law. American degree recognition.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/American_University_of_Nigeria_campus.jpg/800px-American_University_of_Nigeria_campus.jpg",
    virtualTour: "https://www.aun.edu.ng"
  },
  // More US
  {
    id: "duke", name: "Duke University", country: "USA", region: "Top US (STEM)", acceptanceRate: "6.0%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong essays + leadership", "2 teacher recommendations", "Demonstrated interest in research"],
    notes: "Strong Medicine, Engineering, and Business. Beautiful Gothic campus in Durham, NC. Elite basketball culture too.",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Duke_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/81/Duke_Chapel%2C_West_Campus%2C_Duke_University%2C_Durham%2C_NC_%2848960356548%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e5/PerkinsLibrary.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/MedicalCenter.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/81/Duke_Chapel%2C_West_Campus%2C_Duke_University%2C_Durham%2C_NC_%2848960356548%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/duke-university"
  },
  {
    id: "georgetown", name: "Georgetown University", country: "USA", region: "Top US (STEM)", acceptanceRate: "12.0%", competitiveness: "Very High",
    requirements: ["SAT 1430-1550 or ACT 32-35", "Strong essays on intellectual interests", "2-3 recommendation letters", "Interview encouraged"],
    notes: "Best for International Relations and Foreign Service. Jesuit values. Washington DC location is a huge advantage for politics/policy students.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Georgetown_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/5c/Georgetown_University_%2853821005319%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a5/Georgetown_Jesuit_Residence.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/f9/Georgetown_University_School_of_Medicine_%26_School_of_Dentistry_%2853820913143%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Georgetown_University_%2853821005319%29.jpg",
    virtualTour: "https://www.commonapp.org/explore/georgetown-university"
  },
  {
    id: "notre_dame", name: "University of Notre Dame", country: "USA", region: "Top US (STEM)", acceptanceRate: "12.9%", competitiveness: "Very High",
    requirements: ["SAT 1430-1550 or ACT 33-35", "Strong character/values fit", "2 recommendation letters", "Demonstrated interest"],
    notes: "Catholic university known for tight community, strong Business and Engineering, and legendary football culture.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e2/University_of_Notre_Dame_seal_%282%29.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/c9/Main_Building_at_the_University_of_Notre_Dame.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/ca/Notre_Dame_campus_view.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Main_Building_at_the_University_of_Notre_Dame.jpg",
    virtualTour: "https://www.commonapp.org/explore/university-of-notre-dame"
  },
  {
    id: "vanderbilt", name: "Vanderbilt University", country: "USA", region: "Top US (STEM)", acceptanceRate: "5.1%", competitiveness: "Very High",
    requirements: ["SAT 1500-1570 or ACT 34-35", "Strong essays", "2 teacher recommendations", "Demonstrated interest"],
    notes: "Excellent Engineering, Business, and Peabody (Education). Strong financial aid. Nashville location, vibrant campus life.",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/29/Vanderbilt_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/da/E._Bronson_Ingram_College.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/ca/The_Wond%27ry.png", "https://upload.wikimedia.org/wikipedia/commons/3/3f/Bicentennial_Oak.png"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/da/E._Bronson_Ingram_College.jpg",
    virtualTour: "https://www.commonapp.org/explore/vanderbilt-university"
  },
  {
    id: "cmu", name: "Carnegie Mellon University", country: "USA", region: "Top US (STEM)", acceptanceRate: "11.3%", competitiveness: "Very High",
    requirements: ["SAT Math 780+ recommended for CS/Engineering", "Strong portfolio for arts/design programs", "2 recommendation letters", "School-specific supplement essays"],
    notes: "World-renowned Computer Science program (one of the best globally). Highly competitive CS admit rate is much lower than overall rate.",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/bb/Carnegie_Mellon_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/21/Carnegie_Mellon_University_as_seen_from_the_Cathedral_of_Learning.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/Carnegie_Mellon_Hamerschlag_Hall_and_Scott_Hall.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/9a/Cmu-africa-aerial-2021.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/21/Carnegie_Mellon_University_as_seen_from_the_Cathedral_of_Learning.jpg",
    virtualTour: "https://www.commonapp.org/explore/carnegie-mellon-university"
  },
  {
    id: "ucla", name: "UCLA", country: "USA", region: "Top US (STEM)", acceptanceRate: "8.6%", competitiveness: "Very High",
    requirements: ["UC application (not Common App)", "Strong GPA + course rigor", "4 Personal Insight Questions essays", "No letters of recommendation needed"],
    notes: "Top public university. Excellent Film, Business, Engineering, and Medicine. Uses the UC application system, not Common App.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0d/The_University_of_California_UCLA.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/a/ad/Royce_Hall_post_rain.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/67/Legally_Blonde_filming_location_at_Kerckhoff_Hall_at_UCLA.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1b/Ronald_Reagan_UCLA_Medical_Center_June_2012_001.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Royce_Hall_post_rain.jpg",
    virtualTour: "https://www.ucla.edu"
  },
  {
    id: "berkeley", name: "UC Berkeley", country: "USA", region: "Top US (STEM)", acceptanceRate: "11.6%", competitiveness: "Very High",
    requirements: ["UC application (not Common App)", "Strong GPA + course rigor", "4 Personal Insight Questions essays", "No letters of recommendation needed"],
    notes: "#1 public university globally by many rankings. World-class Engineering and CS (EECS). Highly competitive for international students.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Seal_of_University_of_California%2C_Berkeley.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/24/Berkeley_glade_afternoon.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1c/Wheeler_Hall%2C_University_of_California%2C_Berkeley.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/85/UCB_Doe_Memorial_Library_oblique_view_dllu.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/2/24/Berkeley_glade_afternoon.jpg",
    virtualTour: "https://www.berkeley.edu"
  },
  {
    id: "nyu", name: "New York University", country: "USA", region: "Top US (STEM)", acceptanceRate: "8.0%", competitiveness: "High",
    requirements: ["SAT 1450-1560 or ACT 33-35", "Strong essays + creative portfolio (for Tisch)", "2 recommendation letters", "Demonstrated interest"],
    notes: "No traditional campus — fully integrated into NYC. Global campuses in Abu Dhabi and Shanghai. Strong Business (Stern), Film (Tisch), and CS.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/New_York_University_Seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1d/NYC_-_Washington_Square_Park_-_Arch.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5f/Courant_Institute_of_Mathematical_Sciences_%2848072654781%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/NYUAbuDhabiSaadiyat.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/NYC_-_Washington_Square_Park_-_Arch.jpg",
    virtualTour: "https://www.commonapp.org/explore/new-york-university"
  },
  {
    id: "bu", name: "Boston University", country: "USA", region: "Top US (STEM)", acceptanceRate: "10.8%", competitiveness: "High",
    requirements: ["SAT 1420-1530 or ACT 31-34", "Strong essays", "2 recommendation letters", "Demonstrated interest"],
    notes: "Strong Communications, Business, and Medicine. Urban campus integrated into Boston. Good balance of selectivity and accessibility.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Boston_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/52/Marsh_Chapel.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/80/Aerial_Boston_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/e6/Boston_at_sunset.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/52/Marsh_Chapel.jpg",
    virtualTour: "https://www.commonapp.org/explore/boston-university"
  },
  // More UK
  {
    id: "ucl", name: "University College London (UCL)", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["A-Levels: A*AA to AAA depending on course", "Strong personal statement", "Some courses require entrance test", "IGCSE 6-9 in relevant subjects"],
    notes: "London's largest university by research output. Excellent for Architecture, Medicine, Engineering, and Law. Diverse, global student body.",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/UCL_Logo%2C_plain_background.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/03/Wilkins_Building_1%2C_UCL%2C_London_-_Diliff.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/dc/The_UCL_School_of_Slavonic_and_East_European_Studies.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rockefeller_Building%2C_UCL.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/03/Wilkins_Building_1%2C_UCL%2C_London_-_Diliff.jpg",
    virtualTour: "https://www.ucl.ac.uk"
  },
  {
    id: "edinburgh", name: "University of Edinburgh", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "IGCSE 6-9 in relevant subjects"],
    notes: "One of Scotland's most prestigious universities. Strong Medicine, Informatics, and Law. Beautiful historic campus.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/University_of_Edinburgh_ceremonial_roundel.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Temple_of_Fame%2C_McEwan_Hall%2C_Edinburgh%2C_4.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3c/Informatics_Forum_Atrium_turned.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1d/Main_Library%2C_George_Square.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Temple_of_Fame%2C_McEwan_Hall%2C_Edinburgh%2C_4.jpg",
    virtualTour: "https://www.ed.ac.uk"
  },
  {
    id: "manchester", name: "University of Manchester", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~56%", competitiveness: "Moderate-High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "IGCSE 6-9 in relevant subjects"],
    notes: "Largest single-site university in the UK. Strong Engineering, Business, and Sciences. Excellent value with strong research output.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Shield_of_the_University_of_Manchester.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/4/42/Old_Quadrangle%2C_Manchester_1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/43/The_University_of_Manchester_%28with_snow%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Old_Quadrangle%2C_Manchester_1.jpg",
    virtualTour: "https://www.manchester.ac.uk"
  },
  {
    id: "kcl", name: "King's College London", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~25%", competitiveness: "High",
    requirements: ["A-Levels: AAA-ABB depending on course", "Strong personal statement", "Some courses require entrance test"],
    notes: "Central London location. Excellent Medicine, Law, and War Studies. Part of the 'Golden Triangle' of UK universities.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/King%27s_College%2C_London_full_achievement.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/7/70/Strand102.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ea/Maughan_Chancery_Lane.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/21/The_Maughan_Library%2C_King%27s_College%2C_London.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/7/70/Strand102.jpg",
    virtualTour: "https://www.kcl.ac.uk"
  },
  {
    id: "lse", name: "London School of Economics (LSE)", country: "UK", region: "UK (Top STEM)", acceptanceRate: "~9%", competitiveness: "Very High",
    requirements: ["A-Levels: A*AA typical", "Strong personal statement focused on Economics/Social Science", "IGCSE 7-9 in relevant subjects"],
    notes: "World's leading social science university. Best for Economics, Politics, and Finance. Highly competitive, very academic focus.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/42/London_School_of_Economics_Coat_of_Arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/7/79/Centre_Building%2C_LSE_from_LSE_Square.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/The_World_Turned_Upside_Down_%28sculpture_by_Mark_Wallinger%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b2/NABuilding.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/7/79/Centre_Building%2C_LSE_from_LSE_Square.jpg",
    virtualTour: "https://www.lse.ac.uk"
  },
  // Canada
  {
    id: "toronto", name: "University of Toronto", country: "Canada", region: "Canada", acceptanceRate: "~40%", competitiveness: "High",
    requirements: ["High school average 85%+ for competitive programs", "Strong supplementary essays for some programs", "WAEC/IGCSE accepted"],
    notes: "Canada's top-ranked university. Excellent Medicine, Engineering, and CS. Largest, most diverse campus in Canada.",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/04/Utoronto_coa.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/d8/UofTConvocationHall.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6f/Simcoe_Hall_%28University_of_Toronto%29_%281%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d8/UofTConvocationHall.jpg",
    virtualTour: "https://www.utoronto.ca"
  },
  {
    id: "mcgill", name: "McGill University", country: "Canada", region: "Canada", acceptanceRate: "~46%", competitiveness: "High",
    requirements: ["High school average 85%+ for competitive programs", "WAEC/IGCSE accepted", "Personal statement for some programs"],
    notes: "Canada's most internationally recognized university. Strong Medicine, Law, and Engineering. Beautiful Montreal campus.",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/29/McGill_University_CoA.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/df/Arts_Building%2C_McGill_University%2C_Aug_31_2022.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bf/Redpath_Museum_and_Lower_Field%2C_McGill_University%2C_July_18%2C_2024.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/26/Montreal_-_McGill_Physics.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/df/Arts_Building%2C_McGill_University%2C_Aug_31_2022.jpg",
    virtualTour: "https://www.mcgill.ca"
  },
  {
    id: "ubc", name: "University of British Columbia (UBC)", country: "Canada", region: "Canada", acceptanceRate: "~50%", competitiveness: "Moderate-High",
    requirements: ["High school average 80%+ for competitive programs", "Personal Profile essay required", "WAEC/IGCSE accepted"],
    notes: "Stunning Vancouver campus. Strong Sciences, Business (Sauder), and Forestry. Great quality of life and strong co-op programs.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4e/British_columbia_univ_coat_arms.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/b/ba/Raven-and-the-first-men.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/88/UBC_from_the_Air_8788.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/86/Irving_K._Barber_Library.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/88/UBC_from_the_Air_8788.jpg",
    virtualTour: "https://www.ubc.ca"
  },
  {
    id: "waterloo", name: "University of Waterloo", country: "Canada", region: "Canada", acceptanceRate: "~53%", competitiveness: "High",
    requirements: ["Strong Math/Science grades for CS/Engineering", "Some programs require supplementary application (CS especially)", "WAEC/IGCSE accepted"],
    notes: "Canada's #1 school for Computer Science and Engineering. Famous co-op program — students alternate study terms with paid work terms.",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/University_of_Waterloo_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/83/Panorama_MC_green_small.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b2/Dana_Porter_Library_2.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/83/Panorama_MC_green_small.jpg",
    virtualTour: "https://uwaterloo.ca"
  },
  {
    id: "queens_ca", name: "Queen's University", country: "Canada", region: "Canada", acceptanceRate: "~42%", competitiveness: "Moderate-High",
    requirements: ["High school average 85%+ for competitive programs", "Supplementary application for some programs", "WAEC/IGCSE accepted"],
    notes: "Strong Engineering, Business (Smith), and Health Sciences. Known for tight-knit campus community and school spirit in Kingston, Ontario.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/70/QueensU_Crest.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/5/58/Granthall.JPG", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Douglas_Library_at_Dusk%2C_Queen%27s_University%2C_Kingston%2C_Canada.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/5/58/Granthall.JPG",
    virtualTour: "https://www.queensu.ca"
  },
  // Malaysia
  {
    id: "um", name: "University of Malaya (UM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate-High",
    requirements: ["STPM/A-Levels/IB or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Some programs require entrance interview"],
    notes: "Malaysia's oldest and top-ranked university. Strong Medicine, Engineering, and Law. Affordable for international students compared to Western options.",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8f/University_of_Malaya_logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/9/95/University_of_Malaya_-_UM_Letters.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d4/Malaya_University_Faculty_of_Laws_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/91/Tan_Teck_Guan_Building%2C_Aug_07.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/9/95/University_of_Malaya_-_UM_Letters.jpg",
    virtualTour: "https://www.um.edu.my"
  },
  {
    id: "utm", name: "Universiti Teknologi Malaysia (UTM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate",
    requirements: ["STPM/A-Levels or equivalent with strong Maths/Science", "WAEC/NECO accepted with credit requirements", "Engineering-focused entrance criteria"],
    notes: "Malaysia's leading technical university. Excellent Engineering and Built Environment programs. Strong industry partnerships.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/UTM-LOGO.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/cb/UTM-LOGO-FULL.png"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/cb/UTM-LOGO-FULL.png",
    virtualTour: "https://www.utm.my"
  },
  {
    id: "upm", name: "Universiti Putra Malaysia (UPM)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Competitive", competitiveness: "Moderate",
    requirements: ["STPM/A-Levels or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Some programs require interview"],
    notes: "Strong Agriculture, Veterinary Medicine, and Engineering programs. Beautiful spacious campus near Kuala Lumpur.",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Coat_of_Arms_of_Universiti_Putra_Malaysia.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/d/d6/Anjung_Putra%2C_UPM.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/Library_of_UPMKB.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/35/Faculty_of_Engineering%2C_UPM_%28240103-0825%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Anjung_Putra%2C_UPM.jpg",
    virtualTour: "https://www.upm.edu.my"
  },
  {
    id: "taylors", name: "Taylor's University", country: "Malaysia", region: "Malaysia", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["A-Levels/IB or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Strong Hospitality/Business/Design programs entrance"],
    notes: "Top private university in Malaysia. Renowned for Hospitality, Business, and Design. Strong international partnerships with UK/Australian universities for dual degrees.",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f6/Logo_of_Taylor%27s_University.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/f/f5/Taylors_Lakeside_Campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Taylors_Lakeside_Campus.jpg",
    virtualTour: "https://university.taylors.edu.my"
  },
  {
    id: "mmu", name: "Multimedia University (MMU)", country: "Malaysia", region: "Malaysia", acceptanceRate: "Moderate-High", competitiveness: "Moderate",
    requirements: ["A-Levels/STPM or equivalent good grades", "WAEC/NECO accepted with credit requirements", "Strong Engineering/IT entrance criteria"],
    notes: "Malaysia's first private university focused on technology. Excellent for Computer Science, IT, and Engineering. Strong tech industry connections.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Multimedia_University_secondary_logo_2020.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1b/MMU_Chancellery_Building.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5d/Melaka-Campus-mobile.jpg", "https://upload.wikimedia.org/wikipedia/en/5/5c/Multimedia_university_malaysia_mmu_new_pool.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/MMU_Chancellery_Building.jpg",
    virtualTour: "https://www.mmu.edu.my"
  },
  // Australia
  {
    id: "melbourne", name: "University of Melbourne", country: "Australia", region: "Australia", acceptanceRate: "~70%", competitiveness: "Moderate-High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's #1 ranked university. Strong Medicine, Law, and Engineering. Beautiful Parkville campus in Melbourne.",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/50/The_University_of_Melbourne_Logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/8/8e/Melbourne_University_grand_building.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/77/The_University_of_Melbourne.JPG"],
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Melbourne_University_grand_building.jpg",
    virtualTour: "https://www.unimelb.edu.au"
  },
  {
    id: "anu", name: "Australian National University (ANU)", country: "Australia", region: "Australia", acceptanceRate: "~35%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Strong essays for some programs"],
    notes: "Australia's top research university, based in Canberra. Excellent for Politics, International Relations, and Sciences.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Australian_National_University_%28emblem%29.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/c/ca/ANU_School_of_Art.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Homopolar_anu-MJC.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6c/AUS_Canberra%2C_Central%2C_Australian_National_University_004.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6c/AUS_Canberra%2C_Central%2C_Australian_National_University_004.jpg",
    virtualTour: "https://www.anu.edu.au"
  },
  {
    id: "sydney", name: "University of Sydney", country: "Australia", region: "Australia", acceptanceRate: "~30%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's oldest university (est. 1850). Strong Medicine, Law, and Architecture. Iconic sandstone Quadrangle.",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/37/The_University_of_Sydney_Logo.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ee/University_of_Sydney%27s_Main_Quadrangle.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/31/Charles_Perkins_Centre%2C_University_of_Sydney.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/3f/USYD_MacLaurin_Hall_A14D_SEP2019.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ee/University_of_Sydney%27s_Main_Quadrangle.jpg",
    virtualTour: "https://www.sydney.edu.au"
  },
  {
    id: "unsw", name: "UNSW Sydney", country: "Australia", region: "Australia", acceptanceRate: "~30%", competitiveness: "High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Strong Engineering/CS entrance criteria"],
    notes: "Top-ranked for Engineering and Computer Science in Australia. Strong industry connections, located in Sydney.",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4d/University_of_New_South_Wales_Logo.png",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1c/Old_Main_Building_UNSW_2025-01-05.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d3/UNSW_library_lawn.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/35/Main_Walkway%2C_Lower_campus_UNSW.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1a/UNSW_lower_campus.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Old_Main_Building_UNSW_2025-01-05.jpg",
    virtualTour: "https://www.unsw.edu.au"
  },
  {
    id: "monash", name: "Monash University", country: "Australia", region: "Australia", acceptanceRate: "~40%", competitiveness: "Moderate-High",
    requirements: ["ATAR equivalent or strong A-Levels/IB", "WAEC/NECO accepted with credit requirements", "Some programs require portfolio/interview"],
    notes: "Australia's largest university. Strong Medicine, Pharmacy, and Engineering. Multiple global campuses including Malaysia.",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/74/Monash_University_logo-en.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/1/1d/Clayton_-_Monash_University.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/66/Biomedical_Learning_and_Teaching_Building_-In_Explore-_%2847587403542%29.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Clayton_-_Monash_University.jpg",
    virtualTour: "https://www.monash.edu"
  },
  // More US
  {
    id: "gatech", name: "Georgia Institute of Technology", country: "USA", region: "Top US (STEM)", acceptanceRate: "16.0%", competitiveness: "Very High",
    requirements: ["SAT 1400-1540 or ACT 32-35", "Strong Maths/Science grades", "2 recommendation letters", "Engineering/CS focused essays"],
    notes: "Top 5 Engineering school in the US. Excellent CS, Robotics, and Aerospace. More accessible than Ivy League with comparable STEM quality.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Georgia_Tech_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/0/01/Georgia_Tech_campus_buildings.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/01/Georgia_Tech_campus_buildings.jpg",
    virtualTour: "https://www.gatech.edu"
  },
  {
    id: "purdue", name: "Purdue University", country: "USA", region: "Top US (STEM)", acceptanceRate: "57.0%", competitiveness: "Moderate-High",
    requirements: ["SAT 1240-1480 or ACT 26-33", "Strong Maths/Science for Engineering", "2 recommendation letters"],
    notes: "Famous for Aerospace Engineering — more astronauts than any other university. Great Engineering at a more accessible acceptance rate.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Purdue_University_seal.svg",
    images: ["https://upload.wikimedia.org/wikipedia/commons/e/ed/Purdue_university_memorial_union.jpg"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Purdue_university_memorial_union.jpg",
    virtualTour: "https://www.purdue.edu"
  },
  // More Nigerian Private
  {
    id: "admiralty", name: "Admiralty University of Nigeria (ADUN)", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Naval-affiliated private university in Delta State. Growing reputation in Engineering, Law, and Sciences. Modern facilities.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.adun.edu.ng"
  },
  {
    id: "caleb", name: "Caleb University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Christian mission university in Lagos. Strong Business, Law, and Social Sciences. Good campus environment and career support.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.calebuniversity.edu.ng"
  },
  {
    id: "veritas", name: "Veritas University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Catholic university in Abuja. Strong Philosophy, Social Sciences, and Education. Affordable private option for FCT-based students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.veritas.edu.ng"
  },
  {
    id: "redeemers", name: "Redeemer's University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "RCCG-affiliated university in Osun State. Strong Natural Sciences, Business, and Humanities. Known for discipline and strong academics.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.run.edu.ng"
  },
  {
    id: "landmark", name: "Landmark University", country: "Nigeria", region: "Nigeria (Top Private)", acceptanceRate: "Moderate", competitiveness: "Moderate",
    requirements: ["JAMB UTME: 160+ typical", "WAEC/NECO: minimum 5 credits incl. English & Maths", "University screening exam"],
    notes: "Faith-based university in Kwara State. Strong Agriculture, Engineering, and Business. Focus on entrepreneurship and self-reliance.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.lmu.edu.ng"
  },
  // More Nigerian Federal
  {
    id: "uniport", name: "University of Port Harcourt (UNIPORT)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Post-UTME screening exam"],
    notes: "Major federal university in Rivers State. Strong Petroleum Engineering, Chemical Engineering, and Medicine. Oil-sector connections excellent for graduates.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.uniport.edu.ng"
  },
  {
    id: "futa", name: "Federal University of Technology Akure (FUTA)", country: "Nigeria", region: "Nigeria (Top Federal)", acceptanceRate: "Competitive (Post-UTME based)", competitiveness: "Moderate-High",
    requirements: ["JAMB UTME: 180+ for most courses", "WAEC/NECO: minimum 5 credits incl. English & Maths", "Strong Maths/Science grades", "Post-UTME screening"],
    notes: "One of Nigeria's top technology-focused federal universities. Excellent Engineering, Computer Science, and Agriculture programs.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.futa.edu.ng"
  },
  // Asia
  {
    id: "utokyo", name: "University of Tokyo", country: "Japan", region: "Asia", acceptanceRate: "~35% (int'l)", competitiveness: "Very High",
    requirements: ["Strong academic transcript", "EJU or SAT/IB/A-Level scores depending on program", "English or Japanese proficiency depending on track", "Personal statement"],
    notes: "Japan's top-ranked university. Strong Engineering, Medicine, and Economics. English-taught programs (PEAK) available for international undergraduates.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.u-tokyo.ac.jp/en/"
  },
  {
    id: "tsinghua", name: "Tsinghua University", country: "China", region: "Asia", acceptanceRate: "~30% (int'l)", competitiveness: "Very High",
    requirements: ["Strong academic record", "HSK for Chinese-taught programs, TOEFL/IELTS for English-taught", "Personal statement + recommendation letters", "Interview for some programs"],
    notes: "China's top-ranked university, especially strong in Engineering, Computer Science, and Economics. International admission is holistic, separate from the Gaokao used for domestic students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.tsinghua.edu.cn/en/"
  },
  {
    id: "nus", name: "National University of Singapore (NUS)", country: "Singapore", region: "Asia", acceptanceRate: "Highly Selective", competitiveness: "Very High",
    requirements: ["Strong WAEC/IGCSE/A-Level or equivalent results", "SAT/ACT often considered", "Personal statement", "Some programs require portfolio or interview"],
    notes: "Asia's top-ranked university by several major rankings. Excellent Business, Engineering, and Computing. English-medium instruction throughout.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.nus.edu.sg"
  },
  {
    id: "aiims", name: "All India Institute of Medical Sciences (AIIMS Delhi)", country: "India", region: "Asia", acceptanceRate: "Extremely Selective", competitiveness: "Extreme",
    requirements: ["NEET entrance exam (for Indian nationals)", "Separate international student quota/process for foreign nationals", "Strong Physics, Chemistry, Biology background"],
    notes: "India's top medical institution, including renowned Neurosurgery and specialist programs. One of the most competitive medical admissions in the world.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.aiims.edu"
  },
  {
    id: "iitdelhi", name: "Indian Institute of Technology Delhi (IIT Delhi)", country: "India", region: "Asia", acceptanceRate: "Extremely Selective", competitiveness: "Extreme",
    requirements: ["JEE Advanced (for Indian nationals) or DASA scheme for international/NRI students", "Strong Maths and Physics background", "English proficiency for international applicants"],
    notes: "One of India's top engineering institutes. International students typically apply through the DASA scheme rather than JEE directly.",
    logo: "", images: [], image: "",
    virtualTour: "https://home.iitd.ac.in"
  },
  {
    id: "snu", name: "Seoul National University (SNU)", country: "South Korea", region: "Asia", acceptanceRate: "Highly Selective", competitiveness: "Very High",
    requirements: ["Strong academic transcript", "TOPIK for Korean-taught programs, TOEFL/IELTS for English-taught", "Personal statement", "Interview for some programs"],
    notes: "South Korea's top-ranked university. Strong across Engineering, Business, and Natural Sciences, with a growing number of English-taught programs for international students.",
    logo: "", images: [], image: "",
    virtualTour: "https://www.snu.ac.kr/en"
  },
];

const COLLEGE_REGIONS = ["All", ...new Set(COLLEGES.map(c => c.region))];


// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    sparkles: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /><path d="M19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6z" /></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    bookmark: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    arrow_left: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    fire: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21" /><line x1="12" y1="17" x2="12" y2="21" /><path d="M7 4H4a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h3M17 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3" /><rect x="7" y="2" width="10" height="12" rx="2" /></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    external: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    school: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    chevron_left: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
    chevron_right: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    speaker: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  };
  return icons[name] || null;
};

// ── INFO TOOLTIP ──────────────────────────────────────────────────────────────
// A small "?" badge that reveals an explainer bubble when tapped — closes on
// a second tap. Uses fixed positioning computed from the button's real screen
// location so it never gets clipped by a card's rounded-corner overflow, and
// clamps to stay fully on-screen on any device width (phone, iPad, laptop).
function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const TOOLTIP_WIDTH = 240;

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));
      setPos({ top: rect.bottom + 8, left });
    }
    setOpen(o => !o);
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          width: 18, height: 18, borderRadius: "50%", border: "1px solid #3B4A6B",
          backgroundColor: "transparent", color: "#7C8AA5", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, lineHeight: 1,
        }}
      >
        ?
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
          <div
            style={{
              position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
              width: TOOLTIP_WIDTH, padding: "12px 14px", borderRadius: 12,
              backgroundColor: "#12182E", border: "1px solid #2A3A5F",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              fontSize: 12, lineHeight: 1.5, color: "#C9D2E8",
            }}
          >
            {text}
          </div>
        </>
      )}
    </div>
  );
}


const S = {
  // Layout
  app: { minHeight: "100vh", backgroundColor: "#080D1E", color: "#F0F2FF", fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 430, margin: "0 auto", position: "relative", paddingBottom: 80 },
  screen: { padding: "0 0 16px" },

  // Nav
  nav: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430,
    backgroundColor: "rgba(13, 19, 38, 0.72)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px 18px 0 0",
    display: "flex", zIndex: 100,
    boxShadow: "0 -8px 24px rgba(0,0,0,0.25)",
  },
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

// dateKey: local YYYY-MM-DD for a given Date (avoids UTC-shift bugs)
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Real consecutive-day streak ending today or yesterday (grace period so streak
// doesn't die at midnight before the user has practiced today).
function computeStreak(dailyActivity) {
  if (!dailyActivity || Object.keys(dailyActivity).length === 0) return 0;
  const today = new Date();
  const hasToday = (dailyActivity[dateKey(today)]?.total || 0) > 0;
  let cursor = new Date(today);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1); // allow yesterday to still count
  let streak = 0;
  while ((dailyActivity[dateKey(cursor)]?.total || 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Real per-day activity for the last 7 calendar days (chronological order), for
// the weekly dot row and weekly accuracy chart.
function getLast7Days(dailyActivity) {
  const today = new Date();
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const entry = dailyActivity?.[dateKey(d)] || { total: 0, correct: 0 };
    out.push({ date: d, total: entry.total, correct: entry.correct });
  }
  return out;
}

// ── TARGET / READINESS HELPERS ──────────────────────────────────────────────────
// Converts a per-subject target (a grade, a score band, a slider value) into an
// "expected accuracy %" so it can be compared against real practice performance.
const WAEC_GRADE_TO_ACCURACY = { A1: 90, B2: 85, B3: 80, C4: 75, C5: 70, C6: 65, D7: 55, E8: 45, F9: 30 };
const IGCSE_GRADE_TO_ACCURACY = { "A*": 90, A: 85, B: 75, C: 65, D: 55, E: 45, F: 35, G: 25 };

function targetToExpectedAccuracy(exam, subject, targets) {
  const t = targets?.[exam];
  if (!t) return null;
  if (["WAEC", "NECO", "GCE"].includes(exam)) {
    const grade = t.grades?.[subject];
    return grade ? WAEC_GRADE_TO_ACCURACY[grade] ?? null : null;
  }
  if (exam === "IGCSE") {
    const grade = t.grades?.[subject];
    return grade ? IGCSE_GRADE_TO_ACCURACY[grade] ?? null : null;
  }
  if (exam === "JAMB") {
    const band = t.scores?.[subject];
    return band ?? null; // JAMB is scored /100, band (e.g. 90+) maps roughly 1:1 to accuracy%
  }
  if (exam === "SAT") {
    if (subject === "Reading and Writing" && t.rw) return Math.round(((t.rw - 200) / 600) * 100);
    if (subject === "Math" && t.math) return Math.round(((t.math - 200) / 600) * 100);
    return null;
  }
  if (exam === "ACT" && t.composite) return Math.round((t.composite / 36) * 100);
  if (exam === "IELTS") {
    const bandKey = subject.toLowerCase();
    const val = t[bandKey];
    return val ? Math.round((val / 9) * 100) : null;
  }
  return null;
}

// Recency-weighted accuracy: most recent attempts count more than older ones.
// Weight = position from oldest(1) to newest(n); weighted% = sum(weight*correct)/sum(weight).
function weightedAccuracy(log) {
  if (!log || log.length === 0) return null;
  let weightedSum = 0, weightTotal = 0;
  log.forEach((correct, i) => {
    const weight = i + 1; // linear recency weighting
    weightedSum += weight * (correct ? 1 : 0);
    weightTotal += weight;
  });
  return Math.round((weightedSum / weightTotal) * 100);
}

function getSubjectAccuracy(subjectStats, exam, subject) {
  const key = `${exam}::${subject}`;
  return weightedAccuracy(subjectStats?.[key]?.log);
}

// Builds a per-subject readiness breakdown for one exam: target, current
// (recency-weighted) accuracy, gap, and how "ready" the student is (capped 100%).
function getExamReadiness(exam, targets, subjectStats) {
  const t = targets?.[exam];
  if (!t) return null;
  const subjects = t.subjects || (exam === "SAT" ? ["Reading and Writing", "Math"] : exam === "IELTS" ? ["Listening", "Reading", "Writing", "Speaking"] : exam === "ACT" ? ["Composite"] : []);
  const rows = subjects.map(subject => {
    const expected = exam === "ACT" ? Math.round(((t.composite || 20) / 36) * 100) : targetToExpectedAccuracy(exam, subject, targets);
    const current = exam === "ACT" ? null : getSubjectAccuracy(subjectStats, exam, subject);
    const readiness = expected && current != null ? Math.min(100, Math.round((current / expected) * 100)) : null;
    const gap = expected && current != null ? Math.max(0, expected - current) : null;
    return { subject, expected, current, readiness, gap };
  });
  const validReadiness = rows.filter(r => r.readiness != null).map(r => r.readiness);
  const overallReadiness = validReadiness.length > 0 ? Math.round(validReadiness.reduce((a, b) => a + b, 0) / validReadiness.length) : null;
  return { rows, overallReadiness };
}

// Short headline label for a target card, e.g. "320+" for JAMB, "1400" for SAT.
function examTargetHeadline(exam, targets) {
  const t = targets?.[exam];
  if (!t) return null;
  if (exam === "JAMB") {
    const scores = t.scores || {};
    const total = (scores["English Language"] || 0) + (t.subjects || []).reduce((a, s) => a + (scores[s] || 0), 0);
    return total > 0 ? `${total}` : null;
  }
  if (exam === "SAT") return t.rw && t.math ? `${t.rw + t.math}` : null;
  if (exam === "ACT") return t.composite ? `${t.composite}` : null;
  if (exam === "IELTS") {
    const vals = [t.listening, t.reading, t.writing, t.speaking].filter(v => v != null);
    if (vals.length === 0) return null;
    return `${Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2}`;
  }
  if (["WAEC", "NECO", "GCE", "IGCSE"].includes(exam)) {
    const count = (t.subjects || []).length;
    return count > 0 ? `${count} subjects` : null;
  }
  return null;
}

// ── HEATMAP DATA (GitHub-style contribution graph) ──────────────────────────────
// Builds real cells from the user's actual dailyActivity map. No randomness.
function buildHeatmapCells(dailyActivity, weeksBack = 52) {
  const today = new Date();
  const cells = [];
  for (let w = weeksBack - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      const entry = dailyActivity?.[dateKey(date)];
      const questions = entry?.total || 0;
      let level = 0;
      if (questions >= 16) level = 4;
      else if (questions >= 8) level = 3;
      else if (questions >= 4) level = 2;
      else if (questions >= 1) level = 1;
      cells.push({ date, level, questions });
    }
  }
  return cells;
}

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
function HomeScreen({ onStart, onSearch, onNotes, bookmarks, stats, profile, dailyActivity, subjectStats }) {
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
            { label: "Answered", val: totalQ, icon: "book", info: "Total questions you've answered across every subject and exam, all-time." },
            { label: "Correct", val: correctQ, icon: "check", info: "How many of those answered questions you got right, all-time." },
            { label: "Accuracy", val: `${pct}%`, icon: "star", info: "Your overall correct rate: Correct ÷ Answered. This is an all-time average, separate from the recency-weighted per-subject numbers used for target readiness." },
          ].map(({ label, val, icon, info }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: "14px 8px" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <Icon name={icon} size={16} color="#3B82F6" />
                <InfoTooltip text={info} />
              </div>
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
          <div style={{ ...S.row(), justifyContent: "space-between" }}>
            <div style={S.row()}>
              <Icon name="fire" size={16} color="#F97316" />
              <span style={{ ...S.label, color: "#F97316" }}>
                {(() => {
                  const streak = computeStreak(dailyActivity);
                  return streak > 0 ? `Day ${streak} Streak` : "Start Your Streak";
                })()}
              </span>
            </div>
            <InfoTooltip text="Your streak counts consecutive days you've answered at least one question. It stays alive as long as you show up daily — right or wrong doesn't matter, just keep practicing." />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            {getLast7Days(dailyActivity).map((d, i) => {
              const active = d.total > 0;
              const label = days[d.date.getDay() === 0 ? 6 : d.date.getDay() - 1];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: active ? "#3B82F6" : "#1E2A4A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {active && <Icon name="check" size={14} color="#fff" />}
                  </div>
                  <span style={S.small}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target cards — per exam readiness + gap-to-target, from onboarding targets */}
        {profile?.targets && (profile?.exams || []).some(e => examTargetHeadline(e, profile.targets)) && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <p style={{ ...S.label, margin: 0 }}>Your Targets</p>
              <InfoTooltip text="This shows how close you are to the grades/scores you set in onboarding, based on your recent practice accuracy per subject — not your all-time average, so recent improvement counts more." />
            </div>
            <div style={S.gap(10)}>
              {(profile.exams || []).map(exam => {
                const headline = examTargetHeadline(exam, profile.targets);
                if (!headline) return null;
                const readinessData = getExamReadiness(exam, profile.targets, subjectStats);
                const overall = readinessData?.overallReadiness;
                const hasData = overall != null;
                return (
                  <div key={exam} style={{ ...S.card, display: "flex", alignItems: "center", gap: 14 }}>
                    <ExamLogo exam={exam} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>{exam} Target</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#3B82F6" }}>{headline}</span>
                      </div>
                      {hasData ? (
                        <>
                          <div style={{ height: 6, borderRadius: 3, backgroundColor: "#1E2A4A", marginTop: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${overall}%`, backgroundColor: overall >= 90 ? "#22C55E" : overall >= 60 ? "#3B82F6" : "#F97316", transition: "width 400ms ease" }} />
                          </div>
                          <p style={{ fontSize: 11, color: "#7C8AA5", marginTop: 6 }}>
                            {overall >= 100 ? "You're hitting your target! 🎯" : `${overall}% of the way to your target — keep going.`}
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: 11, color: "#7C8AA5", marginTop: 6 }}>Practice a few questions to see your readiness.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

  // Only show subjects the student actually picked during onboarding for this exam —
  // falls back to the full master list if they never set targets for this exam
  // (e.g. picked it as an exam but skipped/hasn't done its config step).
  const allSubjectsForExam = [...new Set(QUESTIONS.filter(q => q.exam === exam).map(q => q.subject))];
  const onboardedSubjects = (() => {
    const t = profile?.targets?.[exam];
    if (!t) return null;
    if (exam === "JAMB") {
      const extras = t.subjects || [];
      return extras.length > 0 ? ["English Language", ...extras] : null;
    }
    if (["WAEC", "NECO", "GCE", "IGCSE"].includes(exam)) {
      return (t.subjects || []).length > 0 ? t.subjects : null;
    }
    return null; // SAT/ACT/IELTS aren't subject-checklist exams
  })();
  const subjectsForExam = onboardedSubjects
    ? allSubjectsForExam.filter(s => onboardedSubjects.includes(s))
    : allSubjectsForExam;
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
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Practice Questions</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>Configure your<br />session</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {/* Exam - only shows student's selected exams */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Exam Body</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {myExams.filter(e => e !== "SAT").map(e => (
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
    const text = getQuestionText(q) + ". " + q.options.map((o, i) => `Option ${["A", "B", "C", "D"][i]}: ${o}`).join(". ");
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
      const resp = await fetch("/api/aceai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `A student is working on this ${q.exam} ${q.subject} question and needs help understanding it (not just the answer): "${getQuestionText(q)}" Options: ${q.options.join(", ")}. Correct answer: ${q.options[q.answer]}. Student's question: ${aiTutorInput}`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setAiTutorReply(data.reply || "Sorry, I couldn't process that.");
    } catch {
      setAiTutorReply("Something went wrong reaching AceAi — check your connection and try again.");
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
        question: getQuestionText(q),
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
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{getQuestionText(q)}</p>
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
function SatResultsScreen({ answers, questions, timeInfo, userName, onHome, onReview }) {
  const qById = {};
  questions.forEach(q => { qById[q.id] = q; });

  const rwAnswers = answers.filter(a => qById[a.qid]?.subject === "Reading and Writing");
  const mathAnswers = answers.filter(a => qById[a.qid]?.subject === "Math");

  const rwCorrect = rwAnswers.filter(a => a.correct).length;
  const mathCorrect = mathAnswers.filter(a => a.correct).length;
  const rwTotal = rwAnswers.length;
  const mathTotal = mathAnswers.length;

  const rwPct = rwTotal ? (rwCorrect / rwTotal) * 100 : 0;
  const mathPct = mathTotal ? (mathCorrect / mathTotal) * 100 : 0;

  const rwScore = pctToScaledScore(rwPct);
  const mathScore = pctToScaledScore(mathPct);
  const totalScore = rwScore + mathScore;

  const totalCorrect = rwCorrect + mathCorrect;
  const totalQuestions = rwTotal + mathTotal;
  const isAnswered = (answer) => answer.selected !== undefined && answer.selected !== null && answer.selected !== "";
  const totalUnanswered = answers.filter((answer) => !isAnswered(answer)).length;
  const totalIncorrect = answers.filter((answer) => isAnswered(answer) && !answer.correct).length;

  // Domain breakdown
  const rwDomains = {};
  rwAnswers.forEach(a => {
    const q = qById[a.qid];
    const domain = getRWDomain(q.topic);
    if (!rwDomains[domain]) rwDomains[domain] = { correct: 0, total: 0 };
    rwDomains[domain].total++;
    if (a.correct) rwDomains[domain].correct++;
  });

  const mathDomains = {};
  mathAnswers.forEach(a => {
    const q = qById[a.qid];
    const domain = getMathDomain(q.topic);
    if (!mathDomains[domain]) mathDomains[domain] = { correct: 0, total: 0 };
    mathDomains[domain].total++;
    if (a.correct) mathDomains[domain].correct++;
  });

  function DomainBar({ label, correct, total }) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{correct}/{total} correct</div>
        <div style={S.progressBar(pct)}>
          <div style={S.progressFill(pct, pct >= 70 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444")} />
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={{ ...S.header, textAlign: "center", paddingBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>{userName}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#AFC2F3", letterSpacing: 1 }}>ACEBOARD SIMULATED PRACTICE ESTIMATE · NOT AN OFFICIAL SAT SCORE</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#3B82F6", letterSpacing: "-0.04em" }}>{totalScore}</div>
        <div style={{ fontSize: 13, color: "#94A3B8" }}>Score Range: 400–1600</div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>Estimated with AceBoard's practice curve; College Board scoring is not reproduced.</div>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {/* Section scores */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 16 }}>Section Scores</p>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Reading and Writing</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#3B82F6" }}>{rwScore}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>200–800</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Math</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#3B82F6" }}>{mathScore}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>200–800</div>
            </div>
          </div>
        </div>

        {/* Questions overview */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Questions Overview</p>
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{totalCorrect}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Correct</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{totalIncorrect}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Incorrect</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{totalUnanswered}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Unanswered</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{totalQuestions}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Total</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", fontSize: 12, color: "#94A3B8" }}>
            <span>R&W: {rwCorrect}/{rwTotal} correct</span>
            <span>Math: {mathCorrect}/{mathTotal} correct</span>
          </div>
        </div>

        {/* Knowledge and Skills */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 4 }}>Knowledge and Skills</p>
          <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>
            Your performance across content domains
          </p>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Reading and Writing</div>
          {Object.entries(rwDomains).map(([domain, data]) => (
            <DomainBar key={domain} label={domain} correct={data.correct} total={data.total} />
          ))}
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 10 }}>Math</div>
          {Object.entries(mathDomains).map(([domain, data]) => (
            <DomainBar key={domain} label={domain} correct={data.correct} total={data.total} />
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, padding: "0 4px" }}>
          Disclaimer: These scores are a simulated estimate based on AceBoard's scoring
          approximation, for practice purposes only. Your actual SAT score may differ due
          to College Board's official equating process. This is not an official score.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 4, marginBottom: 20 }}>
          <button onClick={onReview} style={{ ...S.btnPrimary, flex: 1 }}>Review Answers</button>
          <button onClick={onHome} style={{ ...S.btnSecondary, flex: 1 }}>Home</button>
        </div>
      </div>
    </div>
  );
}
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
function SatReviewScreen({ answers, questions, onBack }) {
  const [idx, setIdx] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(true);

  const qById = {};
  questions.forEach(q => { qById[q.id] = q; });

  const a = answers[idx];
  const q = qById[a.qid];
  const optLabel = ["A", "B", "C", "D"];

  // section-relative numbering, e.g. "Reading and Writing: Question 3"
  const sameSubjectAnswers = answers.filter(x => qById[x.qid]?.subject === q.subject);
  const posInSection = sameSubjectAnswers.findIndex(x => x.qid === a.qid) + 1;

  const isMcq = getQuestionType(q) === "mcq";
  const selectedLabel = a.selected != null ? (isMcq ? optLabel[a.selected] : a.selected) : "—";
  const correctLabel = isMcq ? optLabel[q.answer] : q.answer;

  return (
    <div style={{ fontFamily: `Georgia, "Times New Roman", serif`, minHeight: "100vh", background: "#fff", color: "#1A1A1A" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #E2E8F0",
          fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Review Answers</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>{idx + 1} of {answers.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            Knowledge and Skills: {q.subject === "Math" ? getMathDomain(q.topic) : getRWDomain(q.topic)}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Difficulty level: <span style={{ fontWeight: 700 }}>{q.difficulty}</span>
          </div>
        </div>
        <button onClick={onBack} style={{ border: "none", background: "none", fontSize: 20, color: "#64748B", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>
        <div style={{ width: "50%", borderRight: "1px solid #E2E8F0", padding: "28px 32px", overflowY: "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` }}>
            {q.subject}: Question {posInSection}
          </div>
          {q.passage && (
            <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>{q.passage}</p>
          )}
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>{getQuestionText(q)}</p>
          {isMcq && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, i) => (
              <div key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>{opt}</div>
            ))}
          </div>}
        </div>

        <div style={{ width: "50%", padding: "28px 32px", overflowY: "auto", fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Answer</div>
          {revealAnswer ? (
            <>
              <div
                style={{
                  background: a.correct ? "#DCFCE7" : "#FEE2E2",
                  color: a.correct ? "#166534" : "#991B1B",
                  padding: "14px 18px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 24,
                }}
              >
                You selected answer {selectedLabel}. The correct answer is {correctLabel}.
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Rationale</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155" }}>{q.explanation}</p>
            </>
          ) : (
            <p style={{ fontSize: 14, color: "#94A3B8" }}>Answer hidden. Check the box below to reveal it.</p>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderTop: "1px solid #E2E8F0",
          fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={revealAnswer} onChange={(e) => setRevealAnswer(e.target.checked)} />
          Show correct answer and explanation
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setIdx(i => Math.max(i - 1, 0))}
            disabled={idx === 0}
            style={{
              background: "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: idx === 0 ? 0.4 : 1,
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setIdx(i => Math.min(i + 1, answers.length - 1))}
            disabled={idx === answers.length - 1}
            style={{
              background: "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: idx === answers.length - 1 ? 0.4 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
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
            <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Results</span></div>
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
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{getQuestionText(q)}</p>
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
function ContributionHeatmap({ dailyActivity }) {
  const weeksBack = 52;
  const cells = buildHeatmapCells(dailyActivity, weeksBack);
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ ...S.label, margin: 0 }}>Practice Activity</p>
          <InfoTooltip text="Each square is one day. Darker/brighter squares mean more questions answered that day — this is built entirely from your real practice history, not a demo pattern." />
        </div>
        <span style={S.small}>{totalQuestions} questions · past year</span>
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


function AnalyticsScreen({ stats, allHistory, profile, dailyActivity, subjectStats }) {
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const hasActivity = stats.total > 0;
  const streak = computeStreak(dailyActivity);
  const last7 = getLast7Days(dailyActivity);
  const weekData = last7.map(d => (d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0));
  const weekDayLabels = last7.map(d => days[d.date.getDay() === 0 ? 6 : d.date.getDay() - 1]);
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
          <style>{`
            @keyframes rankIconShine {
              0% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
              8% { opacity: 0.85; }
              22% { opacity: 0.85; }
              32% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
              100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
            }
          `}</style>
          <div style={S.row(12)}>
            <div style={{ position: "relative", width: 46, height: 46, borderRadius: 14, backgroundColor: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22, overflow: "hidden" }}>
              <span style={{ zIndex: 1 }}>🎓</span>
              <div style={{
                position: "absolute", top: 0, left: 0, width: "45%", height: "100%",
                background: "linear-gradient(75deg, transparent, rgba(255,255,255,0.55), transparent)",
                animation: "rankIconShine 3400ms ease-in-out 0ms infinite",
                pointerEvents: "none",
              }} />
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
            { label: "Total Answered", val: stats.total, icon: "book", color: "#3B82F6", info: "Total questions you've answered across every subject and exam, all-time." },
            { label: "Correct", val: stats.correct, icon: "check", color: "#22C55E", info: "How many of those answered questions you got right, all-time." },
            { label: "Accuracy", val: `${pct}%`, icon: "star", color: "#F59E0B", info: "Your overall correct rate: Correct ÷ Answered, all-time." },
            { label: "Streak", val: streak > 0 ? `${streak} day${streak === 1 ? "" : "s"} 🔥` : "0 days", icon: "fire", color: "#F97316", info: "Consecutive days you've answered at least one question. Stays alive as long as you show up daily." },
          ].map(({ label, val, icon, color, info }) => (
            <div key={label} style={{ ...S.card, padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name={icon} size={16} color={color} />
                <InfoTooltip text={info} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 2px", color, letterSpacing: "-0.02em" }}>{val}</div>
              <div style={S.small}>{label}</div>
            </div>
          ))}
        </div>

        {/* Contribution heatmap */}
        <ContributionHeatmap dailyActivity={dailyActivity} />

        {/* Weekly chart */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 14 }}>This Week's Accuracy</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {weekData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{last7[i].total > 0 ? `${v}%` : "—"}</span>
                <div style={{ width: "100%", height: `${(v / maxVal) * 70}px`, backgroundColor: i === 6 ? "#3B82F6" : "#1E2A4A", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
                <span style={{ fontSize: 10, color: "#64748B" }}>{weekDayLabels[i]}</span>
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

        {/* Exam Readiness — real per-subject breakdown vs onboarding targets */}
        {profile?.targets && (profile?.exams || []).some(e => profile.targets[e]) && (
          <div style={S.gap(14)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ ...S.label, margin: 0 }}>Exam Readiness</p>
              <InfoTooltip text="Readiness % compares your recent accuracy per subject against the grade/score you set as your target. 100% means you're currently performing at or above your goal." />
            </div>
            {(profile.exams || []).map(exam => {
              const t = profile.targets[exam];
              if (!t) return null;
              const readinessData = getExamReadiness(exam, profile.targets, subjectStats);
              if (!readinessData) return null;
              const { rows, overallReadiness } = readinessData;
              return (
                <div key={exam} style={S.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <ExamLogo exam={exam} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{exam}</div>
                      <div style={S.small}>{examTargetHeadline(exam, profile.targets) || "Target set"}</div>
                    </div>
                    {overallReadiness != null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: overallReadiness >= 90 ? "#22C55E" : overallReadiness >= 60 ? "#3B82F6" : "#F97316" }}>
                          {overallReadiness}%
                        </div>
                        <div style={{ fontSize: 10, color: "#7C8AA5" }}>ready</div>
                      </div>
                    )}
                  </div>
                  {exam === "ACT" ? (
                    <p style={{ fontSize: 12, color: "#7C8AA5" }}>Answer some ACT practice questions to see your readiness.</p>
                  ) : (
                    <div style={S.gap(10)}>
                      {rows.map(row => (
                        <div key={row.subject}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600 }}>{row.subject}</span>
                            <span style={{ fontSize: 11, color: "#7C8AA5" }}>
                              {row.current != null ? `${row.current}% now` : "no data yet"}
                              {row.gap != null && row.gap > 0 && ` · ${row.gap}% to go`}
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, backgroundColor: "#1E2A4A", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${row.readiness ?? 0}%`,
                              backgroundColor: (row.readiness ?? 0) >= 90 ? "#22C55E" : (row.readiness ?? 0) >= 60 ? "#3B82F6" : "#F97316",
                              transition: "width 400ms ease",
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                    <p style={{ fontSize: 14, color: "#E2E8F0", lineHeight: 1.5, margin: "0 0 8px" }}>{getQuestionText(q)}</p>
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
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              backgroundColor: "#0D1326", border: "1.5px solid #3B82F6", borderRadius: 14,
              padding: "14px 20px", textDecoration: "none", cursor: "pointer"
            }}>
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
function CollegesScreen({ profile }) {
  const [region, setRegion] = useState("All");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const userExams = profile?.exams || [];
  const wantsNG = userExams.some(e => NG_EXAMS.includes(e));
  const wantsIntl = userExams.some(e => INTL_EXAMS.includes(e));
  const showAll = !wantsNG && !wantsIntl;
  const scopedColleges = COLLEGES.filter(c => {
    if (showAll) return true;
    return c.country === "Nigeria" ? wantsNG : wantsIntl;
  });
  const scopedRegions = ["All", ...new Set(scopedColleges.map(c => c.region))];
  const filtered = scopedColleges.filter(c =>
    (region === "All" || c.region === region) &&
    (search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase()))
  );
  if (selected) return <CollegeDetail college={selected} onBack={() => setSelected(null)} />;
  return (
    <div style={S.screen}>
      <div style={S.header}>
        <span style={S.label}>Plan Ahead</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Colleges</h1>
      </div>
      <div style={{ ...S.px, ...S.gap(14) }}>
        <CollegeSlideshow colleges={scopedColleges.slice(0, 5)} onSelect={setSelected} />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={16} color="#64748B" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a school..."
            style={{ width: "100%", padding: "12px 14px 12px 40px", backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        {(wantsNG || showAll) && (
          <div style={S.card}>
            <p style={{ ...S.label, marginBottom: 12 }}>🇳🇬 Nigerian Admissions Portals</p>
            <div style={S.gap(8)}>
              {[
                { name: "JAMB CAPS / Admission Status", url: "https://efacility.jamb.gov.ng", note: "Check status, accept offers, print letter" },
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
          </div>
        )}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {scopedRegions.map(r => <button key={r} style={{ ...S.btnSmall(region === r), flexShrink: 0 }} onClick={() => setRegion(r)}>{r}</button>)}
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
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={S.body}>No schools match your search.</p></div>}
        </div>
      </div>
    </div>
  );
}

// ── QUESTION SEARCH ───────────────────────────────────────────────────────────
function QuestionSearchScreen({ onBack, profile }) {
  const [examFilter, setExamFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);
  const userExams = profile?.exams || [];
  const scopedQs = userExams.length > 0 ? QUESTIONS.filter(q => userExams.includes(q.exam)) : QUESTIONS;
  const normalizedKeyword = normalizeQuestionSearchText(keyword);
  const examOptions = ["All", ...new Set(scopedQs.map(q => q.exam))];
  const subjectOptions = ["All Subjects", ...new Set(scopedQs.filter(q => examFilter === "All" || q.exam === examFilter).map(q => q.subject))];
  const filtered = scopedQs.filter(q =>
    (examFilter === "All" || q.exam === examFilter) &&
    (subjectFilter === "All Subjects" || q.subject === subjectFilter) &&
    (normalizedKeyword === "" || (QUESTION_SEARCH_TEXT_BY_ID.get(q.id) || buildQuestionSearchText(q)).includes(normalizedKeyword))
  );
  if (selected) return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 10 }}>
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back to Search</span></div>
        </button>
      </div>
      <div style={{ ...S.px, ...S.gap(14) }}>
        <div style={S.row(6)}><span style={S.pill()}>{selected.topic}</span><span style={S.pill("#111827", "#64748B")}>{selected.year}</span></div>
        <div style={{ ...S.card, padding: 18 }}><p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>{getQuestionText(selected)}</p></div>
        {selected.image && <img src={selected.image} alt="" style={{ width: "100%", borderRadius: 12 }} />}
        {selected.options && (
          <div style={S.gap(8)}>
            {selected.options.map((opt, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid", fontSize: 14, display: "flex", gap: 12, alignItems: "center",
                backgroundColor: i === selected.answer ? "#052E16" : "#0D1326", borderColor: i === selected.answer ? "#22C55E" : "#1E2A4A", color: i === selected.answer ? "#86EFAC" : "#E2E8F0" }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#1E2A4A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{["A","B","C","D"][i]}</span>
                {opt}
              </div>
            ))}
          </div>
        )}
        <div style={{ backgroundColor: "#051A0F", border: "1px solid #14532D", borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", marginBottom: 8 }}>Explanation</p>
          <p style={{ ...S.body, fontSize: 13, margin: 0 }}>{selected.explanation}</p>
        </div>
      </div>
    </div>
  );
  return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0 }}>
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <div style={{ marginTop: 10 }}><span style={S.label}>Explore</span><h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Search Questions</h1></div>
      </div>
      <div style={{ ...S.px, ...S.gap(12) }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={16} color="#64748B" /></div>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search questions or topics..."
            style={{ width: "100%", padding: "12px 14px 12px 40px", backgroundColor: "#111827", border: "1px solid #1E2A4A", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {examOptions.map(e => <button key={e} onClick={() => { setExamFilter(e); setSubjectFilter("All Subjects"); }} style={{ ...S.btnSmall(examFilter === e), flexShrink: 0 }}>{e}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {subjectOptions.map(s => <button key={s} onClick={() => setSubjectFilter(s)} style={{ ...S.btnSmall(subjectFilter === s), flexShrink: 0, fontSize: 11 }}>{s}</button>)}
        </div>
        <p style={S.small}>{filtered.length} question{filtered.length !== 1 ? "s" : ""} found</p>
        <div style={S.gap(8)}>
          {filtered.slice(0, 50).map(q => (
            <button key={q.id} onClick={() => setSelected(q)} style={{ ...S.cardAlt, display: "flex", flexDirection: "column", gap: 6, cursor: "pointer", textAlign: "left", padding: 14 }}>
              <div style={S.row(6)}><span style={S.pill()}>{q.exam}</span><span style={S.pill("#111827", "#64748B")}>{q.subject}</span>{q.year && <span style={S.pill("#111827", "#374151")}>{q.year}</span>}</div>
              <p style={{ fontSize: 13, color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>{getQuestionText(q).length > 120 ? getQuestionText(q).slice(0, 120) + "…" : getQuestionText(q)}</p>
            </button>
          ))}
          {filtered.length === 0 && <p style={{ ...S.body, textAlign: "center", padding: "30px 0" }}>No questions found.</p>}
        </div>
      </div>
    </div>
  );
}

// ── NOTES SCREEN ──────────────────────────────────────────────────────────────
function NotesScreen({ onBack, onTestTopic, profile }) {
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topicNote, setTopicNote] = useState(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const userExams = profile?.exams || [];
  const scopedNotes = userExams.length > 0 ? NOTES.filter(n => userExams.includes(n.exam)) : NOTES;
  const scopedBooks = userExams.length > 0 ? BOOKS.filter(b => userExams.includes(b.exam)) : BOOKS;
  const examOptions = [...new Set(scopedNotes.map(n => n.exam))];
  const subjectOptions = exam ? [...new Set(scopedNotes.filter(n => n.exam === exam).map(n => n.subject))] : [];
  const topicOptions = exam && subject ? scopedNotes.filter(n => n.exam === exam && n.subject === subject) : [];

  if (showFlashcards && topicNote) {
    return <NoteFlashcards cards={topicNote.flashcards} onBack={() => setShowFlashcards(false)} />;
  }

  if (topicNote) {
    const videoId = topicNote.videoUrl.split("v=")[1];
    return (
      <div style={{ ...S.screen, overflowY: "auto" }}>
        <div style={S.header}>
          <button onClick={() => setTopicNote(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
            <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
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
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
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
          {scopedBooks.map(b => (
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
    { id: "coach", emoji: "🤖", title: "AceAi", desc: "Tell the coach what you're struggling with — get a personalized strategy.", color: "#10B981" },
  ];

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <style>{`
        @keyframes aiIconShine {
          0% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
          8% { opacity: 0.85; }
          22% { opacity: 0.85; }
          32% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
          100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
        }
      `}</style>
      <div style={S.header}>
        <div>
          <div style={S.h1}>AI Tools</div>
          <div style={S.small}>Powered by AceAi</div>
        </div>
      </div>
      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...S.card, backgroundColor: "#0D1E3D", border: "1px solid #1E3A5F", marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
            AceBoard's AI features are designed specifically for students writing WAEC, JAMB, SAT, IGCSE and more. Pick a tool below to get started.
          </div>
        </div>
        {tools.map((t, i) => (
          <button key={t.id} onClick={() => setScreen(t.id)}
            style={{ ...S.card, display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer", textAlign: "left", border: "1.5px solid #1E2A4A" }}>
            <div style={{
              position: "relative", width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              backgroundColor: `${t.color}1A`, border: `1.5px solid ${t.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <span style={{ fontSize: 26, zIndex: 1 }}>{t.emoji}</span>
              <div style={{
                position: "absolute", top: 0, left: 0, width: "45%", height: "100%",
                background: "linear-gradient(75deg, transparent, rgba(255,255,255,0.55), transparent)",
                animation: `aiIconShine 3400ms ease-in-out ${i * 500}ms infinite`,
                pointerEvents: "none",
              }} />
            </div>
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
const PLANNER_SUBJECTS_BY_EXAM = {
  WAEC: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting", "Agricultural Science", "Civic Education", "CRS/IRS"],
  NECO: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting", "Agricultural Science", "Civic Education", "CRS/IRS"],
  GCE: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting", "Agricultural Science", "Civic Education", "CRS/IRS"],
  JAMB: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Accounting", "CRS"],
  IGCSE: ["English Language", "English Literature", "Mathematics", "Additional Mathematics", "Physics", "Chemistry", "Biology", "Combined Science", "Economics", "Business Studies", "Accounting", "Geography", "History", "Computer Science", "ICT", "French", "Spanish", "Art & Design", "Religious Studies", "Sociology", "Environmental Management"],
  SAT: ["Reading and Writing", "Math"],
  ACT: ["English", "Math", "Reading", "Science"],
  IELTS: ["Listening", "Reading", "Writing", "Speaking"],
};

function AIStudyPlanner({ onBack }) {
  const [step, setStep] = useState("form"); // form | loading | result | history
  const [exam, setExam] = useState("WAEC");
  const [examDate, setExamDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const exams = ["WAEC", "JAMB", "NECO", "GCE", "IGCSE", "SAT", "ACT", "IELTS"];
  const availableSubjects = PLANNER_SUBJECTS_BY_EXAM[exam] || [];

  const toggleSubject = (subj) => {
    setSelectedSubjects(prev => prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]);
  };

  const changeExam = (e) => {
    setExam(e);
    setSelectedSubjects([]); // reset subject picks when exam changes since options differ
  };

  // Load saved plan history for this user
  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) { setLoadingHistory(false); return; }
      try {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSavedPlans(snap.data().studyPlans || []);
        }
      } catch (err) {
        console.error("Failed to load saved plans:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  const persistPlan = async (entry) => {
    if (!auth.currentUser) return;
    try {
      const ref = doc(db, "users", auth.currentUser.uid);
      const next = [entry, ...savedPlans].slice(0, 20); // cap history at 20
      await setDoc(ref, { studyPlans: next }, { merge: true });
      setSavedPlans(next);
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  };

  const generatePlan = async () => {
    if (!examDate || selectedSubjects.length === 0) {
      setError("Please pick your exam date and at least one subject.");
      return;
    }
    setError("");
    setStep("loading");
    try {
      const today = new Date();
      const target = new Date(examDate);
      const daysLeft = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
      const subjectsStr = selectedSubjects.join(", ");
      const resp = await fetch("/api/aceai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Create a detailed ${daysLeft}-day study plan for a student preparing for ${exam}. Subjects: ${subjectsStr}. Available study time: ${hoursPerDay} hours per day. Format as a weekly schedule (Week 1, Week 2, etc.) showing which subjects to study each day with approximate time allocation. Include a tip for each week. Keep it practical, specific, and encouraging. Max 300 words.`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const generatedPlan = data.reply || "Could not generate plan. Try again.";
      setPlan(generatedPlan);
      setStep("result");
      persistPlan({
        id: Date.now().toString(),
        exam,
        examDate,
        subjects: subjectsStr,
        hoursPerDay,
        plan: generatedPlan,
        createdAt: new Date().toISOString(),
      });
    } catch {
      setPlan("Something went wrong generating your plan — check your connection and try again.");
      setStep("result");
    }
  };

  const viewSavedPlan = (entry) => {
    setExam(entry.exam);
    setPlan(entry.plan);
    setStep("result");
  };

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Icon name="arrow_left" size={20} color="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={S.h1}>AI Study Planner</div>
          <div style={S.small}>Your personalized exam schedule</div>
        </div>
        {step === "form" && savedPlans.length > 0 && (
          <button onClick={() => setStep("history")} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", fontSize: 13, fontWeight: 700 }}>
            History ({savedPlans.length})
          </button>
        )}
      </div>

      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step === "form" && (<>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>SELECT EXAM</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {exams.map(e => (
                <button key={e} onClick={() => changeExam(e)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    backgroundColor: exam === e ? "#3B82F6" : "transparent",
                    borderColor: exam === e ? "#3B82F6" : "#1E2A4A",
                    color: exam === e ? "#fff" : "#94A3B8"
                  }}>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>
              SUBJECTS {selectedSubjects.length > 0 && `(${selectedSubjects.length} selected)`}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availableSubjects.map(subj => (
                <button key={subj} onClick={() => toggleSubject(subj)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 10, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    backgroundColor: selectedSubjects.includes(subj) ? "#1E3A5F" : "transparent",
                    borderColor: selectedSubjects.includes(subj) ? "#3B82F6" : "#1E2A4A",
                    color: selectedSubjects.includes(subj) ? "#fff" : "#94A3B8"
                  }}>
                  {selectedSubjects.includes(subj) && <Icon name="check" size={12} color="#3B82F6" />}
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginBottom: 8, letterSpacing: "0.08em" }}>HOURS AVAILABLE PER DAY</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6"].map(h => (
                <button key={h} onClick={() => setHoursPerDay(h)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, border: "1.5px solid", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    backgroundColor: hoursPerDay === h ? "#3B82F6" : "transparent",
                    borderColor: hoursPerDay === h ? "#3B82F6" : "#1E2A4A",
                    color: hoursPerDay === h ? "#fff" : "#94A3B8"
                  }}>
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
          <button onClick={() => { setStep("form"); setPlan(""); setSelectedSubjects([]); setExamDate(""); }}
            style={{ backgroundColor: "transparent", border: "1.5px solid #3B82F6", borderRadius: 14, padding: "14px", color: "#3B82F6", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Generate New Plan
          </button>
        </>)}

        {step === "history" && (<>
          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading...</div>
          ) : savedPlans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No saved plans yet.</div>
          ) : (
            savedPlans.map(entry => (
              <button key={entry.id} onClick={() => viewSavedPlan(entry)}
                style={{ ...S.card, textAlign: "left", cursor: "pointer", border: "1.5px solid #1E2A4A" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{entry.exam}</span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>{entry.subjects}</div>
              </button>
            ))
          )}
          <button onClick={() => setStep("form")}
            style={{ backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: "12px", color: "#94A3B8", fontSize: 14, cursor: "pointer" }}>
            ← Back to Planner
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
      const resp = await fetch("/api/aceai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `From the following study notes or text, generate exactly 8 flashcards. Each flashcard should have a clear question on one side and a concise answer on the other. Format your response as valid JSON only — an array of objects with "q" and "a" fields. Example: [{"q":"What is...","a":"It is..."}]. No other text, just the JSON array. Notes: ${inputText.slice(0, 1000)}`
        })
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const raw = data.reply || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCards(parsed);
        setCardIdx(0);
        setFlipped(false);
        setStep("studying");
      } else throw new Error("Bad format");
    } catch {
      setCards([{ q: "Something went wrong generating flashcards.", a: "Check your connection and try again — or try shorter notes." }]);
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
    { role: "assistant", text: "Hi! I'm AceAi, your AceBoard study coach. Tell me what subject or topic you're struggling with, and I'll help you figure out why — and how to fix it." }
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
      const resp = await fetch("/api/aceai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (!resp.ok) throw new Error("Coach unavailable");
      const data = await resp.json();
      const text = data.reply || "Sorry, I couldn't process that. Try again?";
      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong reaching AceAi — check your connection and try again." }]);
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
          <div style={S.h1}>AceAi</div>
          <div style={S.small}>Personalized help, not generic answers</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
            backgroundColor: m.role === "user" ? "#3B82F6" : "#161D33",
            color: m.role === "user" ? "#fff" : "#E2E8F0",
            borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap"
          }}>
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
function AboutScreen({ user, onSignOut, profile, missedQuestions }) {
  const [screen, setScreen] = useState("main"); // main | review | deleteConfirm
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const missedCount = Object.keys(missedQuestions || {}).length;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      // Delete Firestore user document
      const ref = doc(db, "users", user.uid);
      await deleteDoc(ref);
      // Delete Firebase Auth account
      await user.delete();
      // onSignOut will fire automatically via onAuthStateChanged
    } catch (err) {
      console.error("Delete error:", err);
      if (err.code === "auth/requires-recent-login") {
        setDeleteError("For security, please sign out and sign back in, then try deleting again.");
      } else {
        setDeleteError("Something went wrong deleting your account. Try again.");
      }
      setDeleting(false);
    }
  };

  if (screen === "review") {
    return <MissedQuestionsScreen missedQuestions={missedQuestions} profile={profile} onBack={() => setScreen("main")} />;
  }

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <div style={S.logo}>Ace<span style={S.logoAccent}>Board</span></div>
        <p style={{ ...S.body, marginTop: 4, fontSize: 13 }}>v1.0 · Built for students, everywhere</p>
      </div>

      <div style={{ ...S.px, ...S.gap(14) }}>
        {/* Profile card */}
        {user && (
          <div style={{ ...S.card, ...S.row(12) }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20, fontWeight: 800, color: "#3B82F6" }}>
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{user.displayName || "Student"}</div>
              <div style={{ ...S.small, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
              {profile?.exams?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {profile.exams.map(e => <span key={e} style={S.pill()}>{e}</span>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review missed questions */}
        <button onClick={() => setScreen("review")}
          style={{ ...S.card, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#2D1515", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="bookmark" size={20} color="#EF4444" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>Review Missed Questions</div>
            <div style={S.small}>{missedCount > 0 ? `${missedCount} question${missedCount === 1 ? "" : "s"} to review` : "No missed questions yet — keep practicing!"}</div>
          </div>
          <Icon name="chevron_right" size={18} color="#4A5568" />
        </button>

        {/* Premium coming soon */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #0A0F1E 0%, #0D1E3D 60%, #0A1628 100%)", border: "1px solid #1E3A5F", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent)", pointerEvents: "none" }} />
          <div style={{ ...S.row(10), marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F0F2FF" }}>AceBoard Premium</div>
              <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#1E3A5F", color: "#3B82F6", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>COMING SOON</span>
            </div>
          </div>
          {[
            { icon: "⚡", text: "Unlimited AI study sessions — no daily cap" },
            { icon: "📊", text: "Advanced analytics & readiness predictions" },
            { icon: "🏆", text: "Mock full-length exams with timed conditions" },
            { icon: "📚", text: "Full question banks for every exam year" },
            { icon: "🎯", text: "Personalised weak-topic drill mode" },
            { icon: "🔔", text: "Daily reminders & streak protection" },
          ].map(b => (
            <div key={b.text} style={{ ...S.row(10), marginBottom: 10, opacity: 0.85 }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: "#C9D2E8" }}>{b.text}</span>
            </div>
          ))}
          <button style={{ ...S.btnPrimary, marginTop: 6, opacity: 0.6, cursor: "not-allowed" }} disabled>
            Notify me when it's live
          </button>
        </div>

        {/* Settings row */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 12 }}>Account</p>
          <div style={S.gap(4)}>
            {[
              { label: "Sign out", icon: "external", action: onSignOut, color: "#94A3B8" },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #0D1326" }}>
                <span style={{ fontSize: 14, color: item.color || "#F0F2FF" }}>{item.label}</span>
                <Icon name="chevron_right" size={16} color="#4A5568" />
              </button>
            ))}
            <button onClick={() => setScreen("deleteConfirm")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ fontSize: 14, color: "#EF4444" }}>Delete Account</span>
              <Icon name="chevron_right" size={16} color="#4A5568" />
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "4px 0 16px" }}>
          <p style={{ fontSize: 11, color: "#1E2A4A" }}>AceBoard © 2026 · Built by Judah Kayode</p>
        </div>
      </div>

      {/* Delete confirm modal */}
      {screen === "deleteConfirm" && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 430, backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: "28px 24px 40px", border: "1px solid #1E2A4A" }}>
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h2 style={{ ...S.h2, textAlign: "center", marginBottom: 8 }}>Delete Account?</h2>
            <p style={{ ...S.body, textAlign: "center", marginBottom: 20, fontSize: 13 }}>
              This permanently deletes your account, all your progress, streaks, and saved questions. This cannot be undone.
            </p>
            {deleteError && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{deleteError}</p>}
            <div style={S.gap(10)}>
              <button onClick={handleDeleteAccount} disabled={deleting}
                style={{ ...S.btnPrimary, backgroundColor: "#EF4444", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button onClick={() => { setScreen("main"); setDeleteError(""); }}
                style={{ ...S.btnPrimary, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", color: "#94A3B8" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MISSED QUESTIONS REVIEW ──────────────────────────────────────────────────
function MissedQuestionsScreen({ missedQuestions, profile, onBack }) {
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [idx, setIdx] = useState(0);
  const missedIds = Object.keys(missedQuestions || {}).map(id => isNaN(id) ? id : Number(id));
  const missedQs = QUESTIONS.filter(q => missedIds.includes(q.id));
  const userExams = profile?.exams || [];
  const examCounts = userExams.map(e => ({ exam: e, count: missedQs.filter(q => q.exam === e).length })).filter(e => e.count > 0);

  if (!exam) return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0 }}>
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Account</span></div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={S.label}>Review</span>
          <InfoTooltip text="Every question you have gotten wrong lands here. Get one right again in practice and it automatically clears from this list." />
        </div>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Missed Questions</h1>
      </div>
      <div style={{ ...S.px, ...S.gap(12) }}>
        {examCounts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={S.body}>No missed questions — keep practicing and any wrong answers will show up here.</p>
          </div>
        ) : examCounts.map(({ exam: e, count }) => (
          <button key={e} onClick={() => setExam(e)} style={{ ...S.cardAlt, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", padding: 16 }}>
            <ExamLogo exam={e} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{e}</div>
              <div style={S.small}>{count} missed question{count === 1 ? "" : "s"}</div>
            </div>
            <Icon name="chevron_right" size={18} color="#4A5568" />
          </button>
        ))}
      </div>
    </div>
  );

  const examMissed = missedQs.filter(q => q.exam === exam);
  const subjectCounts = [...new Set(examMissed.map(q => q.subject))].map(s => ({ subject: s, count: examMissed.filter(q => q.subject === s).length }));

  if (!subject) return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={() => setExam(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0 }}>
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>All Exams</span></div>
        </button>
        <span style={{ ...S.label, marginTop: 10, display: "block" }}>{exam}</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 24 }}>Pick a subject</h1>
      </div>
      <div style={{ ...S.px, ...S.gap(12) }}>
        {subjectCounts.map(({ subject: s, count }) => (
          <button key={s} onClick={() => { setSubject(s); setIdx(0); }} style={{ ...S.cardAlt, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{s}</span>
            <span style={S.pill("#2D1515", "#EF4444")}>{count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const list = examMissed.filter(q => q.subject === subject);
  const q = list[idx];
  return (
    <div style={S.screen}>
      <div style={{ ...S.header, paddingBottom: 12 }}>
        <button onClick={() => { setSubject(null); setIdx(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0 }}>
          <div style={{ ...S.row(9), padding: "6px 0" }}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>All Subjects</span></div>
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 12 }}>
          <span style={S.label}>{exam} · {subject}</span>
          <span style={S.small}>{idx + 1} of {list.length}</span>
        </div>
        <div style={S.progressBar(((idx + 1) / list.length) * 100)}><div style={S.progressFill(((idx + 1) / list.length) * 100, "#EF4444")} /></div>
      </div>
      <div style={{ ...S.px, ...S.gap(14) }}>
        <div style={S.row(6)}><span style={S.pill()}>{q.topic}</span>{q.year && <span style={S.pill("#111827", "#64748B")}>{q.year}</span>}</div>
        <div style={{ ...S.card, padding: 18 }}><p style={{ fontSize: 15, lineHeight: 1.7, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{getQuestionText(q)}</p></div>
        {q.image && <img src={q.image} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid #1E2A4A" }} />}
        <div style={S.gap(8)}>
          {(q.options || []).map((opt, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid", fontSize: 14, display: "flex", gap: 12, alignItems: "center",
              backgroundColor: i === q.answer ? "#052E16" : "#0D1326", borderColor: i === q.answer ? "#22C55E" : "#1E2A4A", color: i === q.answer ? "#86EFAC" : "#E2E8F0" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#1E2A4A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{["A","B","C","D"][i]}</span>
              {opt}
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "#051A0F", border: "1px solid #14532D", borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", marginBottom: 8 }}>Explanation</p>
          <p style={{ ...S.body, fontSize: 13, margin: "0 0 8px" }}>{q.explanation}</p>
          {q.source && <p style={{ fontSize: 11, color: "#374151" }}>📚 {q.source}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}
            style={{ flex: 1, backgroundColor: "transparent", border: "1.5px solid #1E2A4A", borderRadius: 12, padding: 12, color: "#94A3B8", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>← Prev</button>
          <button onClick={() => setIdx(i => Math.min(i + 1, list.length - 1))} disabled={idx === list.length - 1}
            style={{ flex: 1, backgroundColor: "#3B82F6", border: "none", borderRadius: 12, padding: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: idx === list.length - 1 ? 0.3 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// ── SPLASH SCREEN ────────────────────────────────────
function SignInScreen({ onSignedIn }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);
      onSignedIn(result.user);
    } catch (err) {
      console.error(err);
      const msg =
        err.code === "auth/email-already-in-use" ? "That email's already registered. Try logging in instead." :
        err.code === "auth/invalid-credential" ? "Wrong email or password." :
        err.code === "auth/wrong-password" ? "Wrong email or password." :
        err.code === "auth/user-not-found" ? "No account found. Try signing up instead." :
        err.code === "auth/weak-password" ? "Password must be at least 6 characters." :
        err.code === "auth/invalid-email" ? "That doesn't look like a valid email address." :
        err.code === "auth/operation-not-allowed" ? "Email sign-in isn't enabled — contact support." :
        err.code === "auth/network-request-failed" ? "No internet — check your connection and try again." :
        err.code === "auth/too-many-requests" ? "Too many attempts — wait a moment and try again." :
        `Something went wrong (${err.code || "unknown"}). Try again.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 20,
        background: "linear-gradient(160deg, #EAF1FF 0%, #DCE8FB 45%, #EFF4FF 100%)",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400,
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: 28,
          boxShadow: "0 8px 40px rgba(59,130,246,0.12), 0 2px 8px rgba(11,18,32,0.06)",
          padding: "36px 28px",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#0B1220", lineHeight: 1.2 }}>
            Study Smarter,<br />Not Harder
          </div>
          <p style={{ fontSize: 14, marginTop: 10, color: "#64748B" }}>
            Study with the #1 exam prep app, and get linked to colleges that match you.
          </p>
        </div>

        <button
          onClick={() => { setMode("signup"); setError(null); }}
          style={{
            background: "#3B82F6", color: "#fff", border: "none", borderRadius: 100,
            padding: "16px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12,
            width: "100%",
          }}
        >
          Create Account
        </button>
        <button
          onClick={() => { setMode("signin"); setError(null); }}
          style={{
            background: "rgba(255,255,255,0.7)", color: "#0B1220", border: "1.5px solid #0B1220", borderRadius: 100,
            padding: "16px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 24,
            width: "100%",
          }}
        >
          Log In
        </button>

        {(mode === "signin" || mode === "signup") && (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: "rgba(255,255,255,0.7)", border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "14px 16px", fontSize: 15, color: "#0B1220", outline: "none",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                background: "rgba(255,255,255,0.7)", border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "14px 16px", fontSize: 15, color: "#0B1220", outline: "none",
              }}
            />
            {error && <p style={{ color: "#DC2626", fontSize: 13, textAlign: "center" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#0B1220", color: "#fff", border: "none", borderRadius: 10,
                padding: "14px 0", fontWeight: 700, fontSize: 14, cursor: "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Please wait…" : mode === "signup" ? "Sign up with Email" : "Log in with Email"}
            </button>
          </form>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.4)" }} />
          <span style={{ fontSize: 12, color: "#94A3B8" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.4)" }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "rgba(255,255,255,0.8)", color: "#0B1220", border: "1.5px solid #E2E8F0", borderRadius: 100,
            padding: "14px 0", fontWeight: 600, fontSize: 15, cursor: "pointer",
            opacity: loading ? 0.6 : 1,
            width: "100%",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.71H.99v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l3-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
// — SPLASH SCREEN —
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={() => onDone && onDone()}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "#0B0F1A", cursor: "pointer"
      }}
    >
      <style>{`
  @keyframes logoIn {
    0% { opacity: 0; transform: scale(0.82); }
    55% { opacity: 1; transform: scale(1.06); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes glowPulse {
    0%, 100% { filter: drop-shadow(0 0 0px rgba(59,130,246,0)); }
    50% { filter: drop-shadow(0 0 22px rgba(59,130,246,0.55)); }
  }
  @keyframes shineSweep {
    0% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
    10% { opacity: 0.9; }
    60% { opacity: 0.9; }
    100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
  }
  @keyframes wordUp {
    0% { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes tagUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .as-logo-wrap {
    position: relative; width: 96px; height: 96px; border-radius: 22px; overflow: hidden;
    animation: logoIn 700ms cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards,
               glowPulse 900ms ease-in-out 450ms 1;
    opacity: 0;
  }
  .as-logo-img { width: 100%; height: 100%; display: block; object-fit: contain; }
  .as-shine {
    position: absolute; top: 0; left: 0; width: 40%; height: 100%;
    background: linear-gradient(75deg, transparent, rgba(255,255,255,0.55), transparent);
    animation: shineSweep 650ms ease-in-out 300ms 1;
    pointer-events: none;
  }
  .as-word {
    margin-top: 20px; font-size: 30px; font-weight: 800; letter-spacing: -0.02em;
    color: #F0F4FF; opacity: 0;
    animation: wordUp 450ms ease-out 550ms forwards;
  }
  .as-tag {
    margin-top: 6px; font-size: 13px; color: #7C8AA5; opacity: 0;
    animation: tagUp 450ms ease-out 800ms forwards;
  }
  @media (prefers-reduced-motion: reduce) { .as-logo-wrap,.as-shine,.as-word,.as-tag { animation-duration: 0.01ms !important; animation-delay: 0ms !important; } }
`}</style>

      <div className="as-logo-wrap">
        <img src="/icon.png" alt="AceBoard" className="as-logo-img" />
        <div className="as-shine" />
      </div>

      <div className="as-word">Ace<span style={{ color: "#3B82F6" }}>Board</span></div>
      <div className="as-tag">Learn. Practice. Advance.</div>
    </div>
  );
}

// ── ONBOARDING SCREEN ─────────────────────────────────────────────────────────
const WAEC_SUBJECTS = ["English Language","Mathematics","Biology","Chemistry","Physics","Economics","Government","Literature in English","Geography","Commerce","Financial Accounting","Agricultural Science","Civic Education","CRS/IRS"];
const IGCSE_SUBJECTS = ["English Language","English Literature","Mathematics","Additional Mathematics","Physics","Chemistry","Biology","Combined Science","Economics","Business Studies","Accounting","Geography","History","Computer Science","ICT","French","Spanish","Art & Design","Religious Studies","Sociology","Environmental Management"];
const JAMB_SUBJECTS = ["Mathematics","Biology","Chemistry","Physics","Economics","Government","Literature in English","Geography","Commerce","Accounting","CRS"];
const GRADE_SCALE = ["A1","B2","B3","C4","C5","C6","D7","E8","F9"];
const IGCSE_GRADE_SCALE = ["A*","A","B","C","D","E","F","G"];
const JAMB_BANDS = [90, 80, 70, 60, 50, 40];

const WAEC_STYLE_EXAMS = ["WAEC", "NECO", "GCE"];

function gradeFeedback(grade, scale) {
  if (scale === "igcse") {
    if (["A*", "A"].includes(grade)) return { text: "Excellent choice!", emoji: "😄", color: "#22C55E" };
    if (["B", "C"].includes(grade)) return { text: "Good — aim a bit higher?", emoji: "🙂", color: "#FACC15" };
    return { text: "Aim higher!", emoji: "😬", color: "#F87171" };
  }
  if (["A1", "B2", "B3"].includes(grade)) return { text: "Excellent choice!", emoji: "😄", color: "#22C55E" };
  if (["C4", "C5", "C6"].includes(grade)) return { text: "Good — aim a bit higher?", emoji: "🙂", color: "#FACC15" };
  return { text: "Aim higher!", emoji: "😬", color: "#F87171" };
}

function GradeMascot({ feedback }) {
  if (!feedback) return null;
  return (
    <div key={feedback.subject + feedback.text} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      padding: "10px 16px", borderRadius: 14, backgroundColor: "#111827",
      border: `1.5px solid ${feedback.color}`,
      animation: "mascotIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
    }}>
      <style>{`
        @keyframes mascotIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.85); }
          60% { opacity: 1; transform: translateY(-3px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mascotBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-6deg); }
          75% { transform: translateY(-2px) rotate(6deg); }
        }
      `}</style>
      <span style={{ fontSize: 26, animation: "mascotBounce 700ms ease-in-out 400ms 2" }}>{feedback.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: feedback.color }}>
        {feedback.subject}: {feedback.text}
      </span>
    </div>
  );
}

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedExams, setSelectedExams] = useState([]);
  const [examTargets, setExamTargets] = useState({});
  const [feedback, setFeedback] = useState(null);

  const toggleExam = (exam) => {
    setSelectedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  const examSteps = selectedExams;
  const totalSteps = 2 + examSteps.length + 1;
  const currentExam = step >= 2 && step < 2 + examSteps.length ? examSteps[step - 2] : null;

  const getTarget = (exam) => examTargets[exam] || {};
  const setTarget = (exam, patch) => {
    setExamTargets(prev => ({ ...prev, [exam]: { ...prev[exam], ...patch } }));
  };

  const toggleSubject = (exam, subject) => {
    const t = getTarget(exam);
    const subjects = t.subjects || [];
    const next = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
    setTarget(exam, { subjects: next });
  };

  const pickGrade = (exam, subject, grade, scale) => {
    const t = getTarget(exam);
    setTarget(exam, { grades: { ...(t.grades || {}), [subject]: grade } });
    setFeedback({ subject, ...gradeFeedback(grade, scale) });
    setTimeout(() => setFeedback(null), 1600);
  };

  const jambTotal = (exam) => {
    const t = getTarget(exam);
    const scores = t.scores || {};
    return Object.values(scores).reduce((a, b) => a + (b || 0), 0);
  };

  const satTotal = (exam) => {
    const t = getTarget(exam);
    return (t.rw || 200) + (t.math || 200);
  };

  const ieltsAvg = (exam) => {
    const t = getTarget(exam);
    const vals = [t.listening, t.reading, t.writing, t.speaking].filter(v => v != null);
    if (vals.length === 0) return 0;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg * 2) / 2;
  };

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return selectedExams.length > 0;
    if (currentExam) {
      const t = getTarget(currentExam);
      if (WAEC_STYLE_EXAMS.includes(currentExam)) {
        const subs = t.subjects || [];
        const grades = t.grades || {};
        return subs.length > 0 && subs.every(s => grades[s]);
      }
      if (currentExam === "IGCSE") {
        const subs = t.subjects || [];
        const grades = t.grades || {};
        return subs.length > 0 && subs.every(s => grades[s]);
      }
      if (currentExam === "JAMB") {
        const scores = t.scores || {};
        const activeSubjects = ["English Language", ...(t.subjects || [])];
        return (t.subjects || []).length === 3 && activeSubjects.every(s => scores[s] != null);
      }
      if (currentExam === "SAT") return !!t.rw && !!t.math;
      if (currentExam === "ACT") return !!t.composite;
      if (currentExam === "IELTS") return !!t.listening && !!t.reading && !!t.writing && !!t.speaking;
      return true;
    }
    return true;
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else onComplete({ name: name.trim() || "Student", exams: selectedExams, targets: examTargets });
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.logo}>Ace<span style={S.logoAccent}>Board</span></div>
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: i === step ? 3 : 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= step ? "#3B82F6" : "#1E2A4A",
                transition: "flex 300ms ease",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {step === 0 && (
          <>
            <div>
              <p style={S.label}>Step 1 of {totalSteps}</p>
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
              <p style={S.label}>Step 2 of {totalSteps}</p>
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

        {WAEC_STYLE_EXAMS.includes(currentExam) && (() => {
          const t = getTarget(currentExam);
          const subjects = t.subjects || [];
          const grades = t.grades || {};
          const phase = subjects.length === 0 ? "subjects" : "grades";
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>
                  {phase === "subjects" ? `Which ${currentExam} subjects?` : `Set your target grades`}
                </h1>
                <p style={{ ...S.body, marginTop: 6 }}>
                  {phase === "subjects" ? "Pick every subject you're sitting." : `Tap a grade for each subject — A1 is highest, F9 is lowest.`}
                </p>
              </div>

              {phase === "subjects" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {WAEC_SUBJECTS.map(subj => (
                    <button
                      key={subj}
                      onClick={() => toggleSubject(currentExam, subj)}
                      style={{
                        ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 14,
                        border: `1.5px solid ${subjects.includes(subj) ? "#3B82F6" : "#1E2A4A"}`,
                        backgroundColor: subjects.includes(subj) ? "#1E3A5F" : "#111827",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>{subj}</span>
                        {subjects.includes(subj) && <Icon name="check" size={14} color="#3B82F6" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {phase === "grades" && (
                <div style={S.gap(16)}>
                  <GradeMascot feedback={feedback} />
                  {subjects.map(subj => (
                    <div key={subj}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF", marginBottom: 8 }}>{subj}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {GRADE_SCALE.map(g => (
                          <button
                            key={g}
                            onClick={() => pickGrade(currentExam, subj, g, "waec")}
                            style={{
                              padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                              border: `1.5px solid ${grades[subj] === g ? "#3B82F6" : "#1E2A4A"}`,
                              backgroundColor: grades[subj] === g ? "#1E3A5F" : "#111827",
                              color: "#F0F2FF",
                            }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setTarget(currentExam, { subjects: [] })}
                    style={{ background: "none", border: "none", color: "#7C8AA5", fontSize: 12, textAlign: "left", cursor: "pointer" }}
                  >
                    ← Edit subject list
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {currentExam === "IGCSE" && (() => {
          const t = getTarget("IGCSE");
          const subjects = t.subjects || [];
          const grades = t.grades || {};
          const phase = subjects.length === 0 ? "subjects" : "grades";
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>
                  {phase === "subjects" ? "Which IGCSE subjects?" : "Set your target grades"}
                </h1>
                <p style={{ ...S.body, marginTop: 6 }}>
                  {phase === "subjects" ? "Pick every subject you're sitting." : "Tap a grade for each subject — A* is highest, G is lowest."}
                </p>
              </div>

              {phase === "subjects" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {IGCSE_SUBJECTS.map(subj => (
                    <button
                      key={subj}
                      onClick={() => toggleSubject("IGCSE", subj)}
                      style={{
                        ...S.cardAlt, cursor: "pointer", textAlign: "left", padding: 14,
                        border: `1.5px solid ${subjects.includes(subj) ? "#3B82F6" : "#1E2A4A"}`,
                        backgroundColor: subjects.includes(subj) ? "#1E3A5F" : "#111827",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>{subj}</span>
                        {subjects.includes(subj) && <Icon name="check" size={14} color="#3B82F6" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {phase === "grades" && (
                <div style={S.gap(16)}>
                  <GradeMascot feedback={feedback} />
                  {subjects.map(subj => (
                    <div key={subj}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF", marginBottom: 8 }}>{subj}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {IGCSE_GRADE_SCALE.map(g => (
                          <button
                            key={g}
                            onClick={() => pickGrade("IGCSE", subj, g, "igcse")}
                            style={{
                              padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                              border: `1.5px solid ${grades[subj] === g ? "#3B82F6" : "#1E2A4A"}`,
                              backgroundColor: grades[subj] === g ? "#1E3A5F" : "#111827",
                              color: "#F0F2FF",
                            }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setTarget("IGCSE", { subjects: [] })}
                    style={{ background: "none", border: "none", color: "#7C8AA5", fontSize: 12, textAlign: "left", cursor: "pointer" }}
                  >
                    ← Edit subject list
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {currentExam === "JAMB" && (() => {
          const t = getTarget("JAMB");
          const extras = t.subjects || [];
          const scores = t.scores || {};
          const pickExtra = (subj) => {
            let next = extras.includes(subj) ? extras.filter(s => s !== subj) : [...extras, subj];
            let removed = null;
            if (next.length > 3) {
              removed = next[0];
              next = next.slice(1);
            }
            // Drop the stale score entry for any subject that just got swapped/removed
            // so the "all active subjects scored" check doesn't get confused by leftovers.
            const nextScores = { ...scores };
            if (removed) delete nextScores[removed];
            if (!next.includes(subj) && subj in nextScores) delete nextScores[subj];
            setTarget("JAMB", { subjects: next, scores: nextScores });
          };
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>JAMB targets</h1>
                <p style={{ ...S.body, marginTop: 6 }}>English is compulsory — pick 3 more subjects, then set your target score for each.</p>
              </div>

              <div style={S.gap(10)}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>Subjects (pick 3, plus English)</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {JAMB_SUBJECTS.map(subj => (
                    <button
                      key={subj}
                      onClick={() => pickExtra(subj)}
                      style={{
                        padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${extras.includes(subj) ? "#3B82F6" : "#1E2A4A"}`,
                        backgroundColor: extras.includes(subj) ? "#1E3A5F" : "#111827",
                        color: "#F0F2FF",
                      }}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {["English Language", ...extras].map(subj => (
                <div key={subj}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF", marginBottom: 8 }}>{subj}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {JAMB_BANDS.map(band => (
                      <button
                        key={band}
                        onClick={() => setTarget("JAMB", { scores: { ...scores, [subj]: band } })}
                        style={{
                          padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${scores[subj] === band ? "#3B82F6" : "#1E2A4A"}`,
                          backgroundColor: scores[subj] === band ? "#1E3A5F" : "#111827",
                          color: "#F0F2FF",
                        }}
                      >
                        {band}+
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #1E2A4A" }}>
                <p style={{ fontSize: 12, color: "#7C8AA5" }}>Target total</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>
                  {(scores["English Language"] || 0) + extras.reduce((a, s) => a + (scores[s] || 0), 0)}
                </p>
              </div>
            </>
          );
        })()}

        {currentExam === "SAT" && (() => {
          const t = getTarget("SAT");
          const rw = t.rw || 400;
          const math = t.math || 400;
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>SAT targets</h1>
                <p style={{ ...S.body, marginTop: 6 }}>Set your target score for each section (200–800).</p>
              </div>

              <div style={S.gap(24)}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>Reading & Writing</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{rw}</span>
                  </div>
                  <input
                    type="range" min={200} max={800} step={10} value={rw}
                    onChange={(e) => setTarget("SAT", { rw: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>Math</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{math}</span>
                  </div>
                  <input
                    type="range" min={200} max={800} step={10} value={math}
                    onChange={(e) => setTarget("SAT", { math: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #1E2A4A" }}>
                <p style={{ fontSize: 12, color: "#7C8AA5" }}>Target total</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>{rw + math}</p>
              </div>
            </>
          );
        })()}

        {currentExam === "ACT" && (() => {
          const t = getTarget("ACT");
          const composite = t.composite || 20;
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>ACT target</h1>
                <p style={{ ...S.body, marginTop: 6 }}>Set your target composite score (1–36).</p>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>Composite Score</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{composite}</span>
                </div>
                <input
                  type="range" min={1} max={36} step={1} value={composite}
                  onChange={(e) => setTarget("ACT", { composite: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #1E2A4A" }}>
                <p style={{ fontSize: 12, color: "#7C8AA5" }}>Target composite</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>{composite}</p>
              </div>
            </>
          );
        })()}

        {currentExam === "IELTS" && (() => {
          const t = getTarget("IELTS");
          const listening = t.listening || 6;
          const reading = t.reading || 6;
          const writing = t.writing || 6;
          const speaking = t.speaking || 6;
          const bandRow = (label, key, value) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F2FF" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{value}</span>
              </div>
              <input
                type="range" min={1} max={9} step={0.5} value={value}
                onChange={(e) => setTarget("IELTS", { [key]: Number(e.target.value) })}
                style={{ width: "100%" }}
              />
            </div>
          );
          return (
            <>
              <div>
                <p style={S.label}>Step {step + 1} of {totalSteps}</p>
                <h1 style={{ ...S.h1, marginTop: 8 }}>IELTS targets</h1>
                <p style={{ ...S.body, marginTop: 6 }}>Set your target band for each skill (1–9).</p>
              </div>

              <div style={S.gap(20)}>
                {bandRow("Listening", "listening", listening)}
                {bandRow("Reading", "reading", reading)}
                {bandRow("Writing", "writing", writing)}
                {bandRow("Speaking", "speaking", speaking)}
              </div>

              <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #1E2A4A" }}>
                <p style={{ fontSize: 12, color: "#7C8AA5" }}>Target overall band</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>
                  {(Math.round(((listening + reading + writing + speaking) / 4) * 2) / 2).toFixed(1)}
                </p>
              </div>
            </>
          );
        })()}

        {step === totalSteps - 1 && (
          <>
            <div>
              <p style={S.label}>Last step</p>
              <h1 style={{ ...S.h1, marginTop: 8 }}>You're all set, {name.trim() || "Student"}!</h1>
              <p style={{ ...S.body, marginTop: 6 }}>Here's what we've got:</p>
            </div>
            <div style={S.gap(10)}>
              {selectedExams.map(exam => (
                <div key={exam} style={{ ...S.cardAlt, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <ExamLogo exam={exam} size={24} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#F0F2FF" }}>{exam}</span>
                  </div>
                  {exam === "JAMB" && <p style={{ fontSize: 13, color: "#7C8AA5" }}>Target: {jambTotal(exam)}</p>}
                  {exam === "SAT" && <p style={{ fontSize: 13, color: "#7C8AA5" }}>Target: {satTotal(exam)}</p>}
                  {exam === "ACT" && <p style={{ fontSize: 13, color: "#7C8AA5" }}>Target: {getTarget(exam).composite || "—"}</p>}
                  {exam === "IELTS" && <p style={{ fontSize: 13, color: "#7C8AA5" }}>Target: {ieltsAvg(exam)} overall</p>}
                  {(WAEC_STYLE_EXAMS.includes(exam) || exam === "IGCSE") && (
                    <p style={{ fontSize: 13, color: "#7C8AA5" }}>
                      {(getTarget(exam).subjects || []).length} subjects targeted
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <button style={{ ...S.btnPrimary, opacity: canContinue() ? 1 : 0.4 }} disabled={!canContinue()} onClick={next}>
          {step === totalSteps - 1 ? "Start Practicing →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}


export default function AceBoard() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
const [minSplashDone, setMinSplashDone] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setMinSplashDone(true), 1200);
  return () => clearTimeout(t);
}, []);
const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [screen, setScreen] = useState("home"); useEffect(() => {
  }, [screen]);
  // home | config | quiz | results
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
  const [dailyActivity, setDailyActivity] = useState({}); // { "YYYY-MM-DD": { total, correct } }
  const [subjectStats, setSubjectStats] = useState({});
  const [missedQuestions, setMissedQuestions] = useState({});
  const [learningProgress, setLearningProgress] = useState({});
  const [satOfficialResults, setSatOfficialResults] = useState([]);
  const handleSatSessionChange = useCallback((snapshot) => setSatActiveTest(snapshot), []);
    const [satActiveTest, setSatActiveTest] = useState(null);
      const [satCompletedTests, setSatCompletedTests] = useState([]);
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
    const t = setTimeout(() => setBooting(false), 1250);
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
                        setSatCompletedTests(data.satCompletedTests || []);
            setBookmarks(data.bookmarks || []);
            setStats(data.stats || { total: 0, correct: 0 });
            setDailyActivity(data.dailyActivity || {});
            setSubjectStats(data.subjectStats || {});
            setMissedQuestions(data.missedQuestions || {});
            setLearningProgress(data.learningProgress || {});
            setSatOfficialResults(data.satOfficialResults || []);
                        setSatActiveTest(data.satActiveTest || null);
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
        setDoc(ref, { profile, bookmarks, stats, dailyActivity, subjectStats, missedQuestions, satActiveTest, satCompletedTests, learningProgress, satOfficialResults, email: user.email, name: user.displayName }, { merge: true }).catch(err => console.error("Save failed:", err));
  }, [user, profile, bookmarks, stats, dailyActivity, subjectStats, missedQuestions, satActiveTest, satCompletedTests, learningProgress, satOfficialResults]);

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

  const handleStart = (exam = null, subject = null, topic = null) => {
  const chosenExam = exam || profile?.exams?.find(e => e !== "SAT") || profile?.exams?.[0] || null;
    setDefaultExam(chosenExam);
    setDefaultSubject(subject);
    setDefaultTopic(topic);
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
    const today = dateKey(new Date());
    setDailyActivity(prev => {
      const existing = prev[today] || { total: 0, correct: 0 };
      return {
        ...prev,
        [today]: { total: existing.total + answers.length, correct: existing.correct + correct },
      };
    });
    // Log each answer's correctness against its question's exam+subject, for
    // recency-weighted per-subject accuracy on Home/Progress.
    setSubjectStats(prev => {
      const next = { ...prev };
      answers.forEach(a => {
        const q = (pool || []).find(p => p.id === a.qid);
        if (!q || !q.exam || !q.subject) return;
        const key = `${q.exam}::${q.subject}`;
        const existingLog = next[key]?.log || [];
        const updatedLog = [...existingLog, a.correct].slice(-50); // cap history at last 50 attempts
        next[key] = { log: updatedLog };
      });
      return next;
    });
    setMissedQuestions(prev => {
      const next = { ...prev };
      answers.forEach(a => {
        if (a.correct) delete next[a.qid];
        else next[a.qid] = true;
      });
      return next;
    });
    setScreen("results");
  };

  const handleToggleBookmark = (id) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handleSaveLearningProgress = (lessonId, record) => {
    setLearningProgress(prev => ({ ...prev, [lessonId]: record }));
  };

  const handleSaveOfficialSatResult = (record) => {
    setSatOfficialResults(prev => [record, ...prev]);
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

  if (booting || !authChecked || !minSplashDone) return <SplashScreen />;
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
                  onSaveExit={(snapshot) => setSatActiveTest(snapshot)}
          onSessionChange={handleSatSessionChange}
                  userName={user?.displayName || "Student"}
          allQuestions={QUESTIONS}
          practiceTest={quizConfig.practiceTest}
                    resumeState={satActiveTest?.practiceTest === quizConfig.practiceTest ? satActiveTest : null}
          isPracticeTest={quizConfig.mode === "practice"}
                    onFinish={(payload) => {
            const satPool = QUESTIONS.filter(
              q => q.exam === "SAT" && q.practiceTest === quizConfig.practiceTest
            );
            const { ans, pool, timeInfo } = bridgeSatFinish(payload, satPool);

            const qById = {};
            pool.forEach(q => { qById[q.id] = q; });
            const rwAns = ans.filter(a => qById[a.qid]?.subject === "Reading and Writing");
            const mathAns = ans.filter(a => qById[a.qid]?.subject === "Math");
            const rwScore = pctToScaledScore(rwAns.length ? (rwAns.filter(a => a.correct).length / rwAns.length) * 100 : 0);
            const mathScore = pctToScaledScore(mathAns.length ? (mathAns.filter(a => a.correct).length / mathAns.length) * 100 : 0);

            setSatCompletedTests(prev => [
              ...prev,
              {
                practiceTest: quizConfig.practiceTest,
                completedAt: Date.now(),
                answers: ans,
                totalScore: rwScore + mathScore,
                rwScore,
                mathScore,
              },
            ]);
            setSatActiveTest(null);

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
      {quizConfig?.exam === "SAT" ? (
        <SatResultsScreen
          answers={quizAnswers}
          questions={quizPool}
          timeInfo={quizTimeInfo}
          userName={user?.displayName || "Student"}
          onHome={handleHome}
          onReview={() => setScreen("review")}
        />
      ) : (
        <ResultsScreen answers={quizAnswers} questions={quizPool} mode={quizConfig?.mode} timeInfo={quizTimeInfo} profile={profile} onRetry={handleRetry} onHome={handleHome} onReview={() => setScreen("review")} />
      )}
    </div>
  )

    if (screen === "review") return (
    <div style={shellStyle}>
      {quizConfig?.exam === "SAT" ? (
        <SatReviewScreen answers={quizAnswers} questions={quizPool} onBack={() => setScreen("results")} />
      ) : (
        <ReviewScreen answers={quizAnswers} questions={quizPool} onBack={() => setScreen("results")} />
      )}
    </div>
  );

  if (screen === "search") return (
    <div style={shellStyle}>
      <QuestionSearchScreen onBack={() => setScreen("home")} profile={profile} />
    </div>
  );

  if (screen === "notes") return (
    <div style={shellStyle}>
      <NotesScreen onBack={() => setScreen("home")} onTestTopic={handleTestTopic} profile={profile} />
    </div>
  );
    if (screen === "selectSatTest") return (
    <div style={shellStyle}>
      <PracticeTestSelect
        allQuestions={QUESTIONS}
        activeTest={satActiveTest}
        completedTests={satCompletedTests}
        onSelect={(practiceTestNumber) => {
          handleBegin({
            exam: "SAT",
            practiceTest: practiceTestNumber,
            mode: "practice",
          });
        }}
        onResume={(activeTest) => {
          setQuizConfig({ exam: "SAT", practiceTest: activeTest.practiceTest, mode: "practice" });
          setScreen("quiz");
        }}
                onViewResults={(t) => {
          const pool = QUESTIONS.filter(
            q => q.exam === "SAT" && q.practiceTest === t.practiceTest
          );
          setQuizPool(pool);
          setQuizAnswers(t.answers);
          setQuizConfig({ exam: "SAT", practiceTest: t.practiceTest, mode: "practice" });
          setScreen("results");
        }}
        onBack={() => setScreen("home")}
      />
    </div>
  );

  const primaryAreas = ["home", "practice", "learn", "challenges", "analytics", "more", "sat-resources", "leaderboard", "resources", "search"];
  const isPrimaryArea = primaryAreas.includes(tab);
  const navItems = [
    { id: "home", label: "Home", icon: "home" },
    { id: "practice", label: "Practice", icon: "book" },
    { id: "learn", label: "Learn", icon: "school" },
    { id: "challenges", label: "Challenges", icon: "sparkles" },
    { id: "analytics", label: "Progress", icon: "chart" },
    { id: "more", label: "More", icon: "menu" },
  ];

  return (
    <div style={shellStyle}>
      {isPrimaryArea && tab !== "analytics" && <StudentWorkspace
        area={tab}
        profile={profile}
        stats={stats}
        bookmarks={bookmarks}
        questions={QUESTIONS}
        learningProgress={learningProgress}
        officialSatResults={satOfficialResults}
        onSaveOfficialSatResult={handleSaveOfficialSatResult}
        getActiveChallenges={() => callChallengeFunction("getActiveChallenges", {})}
        startChallenge={(challengeId) => callChallengeFunction("startChallenge", { challengeId })}
        submitChallenge={(challengeId, responses) => callChallengeFunction("submitChallengeAttempt", { challengeId, responses })}
        getLeaderboard={(scope) => callChallengeFunction("getChallengeLeaderboard", { scope })}
        onStartPractice={(exam, subject, topic) => handleStart(exam, subject, topic)}
        onOpenLegacy={(destination) => {
          const destinations = { saved: "bookmarks", progress: "analytics" };
          setTab(destinations[destination] || destination);
        }}
        selectedLessonId={selectedLessonId}
        onSelectLesson={setSelectedLessonId}
        onSaveLearningProgress={handleSaveLearningProgress}
        onSignOut={handleSignOut}
        user={user}
      />}
      {tab === "analytics" && <AnalyticsScreen stats={stats} profile={profile} dailyActivity={dailyActivity} subjectStats={subjectStats} />}
      {tab === "coach" && <AIHub onBack={() => setTab("home")} />}
      {tab === "colleges" && <CollegesScreen profile={profile} />}
      {tab === "bookmarks" && <BookmarksScreen bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} onStartBookmarkQuiz={() => handleStart("practice")} />}
      {tab === "about" && <AboutScreen user={user} onSignOut={handleSignOut} profile={profile} missedQuestions={missedQuestions} />}

      <nav className="ab-bottom-nav" style={{ maxWidth: Math.min(shellMaxWidth, 780) }}>
        {navItems.map(({ id, label, icon }) => (
          <button key={id} className={tab === id ? "is-active" : ""} onClick={() => { setScreen("home"); setTab(id); }}>
            <Icon name={icon} size={19} color={tab === id ? "#3459d4" : "#788398"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
// bridge — already confirmed shape
/* ============================ SAT Scoring Engine ============================ */
/* NOTE: College Board's real scoring curve is proprietary and varies slightly per
   test form. This is a reasonable smoothed approximation for practice purposes only. */

const SAT_CURVE_ANCHORS = [
  [0, 200], [10, 290], [20, 370], [30, 440], [40, 500],
  [50, 560], [60, 610], [70, 660], [80, 710], [90, 760], [100, 800],
];

function pctToScaledScore(pct) {
  for (let i = 0; i < SAT_CURVE_ANCHORS.length - 1; i++) {
    const [p1, s1] = SAT_CURVE_ANCHORS[i];
    const [p2, s2] = SAT_CURVE_ANCHORS[i + 1];
    if (pct >= p1 && pct <= p2) {
      const t = (pct - p1) / (p2 - p1);
      return Math.round((s1 + t * (s2 - s1)) / 10) * 10;
    }
  }
  return pct <= 0 ? 200 : 800;
}

// Map granular topics to official SAT domains
const RW_DOMAIN_MAP = {
  "Vocabulary in Context": "Information and Ideas",
  "Central Ideas and Details": "Information and Ideas",
  "Command of Evidence": "Information and Ideas",
  "Quantitative Evidence": "Information and Ideas",
  "Inferences": "Information and Ideas",
  "Text Structure and Purpose": "Craft and Structure",
  "Cross-Text Connections": "Craft and Structure",
  "Words in Context": "Craft and Structure",
  "Rhetorical Synthesis": "Expression of Ideas",
  "Transitions": "Expression of Ideas",
};
function getRWDomain(topic) {
  if (topic.startsWith("Standard English Conventions")) return "Standard English Conventions";
  return RW_DOMAIN_MAP[topic] || "Information and Ideas";
}
const MATH_DOMAIN_MAP = {
  "Algebra": "Algebra",
  "Advanced Math": "Advanced Math",
  "Problem-Solving and Data Analysis": "Problem-Solving and Data Analysis",
  "Statistics": "Problem-Solving and Data Analysis",
  "Geometry": "Geometry and Trigonometry",
  "Trigonometry": "Geometry and Trigonometry",
};
function getMathDomain(topic) {
  for (const key in MATH_DOMAIN_MAP) {
    if (topic.includes(key)) return MATH_DOMAIN_MAP[key];
  }
  return "Algebra";
}
function bridgeSatFinish({ results, answers }, satPool) {
  const selectedById = {};
  Object.values(answers).forEach(moduleAnswers => {
    Object.entries(moduleAnswers).forEach(([qid, selected]) => {
      selectedById[String(qid)] = selected;
    });
  });
  const ans = satPool.map(q => {
    const hasResponse = Object.prototype.hasOwnProperty.call(selectedById, String(q.id));
    const selected = hasResponse ? selectedById[String(q.id)] : undefined;
    const type = getQuestionType(q);
    const correct = hasResponse && (["numeric", "gridIn"].includes(type)
      ? String(selected).trim() === String(q.answer).trim()
      : selected === q.answer);
    return { qid: q.id, selected, correct };
  });
  const totalSeconds = results.reduce((sum, r) => sum + (r.timeSpentSeconds || 0), 0);
  return { ans, pool: satPool, timeInfo: { timeLog: null, timeLeft: null, totalSeconds } };
}
