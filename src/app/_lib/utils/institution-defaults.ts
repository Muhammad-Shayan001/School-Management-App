export function getDefaultClassSeeds(institutionType?: string): string[] {
  switch (institutionType) {
    case 'college':
      return ['1st Year', '2nd Year', 'Intermediate Part-I', 'Intermediate Part-II', '11th', '12th'];
    case 'university':
      return ['BS', 'BSCS', 'BSIT', 'BBA', 'BCom', 'MS', 'MPhil', 'PhD'];
    case 'academy':
      return ['Batch A', 'Batch B', 'Morning Batch', 'Evening Batch', 'Weekend Batch'];
    default:
      return ['Play Group', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  }
}

export function getDefaultCourseSeeds(institutionType?: string): string[] {
  if (institutionType === 'academy') {
    return ['Web Development', 'Graphic Design', 'Digital Marketing', 'Data Science', 'Programming Fundamentals', 'UI/UX Design'];
  }
  return [];
}
