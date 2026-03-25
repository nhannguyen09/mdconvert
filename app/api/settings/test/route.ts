// app/api/settings/test/route.ts
// POST /api/settings/test — verify API key hợp lệ với provider

import { getSetting } from '@/lib/settings';

export async function POST() {
  try {
    const provider = await getSetting('ai_provider');
    const apiKey = await getSetting('ai_api_key');
    const model = await getSetting('ai_model');

    if (!apiKey) {
      return Response.json(
        { success: false, message: 'Chưa nhập API key. Vui lòng nhập và lưu trước.' },
        { status: 400 }
      );
    }

    if (provider === 'gemini') {
      // Test Gemini bằng cách gọi generateContent với prompt ngắn
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-lite' });

      await geminiModel.generateContent('Hello');
      return Response.json({ success: true, message: `Kết nối ${provider} (${model}) thành công!` });
    }

    return Response.json(
      { success: false, message: `Provider "${provider}" chưa được hỗ trợ kiểm tra.` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { success: false, message: `Kết nối thất bại: ${msg}` },
      { status: 400 }
    );
  }
}
