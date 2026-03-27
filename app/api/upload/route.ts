// app/api/upload/route.ts
// POST /api/upload — nhận nhiều file (field: "files"), validate từng file riêng
// Backward compat: field "file" (đơn) vẫn hoạt động
// C3: lấy user ID từ NextAuth session thay vì hardcode 'system'
// H2: rollback file nếu DB create fail (tránh zombie files)

import { prisma } from '@/lib/prisma';
import { validateFile, saveUploadedFile, parseCompressLevel } from '@/lib/upload';
import { getSessionUserId } from '@/lib/auth-helpers';
import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Request phải là multipart/form-data.' }, { status: 400 });
    }

    // C3: Lấy user ID từ session
    const createdBy = await getSessionUserId();

    // Lấy files: hỗ trợ "files" (batch) và "file" (đơn, backward compat)
    const rawFiles: File[] = [];
    const filesField = formData.getAll('files');
    const fileField = formData.get('file');

    if (filesField.length > 0) {
      for (const f of filesField) {
        if (f instanceof File) rawFiles.push(f);
      }
    } else if (fileField instanceof File) {
      rawFiles.push(fileField);
    }

    if (rawFiles.length === 0) {
      return Response.json(
        { error: 'Thiếu file. Vui lòng chọn file .docx hoặc .pdf để upload.' },
        { status: 400 }
      );
    }

    const compressLevel = parseCompressLevel(formData.get('compressLevel'));

    const conversions: { id: string; fileName: string; fileType: string; fileSize: number; status: string }[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const file of rawFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push({ fileName: file.name, error: validation.error });
        continue;
      }

      const { fileType } = validation;

      // H2: Lưu path để rollback nếu DB fail
      let savedPath: string | null = null;
      try {
        const { conversionId, originalPath, normalizedName } = await saveUploadedFile(file);
        savedPath = originalPath;

        const conversion = await prisma.conversion.create({
          data: {
            id: conversionId,
            fileName: normalizedName,
            fileType,
            fileSize: file.size,
            compressLevel: fileType === 'pdf' ? compressLevel : null,
            originalPath,
            status: 'pending',
            createdBy, // C3: user ID từ session
          },
        });

        conversions.push({
          id: conversion.id,
          fileName: conversion.fileName,
          fileType: conversion.fileType,
          fileSize: conversion.fileSize,
          status: conversion.status,
        });
      } catch (err) {
        // H2: Rollback file nếu DB create fail
        if (savedPath) {
          await fs.unlink(savedPath).catch(() => {});
        }
        console.error('[Upload] error:', err);
        errors.push({ fileName: file.name, error: 'Lỗi server khi lưu file.' });
      }
    }

    if (conversions.length === 0) {
      return Response.json({ conversions: [], errors }, { status: 400 });
    }

    // Backward compat: 1 file → kèm format cũ (id, fileName... ở root)
    if (rawFiles.length === 1 && conversions.length === 1) {
      const c = conversions[0];
      return Response.json(
        { id: c.id, fileName: c.fileName, fileType: c.fileType, fileSize: c.fileSize, status: c.status, conversions, errors },
        { status: 201 }
      );
    }

    return Response.json({ conversions, errors }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return Response.json({ error: 'Lỗi server khi xử lý upload.' }, { status: 500 });
  }
}
