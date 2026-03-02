import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL = "gemini-3-flash-preview";

export interface TestRequest {
  period: string;
  grade: string;
  bookSeries: string;
  files: { mimeType: string; data: string }[];
}

export const generateTest = async (request: TestRequest) => {
  // Sử dụng trực tiếp API Key từ môi trường mà không cần kiểm tra thủ công
  // Điều này giúp tránh việc chặn người dùng khi platform đã tự động cấu hình.
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });

  const getGradeSpecificMatrix = (grade: string, period: string) => {
    if (grade === '3') {
      return `
🔷 MA TRẬN LỚP 3:
- Trắc nghiệm: 6 điểm
- Tự luận: 4 điểm (3 câu viết trên giấy - 3đ, 1 câu thực hành trên máy - 1đ)
- Phân bổ Trắc nghiệm (6đ):
  + Nhận biết: 4đ (4 dạng: Nhiều lựa chọn, Đúng-Sai, Nối cột, Điền khuyết - mỗi dạng 1đ)
  + Thông hiểu: 2đ (4 dạng: Nhiều lựa chọn, Đúng-Sai, Nối cột, Điền khuyết - mỗi dạng 0.5đ)
- Phân bổ Tự luận (4đ):
  + Viết trên giấy: 3 câu (Nhận biết 1đ, Thông hiểu 1đ, Vận dụng 1đ)
  + Thực hành trên máy: 1 câu (Vận dụng 1đ)
`;
    } else if (grade === '4') {
      return `
🔷 MA TRẬN LỚP 4:
- Trắc nghiệm: 6 điểm
- Tự luận: 4 điểm (2 câu viết trên giấy - 2đ, 2 câu thực hành trên máy - 2đ)
- Phân bổ Trắc nghiệm (6đ):
  + Nhận biết: 4đ (4 dạng: mỗi dạng 1đ)
  + Thông hiểu: 2đ (4 dạng: mỗi dạng 0.5đ)
- Phân bổ Tự luận (4đ):
  + Viết trên giấy: 2 câu (Nhận biết 1đ, Thông hiểu 1đ)
  + Thực hành trên máy: 2 câu (Vận dụng 1đ, Vận dụng 1đ)
`;
    } else {
      const isEndOfYear = period === 'Cuối năm';
      return `
🔷 MA TRẬN LỚP 5 (${period.toUpperCase()}):
- Trắc nghiệm: 5 điểm
- Tự luận: 5 điểm (${isEndOfYear ? '2 câu viết trên giấy - 2đ, 3 câu thực hành trên máy - 3đ' : '3 câu viết trên giấy - 3đ, 2 câu thực hành trên máy - 2đ'})
- Phân bổ Trắc nghiệm (5đ):
  + Nhận biết: 3đ (4 dạng: Nhiều lựa chọn 1đ, Đúng-Sai 1đ, Nối cột 0.5đ, Điền khuyết 0.5đ)
  + Thông hiểu: 2đ (4 dạng: mỗi dạng 0.5đ)
- Phân bổ Tự luận (5đ):
  + Viết trên giấy: ${isEndOfYear ? '2 câu (Nhận biết 1đ, Thông hiểu 1đ)' : '3 câu (Nhận biết 1đ, Thông hiểu 1đ, Vận dụng 1đ)'}
  + Thực hành trên máy: ${isEndOfYear ? '3 câu (Vận dụng 1đ, Vận dụng 1đ, Vận dụng 1đ)' : '2 câu (Vận dụng 1đ, Vận dụng 1đ)'}
`;
    }
  };

  const systemInstruction = `
Bạn là AI Agent chuyên thiết kế đề kiểm tra môn Tin học Tiểu học theo chương trình GDPT 2018.
Bạn phải tuân thủ chính xác ma trận, cấu trúc đề và thứ tự câu hỏi được quy định bên dưới.

🔷 THÔNG TIN ĐỀ:
- Khối lớp: ${request.grade}
- Thời điểm: ${request.period}
- Bộ sách: ${request.bookSeries}

${getGradeSpecificMatrix(request.grade, request.period)}

🔷 QUY ĐỊNH CHI TIẾT DẠNG CÂU HỎI:
- Nhiều lựa chọn: Lớp 3 có 3 phương án (A, B, C). Lớp 4-5 có 4 phương án (A, B, C, D).
- Đúng – Sai: 1 câu có 4 ý (mỗi ý 0.25đ).
- Nối cột/Điền khuyết: 
  + Nếu câu 1đ: có 4 nội dung nối hoặc 4 vị trí trống.
  + Nếu câu 0.5đ: có 2 nội dung nối hoặc 2 vị trí trống.

🔷 THỨ TỰ SẮP XẾP CÂU HỎI (BẮT BUỘC):
I. PHẦN TRẮC NGHIỆM
1. Mức Nhận biết: Nhiều lựa chọn -> Đúng-Sai -> Nối cột -> Điền khuyết
2. Mức Thông hiểu: Nhiều lựa chọn -> Đúng-Sai -> Nối cột -> Điền khuyết
II. PHẦN TỰ LUẬN (VIẾT TRÊN GIẤY)
Sắp xếp theo mức độ: Nhận biết -> Thông hiểu -> Vận dụng
III. PHẦN THỰC HÀNH (TRÊN MÁY)
Các câu hỏi thực hành thao tác trên máy tính.

🔷 QUY TRÌNH:
Bước 1: Phân tích tài liệu tải lên.
Bước 2: Trình bày phân bổ điểm theo ma trận.
Bước 3: Sinh đề đúng cấu trúc.
Bước 4: Tự kiểm tra (Đủ 10đ, đúng tỉ lệ MCQ/Essay theo khối lớp, đủ dạng, đúng thứ tự).

🔷 ĐỊNH DẠNG ĐẦU RA (Sử dụng Markdown):
PHẦN 1 – Phân tích nội dung & phân bổ điểm
PHẦN 2 – Đề kiểm tra hoàn chỉnh
PHẦN 3 – Đáp án và hướng dẫn chấm

LƯU Ý: Chỉ sử dụng kiến thức từ tài liệu được cung cấp. Không sáng tác ngoài tài liệu.
`;

  const promptParts = [
    { text: "Hãy thiết kế đề kiểm tra dựa trên tài liệu đính kèm và các yêu cầu đã nêu." },
    ...request.files.map(f => ({
      inlineData: {
        mimeType: f.mimeType,
        data: f.data
      }
    }))
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: { parts: promptParts },
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text;
};
