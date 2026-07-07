export function getDefaultClassSeeds(institutionType?: string): string[] {
  switch (institutionType) {
    case 'college':
      return ['Class 11', 'Class 12'];
    case 'university':
      return ['BS', 'MS'];
    case 'academy':
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12'
      ];
    default:
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
      ];
  }
}

export function getDefaultCourseSeeds(institutionType?: string): string[] {
  if (institutionType === 'academy') {
    return ['Web Development', 'Graphic Design', 'Digital Marketing', 'Data Science', 'Programming Fundamentals', 'UI/UX Design'];
  }
  return [];
}
