import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64 for storage
    const base64Content = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    
    // Store the file info
    const fileData = {
      name: file.name,
      type: mimeType,
      extension,
      size: file.size,
      base64: base64Content,
      dataUrl: `data:${mimeType};base64,${base64Content}`,
      uploadedAt: new Date().toISOString()
    };

    // Try to extract text for profile filling (optional, best effort)
    let extractedData = null;
    
    // For text files, we can parse directly
    if (extension === 'txt') {
      try {
        const text = buffer.toString('utf-8');
        extractedData = {
          profile: { summary: text.substring(0, 500) },
          rawText: text
        };
      } catch {
        // Ignore extraction errors
      }
    }

    return NextResponse.json({ 
      success: true,
      file: {
        name: fileData.name,
        type: fileData.type,
        extension: fileData.extension,
        size: fileData.size,
        dataUrl: fileData.dataUrl,
        base64: fileData.base64
      },
      extractedData,
      message: 'CV importé avec succès ! Vous pouvez maintenant l\'utiliser pour vos candidatures.'
    });

  } catch (error: any) {
    console.error('CV Import Error:', error);
    return NextResponse.json({ 
      error: 'Impossible d\'importer le CV',
      details: error.message 
    }, { status: 500 });
  }
}
