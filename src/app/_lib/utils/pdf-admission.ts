import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to safely load and convert external images to base64 with CORS support
function getBase64ImageFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
  });
}

export async function generateAdmissionForm(student: any, school: any) {
  const doc = new jsPDF();
  const primaryColor = '#101828'; // Deep Navy
  const accentColor = '#2563eb'; // Blue Accent
  
  // Pre-load images to avoid CORS and canvas tainting issues
  let logoBase64 = null;
  if (school?.logo_url) {
    try {
      logoBase64 = await getBase64ImageFromUrl(school.logo_url);
    } catch (e) {
      console.error('Failed to preload school logo for PDF', e);
    }
  }

  let avatarBase64 = null;
  if (student.profiles?.avatar_url) {
    try {
      avatarBase64 = await getBase64ImageFromUrl(student.profiles.avatar_url);
    } catch (e) {
      console.error('Failed to preload student avatar for PDF', e);
    }
  }

  // Header Branding
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 15, 15, 30, 30);
    } catch (e) {
      console.error('Failed to render school logo in PDF', e);
    }
  }
  
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(school?.name || 'School Management System', 55, 25);
  
  doc.setFontSize(10);
  doc.setTextColor('#667085');
  doc.setFont('helvetica', 'normal');
  doc.text(school?.city ? `${school.city}, ${school.country || ''}` : 'Official Admission Registry', 55, 32);
  doc.text(school?.website || '', 55, 37);
  
  // Decorative line
  doc.setDrawColor(accentColor);
  doc.setLineWidth(1);
  doc.line(15, 50, 195, 50);
  
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.text('OFFICIAL ADMISSION FORM', 15, 65);
  
  doc.setFontSize(10);
  doc.setTextColor('#344054');
  doc.text(`Registration Date: ${new Date(student.admission_date || student.created_at).toLocaleDateString()}`, 145, 65);
  
  // Student Portrait Space
  doc.setDrawColor('#eaecf0');
  doc.rect(155, 75, 35, 45);
  if (avatarBase64) {
    try {
      doc.addImage(avatarBase64, 'PNG', 156, 76, 33, 43);
    } catch (e) {
      doc.setFontSize(8);
      doc.text('NO PHOTO', 165, 100);
    }
  } else {
    doc.setFontSize(8);
    doc.text('PHOTO SPACE', 163, 100);
  }

  // section 1: Student Information
  doc.setFontSize(12);
  doc.setTextColor(accentColor);
  doc.text('SECTION I: STUDENT IDENTITY', 15, 80);
  
  const studentData = [
    ['Full Name', student.profiles?.full_name || '---'],
    ['Registration No', student.registration_no || '---'],
    ['Roll Number', student.roll_number || '---'],
    ['Assigned Class', `${student.classes?.name || '---'} (${student.classes?.section || '---'})`],
    ['Gender', student.gender || '---'],
    ['Date of Birth', student.dob || '---'],
    ['Blood Group', student.blood_group || '---'],
    ['Religion', student.religion || '---'],
    ['Cast / Identity', student.student_cast || '---'],
  ];

  autoTable(doc, {
    startY: 85,
    margin: { left: 15 },
    tableWidth: 135,
    body: studentData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // section 2: Contact & Address
  let finalY = ((doc as any).lastAutoTable?.finalY || 150) + 12;
  doc.setFontSize(12);
  doc.setTextColor(accentColor);
  doc.text('SECTION II: CONTACT & ORIGIN', 15, finalY);
  
  const contactData = [
    ['Mobile (SMS/WA)', student.sms_phone || '---'],
    ['Email', student.profiles?.email || '---'],
    ['Address', student.address || '---'],
    ['Previous School', student.previous_school || '---'],
    ['Identification Mark', student.id_mark || '---'],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 15 },
    tableWidth: 180,
    body: contactData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // section 3: Guardian Details
  finalY = ((doc as any).lastAutoTable?.finalY || finalY + 10) + 12;
  doc.setFontSize(12);
  doc.setTextColor(accentColor);
  doc.text('SECTION III: FAMILY & GUARDIANS', 15, finalY);
  
  const familyData = [
    ['Father Name', student.father_name || '---'],
    ['Father CNIC', student.father_cnic || '---'],
    ['Father Occupation', student.father_occupation || '---'],
    ['Mother Name', student.mother_name || '---'],
    ['Mother CNIC', student.mother_cnic || '---'],
    ['Mother Occupation', student.mother_occupation || '---'],
    ['Total Siblings', student.total_siblings?.toString() || '0'],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 15 },
    tableWidth: 180,
    body: familyData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // Financials & Notes
  finalY = ((doc as any).lastAutoTable?.finalY || finalY + 10) + 12;
  doc.setFontSize(12);
  doc.setTextColor(accentColor);
  doc.text('SECTION IV: ADMINISTRATIVE NOTES', 15, finalY);
  
  const adminData = [
    ['Fee Discount', `${student.fee_discount || 0}%`],
    ['Special Conditions', student.disease || 'None'],
    ['Admin Note', student.additional_note || 'N/A'],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 15 },
    tableWidth: 180,
    body: adminData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // Footer / Signatures
  doc.setDrawColor('#eaecf0');
  doc.line(15, 260, 65, 260);
  doc.line(130, 260, 180, 260);
  
  doc.setFontSize(8);
  doc.setTextColor(primaryColor);
  doc.text('Parent/Guardian Signature', 20, 265);
  doc.text('Principal / Admin Signature', 135, 265);
  
  doc.setTextColor('#98a2b3');
  doc.text(`Generated by ${school?.name || 'School ERP'} on ${new Date().toLocaleString()}`, 15, 285);
  doc.text('Page 1 of 1', 180, 285);

  doc.save(`Admission_Form_${student.profiles?.full_name?.replace(/\s+/g, '_')}.pdf`);
}
