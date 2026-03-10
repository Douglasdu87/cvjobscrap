import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

// Premium CV Template Generator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { 
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

    // Parse AI data if available to get interests and refined info
    let aiData: any = {};
    if (generatedCV) {
      try {
        aiData = JSON.parse(generatedCV);
      } catch (e) {
        console.warn('Failed to parse generatedCV JSON in export-pdf');
      }
    }

    const interests = aiData.interests || [];
    const aiSummary = aiData.summary || profile?.summary;
    const aiHeader = aiData.header || {};

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Auto-scaling logic
    const estimateHeight = () => {
      let h = 0;
      const isSingleCol = template === 'minimal' || template === 'professional' || template === 'classic';
      if (isSingleCol) {
        h = 20 + 15 + 15; // Header space
      } else {
        h = 30 + 12 + 10 + 25; // Sidebar templates header space
      }
      
      if (aiSummary) h += (aiSummary.length / 80) * 10;
      
      if (educations.length > 0) h += 12 + educations.length * 16;
      if (experiences.length > 0) {
        h += 12;
        experiences.forEach((exp: any) => {
          h += 15; 
          const achs = exp.achievements || (exp.description ? [exp.description] : []);
          h += achs.length * 6;
        });
      }
      if (skills.length > 0 || languages.length > 0) h += 15 + Math.max(languages.length * 8, skills.length * 8);
      return h + 20; 
    };

    const estHeight = estimateHeight();
    const availableHeight = pageHeight - margin * 2;
    const globalScale = Math.min(1.0, availableHeight / estHeight);
    const baseFontSize = 10 * globalScale;

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
      if (!text) return 0;
      const { fontSize = baseFontSize, fontStyle = 'normal', color = '#333333', align = 'left', maxWidth, lineHeight = 1.4 } = options;
      
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
      try {
        const { r, g, b } = hexToRgb(hex);
        const newR = Math.round(r + (255 - r) * (percent / 100));
        const newG = Math.round(g + (255 - g) * (percent / 100));
        const newB = Math.round(b + (255 - b) * (percent / 100));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      } catch (e) {
        return '#f0f0f0';
      }
    };

    // ============================================
    // UNIVERSAL SIDEBAR LAYOUT (For Modern/Elegant/Creative)
    // ============================================
    if (template === 'modern' || template === 'elegant' || template === 'creative') {
      const sidebarWidth = pageWidth * 0.33;
      const contentX = sidebarWidth + 4; 
      const contentWidth = pageWidth - contentX - 18; // Increased right margin from 15 to 18
      const sidebarMargin = 8;

      // Sidebar background
      setFillColor(primaryColor);
      doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

      // Sidebar: Profil Picture Placeholder (Image 2 style)
      setFillColor(getLighterColor(primaryColor, 90));
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.roundedRect(sidebarMargin + 2, 15, sidebarWidth - (sidebarMargin + 2) * 2, sidebarWidth - (sidebarMargin + 2) * 2, 3, 3, 'FD');
      
      // Sidebar: Sections
      let sideY = 15 + sidebarWidth - (sidebarMargin + 2) * 2 + 15;
      
      const drawSideSection = (title: string, content: any, type: 'text' | 'contact' | 'list') => {
        addText(title, sidebarWidth / 2, sideY, { fontSize: 11 * globalScale, fontStyle: 'bold', color: '#ffffff', align: 'center' });
        doc.setLineWidth(0.2);
        doc.setDrawColor(255, 255, 255);
        doc.line(sidebarMargin + 4, sideY + 2, sidebarWidth - sidebarMargin - 4, sideY + 2);
        sideY += 10;
        
        if (type === 'text') {
           sideY += addText(content, sidebarWidth / 2, sideY, { 
            fontSize: 9 * globalScale, 
            color: '#ffffff', 
            maxWidth: sidebarWidth - sidebarMargin * 2,
            align: 'center',
            lineHeight: 1.5
          }) + 12 * globalScale;
        } else if (type === 'contact') {
          content.forEach((c: any) => {
            if (!c.text) return;
            addText(c.text, sidebarWidth / 2, sideY, { fontSize: 8.5 * globalScale, color: '#ffffff', align: 'center', maxWidth: sidebarWidth - 10 });
            sideY += 7 * globalScale;
          });
          sideY += 5 * globalScale;
        } else if (type === 'list') {
          content.forEach((item: string) => {
            addText(`• ${item}`, sidebarWidth / 2, sideY, { fontSize: 8.5 * globalScale, color: '#ffffff', align: 'center' });
            sideY += 6 * globalScale;
          });
          sideY += 10 * globalScale;
        }
      };

      drawSideSection('PROFIL', aiSummary || "", 'text');
      drawSideSection('CONTACT', [
        { text: profile.city || aiHeader.location },
        { text: profile.email || aiHeader.email },
        { text: profile.phone || aiHeader.phone },
        { text: "Permis B" }
      ], 'contact');
      if (interests.length > 0) drawSideSection('INTÉRÊTS', interests, 'list');

      // Main Content
      yPosition = 30; 
      
      // Header Accent Line
      setFillColor(primaryColor);
      doc.rect(contentX - 6, yPosition - 10, 2, 25, 'F');

      // Name
      const firstName = profile?.firstName || 'PRÉNOM';
      const lastName = profile?.lastName || 'NOM';
      
      doc.setFontSize(38 * globalScale); 
      doc.setFont('helvetica', 'bold');
      setColor('#333333');
      doc.text(firstName.toUpperCase(), contentX, yPosition);
      yPosition += 12 * globalScale;
      doc.setFont('helvetica', 'bold');
      setColor('#999999');
      doc.text(lastName.toUpperCase(), contentX, yPosition);
      yPosition += 10 * globalScale;

      // Title
      addText((aiHeader.targetJobTitle || profile?.targetJobTitle || 'DÉVELOPPEUR').toUpperCase(), contentX, yPosition, { 
        fontSize: 15 * globalScale,
        color: '#bbbbbb',
        fontStyle: 'bold'
      });
      yPosition += 25 * globalScale;

      const drawSectionHeader = (title: string, x: number, y: number, width: number) => {
        // Accent bar
        setFillColor(primaryColor);
        doc.rect(x, y - 4, 14, 1.2, 'F');
        // Title
        addText(title, x + 18, y, { fontSize: 13 * globalScale, fontStyle: 'bold', color: '#333333' });
        // Divider
        const titleWidth = doc.getTextWidth(title);
        setDrawColor('#f0f0f0');
        doc.setLineWidth(0.3);
        doc.line(x + 22 + titleWidth, y - 1, x + width, y - 1);
      };

      // Formation
      if (educations.length > 0) {
        drawSectionHeader('FORMATION', contentX, yPosition, contentWidth);
        yPosition += 12 * globalScale;

        educations.forEach((edu: any) => {
          let period = edu.period || `${edu.startDate || ''} - ${edu.endDate || ''}`;
          addText(period, contentX, yPosition, { fontSize: 9.5 * globalScale, fontStyle: 'bold', color: '#aaaaaa' });
          
          addText(edu.degree || '', contentX + 38 * globalScale, yPosition, { fontSize: 11 * globalScale, fontStyle: 'bold' });
          yPosition += 6 * globalScale;
          addText(edu.school || '', contentX + 38 * globalScale, yPosition, { fontSize: 10 * globalScale, color: '#888888', fontStyle: 'italic' });
          yPosition += 10 * globalScale;
        });
        yPosition += 5 * globalScale;
      }

      // Experience
      if (experiences.length > 0) {
        drawSectionHeader('EXPÉRIENCE', contentX, yPosition, contentWidth);
        yPosition += 12 * globalScale;

        experiences.forEach((exp: any) => {

          addText(exp.period || `${exp.startDate || ''} - ${exp.endDate || ''}`, contentX, yPosition, { fontSize: 10.5 * globalScale, fontStyle: 'bold', color: '#333333' });
          addText(exp.company || '', contentX, yPosition + 6 * globalScale, { fontSize: 9 * globalScale, fontStyle: 'bold', color: '#bbbbbb' });

          addText((exp.position || '').toUpperCase(), contentX + 38 * globalScale, yPosition, { fontSize: 11.5 * globalScale, fontStyle: 'bold' });
          yPosition += 7 * globalScale;
          
          const achList = exp.achievements || (exp.description ? [exp.description] : []);
          achList.forEach((ach: string) => {
            const h = addText(`• ${ach}`, contentX + 38 * globalScale, yPosition, { 
              fontSize: 9 * globalScale, 
              maxWidth: contentWidth - 38 * globalScale, 
              color: '#555555', 
              lineHeight: 1.4 
            });
            yPosition += h + 2.5 * globalScale;
          });
          yPosition += 8 * globalScale;
        });
        yPosition += 5 * globalScale;
      }

      // Skills & Languages (Grid Layout)
      if (skills.length > 0 || languages.length > 0) {
        drawSectionHeader('COMPÉTENCES', contentX, yPosition, contentWidth);
        yPosition += 12 * globalScale;
 
        const startY = yPosition;
        const colWidth = contentWidth / 2;

        // Languages Column
        if (languages.length > 0) {
          addText('LANGUES', contentX, yPosition, { fontSize: 10 * globalScale, fontStyle: 'bold' });
          yPosition += 7 * globalScale;
          languages.forEach((lang: any) => {
            const levelText = lang.level || '';
            const levelWidth = doc.getTextWidth(levelText);
            const nameMaxWidth = colWidth - levelWidth - 8;
            
            const h = addText(lang.name, contentX, yPosition, { 
              fontSize: 9.5 * globalScale, 
              fontStyle: 'bold', 
              color: '#444444',
              maxWidth: nameMaxWidth
            });
            
            addText(levelText, contentX + colWidth - 5, yPosition, { fontSize: 9 * globalScale, color: '#888888', align: 'right' });
            yPosition += Math.max(h, 6 * globalScale);
          });
        }

        // Logiciels Column
        let softwareY = startY;
        if (skills.length > 0) {
          addText('LOGICIELS', contentX + colWidth, softwareY, { fontSize: 10 * globalScale, fontStyle: 'bold' });
          softwareY += 7 * globalScale;
          skills.forEach((skill: any) => {
            const skillName = skill.name || skill;
            const h = addText(`• ${skillName}`, contentX + colWidth, softwareY, { 
              fontSize: 9 * globalScale, 
              fontStyle: 'bold', 
              color: '#555555',
              maxWidth: colWidth - 5
            });
            softwareY += h + 1 * globalScale;
          });
        }
        
        yPosition = Math.max(yPosition, softwareY) + 15 * globalScale;
      }
    }

    // ============================================
    // TEMPLATES: MINIMAL, PROFESSIONAL, CLASSIC (Single Column)
    // ============================================
    else {
      // These templates all use the single column layout in page.tsx
      const contentWidth = pageWidth - margin * 2;
      
      // Header
      const fullName = aiHeader.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'VOTRE NOM';
      addText(fullName.toUpperCase(), margin, yPosition, { fontSize: 24 * globalScale, fontStyle: 'bold' });
      
      const contactParts = [
        profile?.email || aiHeader.email, 
        profile?.phone || aiHeader.phone, 
        profile?.city || aiHeader.location
      ].filter(Boolean);
      addText(contactParts.join('  |  '), pageWidth - margin, yPosition + 5 * globalScale, { fontSize: 9 * globalScale, color: '#888888', align: 'right' });
      yPosition += 15 * globalScale;
      
      // Accent Line
      setFillColor(primaryColor);
      doc.rect(margin, yPosition, contentWidth, 0.5 * globalScale, 'F');
      yPosition += 6 * globalScale;
      
      // Title
      addText((aiHeader.targetJobTitle || profile?.targetJobTitle || 'DÉVELOPPEUR').toUpperCase(), margin, yPosition, { 
        fontSize: 14 * globalScale,
        color: '#666666',
        fontStyle: 'bold'
      });
      yPosition += 15 * globalScale;
      
      if (aiSummary) {
        yPosition += addText(aiSummary, margin, yPosition, { 
          fontSize: 10 * globalScale, 
          maxWidth: contentWidth, 
          lineHeight: 1.6,
          fontStyle: 'italic',
          color: '#555555'
        }) + 12 * globalScale;
      }
      
      const drawMinimalHeader = (title: string, y: number) => {
        addText(title, margin, y, { fontSize: 13 * globalScale, fontStyle: 'bold', color: primaryColor });
        yPosition += 8 * globalScale;
      };

      // Formation
      if (educations.length > 0) {
        drawMinimalHeader('FORMATION', yPosition);
        educations.forEach((edu: any) => {
          const degree = edu.degree || '';
          const school = edu.school || '';
          const displayPeriod = (edu.period || `${edu.startDate || ''} - ${edu.endDate || ''}`).replace(/ - $/, '').replace(/^ - /, '');
          
          addText(degree, margin, yPosition, { fontSize: 11 * globalScale, fontStyle: 'bold' });
          addText(displayPeriod, pageWidth - margin, yPosition, { 
            fontSize: 9 * globalScale, 
            color: '#888888',
            align: 'right'
          });
          yPosition += 5 * globalScale;
          
          if (school && !degree.toLowerCase().includes(school.toLowerCase())) {
            addText(school, margin, yPosition, { fontSize: 10 * globalScale, color: '#666666' });
            yPosition += 10 * globalScale;
          } else {
            yPosition += 5 * globalScale;
          }
        });
        yPosition += 5 * globalScale;
      }

      // Experience
      if (experiences.length > 0) {
        drawMinimalHeader('EXPÉRIENCE PROFESSIONNELLE', yPosition);
        experiences.forEach((exp: any) => {
          const displayPeriod = (exp.period || `${exp.startDate || ''} - ${exp.endDate || ''}`).replace(/ - $/, '').replace(/^ - /, '');
          addText(exp.position || '', margin, yPosition, { fontSize: 12 * globalScale, fontStyle: 'bold' });
          addText(displayPeriod, pageWidth - margin, yPosition, { 
            fontSize: 9 * globalScale, 
            color: '#888888',
            align: 'right'
          });
          yPosition += 6 * globalScale;
          
          const company = exp.company || '';
          if (company && !(exp.position || '').toLowerCase().includes(company.toLowerCase())) {
            addText(company, margin, yPosition, { fontSize: 10.5 * globalScale, color: primaryColor, fontStyle: 'bold' });
            yPosition += 7 * globalScale;
          } else {
            yPosition += 2 * globalScale;
          }
          
          const achList = exp.achievements || (exp.description ? [exp.description] : []);
          achList.forEach((ach: string) => {
            const h = addText(`• ${ach}`, margin + 5 * globalScale, yPosition, { 
              fontSize: 9 * globalScale, 
              maxWidth: contentWidth - 5 * globalScale, 
              color: '#555555', 
              lineHeight: 1.4 
            });
            yPosition += h + 2 * globalScale;
          });
          yPosition += 8 * globalScale;
        });
      }

      // Skills & Interests
      if (skills.length > 0 || interests.length > 0) {
        yPosition += 5 * globalScale;
        const colWidth = contentWidth / 2;
        const startY = yPosition;
        
        if (skills.length > 0) {
          drawMinimalHeader('COMPÉTENCES', yPosition);
          const skillNames = skills.map((s: any) => s.name || s);
          yPosition += addText(skillNames.join('  •  '), margin, yPosition, {
            fontSize: 9 * globalScale,
            maxWidth: colWidth - 10,
            color: '#555555',
            lineHeight: 1.5
          });
        }
        
        if (interests.length > 0) {
          let intY = startY;
          addText('CENTRES D\'INTÉRÊT', margin + colWidth, intY, { fontSize: 13 * globalScale, fontStyle: 'bold', color: primaryColor });
          intY += 8 * globalScale;
          addText(interests.join('  •  '), margin + colWidth, intY, {
            fontSize: 9 * globalScale,
            maxWidth: colWidth - 10,
            color: '#555555',
            lineHeight: 1.5
          });
        }
      }
    }

    // ============================================
    // FIXED FOOTER
    // ============================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      setDrawColor('#e0e0e0');
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      addText(`CV généré par CVJobScrap`, margin, pageHeight - 6, { fontSize: 7, color: '#aaaaaa' });
      addText(`Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 6, { fontSize: 7, color: '#aaaaaa', align: 'right' });
    }

    const pdfBuffer = doc.output('arraybuffer');
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({ 
      pdf: pdfBase64,
      filename: `CV_${profile?.firstName || 'Document'}_${profile?.lastName || ''}.pdf`
    });

  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
  }
}
