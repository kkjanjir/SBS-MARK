export type GeminiScannedStudent = {
  studentName: string;
  className: string;
  marks: Record<string, number | string>;
};

const SYSTEM_INSTRUCTION = `You are an expert at reading handwritten tables. Scan the provided image of a marksheet and extract all student records. For each student, find their Name, Class, and all Subject Marks. Return ONLY a valid JSON Array of objects.`;

function cleanJsonResponse(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
  }
  return trimmed;
}

export async function extractStudentsFromClassSheet(base64Image: string, mimeType: string): Promise<GeminiScannedStudent[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY in .env');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: base64Image } }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini request failed: ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response.');

  const parsed = JSON.parse(cleanJsonResponse(text));
  if (!Array.isArray(parsed)) throw new Error('Gemini output is not a JSON array.');

  return parsed
    .filter((row) => row?.studentName && row?.className && row?.marks && typeof row.marks === 'object')
    .map((row) => ({
      studentName: String(row.studentName).trim(),
      className: String(row.className).trim(),
      marks: row.marks,
    }));
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
