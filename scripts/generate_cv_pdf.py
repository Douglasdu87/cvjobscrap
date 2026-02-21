#!/usr/bin/env python3
"""
CV PDF Generator for CVJobScrap
Generates a professional CV PDF from JSON input
"""

import json
import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
try:
    pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
except:
    pass

def create_cv_pdf(data, output_path):
    """Create a professional CV PDF"""
    
    profile = data.get('profile', {})
    experiences = data.get('experiences', [])
    educations = data.get('educations', [])
    skills = data.get('skills', [])
    languages = data.get('languages', [])
    certifications = data.get('certifications', [])
    
    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm,
        title=f"CV_{profile.get('firstName', '')}_{profile.get('lastName', '')}",
        author='CVJobScrap',
        creator='CVJobScrap'
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    name_style = ParagraphStyle(
        'NameStyle',
        parent=styles['Normal'],
        fontSize=24,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=6
    )
    
    contact_style = ParagraphStyle(
        'ContactStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica',
        textColor=colors.HexColor('#4a5568'),
        spaceAfter=12
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontSize=14,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a365d'),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica',
        leading=14,
        alignment=TA_JUSTIFY
    )
    
    # Header - Name
    full_name = f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip()
    if full_name:
        story.append(Paragraph(full_name, name_style))
    
    # Contact info
    contact_parts = []
    if profile.get('email'):
        contact_parts.append(profile['email'])
    if profile.get('phone'):
        contact_parts.append(profile['phone'])
    if profile.get('city'):
        location = profile['city']
        if profile.get('country'):
            location += f", {profile['country']}"
        contact_parts.append(location)
    
    if contact_parts:
        story.append(Paragraph(" | ".join(contact_parts), contact_style))
    
    # Links
    links = []
    if profile.get('linkedin'):
        links.append(f"LinkedIn: {profile['linkedin']}")
    if profile.get('website'):
        links.append(f"Site: {profile['website']}")
    if links:
        story.append(Paragraph(" | ".join(links), contact_style))
    
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a365d')))
    story.append(Spacer(1, 12))
    
    # Professional Summary
    if profile.get('summary'):
        story.append(Paragraph("PROFIL", section_title_style))
        story.append(Paragraph(profile['summary'], body_style))
        story.append(Spacer(1, 6))
    
    # Target Position
    if profile.get('targetJobTitle'):
        target = profile['targetJobTitle']
        if profile.get('targetLocation'):
            target += f" - {profile['targetLocation']}"
        story.append(Paragraph(f"<b>Objectif:</b> {target}", body_style))
        story.append(Spacer(1, 6))
    
    # Experience
    if experiences:
        story.append(Paragraph("EXPÉRIENCE PROFESSIONNELLE", section_title_style))
        for exp in experiences:
            title = f"<b>{exp.get('position', '')}</b> - {exp.get('company', '')}"
            story.append(Paragraph(title, body_style))
            
            period = exp.get('startDate', '')
            if exp.get('current'):
                period += " - Présent"
            elif exp.get('endDate'):
                period += f" - {exp['endDate']}"
            
            if exp.get('location'):
                period += f" | {exp['location']}"
            
            story.append(Paragraph(period, ParagraphStyle('Period', parent=body_style, textColor=colors.gray, fontSize=9)))
            
            if exp.get('description'):
                story.append(Paragraph(exp['description'], body_style))
            story.append(Spacer(1, 8))
    
    # Education
    if educations:
        story.append(Paragraph("FORMATION", section_title_style))
        for edu in educations:
            title = f"<b>{edu.get('degree', '')}</b> - {edu.get('school', '')}"
            story.append(Paragraph(title, body_style))
            
            period = edu.get('startDate', '')
            if edu.get('current'):
                period += " - Présent"
            elif edu.get('endDate'):
                period += f" - {edu['endDate']}"
            
            story.append(Paragraph(period, ParagraphStyle('Period', parent=body_style, textColor=colors.gray, fontSize=9)))
            story.append(Spacer(1, 6))
    
    # Skills
    if skills:
        story.append(Paragraph("COMPÉTENCES", section_title_style))
        skills_text = ", ".join([s.get('name', '') for s in skills])
        story.append(Paragraph(skills_text, body_style))
        story.append(Spacer(1, 6))
    
    # Languages
    if languages:
        story.append(Paragraph("LANGUES", section_title_style))
        lang_text = ", ".join([f"{l.get('name', '')} ({l.get('level', '')})" for l in languages])
        story.append(Paragraph(lang_text, body_style))
        story.append(Spacer(1, 6))
    
    # Certifications
    if certifications:
        story.append(Paragraph("CERTIFICATIONS", section_title_style))
        for cert in certifications:
            cert_text = f"<b>{cert.get('name', '')}</b> - {cert.get('issuer', '')}"
            if cert.get('date'):
                cert_text += f" ({cert['date']})"
            story.append(Paragraph(cert_text, body_style))
    
    # Build PDF
    doc.build(story)
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_cv_pdf.py <input_json> <output_pdf>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    result = create_cv_pdf(data, output_file)
    print(f"PDF generated: {result}")
