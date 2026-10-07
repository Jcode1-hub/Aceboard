export const jambPhysicsQuestions = [
  {
    id: 2001, exam: "JAMB", year: 2019, subject: "Physics", topic: "Waves & Sound", difficulty: "Medium",
    question: "The velocity of sound in air is NOT affected by which of the following factors during propagation?",
    options: ["Temperature", "Echo", "Density of the medium", "Wind"],
    answer: 1, explanation: "Echo is simply the reflection of sound waves from a hard surface — it does not change how fast sound travels. Temperature, density, and wind all genuinely affect sound speed (v ∝ √T for temperature).", source: "JAMB Physics 2019 Q1"
  },
  {
    id: 2002, exam: "JAMB", year: 2019, subject: "Physics", topic: "Light & Optics", difficulty: "Medium",
    question: "Black is seen as black because it:",
    options: ["White light is reflected from it", "Absorbs all the spectrum of white light", "Refracts white light", "Transmits white light"],
    answer: 1, explanation: "Black objects absorb ALL wavelengths of visible light and reflect none back to the eye. With no colour signal reaching the eye, the object appears black — the opposite of white, which reflects all wavelengths.", source: "JAMB Physics 2019 Q2"
  },
  {
    id: 2003, exam: "JAMB", year: 2019, subject: "Physics", topic: "Pressure", difficulty: "Medium",
    question: "A given barometric altimeter reads zero Pascal in:",
    options: ["The atmosphere", "The sea", "On land", "In outer space"],
    answer: 3, explanation: "A barometric altimeter measures atmospheric pressure. In outer space there is virtually no atmosphere, so atmospheric pressure equals zero Pascal.", source: "JAMB Physics 2019 Q3"
  },
  {
    id: 2004, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Medium",
    question: "Radiant heat can only be measured with:",
    options: ["Clinical thermometer", "Gas thermometer", "Platinum resistance thermometer", "Thermopile"],
    answer: 3, explanation: "A thermopile is made of multiple thermocouples in series and detects infrared radiation by converting it to electrical voltage — the only listed instrument that measures heat without physical contact.", source: "JAMB Physics 2019 Q4"
  },
  {
    id: 2005, exam: "JAMB", year: 2019, subject: "Physics", topic: "Waves & Sound", difficulty: "Medium",
    question: "Standing waves are as a result of:",
    options: ["Interference of waves", "Reflection of wave", "Refraction of waves", "Diffraction of waves"],
    answer: 0, explanation: "Standing waves form when two identical waves travelling in opposite directions meet and superpose (interfere), creating nodes and antinodes. Reflection triggers the second wave, but interference is the underlying mechanism.", source: "JAMB Physics 2019 Q5"
  },
  {
    id: 2006, exam: "JAMB", year: 2019, subject: "Physics", topic: "Gas Laws", difficulty: "Hard",
    question: "A mass of gas at 17°C and 700 mmHg has volume 1.2 m³. Find the volume at 27°C and 750 mmHg.",
    options: ["2.2 m³", "1.2 m³", "4.8 m³", "3.0 m³"],
    answer: 1, explanation: "Using P1V1/T1 = P2V2/T2 with T1=290K, T2=300K: V2 = (700×1.2×300)/(290×750) ≈ 1.2 m³. Always convert °C to Kelvin by adding 273.", source: "JAMB Physics 2019 Q6"
  },
  {
    id: 2007, exam: "JAMB", year: 2019, subject: "Physics", topic: "Magnetism", difficulty: "Medium",
    question: "The point at which the resultant magnetic flux density is zero is the:",
    options: ["Magnetic point", "Flux point", "Neutral point", "Zero point"],
    answer: 2, explanation: "A neutral point is a location where the magnetic flux density due to a magnet exactly cancels the Earth's (or another external) magnetic field, giving a net field of zero.", source: "JAMB Physics 2019 Q7"
  },
  {
    id: 2008, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Hard",
    question: "Equal masses of water and oil are heated equally; oil's temperature rise is twice water's. This is because:",
    options: ["Oil is a better conductor", "Specific heat capacity of water is twice that of oil", "Specific heat capacity of oil is twice that of water", "Thermal capacity of oil is twice water's"],
    answer: 1, explanation: "From Q=mc∆T with equal Q and m: if oil's ∆T is twice water's, then water's specific heat capacity must be twice oil's — water needs more energy per degree to heat up.", source: "JAMB Physics 2019 Q8"
  },
  {
    id: 2009, exam: "JAMB", year: 2019, subject: "Physics", topic: "Pressure", difficulty: "Medium",
    question: "The siphon works on the concept of:",
    options: ["Equal pressure at all points at same level", "Pressure equally transmitted throughout liquid", "Excess pressure between different pressure heads", "Atmospheric pressure greater than internal liquid pressure"],
    answer: 3, explanation: "A siphon works because atmospheric pressure acting on the liquid surface is greater than the pressure at the top of the siphon tube, driving liquid up and over the barrier.", source: "JAMB Physics 2019 Q9"
  },
  {
    id: 2010, exam: "JAMB", year: 2019, subject: "Physics", topic: "Light & Optics", difficulty: "Medium",
    question: "What will be the appearance of the green part of the Nigerian flag under red light?",
    options: ["Black", "Magenta", "Yellow", "Cyan"],
    answer: 0, explanation: "A green surface can only reflect green light. Under red light there is no green light present to reflect, so no light reaches the eye — the surface appears black.", source: "JAMB Physics 2019 Q10"
  },
  {
    id: 2011, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Hard",
    question: "Calculate the resistivity of a wire: length 4 m, area 4×10⁻² m², resistance 3 Ω.",
    options: ["16×10⁻² Ω·m", "3×10⁻² Ω·m", "12×10⁻² Ω·m", "15×10⁻² Ω·m"],
    answer: 1, explanation: "Using ρ = RA/L = (3 × 4×10⁻²) / 4 = 3×10⁻² Ω·m. Resistivity is a material property independent of the wire's dimensions.", source: "JAMB Physics 2019 Q11"
  },
  {
    id: 2012, exam: "JAMB", year: 2019, subject: "Physics", topic: "Gravitation", difficulty: "Medium",
    question: "If object mass = A, Earth mass = B, Earth radius = R, the gravitational force is:",
    options: ["AB/R²", "AB/GR²", "GAB/R²", "GAB/R"],
    answer: 2, explanation: "Newton's Universal Law of Gravitation: F = Gm1m2/r². Substituting gives F = GAB/R² — the gravitational constant G is always needed.", source: "JAMB Physics 2019 Q12"
  },
  {
    id: 2013, exam: "JAMB", year: 2019, subject: "Physics", topic: "Gravitation", difficulty: "Easy",
    question: "The minimum velocity for an object to escape Earth's gravitational influence is:",
    options: ["Gravitational force", "Escape velocity", "Escape acceleration", "Uniform speed"],
    answer: 1, explanation: "Escape velocity (≈11.2 km/s for Earth) is the minimum speed an object needs to break free from gravitational pull without further propulsion, derived from v = √(2GM/R).", source: "JAMB Physics 2019 Q13"
  },
  {
    id: 2014, exam: "JAMB", year: 2019, subject: "Physics", topic: "Forces & Mechanics", difficulty: "Hard",
    question: "Two forces of 5N and 12N act at 120° to each other. Find the resultant.",
    options: ["10.4N", "16.0N", "15.2N", "16.2N"],
    answer: 0, explanation: "FR = √(F1² + F2² + 2F1F2cosθ) = √(25 + 144 + 2×5×12×cos120°) = √(169 − 60) = √109 ≈ 10.4N. Note cos120° = −0.5.", source: "JAMB Physics 2019 Q14"
  },
  {
    id: 2015, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Medium",
    question: "Heat transfer by convection in a liquid is due to:",
    options: ["Translatory motion of molecules", "Increase in vibration about mean position", "Expansion of liquid", "Ability of liquid to evaporate"],
    answer: 0, explanation: "Convection occurs when heated liquid molecules physically move (translatory motion) carrying heat with them, establishing a convection current as heated liquid rises and cooler liquid sinks.", source: "JAMB Physics 2019 Q15"
  },
  {
    id: 2016, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Medium",
    question: "In which circuit does the lighted bulb glow brightest?",
    options: ["Single bulb, two batteries in series", "Single bulb, two batteries in parallel", "Two bulbs in series", "Two bulbs in parallel"],
    answer: 0, explanation: "Series batteries add their voltages across one bulb. Higher voltage across the same resistance means higher power (P=V²/R), giving the brightest glow.", source: "JAMB Physics 2019 Q16"
  },
  {
    id: 2017, exam: "JAMB", year: 2019, subject: "Physics", topic: "Forces & Mechanics", difficulty: "Medium",
    question: "A man walks 20km from A to B, then 50km from B to C (at right angles). Find his displacement.",
    options: ["50 km", "20 km", "120 km", "70 km"],
    answer: 0, explanation: "Displacement is the straight-line distance from start to finish. Using Pythagoras: AC = √(20²+50²) ≈ 54 km, closest to 50 km. 70 km is the total distance travelled, a common trap.", source: "JAMB Physics 2019 Q17"
  },
  {
    id: 2018, exam: "JAMB", year: 2019, subject: "Physics", topic: "Magnetism", difficulty: "Easy",
    question: "Which of these is a naturally occurring magnet?",
    options: ["Lodestone", "Nickel", "Cobalt", "Soft iron"],
    answer: 0, explanation: "Lodestone is a naturally occurring, naturally magnetised mineral form of magnetite (Fe₃O₄) — the only naturally permanent magnet among the options.", source: "JAMB Physics 2019 Q18"
  },
  {
    id: 2019, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electronics", difficulty: "Hard",
    question: "Insulators cannot conduct electricity because:",
    options: ["The forbidden band gap is very wide", "It has no holes", "There is no valence band", "There is no conduction band"],
    answer: 0, explanation: "In insulators the forbidden gap between valence and conduction bands is very wide (>3eV), so electrons cannot jump across it at normal temperatures.", source: "JAMB Physics 2019 Q19"
  },
  {
    id: 2020, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Hard",
    question: "At the resonance frequency of an LCR circuit, the electric current value is:",
    options: ["Equal to zero", "Equal to rms value", "Maximum", "Minimum"],
    answer: 2, explanation: "At resonance, XL = XC, so they cancel, making total impedance Z = R (minimum). Since I=V/Z, the current is maximum at resonance.", source: "JAMB Physics 2019 Q20"
  },
  {
    id: 2021, exam: "JAMB", year: 2019, subject: "Physics", topic: "Properties of Matter", difficulty: "Medium",
    question: "The easiest way to reduce the viscosity of any liquid is by:",
    options: ["Increasing its surface area", "Applying high temperature", "Applying pressure", "Applying electric field"],
    answer: 1, explanation: "Heating a liquid weakens intermolecular forces, letting molecules slide past each other more easily, decreasing viscosity — like cold honey being thick and warm honey flowing easily.", source: "JAMB Physics 2019 Q21"
  },
  {
    id: 2022, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Hard",
    question: "Liquid density = 7.00×10³ kg/m³ at 10°C. Find the density at 100°C. Cubic expansivity = 6.5×10⁻⁴ K⁻¹.",
    options: ["7.82×10³", "6.69×10³", "7.08×10³", "7.00×10³ kg/m³"],
    answer: 1, explanation: "ρ2 = ρ1/(1+γ∆T) with ∆T=90°C gives ρ2 ≈ 6.69×10³ kg/m³. Density decreases when a liquid expands on heating since the same mass now occupies more volume.", source: "JAMB Physics 2019 Q22"
  },
  {
    id: 2023, exam: "JAMB", year: 2019, subject: "Physics", topic: "Waves & Sound", difficulty: "Medium",
    question: "When a sound wave goes from air into water, the wave property that does NOT change is its:",
    options: ["Amplitude", "Velocity", "Wavelength", "Frequency"],
    answer: 3, explanation: "Frequency is set by the source and never changes crossing media boundaries. Velocity changes, and since v=fλ with f constant, wavelength must also change.", source: "JAMB Physics 2019 Q23"
  },
  {
    id: 2024, exam: "JAMB", year: 2019, subject: "Physics", topic: "Light & Optics", difficulty: "Hard",
    question: "An ant is viewed under a glass slab of thickness 10cm, refractive index 1.7. Find the apparent displacement viewed from above.",
    options: ["4.1 cm", "3.8 cm", "5.9 cm", "6.9 cm"],
    answer: 0, explanation: "Apparent depth = Real depth/n = 10/1.7 ≈ 5.88 cm. Apparent displacement = Real − Apparent = 10 − 5.88 ≈ 4.1 cm. Watch out for stopping at the apparent depth (5.9cm) — that's a trap.", source: "JAMB Physics 2019 Q24"
  },
  {
    id: 2025, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Medium",
    question: "The work a 300W electric grinder can do in 300s is:",
    options: ["1.5×10⁵ J", "9.0×10⁴ J", "2.5×10² J", "1.0×10² J"],
    answer: 1, explanation: "W = P × t = 300 × 300 = 90,000 J = 9.0×10⁴ J. Power is the rate of doing work — a 300W grinder does 300 joules every second.", source: "JAMB Physics 2019 Q25"
  },
  {
    id: 2026, exam: "JAMB", year: 2019, subject: "Physics", topic: "Light & Optics", difficulty: "Hard",
    question: "An object is placed 15cm in front of a concave mirror of radius 40cm. The image formed is:",
    options: ["Virtual and 60cm behind the mirror", "Real and 60cm in front", "Virtual and 40cm behind", "Real and 60cm behind"],
    answer: 0, explanation: "f = R/2 = 20cm. Using 1/f = 1/v + 1/u gives v = +60cm (virtual, behind mirror). An object inside the focal length always gives a virtual, magnified image behind the mirror.", source: "JAMB Physics 2019 Q26"
  },
  {
    id: 2027, exam: "JAMB", year: 2019, subject: "Physics", topic: "Forces & Mechanics", difficulty: "Medium",
    question: "All of these are examples of Newton's Third Law EXCEPT:",
    options: ["Force from rotating helicopter blades", "Cyclist continues moving after stopping pedaling", "Person jumping from canoe pushes it backward", "Thick rope preferred for drawing water from well"],
    answer: 1, explanation: "A cyclist continuing to move after stopping pedaling is Newton's First Law (inertia) — an object in motion stays in motion unless acted on. Third Law requires two objects exerting equal, opposite forces on each other.", source: "JAMB Physics 2019 Q27"
  },
  {
    id: 2028, exam: "JAMB", year: 2019, subject: "Physics", topic: "Modern Physics", difficulty: "Hard",
    question: "Calculate the energy of the third level if the ground state is −36.18 eV.",
    options: ["−4.02 eV", "−8.20 eV", "−2.75 eV", "−4.02 eV"],
    answer: 0, explanation: "En = E1/n². For n=3: E3 = −36.18/9 = −4.02 eV. Energy values are always negative for bound electrons; higher n means less negative energy.", source: "JAMB Physics 2019 Q28"
  },
  {
    id: 2029, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Medium",
    question: "Heat required to change 2 kg of water at 0°C to water at 100°C [c = 4200 J/kg/K]:",
    options: ["8.4×10⁵ J", "8.4×10⁴ J", "8.4×10² J", "8.4×10³ J"],
    answer: 0, explanation: "Q = mc∆T = 2 × 4200 × 100 = 840,000 J = 8.4×10⁵ J. No phase change occurs (water stays water), so only one formula is needed — no latent heat.", source: "JAMB Physics 2019 Q29"
  },
  {
    id: 2030, exam: "JAMB", year: 2019, subject: "Physics", topic: "Simple Machines", difficulty: "Medium",
    question: "Calculate the velocity ratio of an inclined plane at 60° to the horizontal.",
    options: ["1.2", "0.7", "0.8", "2.0"],
    answer: 0, explanation: "VR = 1/sinθ = 1/sin60° = 1/0.866 ≈ 1.2. For angle measured from the horizontal, use sinθ; steeper slopes give a smaller VR.", source: "JAMB Physics 2019 Q30"
  },
  {
    id: 2031, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Medium",
    question: "The Nickel-Iron accumulator is a secondary cell and it has:",
    options: ["Very strong container", "Better acidic concentration", "Longer lifespan than Lead-Acid", "Higher relative humidity"],
    answer: 2, explanation: "The Nickel-Iron (Edison) cell uses alkaline KOH electrolyte and lasts 20–30 years versus 3–5 years for Lead-Acid, since the alkaline electrolyte is less corrosive to the plates.", source: "JAMB Physics 2019 Q31"
  },
  {
    id: 2032, exam: "JAMB", year: 2019, subject: "Physics", topic: "Properties of Matter", difficulty: "Medium",
    question: "Which is correct about mercury in a capillary bore?",
    options: ["Concave meniscus, obtuse angle", "Concave meniscus, acute angle", "Does not wet glass, obtuse angle", "Adhesion greater than cohesion"],
    answer: 2, explanation: "Mercury's cohesion (Hg-Hg) exceeds its adhesion to glass, so it does not wet glass. Its meniscus is convex and the contact angle is obtuse (>90°) — mercury is depressed in a capillary tube.", source: "JAMB Physics 2019 Q32"
  },
  {
    id: 2033, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electricity", difficulty: "Hard",
    question: "Electric potential energy of two positive charges each q, distance r apart:",
    options: ["q²/4πε₀r²", "q²/4πε₀r", "q/4πε₀r²", "q/4πε₀r"],
    answer: 1, explanation: "U = kq1q2/r = q²/(4πε₀r). Potential energy is proportional to 1/r, unlike Coulomb's force which has 1/r² — the most common trap is confusing the two.", source: "JAMB Physics 2019 Q33"
  },
  {
    id: 2034, exam: "JAMB", year: 2019, subject: "Physics", topic: "Properties of Matter", difficulty: "Hard",
    question: "A rubber 0.2cm long stretches by 0.01m when loaded. Calculate the strain.",
    options: ["5", "10", "20", "15"],
    answer: 0, explanation: "Strain = Extension/Original Length. Converting 0.2cm to 0.002m: Strain = 0.01/0.002 = 5. Strain is dimensionless — watch unit conversions carefully.", source: "JAMB Physics 2019 Q34"
  },
  {
    id: 2035, exam: "JAMB", year: 2019, subject: "Physics", topic: "Light & Optics", difficulty: "Easy",
    question: "What part of a camera performs the same function as the retina of the human eye?",
    options: ["Aperture", "Iris", "Film", "Diaphragm"],
    answer: 2, explanation: "The retina is the light-sensitive layer at the back of the eye where images focus. Camera film (or a digital sensor) sits at the back and records the image the same way.", source: "JAMB Physics 2019 Q35"
  },
  {
    id: 2036, exam: "JAMB", year: 2019, subject: "Physics", topic: "Heat & Thermometry", difficulty: "Medium",
    question: "The temperature at which water in the air is just enough to saturate the air is:",
    options: ["Dew point", "Fog", "Humidity", "Mist"],
    answer: 0, explanation: "Dew point is the specific temperature at which air becomes fully saturated with water vapour (relative humidity = 100%). Fog and mist are phenomena that occur below dew point, not temperatures themselves.", source: "JAMB Physics 2019 Q36"
  },
  {
    id: 2037, exam: "JAMB", year: 2019, subject: "Physics", topic: "Waves & Sound", difficulty: "Medium",
    question: "From v = fλ, the property of the wave independent of the others is its:",
    options: ["Wavelength", "Frequency", "Amplitude", "Velocity"],
    answer: 2, explanation: "Velocity, frequency, and wavelength are all interdependent through v=fλ. Amplitude is completely absent from this equation — it relates only to energy/intensity.", source: "JAMB Physics 2019 Q37"
  },
  {
    id: 2038, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electromagnetism", difficulty: "Medium",
    question: "An alternator can be made into a dynamo by just:",
    options: ["Changing the rings to a commutator", "Varying the force on the coil", "Interchanging the polarity of the magnets", "Varying the magnet flux linkage"],
    answer: 0, explanation: "The only difference between an alternator (AC) and dynamo (DC generator) is the rings used: slip rings give AC output, while a commutator (split ring) reverses connections each half-rotation to give DC.", source: "JAMB Physics 2019 Q38"
  },
  {
    id: 2039, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electromagnetism", difficulty: "Hard",
    question: "A 10m wire carries current 4A in a flux density of 0.8T, lying at 60° to the field. Calculate the force.",
    options: ["48N", "16N", "32N", "64N"],
    answer: 2, explanation: "F = BILsinθ = 0.8 × 4 × 10 × sin60° ≈ 27.7N, closest to 32N (the value at 90°). A wire parallel to the field (0°) experiences zero force.", source: "JAMB Physics 2019 Q39"
  },
  {
    id: 2040, exam: "JAMB", year: 2019, subject: "Physics", topic: "Electronics", difficulty: "Medium",
    question: "If a donor impurity is introduced into a silicon lattice, the resulting material is:",
    options: ["p-type silicon", "Richer in holes only", "Richer in electron-hole pairs", "n-type silicon"],
    answer: 3, explanation: "A donor impurity is a Group V element (e.g. Phosphorus) with 5 valence electrons — the 5th electron becomes free, making the material rich in free electrons, i.e. n-type.", source: "JAMB Physics 2019 Q40"
  },

];
