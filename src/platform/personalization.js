export const PERSONALIZATION_GOALS = [
  { id: "exam-prep", label: "Prepare for exams", icon: "✦" },
  { id: "weak-subjects", label: "Improve weak subjects", icon: "↗" },
  { id: "school-discovery", label: "Find schools and universities", icon: "⌂" },
  { id: "applications", label: "Plan applications", icon: "▤" },
  { id: "academic-profile", label: "Build my academic profile", icon: "◎" },
  { id: "progress-tracking", label: "Track my progress", icon: "◷" },
  { id: "opportunities", label: "Explore scholarships and opportunities", icon: "◇" },
];

export const SCHOOL_DESTINATIONS = ["Nigeria", "United States", "United Kingdom", "Canada", "Other international"];

export function selectedExamIds(profile, examList) {
  const selected = new Set(Array.isArray(profile?.exams) ? profile.exams : []);
  return examList.filter((exam) => selected.has(exam.id)).map((exam) => exam.id);
}

export function filterLessonsForStudent(lessons, profile) {
  const selected = new Set(Array.isArray(profile?.exams) ? profile.exams : []);
  return lessons.filter((lesson) => selected.has(lesson.exam));
}

export function lessonNavigationTarget(lesson) {
  return lesson?.id && lesson?.exam ? { area: "learn", examId: lesson.exam, lessonId: lesson.id } : null;
}

export function hasContentAdminClaim(claims) {
  return claims?.admin === true;
}

export function canRenderContentReview(isAdmin) {
  return isAdmin === true;
}

export function collegesForDestinations(colleges, destinations) {
  const chosen = new Set(Array.isArray(destinations) ? destinations : []);
  if (!chosen.size) return [];
  return colleges.filter((college) => {
    if (chosen.has("Nigeria") && college.country === "Nigeria") return true;
    if (chosen.has("United States") && ["USA", "United States"].includes(college.country)) return true;
    if (chosen.has("United Kingdom") && ["UK", "United Kingdom"].includes(college.country)) return true;
    if (chosen.has("Canada") && college.country === "Canada") return true;
    return chosen.has("Other international") && college.country !== "Nigeria";
  });
}

export function accountMenuDestination(action) {
  return ({ profile: "about", settings: "profile-settings", account: "about", deleteAccount: "about" })[action] || null;
}

export function shouldDismissAccountMenu(eventType, targetInsideMenu = false) {
  return eventType === "escape" || (eventType === "pointerdown" && !targetInsideMenu);
}
