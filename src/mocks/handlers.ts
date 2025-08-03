import { http, HttpResponse } from "msw";

// 인증번호 저장소 (실제로는 서버에서 관리)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number }
>();

// 인증번호 생성 함수
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 인증번호 유효성 검사 함수
function isValidCode(phoneNumber: string, code: string): boolean {
  const stored = verificationCodes.get(phoneNumber);
  if (!stored) return false;

  // 만료 시간 확인 (5분)
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(phoneNumber);
    return false;
  }

  return stored.code === code;
}

export const handlers = [
  // 인증번호 발송 API
  http.post("/api/auth/send-verification", async ({ request }) => {
    try {
      const body = (await request.json()) as { phoneNumber: string };
      const { phoneNumber } = body;

      if (!phoneNumber || !/^01[0-9]-\d{3,4}-\d{4}$/.test(phoneNumber)) {
        return HttpResponse.json(
          { success: false, message: "올바른 휴대폰 번호를 입력해주세요." },
          { status: 400 }
        );
      }

      // 인증번호 생성 (6자리)
      const verificationCode = generateVerificationCode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 후 만료

      // 인증번호 저장
      verificationCodes.set(phoneNumber, {
        code: verificationCode,
        expiresAt,
      });

      console.log(`[MSW] ${phoneNumber}로 인증번호 ${verificationCode} 발송`);

      return HttpResponse.json({
        success: true,
        message: "인증번호가 발송되었습니다.",
        data: {
          phoneNumber,
          expiresAt,
        },
      });
    } catch {
      return HttpResponse.json(
        { success: false, message: "서버 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  }),

  // 인증번호 확인 API
  http.post("/api/auth/verify-code", async ({ request }) => {
    try {
      const body = (await request.json()) as {
        phoneNumber: string;
        code: string;
      };
      const { phoneNumber, code } = body;

      if (!phoneNumber || !code) {
        return HttpResponse.json(
          { success: false, message: "휴대폰 번호와 인증번호를 입력해주세요." },
          { status: 400 }
        );
      }

      const isValid = isValidCode(phoneNumber, code);

      if (isValid) {
        // 인증 성공 시 저장된 인증번호 삭제
        verificationCodes.delete(phoneNumber);

        return HttpResponse.json({
          success: true,
          message: "인증이 완료되었습니다.",
          data: {
            verified: true,
          },
        });
      } else {
        return HttpResponse.json(
          {
            success: false,
            message: "인증번호가 올바르지 않거나 만료되었습니다.",
            data: {
              verified: false,
            },
          },
          { status: 400 }
        );
      }
    } catch {
      return HttpResponse.json(
        { success: false, message: "서버 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  }),
];
