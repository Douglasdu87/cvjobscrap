import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

// Premium CV Template Generator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      profile, 
      experiences = [], 
      educations = [], 
      certifications = [], 
      languages = [], 
      skills = [],
      template = 'modern',
      primaryColor = '#1a365d',
      generatedCV
    } = body;

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Color utilities
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const setColor = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      doc.setTextColor(r, g, b);
    };

    const setFillColor = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      doc.setFillColor(r, g, b);
    };

    const setDrawColor = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      doc.setDrawColor(r, g, b);
    };

    // Helper to add text with word wrap
    const addText = (text: string, x: number, y: number, options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: string;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
      lineHeight?: number;
    } = {}): number => {
      const { fontSize = 10, fontStyle = 'normal', color = '#333333', align = 'left', maxWidth, lineHeight = 1.4 } = options;
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      setColor(color);
      
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        const lineheight = fontSize * 0.3528 * lineHeight;
        lines.forEach((line: string, i: number) => {
          doc.text(line, x, y + (i * lineheight), { align });
        });
        return lines.length * lineheight;
      }
      
      doc.text(text, x, y, { align });
      return fontSize * 0.3528;
    };

    // Calculate lighter color for backgrounds
    const getLighterColor = (hex: string, percent: number = 90): string => {
      const { r, g, b } = hexToRgb(hex);
      const newR = Math.round(r + (255 - r) * (percent / 100));
      const newG = Math.round(g + (255 - g) * (percent / 100));
      const newB = Math.round(b + (255 - b) * (percent / 100));
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    };

    // ============================================
    // TEMPLATE: MODERN (Header with colored bar)
    // ============================================
    if (template === 'modern') {
      // Header background
      setFillColor(primaryColor);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Name
      addText(`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(), margin, 18, { 
        fontSize: 26, 
        fontStyle: 'bold', 
        color: '#ffffff' 
      });
      
      // Target job title
      if (profile?.targetJobTitle) {
        addText(profile.targetJobTitle, margin, 27, { 
          fontSize: 12, 
          fontStyle: 'italic', 
          color: '#ffffff' 
        });
      }
      
      // Contact info bar
      const contactParts: string[] = [];
      if (profile?.email) contactParts.push(profile.email);
      if (profile?.phone) contactParts.push(profile.phone);
      if (profile?.city) {
        let loc = profile.city;
        if (profile?.country) loc += `, ${profile.country}`;
        contactParts.push(loc);
      }
      
      addText(contactParts.join('  •  '), margin, 38, { 
        fontSize: 9, 
        color: '#ffffff' 
      });

      yPosition = 55;

      // Summary
      if (profile?.summary) {
        addText('À PROPOS', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.setLineWidth(0.5);
        setDrawColor(primaryColor);
        doc.line(margin, yPosition + 2, margin + 20, yPosition + 2);
        yPosition += 6;
        const height = addText(profile.summary, margin, yPosition, { fontSize: 10, maxWidth: pageWidth - margin * 2, lineHeight: 1.5 });
        yPosition += height + 8;
      }

      // Experience
      if (experiences.length > 0) {
        addText('EXPÉRIENCE PROFESSIONNELLE', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(margin, yPosition + 2, margin + 50, yPosition + 2);
        yPosition += 8;

        experiences.forEach((exp: any) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }
          
          // Company and period
          addText(exp.company || '', margin, yPosition, { fontSize: 10, fontStyle: 'bold', color: '#1a1a1a' });
          let period = exp.startDate || '';
          period += exp.current ? ' - Présent' : (exp.endDate ? ` - ${exp.endDate}` : '');
          addText(period, pageWidth - margin, yPosition, { fontSize: 9, color: '#666666', align: 'right' });
          yPosition += 5;
          
          // Position
          addText(exp.position || '', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
          yPosition += 5;
          
          // Description
          if (exp.description) {
            const height = addText(exp.description, margin, yPosition, { fontSize: 9, maxWidth: pageWidth - margin * 2, color: '#444444', lineHeight: 1.4 });
            yPosition += height + 5;
          }
          yPosition += 3;
        });
      }

      // Education
      if (educations.length > 0) {
        yPosition += 5;
        addText('FORMATION', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(margin, yPosition + 2, margin + 25, yPosition + 2);
        yPosition += 8;

        educations.forEach((edu: any) => {
          addText(edu.degree || '', margin, yPosition, { fontSize: 10, fontStyle: 'bold', color: '#1a1a1a' });
          let period = edu.startDate || '';
          period += edu.current ? ' - Présent' : (edu.endDate ? ` - ${edu.endDate}` : '');
          addText(period, pageWidth - margin, yPosition, { fontSize: 9, color: '#666666', align: 'right' });
          yPosition += 5;
          addText(edu.school || '', margin, yPosition, { fontSize: 9, color: '#666666' });
          yPosition += 6;
        });
      }

      // Skills
      if (skills.length > 0) {
        yPosition += 5;
        addText('COMPÉTENCES', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(margin, yPosition + 2, margin + 30, yPosition + 2);
        yPosition += 8;
        
        const skillWidth = (pageWidth - margin * 2) / 2 - 5;
        const skillsPerRow = 2;
        let currentX = margin;
        
        skills.forEach((skill: any, index: number) => {
          if (index > 0 && index % skillsPerRow === 0) {
            yPosition += 8;
            currentX = margin;
          }
          
          // Skill pill
          const text = skill.name;
          const textWidth = doc.getTextWidth(text) * (9 / 2.83);
          setFillColor(getLighterColor(primaryColor, 85));
          doc.roundedRect(currentX, yPosition - 3, textWidth + 8, 6, 2, 2, 'F');
          addText(text, currentX + 4, yPosition, { fontSize: 8, color: primaryColor });
          
          currentX += skillWidth + 10;
        });
        yPosition += 10;
      }

      // Languages
      if (languages.length > 0) {
        yPosition += 5;
        addText('LANGUES', margin, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(margin, yPosition + 2, margin + 20, yPosition + 2);
        yPosition += 8;
        
        languages.forEach((lang: any) => {
          addText(`${lang.name}: ${lang.level || 'Niveau non spécifié'}`, margin, yPosition, { fontSize: 9 });
          yPosition += 5;
        });
      }
    }

    // ============================================
    // TEMPLATE: ELEGANT (Two column layout)
    // ============================================
    else if (template === 'elegant' || template === 'creative') {
      const sidebarWidth = 65;
      const contentX = sidebarWidth + 5;
      const contentWidth = pageWidth - contentX - margin;

      // Sidebar background
      setFillColor(primaryColor);
      doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

      // Sidebar: Name and title
      addText(`${profile?.firstName || ''}`.toUpperCase(), margin, 25, { fontSize: 16, fontStyle: 'bold', color: '#ffffff' });
      addText(`${profile?.lastName || ''}`.toUpperCase(), margin, 33, { fontSize: 16, fontStyle: 'bold', color: '#ffffff' });
      
      if (profile?.targetJobTitle) {
        addText(profile.targetJobTitle, margin, 45, { fontSize: 10, fontStyle: 'italic', color: '#ffffff' });
      }

      // Sidebar: Contact
      let sideY = 60;
      addText('CONTACT', margin, sideY, { fontSize: 9, fontStyle: 'bold', color: '#ffffff' });
      sideY += 6;
      doc.setDrawColor('#ffffff');
      doc.line(margin, sideY, sidebarWidth - margin, sideY);
      sideY += 6;

      if (profile?.email) {
        addText(profile.email, margin, sideY, { fontSize: 8, color: '#ffffff', maxWidth: sidebarWidth - margin * 2 });
        sideY += 8;
      }
      if (profile?.phone) {
        addText(profile.phone, margin, sideY, { fontSize: 8, color: '#ffffff' });
        sideY += 8;
      }
      if (profile?.city) {
        addText(`${profile.city}${profile.country ? `, ${profile.country}` : ''}`, margin, sideY, { fontSize: 8, color: '#ffffff' });
        sideY += 8;
      }
      if (profile?.linkedin) {
        addText('LinkedIn', margin, sideY, { fontSize: 8, color: '#ffffff' });
        sideY += 8;
      }

      // Sidebar: Skills
      if (skills.length > 0) {
        sideY += 10;
        addText('COMPÉTENCES', margin, sideY, { fontSize: 9, fontStyle: 'bold', color: '#ffffff' });
        sideY += 6;
        doc.line(margin, sideY, sidebarWidth - margin, sideY);
        sideY += 6;

        skills.forEach((skill: any) => {
          addText(`• ${skill.name}`, margin, sideY, { fontSize: 8, color: '#ffffff', maxWidth: sidebarWidth - margin * 2 });
          sideY += 6;
        });
      }

      // Sidebar: Languages
      if (languages.length > 0) {
        sideY += 10;
        addText('LANGUES', margin, sideY, { fontSize: 9, fontStyle: 'bold', color: '#ffffff' });
        sideY += 6;
        doc.line(margin, sideY, sidebarWidth - margin, sideY);
        sideY += 6;

        languages.forEach((lang: any) => {
          addText(`${lang.name}`, margin, sideY, { fontSize: 8, color: '#ffffff' });
          sideY += 4;
          addText(lang.level || '', margin + 3, sideY, { fontSize: 7, color: '#cccccc' });
          sideY += 5;
        });
      }

      // Main content area
      yPosition = margin;

      // Summary
      if (profile?.summary) {
        addText('PROFIL PROFESSIONNEL', contentX, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(contentX, yPosition + 2, contentX + 40, yPosition + 2);
        yPosition += 8;
        const height = addText(profile.summary, contentX, yPosition, { fontSize: 9, maxWidth: contentWidth, lineHeight: 1.5, color: '#333333' });
        yPosition += height + 10;
      }

      // Experience
      if (experiences.length > 0) {
        addText('EXPÉRIENCE PROFESSIONNELLE', contentX, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(contentX, yPosition + 2, contentX + 55, yPosition + 2);
        yPosition += 8;

        experiences.forEach((exp: any) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          addText(exp.position || '', contentX, yPosition, { fontSize: 10, fontStyle: 'bold', color: '#1a1a1a' });
          let period = exp.startDate || '';
          period += exp.current ? ' - Présent' : (exp.endDate ? ` - ${exp.endDate}` : '');
          addText(period, contentX + contentWidth, yPosition, { fontSize: 8, color: '#666666', align: 'right' });
          yPosition += 5;
          
          addText(exp.company || '', contentX, yPosition, { fontSize: 9, fontStyle: 'italic', color: primaryColor });
          yPosition += 5;
          
          if (exp.description) {
            const height = addText(exp.description, contentX, yPosition, { fontSize: 8, maxWidth: contentWidth, color: '#444444', lineHeight: 1.4 });
            yPosition += height + 6;
          }
          yPosition += 2;
        });
      }

      // Education
      if (educations.length > 0) {
        yPosition += 5;
        addText('FORMATION', contentX, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(contentX, yPosition + 2, contentX + 25, yPosition + 2);
        yPosition += 8;

        educations.forEach((edu: any) => {
          addText(edu.degree || '', contentX, yPosition, { fontSize: 9, fontStyle: 'bold', color: '#1a1a1a' });
          let period = edu.startDate || '';
          period += edu.current ? ' - Présent' : (edu.endDate ? ` - ${edu.endDate}` : '');
          addText(period, contentX + contentWidth, yPosition, { fontSize: 8, color: '#666666', align: 'right' });
          yPosition += 5;
          addText(edu.school || '', contentX, yPosition, { fontSize: 8, color: '#666666' });
          yPosition += 6;
        });
      }

      // Certifications
      if (certifications.length > 0) {
        yPosition += 5;
        addText('CERTIFICATIONS', contentX, yPosition, { fontSize: 11, fontStyle: 'bold', color: primaryColor });
        doc.line(contentX, yPosition + 2, contentX + 35, yPosition + 2);
        yPosition += 8;

        certifications.forEach((cert: any) => {
          addText(`${cert.name} - ${cert.issuer || ''}`, contentX, yPosition, { fontSize: 8 });
          yPosition += 5;
        });
      }
    }

    // ============================================
    // TEMPLATE: MINIMAL (Clean, simple)
    // ============================================
    else if (template === 'minimal') {
      // Name
      addText(`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(), margin, yPosition, { 
        fontSize: 28, 
        fontStyle: 'bold', 
        color: '#1a1a1a' 
      });
      yPosition += 12;

      // Contact line
      const contactParts: string[] = [];
      if (profile?.email) contactParts.push(profile.email);
      if (profile?.phone) contactParts.push(profile.phone);
      if (profile?.city) contactParts.push(profile.city);
      addText(contactParts.join('  |  '), margin, yPosition, { fontSize: 9, color: '#888888' });
      yPosition += 10;

      // Thin separator
      doc.setDrawColor('#e0e0e0');
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Summary
      if (profile?.summary) {
        const height = addText(profile.summary, margin, yPosition, { fontSize: 10, maxWidth: pageWidth - margin * 2, lineHeight: 1.6, color: '#444444' });
        yPosition += height + 10;
      }

      // Sections without colored titles
      const addMinimalSection = (title: string, content: () => void) => {
        addText(title, margin, yPosition, { fontSize: 10, fontStyle: 'bold', color: '#1a1a1a' });
        yPosition += 6;
        content();
        yPosition += 5;
      };

      if (experiences.length > 0) {
        addMinimalSection('Expérience', () => {
          experiences.forEach((exp: any) => {
            addText(`${exp.position} — ${exp.company}`, margin, yPosition, { fontSize: 10, fontStyle: 'bold' });
            let period = exp.startDate || '';
            period += exp.current ? ' – Présent' : (exp.endDate ? ` – ${exp.endDate}` : '');
            addText(period, pageWidth - margin, yPosition, { fontSize: 9, color: '#888888', align: 'right' });
            yPosition += 5;
            if (exp.description) {
              const height = addText(exp.description, margin, yPosition, { fontSize: 9, maxWidth: pageWidth - margin * 2, color: '#666666' });
              yPosition += height + 4;
            }
            yPosition += 2;
          });
        });
      }

      if (educations.length > 0) {
        addMinimalSection('Formation', () => {
          educations.forEach((edu: any) => {
            addText(`${edu.degree} — ${edu.school}`, margin, yPosition, { fontSize: 9 });
            yPosition += 5;
          });
        });
      }

      if (skills.length > 0) {
        addMinimalSection('Compétences', () => {
          addText(skills.map((s: any) => s.name).join(', '), margin, yPosition, { fontSize: 9, color: '#666666' });
          yPosition += 5;
        });
      }

      if (languages.length > 0) {
        addMinimalSection('Langues', () => {
          addText(languages.map((l: any) => `${l.name} (${l.level})`).join(', '), margin, yPosition, { fontSize: 9, color: '#666666' });
          yPosition += 5;
        });
      }
    }

    // ============================================
    // TEMPLATE: PROFESSIONAL (Corporate style)
    // ============================================
    else if (template === 'professional' || template === 'classic') {
      // Top accent line
      setFillColor(primaryColor);
      doc.rect(0, 0, pageWidth, 3, 'F');

      // Name and contact
      yPosition = 15;
      addText(`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim().toUpperCase(), margin, yPosition, { 
        fontSize: 22, 
        fontStyle: 'bold', 
        color: '#1a1a1a' 
      });
      yPosition += 10;

      if (profile?.targetJobTitle) {
        addText(profile.targetJobTitle, margin, yPosition, { fontSize: 11, color: primaryColor });
        yPosition += 8;
      }

      // Contact box
      const contactParts: string[] = [];
      if (profile?.email) contactParts.push(`✉ ${profile.email}`);
      if (profile?.phone) contactParts.push(`☎ ${profile.phone}`);
      if (profile?.city) contactParts.push(`📍 ${profile.city}`);
      
      setFillColor('#f5f5f5');
      doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 10, 2, 2, 'F');
      addText(contactParts.join('    '), margin + 5, yPosition + 6, { fontSize: 8, color: '#666666' });
      yPosition += 18;

      // Summary
      if (profile?.summary) {
        addText('PROFIL', margin, yPosition, { fontSize: 10, fontStyle: 'bold', color: primaryColor });
        setDrawColor(primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + 15, yPosition + 2);
        yPosition += 6;
        const height = addText(profile.summary, margin, yPosition, { fontSize: 9, maxWidth: pageWidth - margin * 2, lineHeight: 1.5 });
        yPosition += height + 8;
      }

      // Helper for professional sections
      const addProSection = (title: string, items: any[], renderItem: (item: any) => void) => {
        if (items.length === 0) return;
        
        // Section header with background
        setFillColor(primaryColor);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 7, 'F');
        addText(title, margin + 3, yPosition + 5, { fontSize: 9, fontStyle: 'bold', color: '#ffffff' });
        yPosition += 12;
        
        items.forEach((item, index) => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = margin;
          }
          renderItem(item);
          if (index < items.length - 1) yPosition += 3;
        });
        yPosition += 5;
      };

      addProSection('EXPÉRIENCE PROFESSIONNELLE', experiences, (exp: any) => {
        addText(exp.position || '', margin, yPosition, { fontSize: 10, fontStyle: 'bold' });
        addText(exp.company || '', pageWidth - margin, yPosition, { fontSize: 9, color: primaryColor, align: 'right' });
        yPosition += 5;
        let period = exp.startDate || '';
        period += exp.current ? ' - Présent' : (exp.endDate ? ` - ${exp.endDate}` : '');
        addText(period, margin, yPosition, { fontSize: 8, color: '#888888' });
        yPosition += 5;
        if (exp.description) {
          const height = addText(exp.description, margin, yPosition, { fontSize: 8, maxWidth: pageWidth - margin * 2, color: '#555555' });
          yPosition += height + 2;
        }
      });

      addProSection('FORMATION', educations, (edu: any) => {
        addText(edu.degree || '', margin, yPosition, { fontSize: 9, fontStyle: 'bold' });
        addText(edu.school || '', pageWidth - margin, yPosition, { fontSize: 9, color: primaryColor, align: 'right' });
        yPosition += 5;
        let period = edu.startDate || '';
        period += edu.current ? ' - Présent' : (edu.endDate ? ` - ${edu.endDate}` : '');
        addText(period, margin, yPosition, { fontSize: 8, color: '#888888' });
        yPosition += 4;
      });

      if (skills.length > 0) {
        addProSection('COMPÉTENCES', skills, (skill: any) => {});
        // Display skills in a grid
        const cols = 3;
        const colWidth = (pageWidth - margin * 2) / cols;
        skills.forEach((skill: any, i: number) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          addText(`• ${skill.name}`, margin + col * colWidth, yPosition + row * 5, { fontSize: 8 });
        });
        yPosition += Math.ceil(skills.length / cols) * 5 + 5;
      }

      if (languages.length > 0) {
        addProSection('LANGUES', languages, (lang: any) => {
          addText(`${lang.name}: ${lang.level || 'Non spécifié'}`, margin, yPosition, { fontSize: 8 });
          yPosition += 4;
        });
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      setDrawColor('#e0e0e0');
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      addText(`CV généré par CVJobScrap`, margin, pageHeight - 6, { fontSize: 7, color: '#aaaaaa' });
      addText(`Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 6, { fontSize: 7, color: '#aaaaaa', align: 'right' });
    }

    // Generate PDF as base64
    const pdfBuffer = doc.output('arraybuffer');
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({ 
      pdf: pdfBase64,
      filename: `CV_${profile?.firstName || 'Document'}_${profile?.lastName || ''}.pdf`
    });

  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    }, { status: 500 });
  }
}
