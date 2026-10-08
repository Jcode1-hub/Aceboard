// Small, reviewable AceBoard-authored practice set. These records are drafts:
// the publication and rights gates intentionally prevent student delivery until
// an editor has reviewed the content and rights evidence.
const make = (exam, subject, rows, options = {}) => rows.map(([topic, difficulty, question, choices, answer, explanation, extra = {}], index) => ({
  id: `ab-${exam.toLowerCase()}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(index + 1).padStart(2, "0")}`,
  exam,
  examVersion: options.examVersion || "AceBoard starter curriculum map (2026)",
  subject,
  topic,
  skill: extra.skill || topic,
  difficulty,
  questionType: extra.questionType || "mcq",
  question,
  ...(extra.passage ? { passage: extra.passage } : {}),
  ...(choices ? { options: choices } : {}),
  answer,
  explanation,
  ...(options.section ? { section: options.section } : {}),
  source: "AceBoard-original starter draft; independently authored for learning practice.",
  sourceId: "aceboard-original-content",
  provenance: {
    kind: "aceboard-original",
    sourceId: "aceboard-original-content",
    sourceName: "AceBoard original authored content",
    sourceItemId: `starter-${exam.toLowerCase()}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
    createdBy: "OpenAI Codex (AceBoard authoring assistant)",
    model: "OpenAI Codex GPT-6",
    acquisitionMethod: "original-authorship",
    lastReviewedAt: null,
  },
  rightsStatus: "unknown",
  contentRights: "review-required",
  publicationStatus: "needs-review",
  tags: [exam.toLowerCase(), subject.toLowerCase(), topic.toLowerCase(), "aceboard-original", "editorial-review-required"],
  learningObjective: `Apply the ${topic.toLowerCase()} skill in an original ${exam} ${subject} practice context.`,
  createdAt: "2026-10-08T00:00:00.000Z",
  revision: 1,
}));

const datasets = [
  ["JAMB", "Use of English", [
    ["Sentence interpretation", "Easy", "Choose the option closest in meaning to: The committee finally **reached a decision** after a long discussion.", ["made a choice", "ended the meeting", "changed its members", "postponed the matter"], 0, "To reach a decision means to make or arrive at a choice."],
    ["Concord", "Medium", "Neither the coach nor the players ___ willing to leave before the review was complete.", ["was", "were", "is", "has been"], 1, "With neither…nor, the verb agrees with the nearer subject, players, which is plural."],
    ["Vocabulary in context", "Medium", "In the sentence ‘The witness gave a **candid** account’, candid most nearly means:", ["frank", "confusing", "hostile", "incomplete"], 0, "A candid account is open and honest."],
  ]],
  ["JAMB", "Mathematics", [
    ["Linear equations", "Easy", "Solve 3(2x − 1) = 15.", ["2", "3", "4", "5"], 1, "Divide by 3 to get 2x − 1 = 5; hence x = 3."],
    ["Ratio and proportion", "Medium", "A drink is mixed in the ratio syrup:water = 2:5. If the mixture contains 21 litres, how many litres are water?", ["6", "12", "15", "18"], 2, "There are 7 equal parts. Each is 21 ÷ 7 = 3 L, so water is 5 × 3 = 15 L."],
    ["Sequences", "Medium", "The first term of an arithmetic sequence is 7 and its common difference is 4. What is the 8th term?", ["31", "35", "39", "43"], 1, "a₈ = 7 + (8 − 1)4 = 35."],
  ]],
  ["JAMB", "Physics", [
    ["Uniform acceleration", "Easy", "A cart starts from rest and accelerates uniformly at 2 m/s² for 5 s. What is its final speed?", ["2 m/s", "5 m/s", "10 m/s", "25 m/s"], 2, "v = u + at = 0 + (2)(5) = 10 m/s."],
    ["Density", "Medium", "A metal block has mass 540 g and volume 200 cm³. What is its density?", ["0.37 g/cm³", "2.7 g/cm³", "27 g/cm³", "740 g/cm³"], 1, "Density = mass ÷ volume = 540 ÷ 200 = 2.7 g/cm³."],
    ["Electrical power", "Medium", "A 12 Ω resistor carries a current of 2 A. How much power is dissipated?", ["6 W", "24 W", "48 W", "96 W"], 2, "P = I²R = 2² × 12 = 48 W."],
  ]],
  ["JAMB", "Chemistry", [
    ["Atomic structure", "Easy", "An atom has 11 protons and 12 neutrons. What is its mass number?", ["11", "12", "23", "132"], 2, "Mass number is the total number of protons and neutrons: 11 + 12 = 23."],
    ["Acids and bases", "Medium", "Which pH value represents the most acidic solution?", ["2", "6", "8", "12"], 0, "Lower pH indicates greater acidity; pH 2 is the lowest listed."],
    ["Chemical bonding", "Medium", "Which type of bond forms when one atom transfers electrons to another?", ["Covalent", "Ionic", "Metallic", "Hydrogen"], 1, "Electron transfer creates oppositely charged ions held together by electrostatic attraction."],
  ]],
  ["JAMB", "Biology", [
    ["Cell structure", "Easy", "Which organelle is the main site of aerobic respiration in a typical eukaryotic cell?", ["Ribosome", "Mitochondrion", "Golgi apparatus", "Vacuole"], 1, "Mitochondria carry out most aerobic respiration and ATP production in eukaryotic cells."],
    ["Ecology", "Medium", "In a food chain, green plants are called producers because they:", ["consume herbivores", "make organic food from inorganic materials", "decompose dead matter", "return nitrogen directly to air"], 1, "Producers capture energy, usually from sunlight, and synthesize organic compounds."],
    ["Genetics", "Medium", "For a cross Aa × Aa, assuming complete dominance, what fraction of offspring is expected to show the recessive phenotype?", ["0", "1/4", "1/2", "3/4"], 1, "The genotype ratio is 1 AA:2 Aa:1 aa; only aa shows the recessive phenotype, or 1/4."],
  ]],
  ["WAEC", "English Language", [
    ["Punctuation", "Easy", "Which sentence uses the apostrophe correctly?", ["The teachers lounge is upstairs.", "The teacher's lounge is upstairs.", "The teachers' lounge is upstairs. (for one teacher)", "The teachers lounge's is upstairs."], 1, "For a lounge belonging to one teacher, the singular possessive is teacher's."],
    ["Inference", "Medium", "Mara packed an umbrella after checking the dark clouds gathering above the town. What is the most reasonable inference?", ["She expects rain may fall.", "She plans to travel by boat.", "The sky is already clear.", "She dislikes walking."], 0, "Dark clouds and an umbrella suggest she is preparing for possible rain; no other motive is supported."],
    ["Sentence structure", "Medium", "Choose the clearest revision: ‘Because the laboratory was closed. We returned the next morning.’", ["Because the laboratory was closed, we returned the next morning.", "The laboratory, because closed. We returned next morning.", "We returned. Because the laboratory was closed the next morning.", "Because closed, the laboratory returned us next morning."], 0, "Joining the dependent clause to the main clause removes the fragment and preserves the intended meaning."],
  ]],
  ["WAEC", "Mathematics", [
    ["Percentages", "Easy", "A bag marked ₦8,000 is discounted by 15%. What is the sale price?", ["₦6,400", "₦6,800", "₦7,200", "₦7,850"], 1, "15% of ₦8,000 is ₦1,200; subtracting gives ₦6,800."],
    ["Coordinate geometry", "Medium", "Find the gradient of the line through (2, 3) and (6, 11).", ["1/2", "2", "4", "8"], 1, "Gradient = (11 − 3)/(6 − 2) = 8/4 = 2."],
    ["Probability", "Medium", "A fair six-sided die is rolled once. What is the probability of obtaining a prime number?", ["1/6", "1/3", "1/2", "2/3"], 2, "The primes from 1 to 6 are 2, 3 and 5, so the probability is 3/6 = 1/2."],
  ]],
  ["WAEC", "Physics", [
    ["Work and energy", "Easy", "A 20 N force moves a box 3 m in the direction of the force. How much work is done?", ["6 J", "17 J", "23 J", "60 J"], 3, "W = Fd for parallel force and displacement: 20 × 3 = 60 J."],
    ["Waves", "Medium", "A wave travels at 24 m/s and has frequency 6 Hz. What is its wavelength?", ["0.25 m", "4 m", "18 m", "144 m"], 1, "v = fλ, so λ = 24/6 = 4 m."],
    ["Series circuits", "Medium", "Two 4 Ω resistors are connected in series to a 12 V supply. What current flows?", ["0.67 A", "1.5 A", "3 A", "6 A"], 1, "Series resistance is 8 Ω. Ohm's law gives I = 12/8 = 1.5 A."],
  ]],
  ["WAEC", "Chemistry", [
    ["Mole concept", "Medium", "How many moles are present in 18 g of water? (H₂O = 18 g/mol)", ["0.5 mol", "1 mol", "2 mol", "18 mol"], 1, "Amount = mass ÷ molar mass = 18/18 = 1 mol."],
    ["Separation techniques", "Easy", "Which method is most suitable for separating an insoluble solid from a liquid?", ["Filtration", "Fractional distillation", "Chromatography", "Sublimation"], 0, "A filter retains the insoluble solid while the liquid passes through."],
    ["Reaction rates", "Medium", "Why does powdered calcium carbonate generally react faster than equal-mass large chips with dilute acid?", ["It has a lower mass.", "It exposes a greater surface area.", "It changes the acid into a catalyst.", "It removes the products."], 1, "Smaller particles expose more surface to collisions with acid particles, increasing reaction rate."],
  ]],
  ["WAEC", "Biology", [
    ["Photosynthesis", "Easy", "Which raw material supplies the carbon atoms used to make glucose during photosynthesis?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Water vapour"], 1, "Carbon dioxide supplies carbon for carbohydrate synthesis in photosynthesis."],
    ["Human circulation", "Medium", "Which blood vessel carries oxygenated blood from the lungs to the heart?", ["Pulmonary artery", "Pulmonary vein", "Vena cava", "Aorta"], 1, "The pulmonary veins return oxygenated blood from the lungs to the left atrium."],
    ["Inheritance", "Medium", "A heterozygous tall plant (Tt) is crossed with a short plant (tt). If T is dominant, what fraction is expected to be short?", ["0", "1/4", "1/2", "3/4"], 2, "The cross produces Tt and tt in equal proportions; half are short."],
  ]],
  ["WAEC", "Economics", [
    ["Demand", "Easy", "If the price of a normal good falls and other factors remain constant, what usually happens to quantity demanded?", ["It increases.", "It decreases.", "It remains exactly zero.", "Supply becomes demand."], 0, "The law of demand predicts an inverse relationship between price and quantity demanded, all else equal."],
    ["Opportunity cost", "Medium", "A student spends Saturday working for ₦5,000 instead of attending a free workshop. The opportunity cost of working is:", ["₦5,000 only", "the value of the workshop opportunity forgone", "the student's total weekly income", "the cost of transport to work"], 1, "Opportunity cost is the value of the next best alternative sacrificed."],
    ["Inflation", "Medium", "If a household's money income stays fixed while the general price level rises, its purchasing power generally:", ["rises", "falls", "doubles", "becomes unrelated to prices"], 1, "A higher price level means the same nominal income buys fewer goods and services."],
  ]],
  ["WAEC", "Government", [
    ["Separation of powers", "Easy", "In a constitutional system, the main purpose of separating legislative, executive and judicial powers is to:", ["concentrate authority in one office", "reduce abuse through checks and balances", "remove the need for courts", "make elections unnecessary"], 1, "Distributing authority enables institutions to check one another and limits arbitrary power."],
    ["Citizenship", "Medium", "Which is an example of a civic responsibility that supports accountable government?", ["Refusing all public information", "Voting and evaluating candidates", "Ignoring laws one dislikes", "Preventing others from participating"], 1, "Informed participation, including voting, helps citizens hold representatives accountable."],
    ["Constitution", "Medium", "A constitution is best described as:", ["a temporary campaign speech", "the fundamental framework of a state's government and powers", "a list of private business prices", "a court judgment in every individual case"], 1, "A constitution establishes governing institutions, authority and often citizens' rights."],
  ]],
  ["NECO", "English Language", [
    ["Main idea", "Easy", "A paragraph explains how shade trees lower street temperatures, reduce glare and improve walking comfort. Which title best captures its main idea?", ["The History of Street Names", "Benefits of Trees Along Streets", "How to Build a Road", "Measuring Rainfall"], 1, "The title includes all three benefits described without introducing an unrelated subject."],
    ["Verb tense", "Easy", "By the time the guests arrived, the host ___ the meal.", ["prepares", "has prepared", "had prepared", "will prepare"], 2, "The meal was completed before another past event, so the past perfect is appropriate."],
    ["Word choice", "Medium", "Choose the word that best completes: The engineer checked the measurements twice to ensure they were ___.", ["accurate", "casual", "distant", "ordinary"], 0, "Accurate means correct or precise, which fits checking measurements."],
  ]],
  ["NECO", "Mathematics", [
    ["Fractions", "Easy", "Evaluate 3/4 + 1/8.", ["4/12", "5/8", "7/8", "1"], 2, "Convert 3/4 to 6/8; 6/8 + 1/8 = 7/8."],
    ["Simultaneous equations", "Medium", "If x + y = 9 and x − y = 3, what is x?", ["3", "6", "9", "12"], 1, "Adding the equations gives 2x = 12, so x = 6."],
    ["Mensuration", "Medium", "A rectangle is 9 cm long and 4 cm wide. What is its perimeter?", ["13 cm", "26 cm", "36 cm", "72 cm"], 1, "Perimeter = 2(l + w) = 2(9 + 4) = 26 cm."],
  ]],
  ["NECO", "Physics", [
    ["Pressure", "Easy", "A force of 30 N acts normally on an area of 0.5 m². What pressure is produced?", ["15 Pa", "30 Pa", "60 Pa", "150 Pa"], 2, "Pressure = force ÷ area = 30/0.5 = 60 Pa."],
    ["Momentum", "Medium", "A 2 kg trolley moves at 3 m/s. What is its momentum?", ["1.5 kg m/s", "5 kg m/s", "6 kg m/s", "9 kg m/s"], 2, "Momentum p = mv = 2 × 3 = 6 kg m/s."],
    ["Heat transfer", "Medium", "Which mode of heat transfer can occur through a vacuum?", ["Conduction", "Convection", "Radiation", "Conduction and convection only"], 2, "Radiation travels by electromagnetic waves and does not require a material medium."],
  ]],
  ["NECO", "Chemistry", [
    ["Elements and compounds", "Easy", "Which statement describes a compound?", ["A substance made of one type of atom only", "Two or more elements chemically combined in a fixed ratio", "Any mixture that can be filtered", "A single uncombined molecule of an element"], 1, "Compounds contain elements chemically bonded in definite proportions."],
    ["Periodic table", "Medium", "Elements in the same group of the periodic table generally have similar chemical properties because they have the same number of:", ["neutrons", "occupied shells", "outer-shell electrons", "nucleons"], 2, "For main-group elements, the same valence-electron count leads to similar chemical behavior."],
    ["Oxidation and reduction", "Medium", "In the change Fe²⁺ → Fe³⁺, the iron ion is:", ["reduced by gaining an electron", "oxidized by losing an electron", "unchanged in oxidation state", "neutralized by gaining a proton"], 1, "The oxidation state rises from +2 to +3, which corresponds to loss of one electron and oxidation."],
  ]],
  ["NECO", "Biology", [
    ["Classification", "Easy", "Which feature is shared by all mammals?", ["They lay hard-shelled eggs.", "They possess hair at some stage of life.", "They live only on land.", "They have gills as adults."], 1, "Hair or fur at some life stage is a defining characteristic of mammals."],
    ["Transport in plants", "Medium", "Which tissue mainly transports water and mineral ions upward from roots?", ["Phloem", "Xylem", "Epidermis", "Cambium"], 1, "Xylem conducts water and dissolved minerals from roots toward stems and leaves."],
    ["Reproduction", "Medium", "Fertilization in flowering plants occurs when:", ["pollen lands on a leaf", "a male gamete fuses with the egg cell", "a seed absorbs water", "the ovary becomes a root"], 1, "Fertilization is fusion of male and female gametes; in flowering plants it occurs in the ovule."],
  ]],
  ["IGCSE", "Mathematics", [
    ["Algebraic expansion", "Easy", "Expand (x + 4)(x − 2).", ["x² + 2x − 8", "x² − 2x − 8", "x² + 6x + 8", "x² − 8"], 0, "Multiplying gives x² − 2x + 4x − 8 = x² + 2x − 8."],
    ["Trigonometry", "Medium", "In a right triangle, the side opposite angle θ is 6 cm and the hypotenuse is 10 cm. What is sin θ?", ["3/5", "4/5", "5/3", "10/6"], 0, "sin θ = opposite/hypotenuse = 6/10 = 3/5."],
    ["Statistics", "Medium", "The values are 2, 4, 4, 7 and 8. What is the median?", ["2", "4", "5", "7"], 1, "The ordered list has five values; the central third value is 4."],
  ]],
  ["IGCSE", "English", [
    ["Writer's purpose", "Easy", "A writer describes a community garden using precise sensory details and ends by inviting neighbours to volunteer. The main purpose is most likely to:", ["explain a chemical process", "encourage community involvement", "report a court decision", "compare two sports"], 1, "The descriptive account and direct invitation are intended to encourage participation."],
    ["Evidence and inference", "Medium", "A report says a town's library extended its evening hours; visits after 6 p.m. then rose by 30%. Which conclusion is best supported?", ["The extended hours may have made evening visits easier.", "Every resident now visits daily.", "The library reduced its book collection.", "Evening visits caused the town's population to grow."], 0, "The timing supports a cautious link between later hours and increased evening visits, not the broader claims."],
    ["Sentence control", "Medium", "Choose the sentence with a clear and correct subject-verb agreement.", ["A box of old maps were found in the attic.", "A box of old maps was found in the attic.", "A box of old maps have found in the attic.", "A box of old maps are found in the attic."], 1, "The subject is singular box, so it takes was."],
  ]],
  ["IGCSE", "Physics", [
    ["Electricity", "Easy", "A 6 V battery is connected across a 3 Ω resistor. What current flows?", ["0.5 A", "2 A", "9 A", "18 A"], 1, "I = V/R = 6/3 = 2 A."],
    ["Forces", "Medium", "A resultant force of 12 N acts on a 4 kg object. What is its acceleration?", ["0.33 m/s²", "3 m/s²", "8 m/s²", "48 m/s²"], 1, "Newton's second law gives a = F/m = 12/4 = 3 m/s²."],
    ["Specific heat capacity", "Medium", "How much energy is needed to raise the temperature of 0.5 kg of a material by 10 °C if its specific heat capacity is 400 J kg⁻¹ °C⁻¹?", ["200 J", "2,000 J", "4,000 J", "20,000 J"], 1, "Q = mcΔT = 0.5 × 400 × 10 = 2,000 J."],
  ]],
  ["IGCSE", "Chemistry", [
    ["Periodic trends", "Easy", "Across a period, the proton number of successive elements generally:", ["decreases by one", "increases by one", "stays constant", "doubles"], 1, "Each successive element has one additional proton in its nucleus."],
    ["Acids and salts", "Medium", "Which products form when hydrochloric acid reacts completely with sodium hydroxide?", ["Sodium chloride and water", "Sodium and chlorine", "Hydrogen and oxygen", "Sodium carbonate and water"], 0, "Acid-base neutralization: HCl + NaOH → NaCl + H₂O."],
    ["Formulae and equations", "Medium", "What is the coefficient of O₂ when this equation is balanced with the smallest whole numbers: C₃H₈ + O₂ → CO₂ + H₂O?", ["3", "4", "5", "8"], 2, "Balancing gives C₃H₈ + 5O₂ → 3CO₂ + 4H₂O."],
  ]],
  ["IGCSE", "Biology", [
    ["Enzymes", "Easy", "Why does a human enzyme usually work poorly at a temperature far above its optimum?", ["Its active site may change shape.", "It gains a cell wall.", "The substrate becomes an enzyme.", "It is converted into DNA."], 0, "High temperatures can denature the enzyme, altering the active site so the substrate no longer fits."],
    ["Gas exchange", "Medium", "Which feature of alveoli helps rapid gas exchange?", ["Thick dry walls", "Large surface area and thin walls", "No blood supply", "Very low ventilation"], 1, "Many thin-walled alveoli provide large area and a short diffusion distance, supported by blood flow and ventilation."],
    ["Homeostasis", "Medium", "When blood glucose rises after a meal, which hormone helps lower it by promoting uptake and storage?", ["Adrenaline", "Insulin", "Thyroxine", "Glucagon"], 1, "Insulin promotes glucose uptake by cells and storage as glycogen, lowering blood glucose."],
  ]],
  ["SAT", "Reading and Writing", [
    ["Craft and Structure · Words in Context", "Medium", "In a short research note, the author says a result was ‘tentative’ because the sample was small. Here, tentative most nearly means:", ["provisional", "celebratory", "irrelevant", "permanent"], 0, "A small sample limits certainty, so the conclusion is provisional rather than final.", { section: "Reading and Writing", skill: "Words in Context" }],
    ["Information and Ideas · Inference", "Medium", "A city planted trees along two streets. Sensors showed lower afternoon temperatures on both streets, while nearby unplanted streets showed no comparable change. Which conclusion is best supported?", ["The planting may have contributed to lower street temperatures.", "Trees eliminate all urban heat.", "Every city street will cool by the same amount.", "Sensors cannot measure temperature."], 0, "The comparison is consistent with a cooling effect, while the evidence does not justify a universal claim.", { section: "Reading and Writing", skill: "Inference" }],
    ["Standard English Conventions · Boundaries", "Easy", "Choose the sentence with correct punctuation.", ["The survey was brief, however its results were useful.", "The survey was brief; however, its results were useful.", "The survey was brief however, its results were useful.", "The survey was brief; however its results, were useful."], 1, "A semicolon can join independent clauses before the conjunctive adverb however, which is followed by a comma.", { section: "Reading and Writing", skill: "Boundaries" }],
  ], { section: "Reading and Writing", examVersion: "Digital SAT skill practice · original AceBoard content" }],
  ["SAT", "Math", [
    ["Algebra · Linear equations", "Easy", "If 4x + 7 = 31, what is the value of x?", ["4", "5", "6", "7"], 2, "Subtract 7 to get 4x = 24, then divide by 4: x = 6.", { section: "Math", skill: "Algebra" }],
    ["Advanced Math · Quadratics", "Medium", "The equation x² − 9 = 0 has two solutions. What is their sum?", ["−9", "0", "3", "9"], 1, "The roots are 3 and −3, whose sum is 0.", { section: "Math", skill: "Advanced Math" }],
    ["Problem-Solving and Data Analysis · Rates", "Medium", "A printer produces 84 pages in 7 minutes at a constant rate. How many pages will it produce in 12 minutes?", ["108", "126", "144", "168"], 2, "The rate is 84/7 = 12 pages per minute; 12 × 12 = 144 pages.", { section: "Math", skill: "Problem-Solving and Data Analysis" }],
  ], { section: "Math", examVersion: "Digital SAT skill practice · original AceBoard content" }],
  ["ACT", "English", [
    ["Production of Writing", "Medium", "A student is revising a paragraph about a school garden. Which sentence best supports the claim that the garden is useful for science learning?", ["The garden gate is painted green.", "Students record plant growth each week and compare how light affects it.", "The garden is beside a parking area.", "Many students enjoy lunch outdoors."], 1, "This sentence directly links garden activity to observation and comparison in science."],
    ["Conventions of Standard English", "Easy", "Choose the correctly punctuated sentence.", ["Before the bell rang the class, had finished.", "Before the bell rang, the class had finished.", "Before, the bell rang the class had finished.", "Before the bell, rang the class had finished."], 1, "A comma follows the introductory dependent clause; the main clause then reads clearly."],
    ["Knowledge of Language", "Medium", "Which revision is most concise while preserving the meaning? ‘At this point in time, the team is currently reviewing the plan.’", ["At this point in time, the team currently reviews the plan.", "The team is reviewing the plan now.", "Currently, at this point, the team reviews the plan.", "The team is at this point in time reviewing currently."], 1, "Now preserves the meaning and removes redundant phrases at this point in time and currently."],
  ], { section: "English" }],
  ["ACT", "Math", [
    ["Algebra", "Easy", "A taxi charges a fixed ₦500 plus ₦180 per kilometre. What is the fare for a 6 km trip?", ["₦1,080", "₦1,380", "₦1,580", "₦3,000"], 2, "Fare = 500 + 180(6) = ₦1,580."],
    ["Functions", "Medium", "If f(x) = 2x² − 1, what is f(3)?", ["11", "15", "17", "35"], 2, "Substitute 3: 2(9) − 1 = 17."],
    ["Statistics and probability", "Medium", "A bag contains 3 red and 5 blue counters. One counter is selected at random. What is the probability it is red?", ["3/8", "1/2", "5/8", "3/5"], 0, "There are 3 red counters out of 8 total, so the probability is 3/8."],
  ], { section: "Math" }],
  ["ACT", "Reading", [
    ["Key Ideas and Details", "Medium", "A field note reports that a footpath was busiest at sunrise, when nearby market workers arrived, and quieter later in the morning. Which statement best summarizes the observation?", ["Use of the path varied by time of day.", "The path was closed at sunrise.", "Market workers avoided the path.", "The note measured weekly rainfall."], 0, "The note contrasts higher early use with lower later use, showing time-based variation."],
    ["Craft and Structure", "Medium", "A narrator calls a plan ‘ambitious but workable’ after listing its costs and staffing needs. The phrase suggests the narrator considers the plan:", ["impossible under any conditions", "challenging yet feasible", "already completed", "unrelated to the evidence"], 1, "Ambitious signals difficulty while workable means it can be carried out."],
    ["Integration of Knowledge and Ideas", "Medium", "Report A says a town's bus service added riders after routes became more frequent. Report B says riders also increased during a fuel-price rise. What is the strongest conclusion?", ["Both reports offer possible factors; they do not isolate one cause.", "Fuel prices never affect transport choices.", "More frequent routes always reduce riders.", "The two reports prove the same single cause."], 0, "The observations suggest multiple plausible influences but do not establish a sole cause."],
  ], { section: "Reading" }],
  ["ACT", "Science", [
    ["Data Interpretation", "Easy", "A plant grew 2 cm in week 1, 5 cm in week 2 and 7 cm in week 3. Between which consecutive weeks was the increase in growth greatest?", ["Weeks 1 to 2", "Weeks 2 to 3", "The increases were equal", "There was no increase"], 0, "The increase was 3 cm from week 1 to 2 and 2 cm from week 2 to 3."],
    ["Scientific Investigation", "Medium", "A student tests whether light intensity affects seedling growth. Which factor should be kept the same across groups to make the comparison fair?", ["The light intensity being tested", "The seed type and watering schedule", "The measured growth result", "The group label"], 1, "Holding seed type and water constant helps isolate the effect of light intensity."],
    ["Evaluating Models", "Medium", "Two models predict that a liquid cools over time. Model A predicts 60 °C after 10 minutes; Model B predicts 45 °C. A measurement is 47 °C. Which model is better supported by this measurement?", ["Model A", "Model B", "Both exactly", "Neither can be compared"], 1, "The measured 47 °C is much closer to Model B's 45 °C prediction."],
  ], { section: "Science" }],
  ["IELTS", "Reading", [
    ["Identifying main ideas", "Medium", "A passage describes how a coastal town restored wetlands. The wetlands absorbed storm water, supported bird life and created outdoor learning sites. Which is the best summary?", ["Wetland restoration produced several environmental and educational benefits.", "The town replaced all schools with wetlands.", "Birds caused the coastal storms.", "The project focused only on tourism."], 0, "The summary captures the three outcomes without adding claims absent from the passage.", { passage: "After repeated flooding, residents restored a stretch of coastal wetland. The area slowed storm water, provided habitat for birds and became a place where local schools could study ecosystems." }],
    ["Matching information", "Medium", "A report says that a new library service lets residents borrow tools for home repairs. Which heading best matches this information?", ["Sharing equipment through a public service", "A history of book printing", "Why roads need repair", "The cost of university tuition"], 0, "A public library tool-lending service is a form of sharing equipment."],
    ["Inference", "Medium", "A survey found that commuters who received reliable bus arrival updates were more likely to choose the bus the following month. Which inference is most cautious?", ["Reliable updates may encourage some commuters to use buses.", "Every commuter will permanently stop driving.", "The survey proves buses are always faster.", "Arrival updates caused a rise in rainfall."], 0, "The reported association supports a limited inference, not a universal or causal claim."],
  ], { section: "Reading" }],
  ["IELTS", "Listening", [
    ["Note completion", "Easy", "A speaker says: ‘The study group meets in Room 204 on Thursday at 4:30 p.m.’ Which room should a listener write down?", ["Room 204", "Room 240", "Room 24", "Room 420"], 0, "The speaker explicitly gives Room 204."],
    ["Attitude and purpose", "Medium", "A caller says, ‘I appreciate the quick reply; could you also confirm whether the fee includes materials?’ What is the caller mainly doing?", ["Complaining that no one replied", "Thanking the person and asking for clarification", "Cancelling a course", "Requesting a refund without explanation"], 1, "The caller expresses appreciation, then asks a specific follow-up question."],
    ["Sequence", "Medium", "A guide says visitors should first collect a map, then follow the blue path, and finally meet at the east gate. Where do they meet?", ["At the map desk", "At the blue path entrance", "At the east gate", "At the west gate"], 2, "The final stated meeting point is the east gate."],
  ], { section: "Listening" }],
  ["IELTS", "Writing", [
    ["Task response", "Medium", "Practice prompt: Some people think public libraries should lend tools and equipment as well as books. Discuss both views and give your opinion. Which plan best addresses the task?", ["Explain arguments on both sides, then state and support a position.", "Describe only the history of books.", "List library locations without an opinion.", "Write about an unrelated school policy."], 0, "The prompt explicitly asks for both views and the writer's own position."],
    ["Coherence and cohesion", "Medium", "A response has three reasons supporting one view, but each reason appears in a random order with no transitions. Which revision most directly improves coherence?", ["Group related reasons and use clear transitions.", "Remove the conclusion and all examples.", "Replace every sentence with a question.", "Add unrelated facts between each reason."], 0, "Logical grouping and transitions help readers follow how ideas connect."],
    ["Lexical resource", "Medium", "Which phrase is the most precise formal alternative to ‘a lot of people’?", ["many individuals", "loads of folks", "a bunch of people", "tons of guys"], 0, "Many individuals is concise and appropriately formal for academic writing."],
  ], { section: "Writing" }],
  ["IELTS", "Speaking", [
    ["Fluency and coherence", "Easy", "Speaking practice: ‘Describe a skill you learned.’ Which response plan is most likely to produce a coherent answer?", ["Name the skill, explain how you learned it, give one example and say why it matters.", "Repeat the prompt several times.", "List unrelated places and dates.", "Stop after naming the skill."], 0, "A simple sequence of topic, process, example and reflection develops a connected response."],
    ["Part 3: developing ideas", "Medium", "Interviewer: ‘Why might people prefer learning in groups?’ Which answer develops the idea most clearly?", ["Groups are good, good, good.", "People can compare approaches and receive feedback; for example, peers may notice a mistake one learner missed.", "I do not know any groups.", "The word group has five letters."], 1, "The answer gives a reason and a relevant example, supporting the claim."],
    ["Pronunciation and clarity", "Medium", "A speaker notices that listeners often misunderstand key words. Which practice is most useful?", ["Speak as quickly as possible", "Record a short answer, listen for unclear word stress and practise at a measured pace", "Avoid all pauses", "Lower the volume until words are difficult to hear"], 1, "Recording and checking stress at a measured pace helps identify and improve intelligibility."],
  ], { section: "Speaking" }],
];

export const aceBoardOriginalStarterQuestions = datasets.flatMap(([exam, subject, rows, options]) => make(exam, subject, rows, options || {}));
